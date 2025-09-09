import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookReservation {
  channelId: string
  reservationId: string
  action: 'create' | 'update' | 'cancel'
  data: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const contentType = req.headers.get('content-type') || ''
    let webhookData: WebhookReservation

    if (contentType.includes('application/json')) {
      webhookData = await req.json()
    } else {
      // Handle form data or other formats
      const formData = await req.formData()
      webhookData = {
        channelId: formData.get('channelId') as string,
        reservationId: formData.get('reservationId') as string,
        action: formData.get('action') as 'create' | 'update' | 'cancel',
        data: JSON.parse(formData.get('data') as string)
      }
    }

    console.log(`Processing webhook reservation: ${webhookData.action} from channel ${webhookData.channelId}`)

    // Verify channel exists and is active
    const { data: channel, error: channelError } = await supabase
      .from('channel_connections')
      .select('*')
      .eq('id', webhookData.channelId)
      .eq('connection_status', 'active')
      .eq('receive_reservations', true)
      .single()

    if (channelError || !channel) {
      throw new Error(`Invalid or inactive channel: ${webhookData.channelId}`)
    }

    let result

    switch (webhookData.action) {
      case 'create':
        result = await createReservation(supabase, channel, webhookData)
        break
      case 'update':
        result = await updateReservation(supabase, channel, webhookData)
        break
      case 'cancel':
        result = await cancelReservation(supabase, channel, webhookData)
        break
      default:
        throw new Error(`Unknown action: ${webhookData.action}`)
    }

    // Log the webhook processing
    await supabase.from('channel_sync_logs').insert({
      channel_id: channel.id,
      sync_type: 'reservation_webhook',
      sync_status: result.success ? 'success' : 'error',
      records_processed: 1,
      error_message: result.error || null,
      sync_data: {
        action: webhookData.action,
        reservationId: webhookData.reservationId,
        result: result
      }
    })

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function createReservation(supabase: any, channel: any, webhookData: WebhookReservation) {
  console.log(`Creating reservation from ${channel.channel_name}`)

  try {
    const reservationData = webhookData.data

    // Store inbound reservation for tracking
    const { data: inboundReservation, error: inboundError } = await supabase
      .from('inbound_reservations')
      .insert({
        channel_id: channel.id,
        channel_reservation_id: webhookData.reservationId,
        hotel_id: channel.hotel_id,
        guest_data: reservationData.guest || {},
        booking_data: reservationData.booking || {},
        raw_data: reservationData,
        processing_status: 'pending'
      })
      .select()
      .single()

    if (inboundError) {
      throw new Error(`Failed to store inbound reservation: ${inboundError.message}`)
    }

    // Process guest
    const guestId = await processGuest(supabase, channel.hotel_id, reservationData.guest)
    
    // Find or create room type mapping
    const roomTypeId = await mapRoomType(supabase, channel, reservationData.booking.roomType)
    
    // Find or create rate plan
    const ratePlanId = await mapRatePlan(supabase, channel, reservationData.booking.ratePlan)

    // Create HMS reservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        hotel_id: channel.hotel_id,
        guest_id: guestId,
        room_type_id: roomTypeId,
        rate_plan_id: ratePlanId,
        check_in: reservationData.booking.checkIn,
        check_out: reservationData.booking.checkOut,
        adults: reservationData.booking.adults || 1,
        children: reservationData.booking.children || 0,
        total_price: reservationData.booking.totalAmount || 0,
        source: channel.channel_name,
        booking_reference: reservationData.booking.reference,
        confirmation_number: reservationData.booking.confirmationNumber || webhookData.reservationId,
        status: mapReservationStatus(reservationData.booking.status),
        notes: reservationData.booking.notes,
        special_requests: reservationData.booking.specialRequests || [],
        api_source_id: webhookData.reservationId
      })
      .select()
      .single()

    if (reservationError) {
      throw new Error(`Failed to create reservation: ${reservationError.message}`)
    }

    // Auto-assign room if available
    await autoAssignRoom(supabase, reservation)

    // Create initial charges
    if (reservationData.booking.charges) {
      await createCharges(supabase, reservation.id, reservationData.booking.charges)
    }

    // Update inbound reservation status
    await supabase
      .from('inbound_reservations')
      .update({
        reservation_id: reservation.id,
        processing_status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', inboundReservation.id)

    // Send confirmation if enabled
    if (channel.channel_settings?.sendConfirmation) {
      await sendConfirmation(supabase, reservation, reservationData.guest)
    }

    return {
      success: true,
      reservationId: reservation.id,
      hmsReservationCode: reservation.code,
      message: 'Reservation created successfully'
    }

  } catch (error) {
    console.error('Error creating reservation:', error)
    
    // Update inbound reservation with error
    await supabase
      .from('inbound_reservations')
      .update({
        processing_status: 'error',
        error_message: error.message,
        processed_at: new Date().toISOString()
      })
      .eq('channel_reservation_id', webhookData.reservationId)

    return {
      success: false,
      error: error.message
    }
  }
}

async function updateReservation(supabase: any, channel: any, webhookData: WebhookReservation) {
  console.log(`Updating reservation from ${channel.channel_name}`)

  try {
    const reservationData = webhookData.data

    // Find existing HMS reservation
    const { data: existingReservation, error: findError } = await supabase
      .from('reservations')
      .select('*')
      .eq('api_source_id', webhookData.reservationId)
      .eq('hotel_id', channel.hotel_id)
      .single()

    if (findError || !existingReservation) {
      throw new Error(`Reservation not found: ${webhookData.reservationId}`)
    }

    // Update reservation
    const updateData: any = {}
    
    if (reservationData.booking.checkIn) updateData.check_in = reservationData.booking.checkIn
    if (reservationData.booking.checkOut) updateData.check_out = reservationData.booking.checkOut
    if (reservationData.booking.adults) updateData.adults = reservationData.booking.adults
    if (reservationData.booking.children !== undefined) updateData.children = reservationData.booking.children
    if (reservationData.booking.totalAmount) updateData.total_price = reservationData.booking.totalAmount
    if (reservationData.booking.status) updateData.status = mapReservationStatus(reservationData.booking.status)
    if (reservationData.booking.notes) updateData.notes = reservationData.booking.notes
    if (reservationData.booking.specialRequests) updateData.special_requests = reservationData.booking.specialRequests

    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', existingReservation.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update reservation: ${updateError.message}`)
    }

    // Log the update
    await supabase.from('inbound_reservations').insert({
      channel_id: channel.id,
      channel_reservation_id: webhookData.reservationId,
      hotel_id: channel.hotel_id,
      reservation_id: existingReservation.id,
      guest_data: reservationData.guest || {},
      booking_data: reservationData.booking || {},
      raw_data: reservationData,
      processing_status: 'processed',
      processed_at: new Date().toISOString()
    })

    return {
      success: true,
      reservationId: updatedReservation.id,
      hmsReservationCode: updatedReservation.code,
      message: 'Reservation updated successfully'
    }

  } catch (error) {
    console.error('Error updating reservation:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function cancelReservation(supabase: any, channel: any, webhookData: WebhookReservation) {
  console.log(`Cancelling reservation from ${channel.channel_name}`)

  try {
    // Find existing HMS reservation
    const { data: existingReservation, error: findError } = await supabase
      .from('reservations')
      .select('*')
      .eq('api_source_id', webhookData.reservationId)
      .eq('hotel_id', channel.hotel_id)
      .single()

    if (findError || !existingReservation) {
      throw new Error(`Reservation not found: ${webhookData.reservationId}`)
    }

    // Update reservation status to cancelled
    const { data: cancelledReservation, error: cancelError } = await supabase
      .from('reservations')
      .update({
        status: 'Cancelled',
        notes: `Cancelled via ${channel.channel_name}: ${webhookData.data.reason || 'No reason provided'}`
      })
      .eq('id', existingReservation.id)
      .select()
      .single()

    if (cancelError) {
      throw new Error(`Failed to cancel reservation: ${cancelError.message}`)
    }

    // Release room if assigned
    if (existingReservation.room_id) {
      await supabase
        .from('rooms')
        .update({ status: 'Available' })
        .eq('id', existingReservation.room_id)
    }

    // Log the cancellation
    await supabase.from('inbound_reservations').insert({
      channel_id: channel.id,
      channel_reservation_id: webhookData.reservationId,
      hotel_id: channel.hotel_id,
      reservation_id: existingReservation.id,
      guest_data: webhookData.data.guest || {},
      booking_data: webhookData.data.booking || {},
      raw_data: webhookData.data,
      processing_status: 'processed',
      processed_at: new Date().toISOString()
    })

    return {
      success: true,
      reservationId: cancelledReservation.id,
      hmsReservationCode: cancelledReservation.code,
      message: 'Reservation cancelled successfully'
    }

  } catch (error) {
    console.error('Error cancelling reservation:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function processGuest(supabase: any, hotelId: string, guestData: any) {
  if (!guestData) {
    throw new Error('Guest data is required')
  }

  // Check if guest already exists
  const { data: existingGuest } = await supabase
    .from('guests')
    .select('id')
    .eq('hotel_id', hotelId)
    .eq('email', guestData.email)
    .single()

  if (existingGuest) {
    // Update existing guest with any new information
    await supabase
      .from('guests')
      .update({
        first_name: guestData.firstName || guestData.first_name,
        last_name: guestData.lastName || guestData.last_name,
        phone: guestData.phone,
        nationality: guestData.nationality
      })
      .eq('id', existingGuest.id)
    
    return existingGuest.id
  }

  // Create new guest
  const { data: newGuest, error } = await supabase
    .from('guests')
    .insert({
      hotel_id: hotelId,
      first_name: guestData.firstName || guestData.first_name,
      last_name: guestData.lastName || guestData.last_name,
      email: guestData.email,
      phone: guestData.phone,
      nationality: guestData.nationality,
      id_number: guestData.idNumber
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create guest: ${error.message}`)
  }

  return newGuest.id
}

async function mapRoomType(supabase: any, channel: any, roomTypeCode: string) {
  // Check if we have a mapping for this room type
  const { data: mapping } = await supabase
    .from('channel_rate_mappings')
    .select('room_type_id')
    .eq('channel_id', channel.id)
    .eq('channel_room_code', roomTypeCode)
    .single()

  if (mapping) {
    return mapping.room_type_id
  }

  // Try to find room type by code
  const { data: roomType } = await supabase
    .from('room_types')
    .select('id')
    .eq('hotel_id', channel.hotel_id)
    .eq('code', roomTypeCode)
    .single()

  if (roomType) {
    return roomType.id
  }

  // Get the first available room type as fallback
  const { data: defaultRoomType } = await supabase
    .from('room_types')
    .select('id')
    .eq('hotel_id', channel.hotel_id)
    .limit(1)
    .single()

  if (!defaultRoomType) {
    throw new Error(`No room types found for hotel ${channel.hotel_id}`)
  }

  return defaultRoomType.id
}

async function mapRatePlan(supabase: any, channel: any, ratePlanCode: string) {
  // Check if we have a mapping for this rate plan
  const { data: mapping } = await supabase
    .from('channel_rate_mappings')
    .select('rate_plan_id')
    .eq('channel_id', channel.id)
    .eq('channel_rate_plan_code', ratePlanCode)
    .single()

  if (mapping) {
    return mapping.rate_plan_id
  }

  // Try to find rate plan by code
  const { data: ratePlan } = await supabase
    .from('rate_plans')
    .select('id')
    .eq('hotel_id', channel.hotel_id)
    .eq('code', ratePlanCode)
    .single()

  if (ratePlan) {
    return ratePlan.id
  }

  // Get the first available rate plan as fallback
  const { data: defaultRatePlan } = await supabase
    .from('rate_plans')
    .select('id')
    .eq('hotel_id', channel.hotel_id)
    .limit(1)
    .single()

  if (!defaultRatePlan) {
    throw new Error(`No rate plans found for hotel ${channel.hotel_id}`)
  }

  return defaultRatePlan.id
}

function mapReservationStatus(channelStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'confirmed': 'Confirmed',
    'pending': 'Tentative',
    'cancelled': 'Cancelled',
    'no_show': 'No Show',
    'checked_in': 'In House',
    'checked_out': 'Checked Out'
  }

  return statusMap[channelStatus.toLowerCase()] || 'Confirmed'
}

async function autoAssignRoom(supabase: any, reservation: any) {
  // Find available room of the correct type
  const { data: availableRoom } = await supabase
    .from('rooms')
    .select('id')
    .eq('hotel_id', reservation.hotel_id)
    .eq('room_type_id', reservation.room_type_id)
    .eq('status', 'Available')
    .limit(1)
    .single()

  if (availableRoom) {
    // Assign room
    await supabase
      .from('reservations')
      .update({ room_id: availableRoom.id })
      .eq('id', reservation.id)

    // Update room status
    await supabase
      .from('rooms')
      .update({ status: 'Reserved' })
      .eq('id', availableRoom.id)
  }
}

async function createCharges(supabase: any, reservationId: string, charges: any[]) {
  for (const charge of charges) {
    await supabase
      .from('reservation_charges')
      .insert({
        reservation_id: reservationId,
        description: charge.description,
        amount: charge.amount,
        type: charge.type || 'Room',
        currency: charge.currency || 'USD'
      })
  }
}

async function sendConfirmation(supabase: any, reservation: any, guestData: any) {
  // This would integrate with your email service
  console.log(`Sending confirmation for reservation ${reservation.code} to ${guestData.email}`)
  
  // Implementation would depend on your email service
  // You could call another edge function or external email service
}