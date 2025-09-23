import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay } from 'date-fns';

export interface DailyPerformanceData {
  totalReservations: number;
  totalRevenue: number;
  avgDailyRate: number;
  occupancyRate: number;
  reservations: Array<{
    id: string;
    code?: string;
    guests: { first_name: string; last_name: string };
    check_in: string;
    check_out: string;
    source: string;
    status: string;
    balance_due: number;
    total_amount?: number;
    room_types?: { name: string };
  }>;
  bySource: Record<string, { count: number; revenue: number }>;
}

export const useDailyPerformance = (hotelId: string, date: Date = new Date()) => {
  const queryClient = useQueryClient();
  const queryKey = ['daily-performance', hotelId, format(date, 'yyyy-MM-dd')];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<DailyPerformanceData> => {
      if (!hotelId) {
        return {
          totalReservations: 0,
          totalRevenue: 0,
          avgDailyRate: 0,
          occupancyRate: 0,
          reservations: [],
          bySource: {}
        };
      }

      const dayStart = format(startOfDay(date), 'yyyy-MM-dd');
      const dayEnd = format(endOfDay(date), 'yyyy-MM-dd');

      // Fetch today's reservations with guest and room type details
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          id,
          code,
          check_in,
          check_out,
          total_amount,
          balance_due,
          source,
          status,
          guests:guest_id (
            first_name,
            last_name
          ),
          room_types:room_type_id (
            name
          )
        `)
        .eq('hotel_id', hotelId)
        .or(`check_in.eq.${dayStart},and(check_in.lte.${dayStart},check_out.gt.${dayStart})`)
        .in('status', ['Booked', 'Confirmed', 'Checked In', 'Checked Out']);

      console.log('Daily Performance DEBUG:', {
        date: dayStart,
        hotelId,
        query: `check_in.eq.${dayStart},and(check_in.lte.${dayStart},check_out.gt.${dayStart})`,
        totalReservationsFound: reservations?.length || 0,
        reservationCodes: reservations?.map(r => r.code) || [],
        statusBreakdown: reservations?.reduce((acc, res) => {
          acc[res.status] = (acc[res.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        error
      });

      // Get total rooms for occupancy calculation
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id')
        .eq('hotel_id', hotelId);

      const totalRooms = rooms?.length || 0;
      const totalReservations = reservations?.length || 0;
      const occupancyRate = totalRooms > 0 ? (totalReservations / totalRooms) * 100 : 0;

      // Calculate revenue and ADR
      const totalRevenue = reservations?.reduce((sum, res) => {
        const checkIn = new Date(res.check_in);
        const checkOut = new Date(res.check_out);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const dailyRate = nights > 0 ? (res.total_amount || 0) / nights : 0;
        return sum + dailyRate;
      }, 0) || 0;

      const avgDailyRate = totalReservations > 0 ? totalRevenue / totalReservations : 0;

      // Group by source
      const bySource: Record<string, { count: number; revenue: number }> = {};
      reservations?.forEach(res => {
        const source = res.source || 'Direct';
        if (!bySource[source]) {
          bySource[source] = { count: 0, revenue: 0 };
        }
        
        const checkIn = new Date(res.check_in);
        const checkOut = new Date(res.check_out);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const dailyRate = nights > 0 ? (res.total_amount || 0) / nights : 0;
        
        bySource[source].count += 1;
        bySource[source].revenue += dailyRate;
      });

      // Transform reservations for display
      const transformedReservations = reservations?.map(res => ({
        id: res.id,
        code: res.code,
        guests: res.guests || { first_name: 'Unknown', last_name: 'Guest' },
        check_in: res.check_in,
        check_out: res.check_out,
        source: res.source || 'Direct',
        status: res.status,
        balance_due: res.balance_due || 0,
        total_amount: res.total_amount || 0,
        room_types: res.room_types
      })) || [];

      return {
        totalReservations,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgDailyRate: Math.round(avgDailyRate * 100) / 100,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        reservations: transformedReservations,
        bySource
      };
    },
    enabled: !!hotelId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Set up real-time subscription for reservations
  useEffect(() => {
    if (!hotelId) return;

    const channel = supabase
      .channel('daily-performance-reservations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `hotel_id=eq.${hotelId}`
        },
        (payload) => {
          console.log('Reservation change detected:', payload);
          // Invalidate and refetch the daily performance data
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId, queryClient, queryKey]);

  return query;
};