import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChannelSyncRequest {
  hotelId: string
  channelId?: string
  syncType: 'rate_push' | 'availability_push' | 'reservation_pull' | 'full_sync'
  dateFrom?: string
  dateTo?: string
  priority?: number
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

    const { hotelId, channelId, syncType, dateFrom, dateTo, priority = 5 } = await req.json() as ChannelSyncRequest

    console.log(`Processing channel sync: ${syncType} for hotel ${hotelId}`)

    let result

    switch (syncType) {
      case 'rate_push':
        result = await pushRatesAndAvailability(supabase, hotelId, channelId, dateFrom, dateTo, 'rate')
        break
      case 'availability_push':
        result = await pushRatesAndAvailability(supabase, hotelId, channelId, dateFrom, dateTo, 'availability')
        break
      case 'reservation_pull':
        result = await pullReservations(supabase, hotelId, channelId)
        break
      case 'full_sync':
        result = await performFullSync(supabase, hotelId, channelId)
        break
      default:
        throw new Error(`Unknown sync type: ${syncType}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Channel manager error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function pushRatesAndAvailability(
  supabase: any,
  hotelId: string,
  channelId?: string,
  dateFrom?: string,
  dateTo?: string,
  pushType: 'rate' | 'availability' | 'both' = 'both'
) {
  console.log(`Pushing ${pushType} for hotel ${hotelId}`)

  // Get active channels for this hotel
  const { data: channels, error: channelsError } = await supabase
    .from('channel_connections')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('connection_status', 'active')
    .eq(channelId ? 'id' : 'hotel_id', channelId || hotelId)

  if (channelsError) {
    throw new Error(`Failed to fetch channels: ${channelsError.message}`)
  }

  const results = []

  for (const channel of channels) {
    try {
      const syncLogId = crypto.randomUUID()
      
      // Log sync start
      await supabase.from('channel_sync_logs').insert({
        id: syncLogId,
        channel_id: channel.id,
        sync_type: `${pushType}_push`,
        sync_status: 'pending',
        started_at: new Date().toISOString()
      })

      let syncResult
      
      if (channel.channel_type === 'beds24') {
        syncResult = await pushToBeds24(supabase, channel, hotelId, dateFrom, dateTo, pushType)
      } else {
        syncResult = await pushToGenericChannel(supabase, channel, hotelId, dateFrom, dateTo, pushType)
      }

      // Update sync log
      await supabase.from('channel_sync_logs').update({
        sync_status: syncResult.success ? 'success' : 'error',
        completed_at: new Date().toISOString(),
        records_processed: syncResult.recordsProcessed || 0,
        error_message: syncResult.error || null,
        sync_data: syncResult.data || null
      }).eq('id', syncLogId)

      results.push({
        channelId: channel.id,
        channelName: channel.channel_name,
        success: syncResult.success,
        recordsProcessed: syncResult.recordsProcessed,
        error: syncResult.error
      })

    } catch (error) {
      console.error(`Error syncing to channel ${channel.channel_name}:`, error)
      results.push({
        channelId: channel.id,
        channelName: channel.channel_name,
        success: false,
        error: error.message
      })
    }
  }

  return {
    hotelId,
    pushType,
    channelsProcessed: results.length,
    results
  }
}

async function pushToBeds24(
  supabase: any,
  channel: any,
  hotelId: string,
  dateFrom?: string,
  dateTo?: string,
  pushType: 'rate' | 'availability' | 'both' = 'both'
) {
  console.log(`Pushing to Beds24 channel: ${channel.channel_name}`)

  try {
    // Use existing beds24-rate-push function
    const { data, error } = await supabase.functions.invoke('beds24-rate-push', {
      body: {
        hotelId,
        roomId: null, // Will process all rooms
        startDate: dateFrom || new Date().toISOString().split('T')[0],
        endDate: dateTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        updates: {
          rate: pushType === 'rate' || pushType === 'both' ? true : undefined,
          availability: pushType === 'availability' || pushType === 'both' ? true : undefined
        }
      }
    })

    if (error) {
      throw new Error(`Beds24 push failed: ${error.message}`)
    }

    return {
      success: true,
      recordsProcessed: data?.linesTotal || 0,
      data: data
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

async function pushToGenericChannel(
  supabase: any,
  channel: any,
  hotelId: string,
  dateFrom?: string,
  dateTo?: string,
  pushType: 'rate' | 'availability' | 'both' = 'both'
) {
  console.log(`Pushing to generic channel: ${channel.channel_name}`)

  try {
    // Get rate and availability data
    const startDate = dateFrom || new Date().toISOString().split('T')[0]
    const endDate = dateTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Fetch rates if needed
    let ratesData = []
    if (pushType === 'rate' || pushType === 'both') {
      const { data: rates } = await supabase
        .from('daily_rates')
        .select('*, room_types(*), rate_plans(*)')
        .eq('hotel_id', hotelId)
        .gte('date', startDate)
        .lte('date', endDate)

      ratesData = rates || []
    }

    // Fetch availability if needed
    let availabilityData = []
    if (pushType === 'availability' || pushType === 'both') {
      const { data: availability } = await supabase
        .from('room_inventory')
        .select('*, room_types(*)')
        .eq('hotel_id', hotelId)
        .gte('date', startDate)
        .lte('date', endDate)

      availabilityData = availability || []
    }

    // Format data for channel
    const formattedData = formatDataForChannel(channel, ratesData, availabilityData)

    // Send to channel endpoint
    const response = await fetch(channel.endpoint_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channel.api_credentials.token}`,
        ...channel.api_credentials.headers || {}
      },
      body: JSON.stringify(formattedData)
    })

    if (!response.ok) {
      throw new Error(`Channel API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    return {
      success: true,
      recordsProcessed: formattedData.length || 0,
      data: result
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

function formatDataForChannel(channel: any, ratesData: any[], availabilityData: any[]) {
  // This is a generic formatter - in real implementation, you'd have
  // channel-specific formatters based on their API requirements
  
  const formatted = []

  // Format rates
  for (const rate of ratesData) {
    formatted.push({
      type: 'rate',
      date: rate.date,
      roomType: rate.room_types?.code,
      ratePlan: rate.rate_plans?.code,
      rate: rate.rate,
      currency: 'USD' // or from hotel settings
    })
  }

  // Format availability
  for (const avail of availabilityData) {
    formatted.push({
      type: 'availability',
      date: avail.date,
      roomType: avail.room_types?.code,
      allotment: avail.allotment,
      stopSell: avail.stop_sell,
      closedToArrival: avail.closed_to_arrival,
      closedToDeparture: avail.closed_to_departure
    })
  }

  return formatted
}

async function pullReservations(supabase: any, hotelId: string, channelId?: string) {
  console.log(`Pulling reservations for hotel ${hotelId}`)

  // Get active channels that receive reservations
  const { data: channels, error: channelsError } = await supabase
    .from('channel_connections')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('connection_status', 'active')
    .eq('receive_reservations', true)
    .eq(channelId ? 'id' : 'hotel_id', channelId || hotelId)

  if (channelsError) {
    throw new Error(`Failed to fetch channels: ${channelsError.message}`)
  }

  const results = []

  for (const channel of channels) {
    try {
      const reservations = await fetchReservationsFromChannel(channel)
      let processedCount = 0

      for (const reservation of reservations) {
        const processed = await processInboundReservation(supabase, channel, reservation)
        if (processed) processedCount++
      }

      results.push({
        channelId: channel.id,
        channelName: channel.channel_name,
        success: true,
        reservationsPulled: reservations.length,
        reservationsProcessed: processedCount
      })

    } catch (error) {
      console.error(`Error pulling from channel ${channel.channel_name}:`, error)
      results.push({
        channelId: channel.id,
        channelName: channel.channel_name,
        success: false,
        error: error.message
      })
    }
  }

  return {
    hotelId,
    channelsProcessed: results.length,
    results
  }
}

async function fetchReservationsFromChannel(channel: any) {
  // Implement channel-specific reservation fetching
  console.log(`Fetching reservations from ${channel.channel_name}`)
  
  try {
    const response = await fetch(`${channel.endpoint_url}/reservations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${channel.api_credentials.token}`,
        'Content-Type': 'application/json',
        ...channel.api_credentials.headers || {}
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch reservations: ${response.status}`)
    }

    const data = await response.json()
    return data.reservations || []

  } catch (error) {
    console.error(`Error fetching from channel:`, error)
    return []
  }
}

async function processInboundReservation(supabase: any, channel: any, reservationData: any) {
  console.log(`Processing inbound reservation from ${channel.channel_name}`)

  try {
    // Store inbound reservation first
    const { data: inboundReservation, error: inboundError } = await supabase
      .from('inbound_reservations')
      .insert({
        channel_id: channel.id,
        channel_reservation_id: reservationData.id,
        hotel_id: channel.hotel_id,
        guest_data: reservationData.guest,
        booking_data: reservationData.booking,
        raw_data: reservationData,
        processing_status: 'pending'
      })
      .select()
      .single()

    if (inboundError) {
      throw new Error(`Failed to store inbound reservation: ${inboundError.message}`)
    }

    // Process guest data
    const guestId = await processGuestData(supabase, channel.hotel_id, reservationData.guest)

    // Create HMS reservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        hotel_id: channel.hotel_id,
        guest_id: guestId,
        room_type_id: reservationData.booking.roomTypeId,
        rate_plan_id: reservationData.booking.ratePlanId,
        check_in: reservationData.booking.checkIn,
        check_out: reservationData.booking.checkOut,
        adults: reservationData.booking.adults,
        children: reservationData.booking.children || 0,
        total_price: reservationData.booking.totalAmount,
        source: channel.channel_name,
        booking_reference: reservationData.booking.reference,
        confirmation_number: reservationData.booking.confirmationNumber,
        status: 'Confirmed'
      })
      .select()
      .single()

    if (reservationError) {
      throw new Error(`Failed to create reservation: ${reservationError.message}`)
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

    console.log(`Successfully processed reservation ${reservation.id}`)
    return true

  } catch (error) {
    console.error(`Error processing inbound reservation:`, error)
    
    // Update inbound reservation with error
    await supabase
      .from('inbound_reservations')
      .update({
        processing_status: 'error',
        error_message: error.message,
        processed_at: new Date().toISOString()
      })
      .eq('channel_reservation_id', reservationData.id)

    return false
  }
}

async function processGuestData(supabase: any, hotelId: string, guestData: any) {
  // Check if guest already exists
  const { data: existingGuest } = await supabase
    .from('guests')
    .select('id')
    .eq('hotel_id', hotelId)
    .eq('email', guestData.email)
    .single()

  if (existingGuest) {
    return existingGuest.id
  }

  // Create new guest
  const { data: newGuest, error } = await supabase
    .from('guests')
    .insert({
      hotel_id: hotelId,
      first_name: guestData.firstName,
      last_name: guestData.lastName,
      email: guestData.email,
      phone: guestData.phone,
      nationality: guestData.nationality
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create guest: ${error.message}`)
  }

  return newGuest.id
}

async function performFullSync(supabase: any, hotelId: string, channelId?: string) {
  console.log(`Performing full sync for hotel ${hotelId}`)

  const results = {
    ratePush: await pushRatesAndAvailability(supabase, hotelId, channelId, undefined, undefined, 'both'),
    reservationPull: await pullReservations(supabase, hotelId, channelId)
  }

  return {
    hotelId,
    syncType: 'full_sync',
    results,
    success: results.ratePush.results.some(r => r.success) || results.reservationPull.results.some(r => r.success)
  }
}