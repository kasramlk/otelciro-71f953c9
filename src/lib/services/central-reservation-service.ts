import { supabase } from '@/integrations/supabase/client';
import { ReservationService, CreateReservationData } from './reservation-service';
import { z } from 'zod';

// Channel booking request schema
export const ChannelBookingSchema = z.object({
  channel_id: z.string().uuid(),
  channel_reservation_id: z.string(),
  guest_data: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    nationality: z.string().optional(),
    id_number: z.string().optional(),
  }),
  booking_data: z.object({
    room_type_code: z.string(),
    rate_plan_code: z.string().optional(),
    check_in: z.string().date(),
    check_out: z.string().date(),
    adults: z.number().min(1).max(10),
    children: z.number().min(0).max(10),
    total_amount: z.number().min(0),
    currency: z.string().default('USD'),
    status: z.string().default('confirmed'),
    special_requests: z.array(z.string()).optional(),
    notes: z.string().optional(),
    confirmation_number: z.string().optional(),
    booking_reference: z.string().optional(),
  }),
  raw_data: z.record(z.any()).optional(),
});

export type ChannelBookingRequest = z.infer<typeof ChannelBookingSchema>;

export interface ChannelProcessingResult {
  success: boolean;
  reservation_id?: string;
  hms_code?: string;
  inbound_reservation_id?: string;
  errors?: string[];
  warnings?: string[];
}

export interface OverbookingPolicy {
  enabled: boolean;
  max_percentage: number; // Maximum overbooking percentage (e.g., 10 for 10%)
  room_types_allowed: string[]; // Which room types allow overbooking
  notification_threshold: number; // When to alert staff (e.g., 90% occupancy)
}

export interface InventoryAllocation {
  room_type_id: string;
  channel_allocations: {
    [channel_id: string]: {
      allocation: number;
      priority: number; // 1 = highest priority
    };
  };
  reservation_buffer: number; // Rooms to keep for direct bookings
}

export class CentralReservationService {
  /**
   * Process incoming reservation from channel manager
   */
  public static async processChannelReservation(
    bookingRequest: ChannelBookingRequest
  ): Promise<ChannelProcessingResult> {
    try {
      // Validate input
      const validationResult = ChannelBookingSchema.safeParse(bookingRequest);
      if (!validationResult.success) {
        return {
          success: false,
          errors: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }

      const validData = validationResult.data;

      // Store inbound reservation for tracking
      const { data: inboundReservation, error: inboundError } = await supabase
        .from('inbound_reservations')
        .insert({
          channel_id: validData.channel_id,
          channel_reservation_id: validData.channel_reservation_id,
          guest_data: validData.guest_data,
          booking_data: validData.booking_data,
          raw_data: validData.raw_data || {},
          processing_status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (inboundError) {
        throw new Error(`Failed to store inbound reservation: ${inboundError.message}`);
      }

      try {
        // Get channel configuration
        const { data: channel, error: channelError } = await supabase
          .from('channel_connections')
          .select('*')
          .eq('id', validData.channel_id)
          .eq('connection_status', 'active')
          .single();

        if (channelError || !channel) {
          throw new Error(`Channel not found or inactive: ${validData.channel_id}`);
        }

        // Process guest (create or update)
        const guestId = await this.processChannelGuest(
          channel.hotel_id,
          validData.guest_data
        );

        // Map room type
        const roomTypeId = await this.mapChannelRoomType(
          validData.channel_id,
          channel.hotel_id,
          validData.booking_data.room_type_code
        );

        // Map rate plan
        const ratePlanId = await this.mapChannelRatePlan(
          validData.channel_id,
          channel.hotel_id,
          validData.booking_data.rate_plan_code || 'default'
        );

        // Check channel allocation availability
        const allocationCheck = await this.checkChannelAllocation(
          channel.hotel_id,
          roomTypeId,
          validData.channel_id,
          validData.booking_data.check_in,
          validData.booking_data.check_out
        );

        if (!allocationCheck.available && !allocationCheck.allowOverbooking) {
          throw new Error(allocationCheck.reason || 'No allocation available for this channel');
        }

        // Create HMS reservation
        const reservationData: CreateReservationData = {
          hotel_id: channel.hotel_id,
          guest_id: guestId,
          room_type_id: roomTypeId,
          rate_plan_id: ratePlanId,
          check_in: validData.booking_data.check_in,
          check_out: validData.booking_data.check_out,
          adults: validData.booking_data.adults,
          children: validData.booking_data.children,
          total_price: validData.booking_data.total_amount,
          source: channel.channel_name,
          booking_reference: validData.booking_data.booking_reference,
          confirmation_number: validData.booking_data.confirmation_number || validData.channel_reservation_id,
          status: this.mapChannelStatus(validData.booking_data.status),
          notes: validData.booking_data.notes,
          special_requests: validData.booking_data.special_requests,
          currency: validData.booking_data.currency,
          api_source_id: validData.channel_reservation_id,
          total_amount: validData.booking_data.total_amount,
          balance_due: validData.booking_data.total_amount, // Assuming full amount due
        };

        const reservationResult = await ReservationService.createReservation(
          reservationData,
          {
            allowOverbooking: allocationCheck.allowOverbooking,
            maxAdvanceBookingDays: 365,
            minStayLength: 1,
            maxStayLength: 30,
            requireDeposit: false,
            depositPercentage: 0,
            cancellationDeadlineHours: 24,
            noShowTimeHours: 6
          }
        );

        if (!reservationResult.success) {
          throw new Error(`Failed to create reservation: ${reservationResult.errors?.join(', ')}`);
        }

        // Update inbound reservation with success
        await supabase
          .from('inbound_reservations')
          .update({
            reservation_id: reservationResult.data.id,
            processing_status: 'processed',
            processed_at: new Date().toISOString(),
            hotel_id: channel.hotel_id
          })
          .eq('id', inboundReservation.id);

        // Send confirmation if enabled
        if (channel.channel_settings?.auto_confirm) {
          await this.sendChannelConfirmation(
            validData.channel_id,
            validData.channel_reservation_id,
            reservationResult.data
          );
        }

        return {
          success: true,
          reservation_id: reservationResult.data.id,
          hms_code: reservationResult.data.code,
          inbound_reservation_id: inboundReservation.id,
          warnings: reservationResult.warnings
        };

      } catch (processingError) {
        // Update inbound reservation with error
        await supabase
          .from('inbound_reservations')
          .update({
            processing_status: 'error',
            error_message: processingError.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', inboundReservation.id);

        throw processingError;
      }

    } catch (error) {
      console.error('Channel reservation processing error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to process channel reservation']
      };
    }
  }

  /**
   * Process or create guest from channel data
   */
  private static async processChannelGuest(
    hotelId: string,
    guestData: any
  ): Promise<string> {
    // Check if guest already exists
    const { data: existingGuest } = await supabase
      .from('guests')
      .select('id')
      .eq('hotel_id', hotelId)
      .eq('email', guestData.email)
      .single();

    if (existingGuest) {
      // Update existing guest with new information
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
   * Map channel room type code to HMS room type
   */
  private static async mapChannelRoomType(
    channelId: string,
    hotelId: string,
    roomTypeCode: string
  ): Promise<string> {
    // Check for explicit mapping
    const { data: mapping } = await supabase
      .from('channel_rate_mappings')
      .select('room_type_id')
      .eq('channel_id', channelId)
      .eq('channel_room_code', roomTypeCode)
      .single();

    if (mapping) {
      return mapping.room_type_id;
    }

    // Try to find by code
    const { data: roomType } = await supabase
      .from('room_types')
      .select('id')
      .eq('hotel_id', hotelId)
      .eq('code', roomTypeCode)
      .single();

    if (roomType) {
      return roomType.id;
    }

    // Default to first available room type
    const { data: defaultRoomType } = await supabase
      .from('room_types')
      .select('id')
      .eq('hotel_id', hotelId)
      .limit(1)
      .single();

    if (!defaultRoomType) {
      throw new Error(`No room types found for hotel ${hotelId}`);
    }

    return defaultRoomType.id;
  }

  /**
   * Map channel rate plan code to HMS rate plan
   */
  private static async mapChannelRatePlan(
    channelId: string,
    hotelId: string,
    ratePlanCode: string
  ): Promise<string> {
    // Check for explicit mapping
    const { data: mapping } = await supabase
      .from('channel_rate_mappings')
      .select('rate_plan_id')
      .eq('channel_id', channelId)
      .eq('channel_rate_plan_code', ratePlanCode)
      .single();

    if (mapping) {
      return mapping.rate_plan_id;
    }

    // Try to find by code
    const { data: ratePlan } = await supabase
      .from('rate_plans')
      .select('id')
      .eq('hotel_id', hotelId)
      .eq('code', ratePlanCode)
      .single();

    if (ratePlan) {
      return ratePlan.id;
    }

    // Default to first available rate plan
    const { data: defaultRatePlan } = await supabase
      .from('rate_plans')
      .select('id')
      .eq('hotel_id', hotelId)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!defaultRatePlan) {
      throw new Error(`No active rate plans found for hotel ${hotelId}`);
    }

    return defaultRatePlan.id;
  }

  /**
   * Check channel allocation availability
   */
  private static async checkChannelAllocation(
    hotelId: string,
    roomTypeId: string,
    channelId: string,
    checkIn: string,
    checkOut: string
  ): Promise<{ available: boolean; allowOverbooking: boolean; reason?: string }> {
    try {
      // Get channel allocation configuration
      const { data: allocation } = await supabase
        .from('channel_allocations')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('room_type_id', roomTypeId)
        .eq('channel_id', channelId)
        .single();

      // If no specific allocation, allow based on general availability
      if (!allocation) {
        return { available: true, allowOverbooking: false };
      }

      // Check if allocation has rooms available
      const { data: channelBookings } = await supabase
        .from('reservations')
        .select('id')
        .eq('hotel_id', hotelId)
        .eq('room_type_id', roomTypeId)
        .not('source', 'is', null)
        .in('status', ['Confirmed', 'In House', 'Booked'])
        .or(`and(check_in.lt.${checkOut},check_out.gt.${checkIn})`);

      const usedAllocation = channelBookings?.length || 0;
      const availableAllocation = allocation.allocated_rooms - usedAllocation;

      return {
        available: availableAllocation > 0,
        allowOverbooking: allocation.allow_overbooking || false,
        reason: availableAllocation <= 0 ? 'Channel allocation exceeded' : undefined
      };

    } catch (error) {
      console.error('Channel allocation check error:', error);
      // Default to allowing booking if allocation check fails
      return { available: true, allowOverbooking: false };
    }
  }

  /**
   * Map channel status to HMS status
   */
  private static mapChannelStatus(channelStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'confirmed': 'Confirmed',
      'pending': 'Tentative',
      'tentative': 'Tentative',
      'cancelled': 'Cancelled',
      'no_show': 'No Show',
      'checked_in': 'In House',
      'checked_out': 'Checked Out',
      'booked': 'Booked'
    };

    return statusMap[channelStatus.toLowerCase()] || 'Confirmed';
  }

  /**
   * Send confirmation back to channel
   */
  private static async sendChannelConfirmation(
    channelId: string,
    channelReservationId: string,
    hmsReservation: any
  ): Promise<void> {
    try {
      // This would integrate with channel APIs to send confirmations
      // For now, just log the confirmation
      console.log(`Confirmation sent to channel ${channelId} for reservation ${channelReservationId}`);
      
      // Store confirmation log
      await supabase.from('channel_sync_logs').insert({
        channel_id: channelId,
        sync_type: 'confirmation_sent',
        sync_status: 'success',
        records_processed: 1,
        sync_data: {
          channel_reservation_id: channelReservationId,
          hms_code: hmsReservation.code,
          confirmation_time: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Failed to send channel confirmation:', error);
    }
  }

  /**
   * Synchronize inventory across all channels
   */
  public static async synchronizeInventoryAcrossChannels(
    hotelId: string,
    roomTypeId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      // Get all active channels for this hotel
      const { data: channels, error: channelsError } = await supabase
        .from('channel_connections')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('connection_status', 'active')
        .eq('push_inventory', true);

      if (channelsError) throw channelsError;

      if (!channels || channels.length === 0) {
        return { success: true }; // No channels to sync
      }

      // Queue inventory pushes for each channel
      const pushPromises = channels.map(channel =>
        supabase.from('rate_push_queue').insert({
          hotel_id: hotelId,
          room_type_id: roomTypeId,
          rate_plan_id: null, // Will be determined by processor
          channel_id: channel.id,
          date_from: dateFrom,
          date_to: dateTo,
          push_type: 'availability',
          priority: 1, // High priority for inventory sync
          status: 'pending'
        })
      );

      await Promise.all(pushPromises);

      return { success: true };

    } catch (error) {
      console.error('Inventory synchronization error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to synchronize inventory']
      };
    }
  }

  /**
   * Get channel performance analytics
   */
  public static async getChannelPerformance(
    hotelId: string,
    dateFrom: string,
    dateTo: string
  ) {
    try {
      const { data: channelStats, error } = await supabase
        .from('reservations')
        .select(`
          source,
          status,
          total_price,
          adults,
          children,
          check_in,
          check_out
        `)
        .eq('hotel_id', hotelId)
        .gte('check_in', dateFrom)
        .lte('check_out', dateTo)
        .not('source', 'is', null);

      if (error) throw error;

      // Process statistics by channel
      const channelPerformance = {};
      
      channelStats?.forEach(reservation => {
        const channel = reservation.source || 'Direct';
        if (!channelPerformance[channel]) {
          channelPerformance[channel] = {
            reservations: 0,
            revenue: 0,
            guests: 0,
            avg_length_of_stay: 0,
            cancellations: 0
          };
        }

        channelPerformance[channel].reservations++;
        channelPerformance[channel].revenue += reservation.total_price;
        channelPerformance[channel].guests += reservation.adults + reservation.children;
        
        if (reservation.status === 'Cancelled') {
          channelPerformance[channel].cancellations++;
        }

        const los = Math.ceil(
          (new Date(reservation.check_out).getTime() - new Date(reservation.check_in).getTime()) 
          / (1000 * 60 * 60 * 24)
        );
        channelPerformance[channel].avg_length_of_stay += los;
      });

      // Calculate averages
      Object.keys(channelPerformance).forEach(channel => {
        const stats = channelPerformance[channel];
        stats.avg_length_of_stay = stats.avg_length_of_stay / stats.reservations;
        stats.cancellation_rate = (stats.cancellations / stats.reservations) * 100;
        stats.adr = stats.revenue / stats.reservations; // Average Daily Rate
      });

      return { success: true, data: channelPerformance };

    } catch (error) {
      console.error('Channel performance error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to get channel performance']
      };
    }
  }
}