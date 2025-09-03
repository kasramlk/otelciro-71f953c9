import { getTokenForOperation } from './beds24-tokens.ts'
import { parseCreditHeaders, shouldBackoff, RateLimitError } from './credit-limit.ts'
import { logAudit, createOperationTimer } from './logger.ts'

// Startup self-check for required secrets
function validateEnvironment() {
  const requiredSecrets = [
    'BEDS24_BASE_URL',
    'BEDS24_READ_TOKEN', 
    'LOG_REDACT_KEYS'
  ];
  
  const missing = requiredSecrets.filter(secret => !Deno.env.get(secret));
  
  if (missing.length > 0) {
    throw new Error(`Missing required secrets: ${missing.join(', ')}. Please configure these in Supabase Edge Functions settings.`);
  }
  
  // Validate BEDS24_BASE_URL format
  const baseUrl = Deno.env.get('BEDS24_BASE_URL');
  if (baseUrl && !baseUrl.startsWith('https://')) {
    throw new Error('BEDS24_BASE_URL must be a valid HTTPS URL');
  }
  
  console.log('Beds24Client: Environment validation passed', { secrets: requiredSecrets });
}

export interface Beds24RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  hotelId?: string
  operation?: string
}

export interface Beds24Response<T = any> {
  data: T
  creditInfo: {
    requestCost: number
    remaining: number
    resetsIn: number
  }
}

class Beds24Client {
  private baseUrl: string

  constructor() {
    // Validate environment on initialization
    validateEnvironment();
    this.baseUrl = Deno.env.get('BEDS24_BASE_URL') || 'https://api.beds24.com/v2'
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: Beds24RequestOptions = {}
  ): Promise<Beds24Response<T>> {
    const timer = createOperationTimer()
    const isWriteOperation = options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)
    
    try {
      const token = await getTokenForOperation(isWriteOperation ? 'write' : 'read')
      
      const url = `${this.baseUrl}${endpoint}`
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      })

      const creditInfo = parseCreditHeaders(response.headers)
      const duration = timer.getDuration()

      // Check if we should back off due to rate limits
      if (shouldBackoff(creditInfo.remaining)) {
        await logAudit(options.operation || 'api_request', {
          hotel_id: options.hotelId,
          status: 'error',
          request_cost: creditInfo.requestCost,
          credit_limit_remaining: creditInfo.remaining,
          credit_limit_resets_in: creditInfo.resetsIn,
          duration_ms: duration,
          error_details: { 
            type: 'rate_limit', 
            remaining: creditInfo.remaining,
            resetsIn: creditInfo.resetsIn 
          }
        })

        throw new RateLimitError(
          `Rate limit approaching. Remaining: ${creditInfo.remaining}`,
          creditInfo.remaining,
          creditInfo.resetsIn
        )
      }

      let responseData: T
      try {
        responseData = await response.json()
      } catch {
        responseData = null as T
      }

      if (!response.ok) {
        await logAudit(options.operation || 'api_request', {
          hotel_id: options.hotelId,
          status: 'error',
          request_cost: creditInfo.requestCost,
          credit_limit_remaining: creditInfo.remaining,
          credit_limit_resets_in: creditInfo.resetsIn,
          duration_ms: duration,
          request_payload: options.body,
          response_payload: responseData,
          error_details: {
            status: response.status,
            statusText: response.statusText,
            url
          }
        })

        throw new Error(`Beds24 API error: ${response.status} ${response.statusText}`)
      }

      // Log successful request
      await logAudit(options.operation || 'api_request', {
        hotel_id: options.hotelId,
        status: 'success',
        request_cost: creditInfo.requestCost,
        credit_limit_remaining: creditInfo.remaining,
        credit_limit_resets_in: creditInfo.resetsIn,
        duration_ms: duration,
        request_payload: options.body,
        response_payload: responseData
      })

      return {
        data: responseData,
        creditInfo
      }
    } catch (error) {
      const duration = timer.getDuration()
      
      if (!(error instanceof RateLimitError)) {
        await logAudit(options.operation || 'api_request', {
          hotel_id: options.hotelId,
          status: 'error',
          duration_ms: duration,
          request_payload: options.body,
          error_details: {
            message: error.message,
            type: error.name
          }
        })
      }

      throw error
    }
  }

  // Property methods
  async getProperty(propertyId: string, opts: {
    includeAllRooms?: boolean
    includePriceRules?: boolean
    includeOffers?: boolean
    includeTexts?: boolean
  } = {}) {
    const params = new URLSearchParams()
    if (opts.includeAllRooms) params.set('includeAllRooms', 'true')
    if (opts.includePriceRules) params.set('includePriceRules', 'true')
    if (opts.includeOffers) params.set('includeOffers', 'true')
    if (opts.includeTexts) params.set('includeTexts', 'true')

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.makeRequest(`/properties/${propertyId}${query}`, {
      operation: 'get_property'
    })
  }

  // Calendar methods
  async getRoomsCalendar(propertyId: string, params: {
    startDate?: string
    endDate?: string
    includePrices?: boolean
    includeMinStay?: boolean
    includeMaxStay?: boolean
    includeNumAvail?: boolean
  }) {
    const searchParams = new URLSearchParams()
    if (params.startDate) searchParams.set('startDate', params.startDate)
    if (params.endDate) searchParams.set('endDate', params.endDate)
    if (params.includePrices) searchParams.set('includePrices', 'true')
    if (params.includeMinStay) searchParams.set('includeMinStay', 'true')
    if (params.includeMaxStay) searchParams.set('includeMaxStay', 'true')
    if (params.includeNumAvail) searchParams.set('includeNumAvail', 'true')

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return this.makeRequest(`/properties/${propertyId}/rooms/calendar${query}`, {
      operation: 'get_rooms_calendar'
    })
  }

  async postRoomsCalendar(propertyId: string, lines: any[]) {
    return this.makeRequest(`/properties/${propertyId}/rooms/calendar`, {
      method: 'POST',
      body: lines,
      operation: 'post_rooms_calendar'
    })
  }

  // Booking methods
  async getBookings(propertyId: string, params: {
    modifiedFrom?: string
    includeGuests?: boolean
    includeInvoiceItems?: boolean
    includeBookingGroup?: boolean
    status?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params.modifiedFrom) searchParams.set('modifiedFrom', params.modifiedFrom)
    if (params.includeGuests) searchParams.set('includeGuests', 'true')
    if (params.includeInvoiceItems) searchParams.set('includeInvoiceItems', 'true')
    if (params.includeBookingGroup) searchParams.set('includeBookingGroup', 'true')
    if (params.status) searchParams.set('status', params.status)

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return this.makeRequest(`/properties/${propertyId}/bookings${query}`, {
      operation: 'get_bookings'
    })
  }

  // Message methods (stubbed for later implementation)
  async getMessages(propertyId: string) {
    return this.makeRequest(`/properties/${propertyId}/messages`, {
      operation: 'get_messages'
    })
  }

  async postMessage(propertyId: string, message: any) {
    return this.makeRequest(`/properties/${propertyId}/messages`, {
      method: 'POST',
      body: message,
      operation: 'post_message'
    })
  }
}

export const beds24Client = new Beds24Client()