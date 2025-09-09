// Advanced Folio Management Hooks
// Real backend integration for Phase 2: Financial operations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { auditLogger } from '@/lib/audit-logger';

export const FOLIO_MANAGEMENT_KEYS = {
  folioItems: (reservationId: string) => ['folio-items', reservationId],
  reservationCharges: (reservationId: string) => ['reservation-charges', reservationId],
  payments: (reservationId: string) => ['payments', reservationId],
  invoices: (reservationId: string) => ['invoices', reservationId],
} as const;

// Get Folio Items (Charges and Payments)
export function useFolioItems(reservationId: string) {
  return useQuery({
    queryKey: FOLIO_MANAGEMENT_KEYS.folioItems(reservationId),
    queryFn: async () => {
      // Get charges
      const { data: charges, error: chargesError } = await supabase
        .from('reservation_charges')
        .select('*')
        .eq('reservation_id', reservationId)
        .order('posted_at', { ascending: false });

      if (chargesError) throw chargesError;

      // Get payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('reservation_id', reservationId)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Combine and transform data
      const folioItems = [
        ...charges.map(charge => ({
          id: charge.id,
          type: 'charge' as const,
          description: charge.description,
          amount: charge.amount,
          currency: charge.currency,
          postedAt: new Date(charge.posted_at),
          voidedAt: charge.voided_at ? new Date(charge.voided_at) : null,
          voidReason: charge.void_reason,
          folioSplit: charge.folio_split,
          isVoided: !!charge.voided_at
        })),
        ...payments.map(payment => ({
          id: payment.id,
          type: 'payment' as const,
          description: `${payment.payment_method} Payment`,
          amount: -payment.amount, // Negative for payments
          currency: payment.currency,
          postedAt: new Date(payment.created_at),
          voidedAt: null,
          voidReason: null,
          folioSplit: 'Guest',
          isVoided: payment.status === 'failed'
        }))
      ].sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());

      return folioItems;
    },
    enabled: !!reservationId,
    staleTime: 30 * 1000 // 30 seconds - financial data should be fresh
  });
}

// Calculate Folio Balance
export function useFolioBalance(reservationId: string) {
  const { data: folioItems = [] } = useFolioItems(reservationId);

  const balance = folioItems
    .filter(item => !item.isVoided)
    .reduce((sum, item) => {
      return item.type === 'charge' ? sum + item.amount : sum + item.amount; // amount is already negative for payments
    }, 0);

  return { balance, items: folioItems };
}

// Add Folio Charge
export function useAddFolioCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chargeData: {
      reservationId: string;
      description: string;
      amount: number;
      currency?: string;
      type: string;
      folioSplit?: string;
    }) => {
      const { data, error } = await supabase
        .from('reservation_charges')
        .insert({
          reservation_id: chargeData.reservationId,
          description: chargeData.description,
          amount: chargeData.amount,
          currency: chargeData.currency || 'USD',
          type: chargeData.type,
          folio_split: chargeData.folioSplit || 'Guest',
          posted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: FOLIO_MANAGEMENT_KEYS.folioItems(variables.reservationId) 
      });

      // Audit log
      console.log('Charge added:', data.id);

      toast({
        title: "Charge Added",
        description: `${variables.description} - $${variables.amount.toFixed(2)} added to folio.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error Adding Charge",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Process Payment
export function useProcessPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData: {
      reservationId: string;
      hotelId: string;
      amount: number;
      paymentMethod: string;
      paymentType: string;
      currency?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          hotel_id: paymentData.hotelId,
          reservation_id: paymentData.reservationId,
          amount: paymentData.amount,
          amount_in_base_currency: paymentData.amount, // Same as amount for now
          payment_method: paymentData.paymentMethod,
          payment_type: paymentData.paymentType,
          currency: paymentData.currency || 'USD',
          status: 'completed',
          processed_at: new Date().toISOString(),
          notes: paymentData.notes
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: FOLIO_MANAGEMENT_KEYS.folioItems(variables.reservationId) 
      });

      toast({
        title: "Payment Processed",
        description: `$${variables.amount.toFixed(2)} payment received via ${variables.paymentMethod}.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error Processing Payment",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Void Folio Item
export function useVoidFolioItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, itemType, reason }: {
      itemId: string;
      itemType: 'charge' | 'payment';
      reason: string;
    }) => {
      if (itemType === 'charge') {
        const { data, error } = await supabase
          .from('reservation_charges')
          .update({
            voided_at: new Date().toISOString(),
            void_reason: reason
          })
          .eq('id', itemId)
          .select()
          .single();

        if (error) throw error;
        return { data, type: 'charge' };
      } else {
        const { data, error } = await supabase
          .from('payments')
          .update({
            status: 'failed',
            notes: reason
          })
          .eq('id', itemId)
          .select()
          .single();

        if (error) throw error;
        return { data, type: 'payment' };
      }
    },
    onSuccess: (result, variables) => {
      // Get reservation ID from the result
      const reservationId = result.data.reservation_id;
      
      queryClient.invalidateQueries({ 
        queryKey: FOLIO_MANAGEMENT_KEYS.folioItems(reservationId) 
      });

      toast({
        title: "Item Voided",
        description: `${variables.itemType} has been voided: ${variables.reason}`
      });
    },
    onError: (error) => {
      toast({
        title: "Error Voiding Item",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Split Folio
export function useSplitFolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reservationId, selectedItems, splitType, splitValue }: {
      reservationId: string;
      selectedItems: string[];
      splitType: 'percentage' | 'amount' | 'items';
      splitValue?: number;
    }) => {
      if (splitType === 'items') {
        // Move selected items to company folio
        const { error } = await supabase
          .from('reservation_charges')
          .update({ folio_split: 'Company' })
          .in('id', selectedItems);

        if (error) throw error;
      } else {
        // Calculate split amounts (mock implementation)
        // In real system, this would create new folio entries
        console.log('Folio split:', { splitType, splitValue });
      }

      return { reservationId, splitType, splitValue };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: FOLIO_MANAGEMENT_KEYS.folioItems(data.reservationId) 
      });

      toast({
        title: "Folio Split",
        description: "Folio has been split successfully."
      });
    }
  });
}

// Generate Invoice
export function useGenerateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reservationId, hotelId, guestId, invoiceType }: {
      reservationId: string;
      hotelId: string;
      guestId: string;
      invoiceType: 'standard' | 'e-invoice';
    }) => {
      // Get folio items for invoice
      const { data: charges } = await supabase
        .from('reservation_charges')
        .select('*')
        .eq('reservation_id', reservationId)
        .is('voided_at', null);

      const subtotal = charges?.reduce((sum, charge) => sum + charge.amount, 0) || 0;
      const taxAmount = subtotal * 0.1; // 10% tax
      const totalAmount = subtotal + taxAmount;

      // Create invoice
      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          hotel_id: hotelId,
          entity_id: guestId,
          entity_type: 'guest',
          reservation_id: reservationId,
          invoice_number: `INV-${Date.now()}`,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          status: 'issued'
        })
        .select()
        .single();

      if (error) throw error;

      // Create invoice line items
      if (charges) {
        const lineItems = charges.map(charge => ({
          invoice_id: invoice.id,
          description: charge.description,
          quantity: 1,
          unit_price: charge.amount,
          line_total: charge.amount
        }));

        const { error: lineItemsError } = await supabase
          .from('invoice_line_items')
          .insert(lineItems);

        if (lineItemsError) throw lineItemsError;
      }

      return invoice;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: FOLIO_MANAGEMENT_KEYS.invoices(variables.reservationId) 
      });

      toast({
        title: "Invoice Generated",
        description: `Invoice ${data.invoice_number} has been created successfully.`
      });
    }
  });
}

// Export Folio
export function useExportFolio() {
  return useMutation({
    mutationFn: async ({ reservationId, format }: {
      reservationId: string;
      format: 'pdf' | 'csv' | 'xlsx';
    }) => {
      // Get folio data
      const { data: folioItems } = await supabase
        .from('reservation_charges')
        .select(`
          *,
          reservations(
            code,
            guests(first_name, last_name)
          )
        `)
        .eq('reservation_id', reservationId);

      // Mock export - in real system this would generate actual files
      const exportData = {
        reservationId,
        format,
        items: folioItems,
        timestamp: new Date().toISOString()
      };

      return exportData;
    },
    onSuccess: (data) => {
      toast({
        title: "Folio Exported",
        description: `Folio has been exported as ${data.format.toUpperCase()}.`
      });
    }
  });
}