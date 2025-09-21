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

      // Get channel configuration first
      const { data: channel, error: channelError } = await supabase
        .from('channel_connections')
        .select('*')
        .eq('id', validData.channel_id)
        .eq('connection_status', 'active')
        .single();

      if (channelError || !channel) {
        return {
          success: false,
          errors: [`Channel not found or inactive: ${validData.channel_id}`]
        };
      }

      // Store inbound reservation for tracking
      const { data: inboundReservation, error: inboundError } = await supabase
        .from('inbound_reservations')
        .insert({
          channel_id: validData.channel_id,
          channel_reservation_id: validData.channel_reservation_id,
          hotel_id: channel.hotel_id,
          guest_data: validData.guest_data,
          booking_data: validData.booking_data,
          raw_data: validData.raw_data || {},
          processing_status: 'pending'
        })
        .select()
        .single();

      if (inboundError) {
        return {
          success: false,
          errors: [`Failed to store inbound reservation: ${inboundError.message}`]
        };
      }

      try {
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
          notes: validData.booking_data.notes,
          special_requests: validData.booking_data.special_requests,
          total_amount: validData.booking_data.total_amount,
          balance_due: validData.booking_data.total_amount,
        };

        const reservationResult = await ReservationService.createReservation(
          reservationData,
          {
            allowOverbooking: false,
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
            processed_at: new Date().toISOString()
          })
          .eq('id', inboundReservation.id);

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
      for (const channel of channels) {
        // Get a default rate plan for this hotel
        const { data: ratePlan } = await supabase
          .from('rate_plans')
          .select('id')
          .eq('hotel_id', hotelId)
          .eq('is_active', true)
          .limit(1)
          .single();

        await supabase.from('rate_push_queue').insert({
          hotel_id: hotelId,
          room_type_id: roomTypeId,
          rate_plan_id: ratePlan?.id || null,
          date_from: dateFrom,
          date_to: dateTo,
          push_type: 'availability',
          priority: 1,
          status: 'pending'
        });
      }

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