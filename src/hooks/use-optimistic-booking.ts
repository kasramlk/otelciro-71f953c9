import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createAgencyBooking, BookingRequest } from '@/lib/services/booking-service';
import { useToast } from '@/hooks/use-toast';

interface OptimisticBookingState {
  isProcessing: boolean;
  currentStep: 'validating' | 'checking-availability' | 'creating-guest' | 'creating-reservation' | 'confirming' | 'completed';
  error: string | null;
  bookingReference: string | null;
}

export const useOptimisticBooking = () => {
  const [state, setState] = useState<OptimisticBookingState>({
    isProcessing: false,
    currentStep: 'validating',
    error: null,
    bookingReference: null,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processBooking = async (bookingData: BookingRequest) => {
    setState({ isProcessing: true, currentStep: 'validating', error: null, bookingReference: null });

    try {
      // Step 1: Validate booking data
      setState(prev => ({ ...prev, currentStep: 'validating' }));
      if (!bookingData.guestName || !bookingData.hotelId) {
        throw new Error('Missing required booking information');
      }

      // Step 2: Check availability
      setState(prev => ({ ...prev, currentStep: 'checking-availability' }));
      
      // Optimistically update availability in cache
      const availabilityKey = ['hotel-availability', bookingData.hotelId, bookingData.checkIn, bookingData.checkOut];
      queryClient.setQueryData(availabilityKey, (oldData: any) => {
        if (oldData) {
          // Temporarily reduce availability
          const checkIn = new Date(bookingData.checkIn);
          const checkOut = new Date(bookingData.checkOut);
          
          for (let date = checkIn; date < checkOut; date.setDate(date.getDate() + 1)) {
            const key = `${bookingData.roomTypeId}-${date.toISOString().split('T')[0]}`;
            const existing = oldData.get(key);
            if (existing) {
              oldData.set(key, {
                ...existing,
                available: Math.max(0, existing.available - 1)
              });
            }
          }
        }
        return oldData;
      });

      // Step 3: Process booking
      setState(prev => ({ ...prev, currentStep: 'creating-guest' }));
      await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback

      setState(prev => ({ ...prev, currentStep: 'creating-reservation' }));
      await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback

      setState(prev => ({ ...prev, currentStep: 'confirming' }));
      const result = await createAgencyBooking(bookingData);

      if (!result.success) {
        throw new Error(result.error || 'Booking failed');
      }

      // Step 4: Complete
      setState(prev => ({ 
        ...prev, 
        currentStep: 'completed',
        bookingReference: result.bookingReference || 'Unknown',
        isProcessing: false
      }));

      // Refresh availability data
      queryClient.invalidateQueries({ queryKey: ['hotel-availability'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-hotels'] });

      toast({
        title: "Booking Confirmed!",
        description: `Your reservation ${result.bookingReference} has been confirmed.`,
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState({
        isProcessing: false,
        currentStep: 'validating',
        error: errorMessage,
        bookingReference: null,
      });

      // Revert optimistic updates
      queryClient.invalidateQueries({ queryKey: ['hotel-availability'] });

      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    }
  };

  const reset = () => {
    setState({
      isProcessing: false,
      currentStep: 'validating',
      error: null,
      bookingReference: null,
    });
  };

  return {
    ...state,
    processBooking,
    reset,
  };
};