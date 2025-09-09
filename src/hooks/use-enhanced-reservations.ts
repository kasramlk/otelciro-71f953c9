import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type ReservationWithDetails = {
  id: string;
  adults: number;
  agency_id: string | null;
  api_source_id: string | null;
  arrival_time: string | null;
  balance_due: number | null;
  booking_reference: string | null;
  check_in: string;
  check_out: string;
  children: number;
  code: string;
  company_id: string | null;
  confirmation_number: string | null;
  created_at: string;
  currency: string;
  deposit_amount: number | null;
  discount_amount: number | null;
  discount_percent: number | null;
  guarantee_type: string | null;
  group_id: string | null;
  guest_id: string;
  hotel_id: string;
  is_group_master: boolean | null;
  meal_plan: string | null;
  notes: string | null;
  payment_method: string | null;
  payment_type: string | null;
  promotion_id: string | null;
  rate_plan_id: string;
  room_id: string | null;
  room_type_id: string;
  source: string | null;
  special_requests: string[] | null;
  status: string;
  total_amount: number | null;
  total_price: number;
  updated_at: string;
  guests: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  } | null;
  room_types: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  rooms: {
    id: string;
    number: string;
    floor: number | null;
  } | null;
};

export const useEnhancedReservations = (hotelId: string, filters?: any) => {
  return useQuery({
    queryKey: ['enhanced-reservations', hotelId, filters],
    queryFn: async (): Promise<ReservationWithDetails[]> => {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          guests (id, first_name, last_name, email, phone),
          room_types (id, name, description),
          rooms (id, number, floor)
        `)
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('check_in', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('check_out', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []) as ReservationWithDetails[];
    },
    enabled: !!hotelId,
  });
};