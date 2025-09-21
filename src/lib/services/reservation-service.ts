import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Validation schemas
export const CreateReservationSchema = z.object({
  hotel_id: z.string().uuid(),
  guest_id: z.string().uuid(),
  room_type_id: z.string().uuid(),
  rate_plan_id: z.string().uuid(),
  check_in: z.string().date(),
  check_out: z.string().date(),
  adults: z.number().min(1).max(10),
  children: z.number().min(0).max(10),
  total_price: z.number().min(0),
  source: z.string().optional(),
  booking_reference: z.string().optional(),
  confirmation_number: z.string().optional(),
  status: z.enum(['Booked', 'Confirmed', 'Tentative', 'Cancelled', 'No Show', 'In House', 'Checked Out']).default('Booked'),
  notes: z.string().optional(),
  special_requests: z.array(z.string()).optional(),
  payment_method: z.string().optional(),
  guarantee_type: z.string().optional(),
  meal_plan: z.string().optional(),
  deposit_amount: z.number().min(0).optional(),
  balance_due: z.number().optional(),
  total_amount: z.number().min(0).optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),
  agency_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  group_id: z.string().uuid().optional(),
  promotion_id: z.string().uuid().optional(),
  arrival_time: z.string().optional(),
  departure_time: z.string().optional(),
});

export const UpdateReservationSchema = CreateReservationSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateReservationData = z.infer<typeof CreateReservationSchema>;
export type UpdateReservationData = z.infer<typeof UpdateReservationSchema>;

export interface ReservationBusinessRules {
  allowOverbooking: boolean;
  maxAdvanceBookingDays: number;
  minStayLength: number;
  maxStayLength: number;
  requireDeposit: boolean;
  depositPercentage: number;
  cancellationDeadlineHours: number;
  noShowTimeHours: number;
}

export interface ReservationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ReservationService {
  private static async validateBusinessRules(
    reservationData: CreateReservationData,
    rules?: ReservationBusinessRules
  ): Promise<ReservationValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const checkIn = new Date(reservationData.check_in);
    const checkOut = new Date(reservationData.check_out);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Basic date validation
    if (checkIn >= checkOut) {
      errors.push('Check-out date must be after check-in date');
    }

    if (checkIn < today) {
      errors.push('Check-in date cannot be in the past');
    }

    const stayLength = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    if (rules) {
      // Stay length validation
      if (stayLength < rules.minStayLength) {
        errors.push(`Minimum stay length is ${rules.minStayLength} nights`);
      }
      
      if (stayLength > rules.maxStayLength) {
        errors.push(`Maximum stay length is ${rules.maxStayLength} nights`);
      }

      // Advance booking validation
      const daysInAdvance = Math.ceil((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysInAdvance > rules.maxAdvanceBookingDays) {
        errors.push(`Cannot book more than ${rules.maxAdvanceBookingDays} days in advance`);
      }

      // Deposit validation
      if (rules.requireDeposit && (!reservationData.deposit_amount || reservationData.deposit_amount === 0)) {
        const requiredDeposit = (reservationData.total_price * rules.depositPercentage) / 100;
        warnings.push(`Deposit of ${requiredDeposit} is required`);
      }
    }

    // Capacity validation
    const totalGuests = reservationData.adults + reservationData.children;
    if (totalGuests > 8) { // Reasonable limit
      warnings.push('Large group size may require special arrangements');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static async checkInventoryAvailability(
    hotelId: string,
    roomTypeId: string,
    checkIn: string,
    checkOut: string,
    allowOverbooking = false
  ): Promise<{ available: boolean; availableRooms: number; reason?: string }> {
    try {
      // Get inventory for the date range
      const { data: inventory, error: invError } = await supabase
        .from('inventory')
        .select('allotment, stop_sell, closed_to_arrival, closed_to_departure, date')
        .eq('hotel_id', hotelId)
        .eq('room_type_id', roomTypeId)
        .gte('date', checkIn)
        .lt('date', checkOut)
        .order('date');

      if (invError) throw invError;

      // Check if any dates have stop_sell or arrival/departure restrictions
      for (const inv of inventory || []) {
        const invDate = new Date(inv.date);
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (inv.stop_sell) {
          return { available: false, availableRooms: 0, reason: `Stop sell on ${inv.date}` };
        }

        if (inv.closed_to_arrival && invDate.getTime() === checkInDate.getTime()) {
          return { available: false, availableRooms: 0, reason: `Closed to arrival on ${inv.date}` };
        }

        if (inv.closed_to_departure && invDate.getTime() === checkOutDate.getTime()) {
          return { available: false, availableRooms: 0, reason: `Closed to departure on ${inv.date}` };
        }
      }

      // Get existing confirmed reservations for the period
      const { data: existingReservations, error: resError } = await supabase
        .from('reservations')
        .select('check_in, check_out, status')
        .eq('hotel_id', hotelId)
        .eq('room_type_id', roomTypeId)
        .in('status', ['Confirmed', 'In House', 'Booked'])
        .or(`and(check_in.lt.${checkOut},check_out.gt.${checkIn})`);

      if (resError) throw resError;

      if (!inventory || inventory.length === 0) {
        // No inventory data - get total rooms for this type
        const { data: totalRooms, error: roomsError } = await supabase
          .from('rooms')
          .select('id', { count: 'exact' })
          .eq('hotel_id', hotelId)
          .eq('room_type_id', roomTypeId);

        if (roomsError) throw roomsError;

        const roomCount = totalRooms.count || 0;
        const bookedRooms = existingReservations?.length || 0;
        const available = roomCount - bookedRooms;

        return {
          available: available > 0 || allowOverbooking,
          availableRooms: Math.max(0, available)
        };
      }

      // Calculate minimum availability across all dates
      let minAvailableRooms = Infinity;
      
      for (const inv of inventory) {
        const invDate = new Date(inv.date);
        
        // Count overlapping reservations for this specific date
        const overlappingReservations = existingReservations?.filter(res => {
          const resCheckIn = new Date(res.check_in);
          const resCheckOut = new Date(res.check_out);
          return resCheckIn <= invDate && resCheckOut > invDate;
        }).length || 0;

        const availableForDate = inv.allotment - overlappingReservations;
        minAvailableRooms = Math.min(minAvailableRooms, availableForDate);
      }

      const finalAvailable = minAvailableRooms === Infinity ? 0 : Math.max(0, minAvailableRooms);
      
      return {
        available: finalAvailable > 0 || allowOverbooking,
        availableRooms: finalAvailable
      };

    } catch (error) {
      console.error('Inventory check error:', error);
      throw new Error(`Failed to check availability: ${error.message}`);
    }
  }

  public static async createReservation(
    reservationData: CreateReservationData,
    businessRules?: ReservationBusinessRules
  ): Promise<{ success: boolean; data?: any; errors?: string[]; warnings?: string[] }> {
    try {
      // Validate input data
      const validationResult = CreateReservationSchema.safeParse(reservationData);
      if (!validationResult.success) {
        return {
          success: false,
          errors: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }

      const validData = validationResult.data;

      // Validate business rules
      const businessValidation = await this.validateBusinessRules(validData, businessRules);
      if (!businessValidation.isValid) {
        return {
          success: false,
          errors: businessValidation.errors,
          warnings: businessValidation.warnings
        };
      }

      // Check inventory availability
      const availability = await this.checkInventoryAvailability(
        validData.hotel_id,
        validData.room_type_id,
        validData.check_in,
        validData.check_out,
        businessRules?.allowOverbooking
      );

      if (!availability.available) {
        return {
          success: false,
          errors: [availability.reason || 'No availability for selected dates']
        };
      }

      // Begin database transaction
      const { data: reservation, error: createError } = await supabase
        .from('reservations')
        .insert({
          ...validData,
          code: `RES${Date.now()}`, // Generate unique code
          balance_due: validData.total_price - (validData.deposit_amount || 0),
          total_amount: validData.total_price + (validData.discount_amount || 0)
        })
        .select(`
          *,
          guests (id, first_name, last_name, email, phone),
          room_types (id, name, description),
          rate_plans (id, name, description)
        `)
        .single();

      if (createError) {
        throw new Error(`Failed to create reservation: ${createError.message}`);
      }

      // Auto-assign room if available
      const roomAssignment = await this.autoAssignRoom(reservation.id, validData.room_type_id);

      // Create audit log
      await supabase.from('reservation_audit_log').insert({
        reservation_id: reservation.id,
        action: 'created',
        user_id: null, // Will be set by RLS if user is authenticated
        old_data: null,
        new_data: reservation,
        timestamp: new Date().toISOString(),
        notes: 'Reservation created via API'
      });

      return {
        success: true,
        data: {
          ...reservation,
          room_assigned: roomAssignment.success,
          room_number: roomAssignment.roomNumber
        },
        warnings: businessValidation.warnings
      };

    } catch (error) {
      console.error('Create reservation error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to create reservation']
      };
    }
  }

  public static async updateReservation(
    updateData: UpdateReservationData,
    businessRules?: ReservationBusinessRules
  ): Promise<{ success: boolean; data?: any; errors?: string[]; warnings?: string[] }> {
    try {
      // Validate input data
      const validationResult = UpdateReservationSchema.safeParse(updateData);
      if (!validationResult.success) {
        return {
          success: false,
          errors: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }

      const validData = validationResult.data;

      // Get existing reservation
      const { data: existingReservation, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', validData.id)
        .single();

      if (fetchError || !existingReservation) {
        return {
          success: false,
          errors: ['Reservation not found']
        };
      }

      // Check if dates are being changed and validate availability
      if (validData.check_in || validData.check_out || validData.room_type_id) {
        const newCheckIn = validData.check_in || existingReservation.check_in;
        const newCheckOut = validData.check_out || existingReservation.check_out;
        const newRoomType = validData.room_type_id || existingReservation.room_type_id;

        // Only check availability if dates or room type actually changed
        if (newCheckIn !== existingReservation.check_in || 
            newCheckOut !== existingReservation.check_out || 
            newRoomType !== existingReservation.room_type_id) {
          
          const availability = await this.checkInventoryAvailability(
            existingReservation.hotel_id,
            newRoomType,
            newCheckIn,
            newCheckOut,
            businessRules?.allowOverbooking
          );

          if (!availability.available) {
            return {
              success: false,
              errors: [availability.reason || 'No availability for new dates']
            };
          }
        }
      }

      // Update reservation
      const { data: updatedReservation, error: updateError } = await supabase
        .from('reservations')
        .update({
          ...validData,
          id: undefined, // Remove id from update data
          updated_at: new Date().toISOString()
        })
        .eq('id', validData.id)
        .select(`
          *,
          guests (id, first_name, last_name, email, phone),
          room_types (id, name, description),
          rate_plans (id, name, description)
        `)
        .single();

      if (updateError) {
        throw new Error(`Failed to update reservation: ${updateError.message}`);
      }

      // Create audit log
      await supabase.from('reservation_audit_log').insert({
        reservation_id: validData.id,
        action: 'updated',
        user_id: null,
        old_data: existingReservation,
        new_data: updatedReservation,
        timestamp: new Date().toISOString(),
        notes: 'Reservation updated via API'
      });

      return {
        success: true,
        data: updatedReservation
      };

    } catch (error) {
      console.error('Update reservation error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to update reservation']
      };
    }
  }

  public static async cancelReservation(
    reservationId: string,
    reason?: string,
    refundAmount?: number
  ): Promise<{ success: boolean; data?: any; errors?: string[] }> {
    try {
      // Get existing reservation
      const { data: existingReservation, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (fetchError || !existingReservation) {
        return {
          success: false,
          errors: ['Reservation not found']
        };
      }

      if (existingReservation.status === 'Cancelled') {
        return {
          success: false,
          errors: ['Reservation is already cancelled']
        };
      }

      // Update reservation status
      const { data: cancelledReservation, error: cancelError } = await supabase
        .from('reservations')
        .update({
          status: 'Cancelled',
          notes: `${existingReservation.notes || ''}\nCancelled: ${reason || 'No reason provided'}`.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select()
        .single();

      if (cancelError) {
        throw new Error(`Failed to cancel reservation: ${cancelError.message}`);
      }

      // Release assigned room
      if (existingReservation.room_id) {
        await supabase
          .from('rooms')
          .update({ status: 'Available' })
          .eq('id', existingReservation.room_id);
      }

      // Process refund if specified
      if (refundAmount && refundAmount > 0) {
        await supabase.from('payments').insert({
          hotel_id: existingReservation.hotel_id,
          reservation_id: reservationId,
          amount: -refundAmount, // Negative amount for refund
          payment_method: 'Refund',
          payment_type: 'refund',
          status: 'processed',
          notes: `Cancellation refund: ${reason || 'No reason provided'}`,
          processed_at: new Date().toISOString()
        });
      }

      // Create audit log
      await supabase.from('reservation_audit_log').insert({
        reservation_id: reservationId,
        action: 'cancelled',
        user_id: null,
        old_data: existingReservation,
        new_data: cancelledReservation,
        timestamp: new Date().toISOString(),
        notes: `Reservation cancelled: ${reason || 'No reason provided'}`
      });

      return {
        success: true,
        data: cancelledReservation
      };

    } catch (error) {
      console.error('Cancel reservation error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to cancel reservation']
      };
    }
  }

  private static async autoAssignRoom(
    reservationId: string,
    roomTypeId: string
  ): Promise<{ success: boolean; roomNumber?: string }> {
    try {
      // Find available room of the correct type
      const { data: availableRoom, error } = await supabase
        .from('rooms')
        .select('id, number')
        .eq('room_type_id', roomTypeId)
        .eq('status', 'Available')
        .eq('housekeeping_status', 'Clean')
        .limit(1)
        .single();

      if (error || !availableRoom) {
        return { success: false };
      }

      // Assign room to reservation
      const { error: assignError } = await supabase
        .from('reservations')
        .update({ room_id: availableRoom.id })
        .eq('id', reservationId);

      if (assignError) {
        return { success: false };
      }

      // Update room status
      await supabase
        .from('rooms')
        .update({ status: 'Reserved' })
        .eq('id', availableRoom.id);

      return { success: true, roomNumber: availableRoom.number };

    } catch (error) {
      console.error('Auto-assign room error:', error);
      return { success: false };
    }
  }

  public static async getReservationsByDateRange(
    hotelId: string,
    startDate: string,
    endDate: string,
    status?: string[]
  ) {
    try {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          guests (id, first_name, last_name, email, phone),
          room_types (id, name, description),
          rooms (id, number, floor),
          rate_plans (id, name, description)
        `)
        .eq('hotel_id', hotelId)
        .or(`and(check_in.gte.${startDate},check_in.lte.${endDate}),and(check_out.gte.${startDate},check_out.lte.${endDate}),and(check_in.lte.${startDate},check_out.gte.${endDate})`)
        .order('check_in');

      if (status && status.length > 0) {
        query = query.in('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Get reservations error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to get reservations']
      };
    }
  }
}