import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { ensureMapping } from './mapping-repo.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

export interface UpsertResult {
  created: number
  updated: number
  errors: string[]
}

export async function upsertHotelFromBeds24(property: any): Promise<UpsertResult> {
  try {
    const hotelData = {
      name: property.propName || property.name,
      address: property.address,
      city: property.city,
      country: property.country,
      phone: property.phone,
      email: property.email,
      timezone: property.timezone || 'UTC',
      code: property.propKey || property.id?.toString(),
      // Keep existing org_id if updating
      updated_at: new Date().toISOString()
    }

    // First try to find existing hotel by external mapping
    const { data: existingMapping } = await supabase
      .from('v_external_ids')
      .select('otelciro_id')
      .eq('provider', 'beds24')
      .eq('entity', 'property')
      .eq('external_id', property.propId?.toString() || property.id?.toString())
      .single()

    let result: UpsertResult = { created: 0, updated: 0, errors: [] }
    let hotelId: string

    if (existingMapping?.otelciro_id) {
      // Update existing hotel
      const { data, error } = await supabase
        .from('hotels')
        .update(hotelData)
        .eq('id', existingMapping.otelciro_id)
        .select('id')
        .single()

      if (error) {
        result.errors.push(`Failed to update hotel: ${error.message}`)
        return result
      }

      hotelId = data.id
      result.updated = 1
    } else {
      // Create new hotel - need org_id from somewhere (default for now)
      const { data, error } = await supabase
        .from('hotels')
        .insert({
          ...hotelData,
          org_id: '550e8400-e29b-41d4-a716-446655440000' // Default org_id
        })
        .select('id')
        .single()

      if (error) {
        result.errors.push(`Failed to create hotel: ${error.message}`)
        return result
      }

      hotelId = data.id
      result.created = 1
    }

    // Ensure mapping exists
    await ensureMapping(
      'beds24',
      'property',
      property.propId?.toString() || property.id?.toString(),
      hotelId,
      {
        propName: property.propName,
        propKey: property.propKey,
        importedAt: new Date().toISOString()
      }
    )

    return result
  } catch (error) {
    return {
      created: 0,
      updated: 0,
      errors: [`Upsert hotel error: ${error.message}`]
    }
  }
}

export async function upsertRoomTypesFromBeds24(
  hotelId: string,
  roomTypes: any[]
): Promise<UpsertResult> {
  let result: UpsertResult = { created: 0, updated: 0, errors: [] }

  for (const roomType of roomTypes) {
    try {
      // Check if room type already exists via mapping
      const { data: existingMapping } = await supabase
        .from('v_external_ids')
        .select('otelciro_id')
        .eq('provider', 'beds24')
        .eq('entity', 'room_type')
        .eq('external_id', roomType.roomId?.toString())
        .single()

      const roomTypeData = {
        hotel_id: hotelId,
        name: roomType.name,
        capacity: roomType.maxPax || 2,
        base_price: roomType.basePrice || 0,
        description: roomType.description,
        updated_at: new Date().toISOString()
      }

      let roomTypeId: string

      if (existingMapping?.otelciro_id) {
        // Update existing room type
        const { data, error } = await supabase
          .from('room_types')
          .update(roomTypeData)
          .eq('id', existingMapping.otelciro_id)
          .select('id')
          .single()

        if (error) {
          result.errors.push(`Failed to update room type ${roomType.name}: ${error.message}`)
          continue
        }

        roomTypeId = data.id
        result.updated++
      } else {
        // Create new room type
        const { data, error } = await supabase
          .from('room_types')
          .insert(roomTypeData)
          .select('id')
          .single()

        if (error) {
          result.errors.push(`Failed to create room type ${roomType.name}: ${error.message}`)
          continue
        }

        roomTypeId = data.id
        result.created++
      }

      // Ensure mapping
      await ensureMapping(
        'beds24',
        'room_type',
        roomType.roomId?.toString(),
        roomTypeId,
        {
          name: roomType.name,
          maxPax: roomType.maxPax,
          importedAt: new Date().toISOString()
        }
      )
    } catch (error) {
      result.errors.push(`Error processing room type ${roomType.name}: ${error.message}`)
    }
  }

  return result
}

export async function upsertCalendar(
  hotelId: string,
  roomTypeId: string,
  days: any[]
): Promise<UpsertResult> {
  let result: UpsertResult = { created: 0, updated: 0, errors: [] }

  for (const day of days) {
    try {
      // Upsert daily_rates if price data exists
      if (day.price !== undefined && day.price !== null) {
        const rateData = {
          hotel_id: hotelId,
          room_type_id: roomTypeId,
          rate_plan_id: '550e8400-e29b-41d4-a716-446655440001', // Default rate plan
          date: day.date,
          rate: parseFloat(day.price),
          beds24_price_index: day.priceIndex || 1
        }

        const { error: rateError } = await supabase
          .from('daily_rates')
          .upsert(rateData, {
            onConflict: 'room_type_id,date,rate_plan_id'
          })

        if (rateError) {
          result.errors.push(`Failed to upsert rate for ${day.date}: ${rateError.message}`)
        }
      }

      // Upsert room_inventory for availability data
      const inventoryData = {
        hotel_id: hotelId,
        room_type_id: roomTypeId,
        date: day.date,
        allotment: day.numAvail,
        min_stay: day.minStay,
        max_stay: day.maxStay,
        closed_to_arrival: day.closedArrival || false,
        closed_to_departure: day.closedDeparture || false,
        stop_sell: day.stopSell || false,
        updated_at: new Date().toISOString()
      }

      const { error: inventoryError } = await supabase
        .from('room_inventory')
        .upsert(inventoryData, {
          onConflict: 'room_type_id,date'
        })

      if (inventoryError) {
        result.errors.push(`Failed to upsert inventory for ${day.date}: ${inventoryError.message}`)
      } else {
        result.updated++
      }
    } catch (error) {
      result.errors.push(`Error processing calendar day ${day.date}: ${error.message}`)
    }
  }

  return result
}

export async function upsertBooking(
  hotelId: string,
  booking: any
): Promise<UpsertResult> {
  let result: UpsertResult = { created: 0, updated: 0, errors: [] }

  try {
    // First ensure guest exists
    let guestId: string | null = null

    if (booking.guest && (booking.guest.email || booking.guest.firstName || booking.guest.lastName)) {
      const guestData = {
        hotel_id: hotelId,
        first_name: booking.guest.firstName || '',
        last_name: booking.guest.lastName || '',
        email: booking.guest.email,
        phone: booking.guest.phone,
        nationality: booking.guest.nationality,
        updated_at: new Date().toISOString()
      }

      // Try to find existing guest by external mapping
      const { data: existingGuestMapping } = await supabase
        .from('v_external_ids')
        .select('otelciro_id')
        .eq('provider', 'beds24')
        .eq('entity', 'guest')
        .eq('external_id', booking.guest.guestId?.toString() || `booking_${booking.bookId}_guest`)
        .single()

      if (existingGuestMapping?.otelciro_id) {
        guestId = existingGuestMapping.otelciro_id
        // Update existing guest
        await supabase
          .from('guests')
          .update(guestData)
          .eq('id', guestId)
      } else {
        // Create new guest
        const { data: guestResult, error: guestError } = await supabase
          .from('guests')
          .insert(guestData)
          .select('id')
          .single()

        if (guestError) {
          result.errors.push(`Failed to create guest: ${guestError.message}`)
          return result
        }

        guestId = guestResult.id
        result.created++

        // Create guest mapping
        await ensureMapping(
          'beds24',
          'guest',
          booking.guest.guestId?.toString() || `booking_${booking.bookId}_guest`,
          guestId
        )
      }
    }

    // Check if reservation already exists
    const { data: existingReservationMapping } = await supabase
      .from('v_external_ids')
      .select('otelciro_id')
      .eq('provider', 'beds24')
      .eq('entity', 'booking')
      .eq('external_id', booking.bookId?.toString())
      .single()

    const reservationData = {
      hotel_id: hotelId,
      guest_id: guestId,
      check_in: booking.arrival,
      check_out: booking.departure,
      adults: booking.numAdult || 1,
      children: booking.numChild || 0,
      total_amount: parseFloat(booking.price || 0),
      currency: booking.currency || 'USD',
      status: mapBookingStatus(booking.status),
      channel: booking.channel || 'Direct',
      special_requests: booking.notes,
      updated_at: new Date().toISOString()
    }

    let reservationId: string

    if (existingReservationMapping?.otelciro_id) {
      // Update existing reservation
      const { data, error } = await supabase
        .from('reservations')
        .update(reservationData)
        .eq('id', existingReservationMapping.otelciro_id)
        .select('id')
        .single()

      if (error) {
        result.errors.push(`Failed to update reservation: ${error.message}`)
        return result
      }

      reservationId = data.id
      result.updated++
    } else {
      // Create new reservation
      const { data, error } = await supabase
        .from('reservations')
        .insert(reservationData)
        .select('id')
        .single()

      if (error) {
        result.errors.push(`Failed to create reservation: ${error.message}`)
        return result
      }

      reservationId = data.id
      result.created++
    }

    // Ensure booking mapping
    await ensureMapping(
      'beds24',
      'booking',
      booking.bookId?.toString(),
      reservationId,
      {
        bookRoomId: booking.bookRoomId,
        price: booking.price,
        currency: booking.currency,
        importedAt: new Date().toISOString()
      }
    )

    return result
  } catch (error) {
    return {
      created: 0,
      updated: 0,
      errors: [`Upsert booking error: ${error.message}`]
    }
  }
}

function mapBookingStatus(beds24Status: string): string {
  switch (beds24Status?.toLowerCase()) {
    case 'confirmed': return 'confirmed'
    case 'cancelled': return 'cancelled'
    case 'no-show': return 'no_show'
    case 'checked-in': return 'checked_in'
    case 'checked-out': return 'checked_out'
    default: return 'pending'
  }
}
