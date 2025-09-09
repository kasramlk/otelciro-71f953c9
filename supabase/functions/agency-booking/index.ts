import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgencyBookingRequest {
  hotelId: string
  roomTypeId: string
  guestName: string
  guestEmail: string
  guestPhone?: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  specialRequests?: string
  agencyId: string
  rateQuoted: number
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

    const bookingData: AgencyBookingRequest = await req.json()
    console.log('Processing agency booking:', bookingData)

    // Validate required fields
    if (!bookingData.hotelId || !bookingData.roomTypeId || !bookingData.guestEmail) {
      throw new Error('Missing required booking data')
    }

    // Create or update guest
    const guestNames = bookingData.guestName.split(' ')
    const firstName = guestNames[0] || 'Unknown'
    const lastName = guestNames.slice(1).join(' ') || ''

    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .upsert({
        hotel_id: bookingData.hotelId,
        first_name: firstName,
        last_name: lastName,
        email: bookingData.guestEmail,
        phone: bookingData.guestPhone
      }, {
        onConflict: 'email,hotel_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (guestError) {
      console.error('Guest creation error:', guestError)
      throw new Error(`Failed to create guest: ${guestError.message}`)
    }

    // Get or create default rate plan
    const { data: ratePlans } = await supabase
      .from('rate_plans')
      .select('id')
      .eq('hotel_id', bookingData.hotelId)
      .eq('is_active', true)
      .limit(1)

    let ratePlanId = ratePlans?.[0]?.id

    if (!ratePlanId) {
      const { data: newRatePlan } = await supabase
        .from('rate_plans')
        .insert({
          hotel_id: bookingData.hotelId,
          name: 'Agency Rate',
          code: 'AGENCY',
          is_active: true
        })
        .select('id')
        .single()
      
      ratePlanId = newRatePlan?.id
    }

    // Create HMS reservation
    const confirmationNumber = `HMS-${Date.now().toString().slice(-8)}`
    const reservationCode = `AGY${Date.now().toString().slice(-6)}`

    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        hotel_id: bookingData.hotelId,
        guest_id: guest.id,
        room_type_id: bookingData.roomTypeId,
        rate_plan_id: ratePlanId,
        check_in: bookingData.checkIn,
        check_out: bookingData.checkOut,
        adults: bookingData.adults,
        children: bookingData.children,
        total_price: bookingData.rateQuoted,
        currency: 'USD',
        status: 'Confirmed',
        source: 'Agency',
        confirmation_number: confirmationNumber,
        code: reservationCode,
        notes: bookingData.specialRequests,
        api_source_id: `AGENCY-${bookingData.agencyId}-${Date.now()}`
      })
      .select(`
        *,
        guests (first_name, last_name, email),
        room_types (name),
        hotels (name)
      `)
      .single()

    if (reservationError) {
      console.error('Reservation creation error:', reservationError)
      throw new Error(`Failed to create reservation: ${reservationError.message}`)
    }

    // Auto-assign room if available
    const { data: availableRoom } = await supabase
      .from('rooms')
      .select('id')
      .eq('hotel_id', bookingData.hotelId)
      .eq('room_type_id', bookingData.roomTypeId)
      .eq('status', 'Clean')
      .limit(1)
      .single()

    if (availableRoom) {
      await supabase
        .from('reservations')
        .update({ room_id: availableRoom.id })
        .eq('id', reservation.id)

      await supabase
        .from('rooms')
        .update({ 
          status: 'Reserved',
          housekeeping_status: 'Clean'
        })
        .eq('id', availableRoom.id)
    }

    // Send real-time notification to hotel
    await supabase
      .channel(`hotel-${bookingData.hotelId}`)
      .send({
        type: 'broadcast',
        event: 'new_reservation',
        payload: {
          reservationId: reservation.id,
          guestName: bookingData.guestName,
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          source: 'Agency',
          timestamp: new Date().toISOString()
        }
      })

    console.log(`Reservation created successfully: ${reservation.id}`)

    return new Response(JSON.stringify({
      success: true,
      reservationId: reservation.id,
      bookingReference: confirmationNumber,
      message: 'Agency booking converted to HMS reservation successfully',
      reservation: reservation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Agency booking error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})