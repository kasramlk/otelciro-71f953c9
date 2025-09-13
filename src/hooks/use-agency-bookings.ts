import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAgencyAuth } from './use-agency-auth';

export interface AgencyBooking {
  id: string;
  code: string;
  bookingReference: string;
  confirmationNumber: string;
  hotelName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  specialRequests?: string[];
  city: string;
  roomTypeName: string;
}

export const useAgencyBookings = (filters: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  hotelId?: string;
} = {}) => {
  const { currentAgency } = useAgencyAuth();

  return useQuery({
    queryKey: ['agency-bookings', currentAgency?.id, filters],
    queryFn: async (): Promise<AgencyBooking[]> => {
      if (!currentAgency) throw new Error('No agency selected');

      let query = supabase
        .from('reservations')
        .select(`
          id,
          code,
          booking_reference,
          confirmation_number,
          check_in,
          check_out,
          adults,
          children,
          total_amount,
          status,
          created_at,
          special_requests,
          hotels!inner(name, city),
          guests!inner(first_name, last_name),
          room_types!inner(name)
        `)
        .eq('agency_id', currentAgency.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.dateFrom) {
        query = query.gte('check_in', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('check_out', filters.dateTo);
      }
      if (filters.hotelId) {
        query = query.eq('hotel_id', filters.hotelId);
      }

      const { data: reservations, error } = await query;

      if (error) throw error;

      return reservations?.map(reservation => ({
        id: reservation.id,
        code: reservation.code,
        bookingReference: reservation.booking_reference || '',
        confirmationNumber: reservation.confirmation_number || '',
        hotelName: reservation.hotels.name,
        guestName: `${reservation.guests.first_name} ${reservation.guests.last_name}`.trim(),
        checkIn: reservation.check_in,
        checkOut: reservation.check_out,
        adults: reservation.adults,
        children: reservation.children,
        totalAmount: reservation.total_amount || 0,
        status: reservation.status,
        createdAt: reservation.created_at,
        specialRequests: reservation.special_requests || [],
        city: reservation.hotels.city || '',
        roomTypeName: reservation.room_types.name,
      })) || [];
    },
    enabled: !!currentAgency,
  });
};

export const useRecentBookings = (limit: number = 10) => {
  const { currentAgency } = useAgencyAuth();

  return useQuery({
    queryKey: ['agency-recent-bookings', currentAgency?.id, limit],
    queryFn: async (): Promise<AgencyBooking[]> => {
      if (!currentAgency) throw new Error('No agency selected');

      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          id,
          code,
          booking_reference,
          confirmation_number,
          check_in,
          check_out,
          adults,
          children,
          total_amount,
          status,
          created_at,
          special_requests,
          hotels!inner(name, city),
          guests!inner(first_name, last_name),
          room_types!inner(name)
        `)
        .eq('agency_id', currentAgency.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return reservations?.map(reservation => ({
        id: reservation.id,
        code: reservation.code,
        bookingReference: reservation.booking_reference || '',
        confirmationNumber: reservation.confirmation_number || '',
        hotelName: reservation.hotels.name,
        guestName: `${reservation.guests.first_name} ${reservation.guests.last_name}`.trim(),
        checkIn: reservation.check_in,
        checkOut: reservation.check_out,
        adults: reservation.adults,
        children: reservation.children,
        totalAmount: reservation.total_amount || 0,
        status: reservation.status,
        createdAt: reservation.created_at,
        specialRequests: reservation.special_requests || [],
        city: reservation.hotels.city || '',
        roomTypeName: reservation.room_types.name,
      })) || [];
    },
    enabled: !!currentAgency,
  });
};