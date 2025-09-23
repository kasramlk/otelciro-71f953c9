import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface DailyReservation {
  id: string;
  code?: string;
  check_in: string;
  check_out: string;
  status: string;
  source: string;
  total_amount: number;
  balance_due: number;
  guest: {
    first_name: string;
    last_name: string;
  };
  room_type: {
    name: string;
  } | null;
}

export interface DailyReservationsData {
  reservations: DailyReservation[];
  totalCount: number;
  totalRevenue: number;
  avgDailyRate: number;
  sourceBreakdown: Record<string, { count: number; revenue: number }>;
  statusBreakdown: Record<string, number>;
}

export const useDailyReservations = (hotelId: string, selectedDate: Date, options?: { enabled?: boolean }) => {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['daily-reservations', hotelId, dateStr],
    queryFn: async (): Promise<DailyReservationsData> => {
      console.log('🚀 HOOK STARTING - Fetching reservations for:', { hotelId, date: dateStr, selectedDate: selectedDate.toISOString() });

      if (!hotelId) {
        console.log('❌ No hotelId provided');
        return {
          reservations: [],
          totalCount: 0,
          totalRevenue: 0,
          avgDailyRate: 0,
          sourceBreakdown: {},
          statusBreakdown: {}
        };
      }

      console.log('🔄 Making Supabase query...');
      
      // First, try a simple query without joins to test RLS
      const { data: simpleData, error: simpleError } = await supabase
        .from('reservations')
        .select('id, code, check_in, check_out, status, source, total_amount, balance_due, guest_id, room_type_id')
        .eq('hotel_id', hotelId)
        .lte('check_in', dateStr)
        .gt('check_out', dateStr)
        .in('status', ['Booked', 'Confirmed', 'Checked In', 'Checked Out']);

      console.log('🔍 Simple query result:', { 
        simpleData, 
        simpleError,
        count: simpleData?.length || 0
      });

      if (simpleError) {
        console.error('❌ Simple query error:', simpleError);
        throw simpleError;
      }

      // If simple query works, now try with joins
      console.log('🔗 Now trying with joins...');
      
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          code,
          check_in,
          check_out,
          status,
          source,
          total_amount,
          balance_due,
          guests:guest_id (
            first_name,
            last_name
          ),
          room_types:room_type_id (
            name
          )
        `)
        .eq('hotel_id', hotelId)
        .lte('check_in', dateStr)
        .gt('check_out', dateStr)
        .in('status', ['Booked', 'Confirmed', 'Checked In', 'Checked Out'])
        .order('check_in');

      console.log('📊 Query result:', { 
        foundCount: data?.length || 0, 
        error: error?.message,
        sampleReservation: data?.[0] 
      });

      if (error) {
        console.error('❌ Error fetching reservations:', error);
        throw error;
      }

      const reservations = data?.map(res => ({
        id: res.id,
        code: res.code || `RES-${res.id.slice(0, 8)}`,
        check_in: res.check_in,
        check_out: res.check_out,
        status: res.status,
        source: res.source || 'Direct',
        total_amount: res.total_amount || 0,
        balance_due: res.balance_due || 0,
        guest: res.guests || { first_name: 'Unknown', last_name: 'Guest' },
        room_type: res.room_types
      })) || [];

      // Calculate metrics
      const totalCount = reservations.length;
      let totalRevenue = 0;
      const sourceBreakdown: Record<string, { count: number; revenue: number }> = {};
      const statusBreakdown: Record<string, number> = {};

      reservations.forEach(reservation => {
        // Calculate daily rate
        const checkIn = new Date(reservation.check_in);
        const checkOut = new Date(reservation.check_out);
        const totalNights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
        const dailyRate = reservation.total_amount / totalNights;
        
        totalRevenue += dailyRate;

        // Source breakdown
        const source = reservation.source;
        if (!sourceBreakdown[source]) {
          sourceBreakdown[source] = { count: 0, revenue: 0 };
        }
        sourceBreakdown[source].count++;
        sourceBreakdown[source].revenue += dailyRate;

        // Status breakdown
        statusBreakdown[reservation.status] = (statusBreakdown[reservation.status] || 0) + 1;
      });

      const avgDailyRate = totalCount > 0 ? totalRevenue / totalCount : 0;

      const result = {
        reservations,
        totalCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgDailyRate: Math.round(avgDailyRate * 100) / 100,
        sourceBreakdown,
        statusBreakdown
      };

      console.log('✅ Processed result:', { 
        totalCount: result.totalCount,
        totalRevenue: result.totalRevenue,
        sources: Object.keys(result.sourceBreakdown)
      });

      return result;
    },
    enabled: options?.enabled !== false && !!hotelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
  });
};