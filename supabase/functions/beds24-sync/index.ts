import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Beds24Config {
  token: string
  propertyId?: string
  orgId?: string
}

interface SyncRequest {
  operation: 'full_sync' | 'sync_properties' | 'sync_rooms' | 'sync_calendar' | 'sync_bookings' | 'sync_messages' | 'sync_invoices'
  propertyId?: string
  startDate?: string
  endDate?: string
}

// Rate limiting tracker
const rateLimitState = {
  fiveMinCredits: 1000,
  dailyCredits: 10000,
  lastCheck: Date.now()
}

class Beds24APIClient {
  private baseUrl = 'https://api.beds24.com/v2'
  private token: string
  private supabase: any

  constructor(token: string, supabase: any) {
    this.token = token
    this.supabase = supabase
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    
    // Check rate limits before making request
    if (rateLimitState.fiveMinCredits <= 0) {
      throw new Error('Rate limit exceeded: No 5-minute credits remaining')
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'accept': 'application/json',
        'token': this.token,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    // Update rate limit state from response headers
    const fiveMinRemaining = response.headers.get('X-FiveMinCreditLimit-Remaining')
    const dailyRemaining = response.headers.get('X-DailyCreditLimit-Remaining')
    const requestCost = response.headers.get('X-RequestCost')
    
    if (fiveMinRemaining) rateLimitState.fiveMinCredits = parseInt(fiveMinRemaining)
    
    // Log rate limit info
    await this.supabase.from('beds24_rate_limits').insert({
      request_cost: requestCost ? parseInt(requestCost) : 1,
      five_min_credits_remaining: fiveMinRemaining ? parseInt(fiveMinRemaining) : null,
      daily_credits_remaining: dailyRemaining ? parseInt(dailyRemaining) : null,
      response_headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Beds24 API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  async getProperties(): Promise<any[]> {
    console.log('Fetching properties from Beds24...')
    const data = await this.makeRequest('/properties')
    return data.data || []
  }

  async getProperty(propertyId: string): Promise<any> {
    console.log(`Fetching property ${propertyId} from Beds24...`)
    const data = await this.makeRequest(`/properties/${propertyId}`)
    return data.data
  }

  async getRooms(propertyId: string): Promise<any[]> {
    console.log(`Fetching rooms for property ${propertyId} from Beds24...`)
    const data = await this.makeRequest(`/properties/${propertyId}/rooms`)
    return data.data || []
  }

  async getCalendar(propertyId: string, roomId: string, startDate: string, endDate: string): Promise<any[]> {
    console.log(`Fetching calendar for room ${roomId} from ${startDate} to ${endDate}...`)
    const data = await this.makeRequest(`/properties/${propertyId}/rooms/${roomId}/calendar?start=${startDate}&end=${endDate}`)
    return data.data || []
  }

  async getBookings(propertyId: string, startDate?: string, endDate?: string): Promise<any[]> {
    console.log(`Fetching bookings for property ${propertyId}...`)
    let endpoint = `/properties/${propertyId}/bookings`
    if (startDate && endDate) {
      endpoint += `?start=${startDate}&end=${endDate}`
    }
    const data = await this.makeRequest(endpoint)
    return data.data || []
  }

  async getMessages(propertyId: string): Promise<any[]> {
    console.log(`Fetching messages for property ${propertyId}...`)
    const data = await this.makeRequest(`/properties/${propertyId}/messages`)
    return data.data || []
  }

  async getInvoices(propertyId: string): Promise<any[]> {
    console.log(`Fetching invoices for property ${propertyId}...`)
    const data = await this.makeRequest(`/properties/${propertyId}/invoices`)
    return data.data || []
  }

  async updateCalendar(propertyId: string, roomId: string, calendarData: any): Promise<any> {
    console.log(`Updating calendar for room ${roomId}...`)
    return this.makeRequest(`/properties/${propertyId}/rooms/${roomId}/calendar`, {
      method: 'PUT',
      body: JSON.stringify(calendarData)
    })
  }

  async createBooking(propertyId: string, bookingData: any): Promise<any> {
    console.log(`Creating booking for property ${propertyId}...`)
    return this.makeRequest(`/properties/${propertyId}/bookings`, {
      method: 'POST',
      body: JSON.stringify(bookingData)
    })
  }
}

class Beds24Sync {
  private client: Beds24APIClient
  private supabase: any

  constructor(client: Beds24APIClient, supabase: any) {
    this.client = client
    this.supabase = supabase
  }

  private async createSyncLog(operation: string, entityType: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('beds24_sync_logs')
      .insert({
        operation,
        entity_type: entityType,
        status: 'running'
      })
      .select()
      .single()

    if (error) throw error
    return data.id
  }

  private async updateSyncLog(logId: string, updates: any): Promise<void> {
    const { error } = await this.supabase
      .from('beds24_sync_logs')
      .update({
        ...updates,
        completed_at: new Date().toISOString()
      })
      .eq('id', logId)

    if (error) throw error
  }

  async syncProperties(): Promise<{ success: number; failed: number }> {
    const logId = await this.createSyncLog('sync_properties', 'property')
    let success = 0, failed = 0

    try {
      const properties = await this.client.getProperties()
      
      for (const property of properties) {
        try {
          const { error } = await this.supabase
            .from('beds24_properties')
            .upsert({
              beds24_property_id: property.id.toString(),
              name: property.name,
              address: property.address,
              city: property.city,
              country: property.country,
              timezone: property.timezone || 'UTC',
              currency: property.currency || 'USD',
              property_data: property,
              sync_status: 'active',
              last_sync_at: new Date().toISOString()
            }, { onConflict: 'beds24_property_id' })

          if (error) throw error
          success++
        } catch (err) {
          console.error(`Failed to sync property ${property.id}:`, err)
          failed++
        }
      }

      await this.updateSyncLog(logId, { 
        status: 'completed',
        records_processed: properties.length,
        records_success: success,
        records_failed: failed
      })

    } catch (error) {
      await this.updateSyncLog(logId, { 
        status: 'failed',
        error_details: { message: error.message }
      })
      throw error
    }

    return { success, failed }
  }

  async syncRooms(propertyId: string): Promise<{ success: number; failed: number }> {
    const logId = await this.createSyncLog('sync_rooms', 'room')
    let success = 0, failed = 0

    try {
      const rooms = await this.client.getRooms(propertyId)
      
      for (const room of rooms) {
        try {
          const { error } = await this.supabase
            .from('beds24_room_types')
            .upsert({
              beds24_room_id: room.id.toString(),
              beds24_property_id: propertyId,
              name: room.name,
              max_occupancy: room.maxOccupancy || 2,
              room_data: room,
              sync_status: 'active'
            }, { onConflict: 'beds24_room_id,beds24_property_id' })

          if (error) throw error
          success++
        } catch (err) {
          console.error(`Failed to sync room ${room.id}:`, err)
          failed++
        }
      }

      await this.updateSyncLog(logId, { 
        status: 'completed',
        records_processed: rooms.length,
        records_success: success,
        records_failed: failed
      })

    } catch (error) {
      await this.updateSyncLog(logId, { 
        status: 'failed',
        error_details: { message: error.message }
      })
      throw error
    }

    return { success, failed }
  }

  async syncCalendar(propertyId: string, roomId: string, startDate: string, endDate: string): Promise<{ success: number; failed: number }> {
    const logId = await this.createSyncLog('sync_calendar', 'calendar')
    let success = 0, failed = 0

    try {
      const calendarData = await this.client.getCalendar(propertyId, roomId, startDate, endDate)
      
      for (const dayData of calendarData) {
        try {
          const { error } = await this.supabase
            .from('beds24_calendar')
            .upsert({
              beds24_property_id: propertyId,
              beds24_room_id: roomId,
              date: dayData.date,
              available: dayData.available || 0,
              rate: dayData.rate,
              min_stay: dayData.minStay || 1,
              max_stay: dayData.maxStay,
              arrival_allowed: dayData.arrivalAllowed !== false,
              departure_allowed: dayData.departureAllowed !== false,
              closed_arrival: dayData.closedArrival === true,
              closed_departure: dayData.closedDeparture === true,
              calendar_data: dayData,
              sync_status: 'synced'
            }, { onConflict: 'beds24_property_id,beds24_room_id,date' })

          if (error) throw error
          success++
        } catch (err) {
          console.error(`Failed to sync calendar for date ${dayData.date}:`, err)
          failed++
        }
      }

      await this.updateSyncLog(logId, { 
        status: 'completed',
        records_processed: calendarData.length,
        records_success: success,
        records_failed: failed
      })

    } catch (error) {
      await this.updateSyncLog(logId, { 
        status: 'failed',
        error_details: { message: error.message }
      })
      throw error
    }

    return { success, failed }
  }

  async syncBookings(propertyId: string, startDate?: string, endDate?: string): Promise<{ success: number; failed: number }> {
    const logId = await this.createSyncLog('sync_bookings', 'booking')
    let success = 0, failed = 0

    try {
      const bookings = await this.client.getBookings(propertyId, startDate, endDate)
      
      for (const booking of bookings) {
        try {
          const { error } = await this.supabase
            .from('beds24_bookings')
            .upsert({
              beds24_booking_id: booking.id.toString(),
              beds24_property_id: propertyId,
              guest_name: booking.guestName || 'Unknown',
              guest_email: booking.guestEmail,
              guest_phone: booking.guestPhone,
              check_in: booking.checkIn,
              check_out: booking.checkOut,
              adults: booking.adults || 1,
              children: booking.children || 0,
              total_amount: booking.totalAmount,
              currency: booking.currency || 'USD',
              booking_source: booking.source,
              status: booking.status || 'confirmed',
              booking_data: booking,
              sync_status: 'synced'
            }, { onConflict: 'beds24_booking_id' })

          if (error) throw error
          success++
        } catch (err) {
          console.error(`Failed to sync booking ${booking.id}:`, err)
          failed++
        }
      }

      await this.updateSyncLog(logId, { 
        status: 'completed',
        records_processed: bookings.length,
        records_success: success,
        records_failed: failed
      })

    } catch (error) {
      await this.updateSyncLog(logId, { 
        status: 'failed',
        error_details: { message: error.message }
      })
      throw error
    }

    return { success, failed }
  }

  async fullSync(propertyId: string): Promise<any> {
    console.log(`Starting full sync for property ${propertyId}`)
    const results: any = {}

    // Sync properties first
    results.properties = await this.syncProperties()

    // Sync rooms
    results.rooms = await this.syncRooms(propertyId)

    // Sync calendar for the next 90 days
    const startDate = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Get rooms to sync calendar for each
    const { data: rooms } = await this.supabase
      .from('beds24_room_types')
      .select('beds24_room_id')
      .eq('beds24_property_id', propertyId)

    results.calendar = { success: 0, failed: 0 }
    for (const room of rooms || []) {
      const calendarResult = await this.syncCalendar(propertyId, room.beds24_room_id, startDate, endDate)
      results.calendar.success += calendarResult.success
      results.calendar.failed += calendarResult.failed
    }

    // Sync bookings for the next 90 days
    results.bookings = await this.syncBookings(propertyId, startDate, endDate)

    return results
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const beds24Token = Deno.env.get('BEDS24_API_TOKEN')!

    if (!beds24Token) {
      throw new Error('BEDS24_API_TOKEN not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Authenticate request
    const authorization = req.headers.get('authorization')
    if (!authorization) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authorization.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid authorization')
    }

    const { operation, propertyId, startDate, endDate }: SyncRequest = await req.json()

    const client = new Beds24APIClient(beds24Token, supabase)
    const syncService = new Beds24Sync(client, supabase)

    let result: any

    switch (operation) {
      case 'full_sync':
        if (!propertyId) throw new Error('Property ID required for full sync')
        result = await syncService.fullSync(propertyId)
        break

      case 'sync_properties':
        result = await syncService.syncProperties()
        break

      case 'sync_rooms':
        if (!propertyId) throw new Error('Property ID required for room sync')
        result = await syncService.syncRooms(propertyId)
        break

      case 'sync_calendar':
        if (!propertyId || !startDate || !endDate) {
          throw new Error('Property ID, start date, and end date required for calendar sync')
        }
        // Get rooms for the property
        const { data: rooms } = await supabase
          .from('beds24_room_types')
          .select('beds24_room_id')
          .eq('beds24_property_id', propertyId)

        result = { success: 0, failed: 0 }
        for (const room of rooms || []) {
          const calendarResult = await syncService.syncCalendar(propertyId, room.beds24_room_id, startDate, endDate)
          result.success += calendarResult.success
          result.failed += calendarResult.failed
        }
        break

      case 'sync_bookings':
        if (!propertyId) throw new Error('Property ID required for booking sync')
        result = await syncService.syncBookings(propertyId, startDate, endDate)
        break

      default:
        throw new Error(`Unknown operation: ${operation}`)
    }

    return new Response(JSON.stringify({
      success: true,
      operation,
      result,
      rateLimitInfo: {
        fiveMinCredits: rateLimitState.fiveMinCredits,
        timestamp: rateLimitState.lastCheck
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Beds24 sync error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})