import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAgencyBooking } from '@/lib/services/booking-service';
import { useToast } from '@/hooks/use-toast';
import { useAgencyAuth } from './use-agency-auth';

export interface AgencyBookingData {
  hotelId: string;
  roomTypeId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  specialRequests?: string;
  rateQuoted: number;
}

export const useAgencyBooking = () => {
  const [bookingState, setBookingState] = useState({
    isLoading: false,
    error: null as string | null,
    success: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentAgency } = useAgencyAuth();

  const bookingMutation = useMutation({
    mutationFn: async (bookingData: AgencyBookingData) => {
      if (!currentAgency) {
        throw new Error('No agency selected');
      }

      return createAgencyBooking({
        ...bookingData,
        agencyId: currentAgency.id,
      });
    },
    onMutate: () => {
      setBookingState({ isLoading: true, error: null, success: false });
    },
    onSuccess: (result) => {
      setBookingState({ isLoading: false, error: null, success: true });
      
      toast({
        title: "Booking Confirmed!",
        description: `Reservation ${result.bookingReference} has been created successfully.`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['hotel-availability'] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to create booking';
      setBookingState({ isLoading: false, error: errorMessage, success: false });
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const createBooking = async (bookingData: AgencyBookingData) => {
    return bookingMutation.mutateAsync(bookingData);
  };

  return {
    createBooking,
    isLoading: bookingState.isLoading || bookingMutation.isPending,
    error: bookingState.error,
    success: bookingState.success,
    reset: () => {
      setBookingState({ isLoading: false, error: null, success: false });
      bookingMutation.reset();
    },
  };
};