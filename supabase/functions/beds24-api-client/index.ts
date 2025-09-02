import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BEDS24_BASE_URL = "https://api.beds24.com/v2";

class Beds24APIClient {
  private supabase;
  private getAccessToken: (hotelId: string, forWrite?: boolean) => Promise<string>;

  constructor(supabase: any, getAccessToken: (hotelId: string, forWrite?: boolean) => Promise<string>) {
    this.supabase = supabase;
    this.getAccessToken = getAccessToken;
  }

  async makeRequest(hotelId: string, method: string, path: string, body?: any, forWrite = false) {
    const startTime = Date.now();
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        const token = await this.getAccessToken(hotelId, forWrite);
        
        const response = await fetch(`${BEDS24_BASE_URL}${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'token': token
          },
          body: body ? JSON.stringify(body) : undefined
        });

        const duration = Date.now() - startTime;
        
        // Extract rate limit info from headers
        const requestCost = parseFloat(response.headers.get('X-Request-Cost') || '1');
        const fiveMinRemaining = parseFloat(response.headers.get('X-Five-Min-Remaining') || '0');
        const fiveMinResetsIn = parseInt(response.headers.get('X-Five-Min-Resets-In') || '0');

        // Get beds24_property_id for logging
        const { data: connection } = await this.supabase
          .from('beds24_connections')
          .select('beds24_property_id')
          .eq('hotel_id', hotelId)
          .single();

        // Log API call
        await this.supabase.from('beds24_api_logs').insert({
          hotel_id: hotelId,
          beds24_property_id: connection?.beds24_property_id,
          method,
          path,
          status: response.status,
          request_cost: requestCost,
          five_min_remaining: fiveMinRemaining,
          five_min_resets_in: fiveMinResetsIn,
          duration_ms: duration,
          error: !response.ok ? await response.text() : null
        });

        // Handle rate limiting
        if (response.status === 429 || fiveMinRemaining < 10) {
          const sleepTime = Math.max(fiveMinResetsIn * 1000, 60000); // At least 1 minute
          console.log(`Rate limit hit, sleeping for ${sleepTime}ms`);
          await new Promise(resolve => setTimeout(resolve, sleepTime));
          attempt++;
          continue;
        }

        // Handle token refresh on 401
        if (response.status === 401 && attempt === 0) {
          console.log('Access token expired, will retry with new token');
          attempt++;
          continue;
        }

        if (!response.ok) {
          throw new Error(`Beds24 API error: ${response.status} ${await response.text()}`);
        }

        return await response.json();

      } catch (error) {
        attempt++;
        if (attempt >= maxAttempts) {
          throw error;
        }
        
        // Exponential backoff for retries
        const backoffTime = Math.pow(2, attempt) * 1000;
        console.log(`Attempt ${attempt} failed, retrying in ${backoffTime}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }

  // API Methods
  async getAccount(hotelId: string) {
    return this.makeRequest(hotelId, 'GET', '/authentication/details');
  }

  async getProperties(hotelId: string) {
    return this.makeRequest(hotelId, 'GET', '/properties');
  }

  async getProperty(hotelId: string, propertyId: number) {
    return this.makeRequest(hotelId, 'GET', `/properties/${propertyId}`);
  }

  async getRoomTypes(hotelId: string, propertyId: number) {
    return this.makeRequest(hotelId, 'GET', `/properties/${propertyId}/rooms`);
  }

  async getInventory(hotelId: string, propertyId: number, params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest(hotelId, 'GET', `/properties/${propertyId}/inventory?${queryString}`);
  }

  async getBookings(hotelId: string, propertyId: number, params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest(hotelId, 'GET', `/properties/${propertyId}/bookings?${queryString}`);
  }

  async getMessages(hotelId: string, propertyId: number, params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest(hotelId, 'GET', `/properties/${propertyId}/messages?${queryString}`);
  }

  async updateInventory(hotelId: string, propertyId: number, data: any) {
    return this.makeRequest(hotelId, 'POST', `/properties/${propertyId}/inventory`, data, true);
  }

  async createBooking(hotelId: string, propertyId: number, booking: any) {
    return this.makeRequest(hotelId, 'POST', `/properties/${propertyId}/bookings`, booking, true);
  }

  async sendMessage(hotelId: string, propertyId: number, message: any) {
    return this.makeRequest(hotelId, 'POST', `/properties/${propertyId}/messages`, message, true);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Token service function
    const getAccessToken = async (hotelId: string, forWrite = false) => {
      const response = await supabase.functions.invoke('beds24-token-service', {
        body: { action: 'getAccessToken', hotelId, forWrite }
      });
      
      if (response.error) {
        throw new Error('Failed to get access token');
      }
      
      return response.data.token;
    };

    const client = new Beds24APIClient(supabase, getAccessToken);
    const { action, hotelId, propertyId, params, data } = await req.json();

    let result;
    switch (action) {
      case 'getAccount':
        result = await client.getAccount(hotelId);
        break;
      case 'getProperties':
        result = await client.getProperties(hotelId);
        break;
      case 'getProperty':
        result = await client.getProperty(hotelId, propertyId);
        break;
      case 'getRoomTypes':
        result = await client.getRoomTypes(hotelId, propertyId);
        break;
      case 'getInventory':
        result = await client.getInventory(hotelId, propertyId, params);
        break;
      case 'getBookings':
        result = await client.getBookings(hotelId, propertyId, params);
        break;
      case 'getMessages':
        result = await client.getMessages(hotelId, propertyId, params);
        break;
      case 'updateInventory':
        result = await client.updateInventory(hotelId, propertyId, data);
        break;
      case 'createBooking':
        result = await client.createBooking(hotelId, propertyId, data);
        break;
      case 'sendMessage':
        result = await client.sendMessage(hotelId, propertyId, data);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in beds24-api-client:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});