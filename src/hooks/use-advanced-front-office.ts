// Advanced Front Office Operations Hooks
// Real backend integration for Phase 2: Front office workflows

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { auditLogger } from '@/lib/audit-logger';

export const FRONT_OFFICE_KEYS = {
  inHouseGuests: (hotelId: string) => ['in-house-guests', hotelId],
  arrivals: (hotelId: string, date: string) => ['arrivals', hotelId, date],
  departures: (hotelId: string, date: string) => ['departures', hotelId, date],
  walkIns: (hotelId: string, date: string) => ['walk-ins', hotelId, date],
  roomAssignments: (hotelId: string) => ['room-assignments', hotelId],
  checkInQueue: (hotelId: string) => ['checkin-queue', hotelId],
  checkOutQueue: (hotelId: string) => ['checkout-queue', hotelId],
} as const;

// In-House Guests (Currently checked in)
export function useInHouseGuests(hotelId: string) {
  return useQuery({
    queryKey: FRONT_OFFICE_KEYS.inHouseGuests(hotelId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          guests(
            id,
            first_name,
            last_name,
            email,
            phone,
            guest_profiles(vip_status, loyalty_tier)
          ),
          rooms(number, status),
          room_types(name)
        `)
        .eq('hotel_id', hotelId)
        .in('status', ['Checked In'])
        .order('check_in', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
    staleTime: 60 * 1000 // 1 minute
  });
}

// Today's Arrivals
export function useTodaysArrivals(hotelId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: FRONT_OFFICE_KEYS.arrivals(hotelId, today),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          guests(
            id,
            first_name,
            last_name,
            email,
            phone,
            guest_profiles(vip_status, loyalty_tier, special_requests)
          ),
          rooms(number, status, housekeeping_status),
          room_types(name)
        `)
        .eq('hotel_id', hotelId)
        .eq('check_in', today)
        .in('status', ['Booked', 'Confirmed'])
        .order('arrival_time', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
    staleTime: 2 * 60 * 1000
  });
}

// Today's Departures
export function useTodaysDepartures(hotelId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: FRONT_OFFICE_KEYS.departures(hotelId, today),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          guests(
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          rooms(number, status),
          room_types(name)
        `)
        .eq('hotel_id', hotelId)
        .eq('check_out', today)
        .eq('status', 'Checked In')
        .order('departure_time', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
    staleTime: 2 * 60 * 1000
  });
}

// Check-In Guest
export function useCheckInGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reservationId, roomId, notes, actualArrivalTime }: {
      reservationId: string;
      roomId?: string;
      notes?: string;
      actualArrivalTime?: Date;
    }) => {
      // Update reservation status
      const updateData: any = {
        status: 'Checked In',
        updated_at: new Date().toISOString()
      };

      if (roomId) {
        updateData.room_id = roomId;
      }

      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', reservationId)
        .select('*, guests(*), rooms(*)')
        .single();

      if (reservationError) throw reservationError;

      // Update room status to occupied
      if (roomId) {
        const { error: roomError } = await supabase
          .from('rooms')
          .update({ 
            status: 'occupied',
            housekeeping_status: 'occupied'
          })
          .eq('id', roomId);

        if (roomError) throw roomError;
      }

      // Log check-in
      console.log('Guest checked in:', reservationId);

      return reservation;
    },
    onSuccess: (data, variables) => {
      const hotelId = data.hotel_id;
      
      queryClient.invalidateQueries({ queryKey: FRONT_OFFICE_KEYS.arrivals(hotelId, new Date().toISOString().split('T')[0]) });
      queryClient.invalidateQueries({ queryKey: FRONT_OFFICE_KEYS.inHouseGuests(hotelId) });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      toast({
        title: "Guest Checked In",
        description: `${data.guests?.first_name} ${data.guests?.last_name} has been checked in successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: "Check-In Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Check-Out Guest
export function useCheckOutGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reservationId, finalBalance, notes, actualDepartureTime }: {
      reservationId: string;
      finalBalance?: number;
      notes?: string;
      actualDepartureTime?: Date;
    }) => {
      // Get reservation with room info
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('*, guests(*), rooms(*)')
        .eq('id', reservationId)
        .single();

      if (fetchError) throw fetchError;

      // Update reservation status
      const { data: updatedReservation, error: reservationError } = await supabase
        .from('reservations')
        .update({
          status: 'Checked Out',
          balance_due: finalBalance || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select('*, guests(*), rooms(*)')
        .single();

      if (reservationError) throw reservationError;

      // Update room status to dirty for housekeeping
      if (reservation.room_id) {
        const { error: roomError } = await supabase
          .from('rooms')
          .update({ 
            status: 'available',
            housekeeping_status: 'dirty'
          })
          .eq('id', reservation.room_id);

        if (roomError) throw roomError;
      }

      // Log checkout
      const { error: checkoutLogError } = await supabase
        .from('checkout_logs')
        .insert({
          reservation_id: reservationId,
          hotel_id: reservation.hotel_id,
          room_id: reservation.room_id,
          final_balance: finalBalance || 0,
          notes: notes
        });

      if (checkoutLogError) console.warn('Failed to log checkout:', checkoutLogError);

      return updatedReservation;
    },
    onSuccess: (data, variables) => {
      const hotelId = data.hotel_id;
      
      queryClient.invalidateQueries({ queryKey: FRONT_OFFICE_KEYS.departures(hotelId, new Date().toISOString().split('T')[0]) });
      queryClient.invalidateQueries({ queryKey: FRONT_OFFICE_KEYS.inHouseGuests(hotelId) });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      toast({
        title: "Guest Checked Out",
        description: `${data.guests?.first_name} ${data.guests?.last_name} has been checked out successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: "Check-Out Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Room Move Operation
export function useRoomMove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reservationId, newRoomId, reason, effectiveDate }: {
      reservationId: string;
      newRoomId: string;
      reason?: string;
      effectiveDate?: Date;
    }) => {
      // Get current reservation
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('*, rooms(number)')
        .eq('id', reservationId)
        .single();

      if (fetchError) throw fetchError;

      const oldRoomId = reservation.room_id;

      // Update reservation with new room
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({
          room_id: newRoomId,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select('*, guests(*), rooms(number)')
        .single();

      if (updateError) throw updateError;

      // Update old room status if applicable
      if (oldRoomId) {
        await supabase
          .from('rooms')
          .update({ 
            status: 'available',
            housekeeping_status: 'dirty'
          })
          .eq('id', oldRoomId);
      }

      // Update new room status
      await supabase
        .from('rooms')
        .update({ 
          status: 'occupied',
          housekeeping_status: 'occupied'
        })
        .eq('id', newRoomId);

      return updatedReservation;
    },
    onSuccess: (data, variables) => {
      const hotelId = data.hotel_id;
      
      queryClient.invalidateQueries({ queryKey: FRONT_OFFICE_KEYS.inHouseGuests(hotelId) });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      toast({
        title: "Room Move Completed",
        description: `Guest moved to room ${data.rooms?.number} successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: "Room Move Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Stay Extension
export function useStayExtension() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reservationId, newCheckOutDate, additionalCharges, reason }: {
      reservationId: string;
      newCheckOutDate: Date;
      additionalCharges?: number;
      reason?: string;
    }) => {
      // Get current reservation
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (fetchError) throw fetchError;

      const originalCheckOut = new Date(reservation.check_out);
      
      // Update reservation
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({
          check_out: newCheckOutDate.toISOString().split('T')[0],
          total_amount: (reservation.total_amount || 0) + (additionalCharges || 0),
          balance_due: (reservation.balance_due || 0) + (additionalCharges || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select('*, guests(*)')
        .single();

      if (updateError) throw updateError;

      // Log extension
      const { error: logError } = await supabase
        .from('stay_extensions')
        .insert({
          reservation_id: reservationId,
          hotel_id: reservation.hotel_id,
          original_date: originalCheckOut.toISOString().split('T')[0],
          new_date: newCheckOutDate.toISOString().split('T')[0],
          charge_amount: additionalCharges || 0,
          extension_type: 'checkout_extension',
          reason: reason
        });

      if (logError) console.warn('Failed to log extension:', logError);

      return updatedReservation;
    },
    onSuccess: (data, variables) => {
      const hotelId = data.hotel_id;
      
      queryClient.invalidateQueries({ queryKey: FRONT_OFFICE_KEYS.inHouseGuests(hotelId) });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });

      toast({
        title: "Stay Extended",
        description: `Checkout extended to ${variables.newCheckOutDate.toLocaleDateString()}.`
      });
    }
  });
}

// No-Show Processing
export function useProcessNoShow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reservationId, reason, chargeAmount }: {
      reservationId: string;
      reason?: string;
      chargeAmount?: number;
    }) => {
      // Update reservation status to no-show
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'No Show',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select('*, guests(*), rooms(*)')
        .single();

      if (updateError) throw updateError;

      // Add no-show charge if specified
      if (chargeAmount && chargeAmount > 0) {
        const { error: chargeError } = await supabase
          .from('reservation_charges')
          .insert({
            reservation_id: reservationId,
            description: 'No Show Charge',
            amount: chargeAmount,
            type: 'no_show_fee',
            posted_at: new Date().toISOString()
          });

        if (chargeError) console.warn('Failed to add no-show charge:', chargeError);
      }

      // Free up the room if assigned
      if (updatedReservation.room_id) {
        await supabase
          .from('rooms')
          .update({ 
            status: 'available',
            housekeeping_status: 'clean'
          })
          .eq('id', updatedReservation.room_id);
      }

      return updatedReservation;
    },
    onSuccess: (data, variables) => {
      const hotelId = data.hotel_id;
      
      queryClient.invalidateQueries({ queryKey: FRONT_OFFICE_KEYS.arrivals(hotelId, new Date().toISOString().split('T')[0]) });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      toast({
        title: "No-Show Processed",
        description: `${data.guests?.first_name} ${data.guests?.last_name} marked as no-show.`
      });
    }
  });
}
