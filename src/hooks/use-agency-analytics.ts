import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAgencyAuth } from './use-agency-auth';
import { subDays, startOfMonth, endOfMonth, format, startOfDay, endOfDay } from 'date-fns';

export interface AgencyBookingStats {
  totalBookings: number;
  totalCommission: number;
  totalRevenue: number;
  averageBookingValue: number;
  bookingsGrowth: number;
  commissionGrowth: number;
}

export interface MonthlyPerformance {
  month: string;
  bookings: number;
  commission: number;
  revenue: number;
}

export interface TopHotel {
  hotelId: string;
  hotelName: string;
  bookings: number;
  commission: number;
  revenue: number;
  city: string;
}

export const useAgencyAnalytics = (dateRange: { start: Date; end: Date } = {
  start: startOfMonth(new Date()),
  end: endOfMonth(new Date())
}) => {
  const { currentAgency } = useAgencyAuth();

  // Current period stats
  const { data: currentStats, isLoading: statsLoading } = useQuery({
    queryKey: ['agency-stats', currentAgency?.id, dateRange.start, dateRange.end],
    queryFn: async (): Promise<AgencyBookingStats> => {
      if (!currentAgency) throw new Error('No agency selected');

      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          *,
          hotels!inner(name, city),
          rate_plans!inner(name)
        `)
        .eq('agency_id', currentAgency.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .neq('status', 'cancelled');

      if (error) throw error;

      // Previous period for growth calculation
      const prevStart = subDays(dateRange.start, 30);
      const prevEnd = subDays(dateRange.end, 30);

      const { data: prevReservations, error: prevError } = await supabase
        .from('reservations')
        .select(`
          *,
          rate_plans!inner(name)
        `)
        .eq('agency_id', currentAgency.id)
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString())
        .neq('status', 'cancelled');

      if (prevError) throw prevError;

      // Calculate current stats
      const totalBookings = reservations?.length || 0;
      const totalRevenue = reservations?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;
      // Use default 10% commission rate since commission_rate column doesn't exist
      const totalCommission = reservations?.reduce((sum, r) => {
        const commissionRate = 0.1; // Default 10% commission
        return sum + (r.total_amount || 0) * commissionRate;
      }, 0) || 0;
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Calculate growth
      const prevTotalBookings = prevReservations?.length || 0;
      const prevTotalCommission = prevReservations?.reduce((sum, r) => {
        const commissionRate = 0.1; // Default 10% commission
        return sum + (r.total_amount || 0) * commissionRate;
      }, 0) || 0;

      const bookingsGrowth = prevTotalBookings > 0 
        ? ((totalBookings - prevTotalBookings) / prevTotalBookings) * 100 
        : 0;
      const commissionGrowth = prevTotalCommission > 0 
        ? ((totalCommission - prevTotalCommission) / prevTotalCommission) * 100 
        : 0;

      return {
        totalBookings,
        totalCommission,
        totalRevenue,
        averageBookingValue,
        bookingsGrowth,
        commissionGrowth,
      };
    },
    enabled: !!currentAgency,
  });

  // Monthly performance data
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['agency-monthly-performance', currentAgency?.id],
    queryFn: async (): Promise<MonthlyPerformance[]> => {
      if (!currentAgency) throw new Error('No agency selected');

      const sixMonthsAgo = subDays(new Date(), 180);

      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          created_at,
          total_amount,
          rate_plans!inner(name)
        `)
        .eq('agency_id', currentAgency.id)
        .gte('created_at', sixMonthsAgo.toISOString())
        .neq('status', 'cancelled')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyStats: { [key: string]: MonthlyPerformance } = {};

      reservations?.forEach(reservation => {
        const month = format(new Date(reservation.created_at), 'MMM yyyy');
        
        if (!monthlyStats[month]) {
          monthlyStats[month] = {
            month: format(new Date(reservation.created_at), 'MMM'),
            bookings: 0,
            commission: 0,
            revenue: 0,
          };
        }

        monthlyStats[month].bookings += 1;
        monthlyStats[month].revenue += reservation.total_amount || 0;
        
        // Use default 10% commission rate
        const commissionRate = 0.1;
        monthlyStats[month].commission += (reservation.total_amount || 0) * commissionRate;
      });

      return Object.values(monthlyStats).slice(-6); // Last 6 months
    },
    enabled: !!currentAgency,
  });

  // Top performing hotels
  const { data: topHotels, isLoading: hotelsLoading } = useQuery({
    queryKey: ['agency-top-hotels', currentAgency?.id, dateRange.start, dateRange.end],
    queryFn: async (): Promise<TopHotel[]> => {
      if (!currentAgency) throw new Error('No agency selected');

      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          hotel_id,
          total_amount,
          hotels!inner(name, city),
          rate_plans!inner(name)
        `)
        .eq('agency_id', currentAgency.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .neq('status', 'cancelled');

      if (error) throw error;

      // Group by hotel
      const hotelStats: { [key: string]: TopHotel } = {};

      reservations?.forEach(reservation => {
        const hotelId = reservation.hotel_id;
        const hotelName = reservation.hotels.name;
        const city = reservation.hotels.city;

        if (!hotelStats[hotelId]) {
          hotelStats[hotelId] = {
            hotelId,
            hotelName,
            city: city || 'Unknown',
            bookings: 0,
            commission: 0,
            revenue: 0,
          };
        }

        hotelStats[hotelId].bookings += 1;
        hotelStats[hotelId].revenue += reservation.total_amount || 0;
        
        // Use default 10% commission rate
        const commissionRate = 0.1;
        hotelStats[hotelId].commission += (reservation.total_amount || 0) * commissionRate;
      });

      return Object.values(hotelStats)
        .sort((a, b) => b.commission - a.commission)
        .slice(0, 10); // Top 10 hotels
    },
    enabled: !!currentAgency,
  });

  return {
    currentStats,
    monthlyData,
    topHotels,
    isLoading: statsLoading || monthlyLoading || hotelsLoading,
  };
};