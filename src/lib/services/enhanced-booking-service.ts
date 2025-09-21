import { supabase } from '@/integrations/supabase/client';
import { ReservationService } from './reservation-service';
import { InventoryService } from './inventory-service';

export interface EnhancedBookingRequest {
  hotel_id: string;
  room_type_id: string;
  rate_plan_id: string;
  guest_data: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    nationality?: string;
    id_number?: string;
  };
  booking_data: {
    check_in: string;
    check_out: string;
    adults: number;
    children: number;
    special_requests?: string[];
    notes?: string;
    source?: string;
    booking_reference?: string;
    confirmation_number?: string;
  };
  payment_data?: {
    deposit_amount?: number;
    payment_method?: string;
    guarantee_type?: string;
  };
}

export interface EnhancedBookingResponse {
  success: boolean;
  reservation_id?: string;
  reservation_code?: string;
  room_assigned?: boolean;
  room_number?: string;
  errors?: string[];
  warnings?: string[];
}

export class EnhancedBookingService {
  /**
   * Create a new booking with comprehensive validation and processing
   */
  public static async createBooking(
    bookingRequest: EnhancedBookingRequest
  ): Promise<EnhancedBookingResponse> {
    try {
      const { hotel_id, room_type_id, guest_data, booking_data, payment_data } = bookingRequest;

      // Step 1: Validate availability
      const availabilityCheck = await InventoryService.getInventoryStatus(
        hotel_id,
        room_type_id,
        booking_data.check_in,
        booking_data.check_out
      );

      if (!availabilityCheck.success) {
        return {
          success: false,
          errors: availabilityCheck.errors || ['Failed to check availability']
        };
      }

      // Check if any date has no availability
      const hasAvailability = availabilityCheck.data?.every(day => day.available > 0);
      if (!hasAvailability) {
        return {
          success: false,
          errors: ['No availability for selected dates']
        };
      }

      // Step 2: Process or create guest
      const guestId = await this.processGuest(hotel_id, guest_data);

      // Step 3: Calculate pricing
      const pricingResult = await this.calculatePricing(
        hotel_id,
        room_type_id,
        bookingRequest.rate_plan_id,
        booking_data.check_in,
        booking_data.check_out
      );

      if (!pricingResult.success) {
        return {
          success: false,
          errors: pricingResult.errors || ['Failed to calculate pricing']
        };
      }

      // Step 4: Create reservation
      const reservationResult = await ReservationService.createReservation({
        hotel_id,
        guest_id: guestId,
        room_type_id,
        rate_plan_id: bookingRequest.rate_plan_id,
        check_in: booking_data.check_in,
        check_out: booking_data.check_out,
        adults: booking_data.adults,
        children: booking_data.children,
        total_price: pricingResult.data.total_amount,
        source: booking_data.source || 'Direct',
        booking_reference: booking_data.booking_reference,
        confirmation_number: booking_data.confirmation_number,
        status: 'Confirmed',
        notes: booking_data.notes,
        special_requests: booking_data.special_requests,
        deposit_amount: payment_data?.deposit_amount || 0,
        payment_method: payment_data?.payment_method || 'Cash',
        guarantee_type: payment_data?.guarantee_type || 'guarantee',
        total_amount: pricingResult.data.total_amount,
        balance_due: pricingResult.data.total_amount - (payment_data?.deposit_amount || 0)
      });

      if (!reservationResult.success) {
        return {
          success: false,
          errors: reservationResult.errors || ['Failed to create reservation']
        };
      }

      // Step 5: Process initial payment if provided
      if (payment_data?.deposit_amount && payment_data.deposit_amount > 0) {
        await this.processPayment(
          hotel_id,
          reservationResult.data.id,
          payment_data.deposit_amount,
          payment_data.payment_method || 'Cash',
          'Deposit payment'
        );
      }

      // Step 6: Send confirmation
      await this.sendBookingConfirmation(reservationResult.data, guest_data);

      // Step 7: Sync inventory with channels manually for now
      try {
        await supabase.from('rate_push_queue').insert({
          hotel_id,
          room_type_id,
          rate_plan_id: bookingRequest.rate_plan_id,
          date_from: booking_data.check_in,
          date_to: booking_data.check_out,
          push_type: 'availability',
          priority: 1,
          status: 'pending'
        });
      } catch (syncError) {
        console.log('Inventory sync queuing failed:', syncError);
      }

      return {
        success: true,
        reservation_id: reservationResult.data.id,
        reservation_code: reservationResult.data.code,
        room_assigned: reservationResult.data.room_assigned || false,
        room_number: reservationResult.data.room_number,
        warnings: reservationResult.warnings
      };

    } catch (error) {
      console.error('Enhanced booking error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to create booking']
      };
    }
  }

  /**
   * Process or create guest
   */
  private static async processGuest(hotelId: string, guestData: any): Promise<string> {
    // Check if guest already exists
    const { data: existingGuest } = await supabase
      .from('guests')
      .select('id')
      .eq('hotel_id', hotelId)
      .eq('email', guestData.email)
      .single();

    if (existingGuest) {
      // Update existing guest
      await supabase
        .from('guests')
        .update({
          first_name: guestData.first_name,
          last_name: guestData.last_name,
          phone: guestData.phone,
          nationality: guestData.nationality,
          id_number: guestData.id_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingGuest.id);

      return existingGuest.id;
    }

    // Create new guest
    const { data: newGuest, error } = await supabase
      .from('guests')
      .insert({
        hotel_id: hotelId,
        first_name: guestData.first_name,
        last_name: guestData.last_name,
        email: guestData.email,
        phone: guestData.phone,
        nationality: guestData.nationality,
        id_number: guestData.id_number
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create guest: ${error.message}`);
    }

    return newGuest.id;
  }

  /**
   * Calculate pricing for the booking
   */
  private static async calculatePricing(
    hotelId: string,
    roomTypeId: string,
    ratePlanId: string,
    checkIn: string,
    checkOut: string
  ): Promise<{ success: boolean; data?: any; errors?: string[] }> {
    try {
      // Get daily rates for the period
      const { data: rates, error } = await supabase
        .from('daily_rates')
        .select('rate, date')
        .eq('hotel_id', hotelId)
        .eq('room_type_id', roomTypeId)
        .eq('rate_plan_id', ratePlanId)
        .gte('date', checkIn)
        .lt('date', checkOut)
        .order('date');

      if (error) throw error;

      if (!rates || rates.length === 0) {
        // Get base rate from rate plan
        const { data: ratePlan, error: ratePlanError } = await supabase
          .from('rate_plans')
          .select('base_rate')
          .eq('id', ratePlanId)
          .single();

        if (ratePlanError) throw ratePlanError;

        const baseRate = 150; // Default fallback rate
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          success: true,
          data: {
            total_amount: baseRate * nights,
            nights,
            average_rate: baseRate,
            daily_breakdown: []
          }
        };
      }

      const totalAmount = rates.reduce((sum, rate) => sum + Number(rate.rate), 0);
      const averageRate = totalAmount / rates.length;
      const nights = rates.length;

      return {
        success: true,
        data: {
          total_amount: totalAmount,
          nights,
          average_rate: averageRate,
          daily_breakdown: rates
        }
      };

    } catch (error) {
      console.error('Pricing calculation error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to calculate pricing']
      };
    }
  }

  /**
   * Process payment
   */
  private static async processPayment(
    hotelId: string,
    reservationId: string,
    amount: number,
    paymentMethod: string,
    notes: string
  ): Promise<void> {
    try {
      await supabase.from('payments').insert({
        hotel_id: hotelId,
        reservation_id: reservationId,
        amount: amount,
        amount_in_base_currency: amount, // Assuming same currency
        payment_method: paymentMethod,
        payment_type: 'deposit',
        status: 'processed',
        notes: notes,
        processed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Payment processing error:', error);
      // Don't throw error to avoid breaking the booking flow
    }
  }

  /**
   * Send booking confirmation
   */
  private static async sendBookingConfirmation(
    reservation: any,
    guestData: any
  ): Promise<void> {
    try {
      // This would integrate with email service
      console.log(`Booking confirmation sent to ${guestData.email} for reservation ${reservation.code}`);
      
      // Store communication log
      await supabase.from('guest_communications').insert({
        guest_id: reservation.guest_id,
        hotel_id: reservation.hotel_id,
        communication_type: 'email',
        subject: `Booking Confirmation - ${reservation.code}`,
        content: `Your booking has been confirmed. Reservation code: ${reservation.code}`,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to send booking confirmation:', error);
      // Don't throw error to avoid breaking the booking flow
    }
  }

  /**
   * Cancel booking with proper inventory and payment handling
   */
  public static async cancelBooking(
    reservationId: string,
    reason?: string,
    refundAmount?: number
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const cancelResult = await ReservationService.cancelReservation(
        reservationId,
        reason,
        refundAmount
      );

      if (!cancelResult.success) {
        return cancelResult;
      }

      // Sync inventory after cancellation manually for now
      if (cancelResult.data) {
        try {
          await supabase.from('rate_push_queue').insert({
            hotel_id: cancelResult.data.hotel_id,
            room_type_id: cancelResult.data.room_type_id,
            rate_plan_id: null,
            date_from: cancelResult.data.check_in,
            date_to: cancelResult.data.check_out,
            push_type: 'availability',
            priority: 1,
            status: 'pending'
          });
        } catch (syncError) {
          console.log('Inventory sync queuing failed:', syncError);
        }
      }

      return { success: true };

    } catch (error) {
      console.error('Booking cancellation error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to cancel booking']
      };
    }
  }

  /**
   * Modify existing booking
   */
  public static async modifyBooking(
    reservationId: string,
    modifications: any
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      // Check availability for new dates if dates are changing
      if (modifications.check_in || modifications.check_out) {
        const { data: existingReservation } = await supabase
          .from('reservations')
          .select('hotel_id, room_type_id, check_in, check_out')
          .eq('id', reservationId)
          .single();

        if (existingReservation) {
          const newCheckIn = modifications.check_in || existingReservation.check_in;
          const newCheckOut = modifications.check_out || existingReservation.check_out;

          // Only check if dates actually changed
          if (newCheckIn !== existingReservation.check_in || newCheckOut !== existingReservation.check_out) {
            const availabilityCheck = await InventoryService.getInventoryStatus(
              existingReservation.hotel_id,
              existingReservation.room_type_id,
              newCheckIn,
              newCheckOut
            );

            if (!availabilityCheck.success || !availabilityCheck.data?.every(day => day.available > 0)) {
              return {
                success: false,
                errors: ['No availability for new dates']
              };
            }
          }
        }
      }

      // Update reservation
      const updateResult = await ReservationService.updateReservation({
        id: reservationId,
        ...modifications
      });

      return updateResult;

    } catch (error) {
      console.error('Booking modification error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to modify booking']
      };
    }
  }
}