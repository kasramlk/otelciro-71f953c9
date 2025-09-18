import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';

export interface OccupancyDataPoint {
  date: Date;
  day: number;
  specialDay: string;
  capacity: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  adr: number;
  totalRevenue: number;
  arrivals: number;
  departures: number;
}

export const useOccupancyData = (hotelId: string, selectedMonth: Date) => {
  return useQuery({
    queryKey: ['occupancy-data', hotelId, format(selectedMonth, 'yyyy-MM')],
    queryFn: async (): Promise<OccupancyDataPoint[]> => {
      if (!hotelId) return [];

      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      
      // Get all days in the month
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      // Fetch rooms for capacity calculation
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id')
        .eq('hotel_id', hotelId);
      
      const totalRooms = rooms?.length || 0;

      // Fetch reservations for the month with room overlap logic
      const { data: reservations } = await supabase
        .from('reservations')
        .select(`
          id,
          check_in,
          check_out,
          total_amount,
          adults,
          children,
          status
        `)
        .eq('hotel_id', hotelId)
        .or(`check_in.gte.${format(monthStart, 'yyyy-MM-dd')},check_out.lte.${format(monthEnd, 'yyyy-MM-dd')},and(check_in.lte.${format(monthStart, 'yyyy-MM-dd')},check_out.gte.${format(monthEnd, 'yyyy-MM-dd')})`)
        .in('status', ['Confirmed', 'Checked In', 'Checked Out']);

      // Calculate occupancy for each day
      const occupancyData: OccupancyDataPoint[] = daysInMonth.map(date => {
        const dayStart = format(date, 'yyyy-MM-dd');
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        
        // Count reservations active on this date
        const activeReservations = reservations?.filter(res => {
          const checkIn = new Date(res.check_in);
          const checkOut = new Date(res.check_out);
          return checkIn <= date && checkOut > date;
        }) || [];

        const occupiedRooms = activeReservations.length;
        const availableRooms = Math.max(0, totalRooms - occupiedRooms);
        const occupancyRate = totalRooms > 0 ? occupiedRooms / totalRooms : 0;

        // Calculate ADR and revenue
        const dayRevenue = activeReservations.reduce((sum, res) => {
          const checkIn = new Date(res.check_in);
          const checkOut = new Date(res.check_out);
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          const dailyRate = nights > 0 ? (res.total_amount || 0) / nights : 0;
          return sum + dailyRate;
        }, 0);

        const adr = occupiedRooms > 0 ? dayRevenue / occupiedRooms : 0;

        // Count arrivals and departures for this day
        const arrivals = reservations?.filter(res => 
          format(new Date(res.check_in), 'yyyy-MM-dd') === dayStart
        ).length || 0;

        const departures = reservations?.filter(res => 
          format(new Date(res.check_out), 'yyyy-MM-dd') === dayStart
        ).length || 0;

        return {
          date,
          day: date.getDate(),
          specialDay: isWeekend ? 'Weekend' : '',
          capacity: totalRooms,
          availableRooms,
          occupiedRooms,
          occupancyRate,
          adr: Math.round(adr * 100) / 100,
          totalRevenue: Math.round(dayRevenue * 100) / 100,
          arrivals,
          departures,
        };
      });

      return occupancyData;
    },
    enabled: !!hotelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};