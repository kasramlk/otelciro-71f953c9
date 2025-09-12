import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentProcessingData {
  reservationId: string;
  hotelId: string;
  amount: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'Online';
  paymentType: 'full' | 'partial' | 'deposit';
  notes?: string;
}

interface BillingAdjustmentData {
  reservationId: string;
  hotelId: string;
  adjustments: {
    totalAmount?: number;
    depositAmount?: number;
    balanceDue?: number;
    discountPercent?: number;
    discountAmount?: number;
  };
  reason: string;
}

// Process Payment
export function useProcessPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: PaymentProcessingData) => {
      // Get current reservation to calculate balance
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', data.reservationId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate new balance
      const currentBalance = reservation.balance_due || 0;
      const newBalance = Math.max(0, currentBalance - data.amount);

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          hotel_id: data.hotelId,
          reservation_id: data.reservationId,
          amount: data.amount,
          payment_method: data.paymentMethod,
          payment_type: data.paymentType,
          currency: reservation.currency || 'USD',
          status: 'completed',
          processed_at: new Date().toISOString(),
          notes: data.notes,
          amount_in_base_currency: data.amount,
          exchange_rate: 1
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update reservation balance
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({ 
          balance_due: newBalance,
          deposit_amount: (reservation.deposit_amount || 0) + data.amount
        })
        .eq('id', data.reservationId)
        .select()
        .single();

      if (updateError) throw updateError;

      return { payment, reservation: updatedReservation };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['advanced-reservations', variables.hotelId] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      
      toast({
        title: "Payment Processed",
        description: `Payment of ${variables.amount} ${data.reservation.currency || 'USD'} processed successfully.`
      });
    },
    onError: (error) => {
      console.error('Payment processing failed:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    }
  });
}

// Adjust Billing
export function useBillingAdjustment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: BillingAdjustmentData) => {
      const { data: result, error } = await supabase
        .from('reservations')
        .update({
          ...data.adjustments,
          updated_at: new Date().toISOString(),
          notes: data.reason
        })
        .eq('id', data.reservationId)
        .select()
        .single();

      if (error) throw error;

      // Log the adjustment as a charge if there's a monetary change
      if (data.adjustments.totalAmount || data.adjustments.discountAmount) {
        await supabase
          .from('reservation_charges')
          .insert({
            reservation_id: data.reservationId,
            amount: data.adjustments.discountAmount ? -Math.abs(data.adjustments.discountAmount) : 0,
            type: 'adjustment',
            description: `Billing adjustment: ${data.reason}`,
            currency: result.currency || 'USD',
            created_by: null // Will be set by RLS
          });
      }

      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['advanced-reservations', variables.hotelId] });
      
      toast({
        title: "Billing Adjusted",
        description: "Billing information has been updated successfully."
      });
    },
    onError: (error) => {
      console.error('Billing adjustment failed:', error);
      toast({
        title: "Adjustment Failed", 
        description: "Failed to adjust billing. Please try again.",
        variant: "destructive"
      });
    }
  });
}

// Refund Payment
export function useRefundPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      reservationId: string;
      hotelId: string;
      amount: number;
      reason: string;
      paymentId?: string;
    }) => {
      // Get current reservation
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', data.reservationId)
        .single();

      if (fetchError) throw fetchError;

      // Create refund payment record
      const { data: refund, error: refundError } = await supabase
        .from('payments')
        .insert({
          hotel_id: data.hotelId,
          reservation_id: data.reservationId,
          amount: -Math.abs(data.amount), // Negative amount for refund
          payment_method: 'Refund',
          payment_type: 'refund',
          currency: reservation.currency || 'USD',
          status: 'completed',
          processed_at: new Date().toISOString(),
          notes: `Refund: ${data.reason}`,
          amount_in_base_currency: -Math.abs(data.amount),
          exchange_rate: 1
        })
        .select()
        .single();

      if (refundError) throw refundError;

      // Update reservation balance
      const newBalance = (reservation.balance_due || 0) + Math.abs(data.amount);
      const newDeposit = Math.max(0, (reservation.deposit_amount || 0) - Math.abs(data.amount));

      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({
          balance_due: newBalance,
          deposit_amount: newDeposit
        })
        .eq('id', data.reservationId)
        .select()
        .single();

      if (updateError) throw updateError;

      return { refund, reservation: updatedReservation };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['advanced-reservations', variables.hotelId] });
      
      toast({
        title: "Refund Processed",
        description: `Refund of ${Math.abs(variables.amount)} processed successfully.`
      });
    },
    onError: (error) => {
      console.error('Refund processing failed:', error);
      toast({
        title: "Refund Failed",
        description: "Failed to process refund. Please try again.",
        variant: "destructive"
      });
    }
  });
}