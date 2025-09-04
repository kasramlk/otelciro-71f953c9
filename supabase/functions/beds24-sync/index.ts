import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { beds24Client } from "../_shared/beds24-client.ts";
import { logAudit, createOperationTimer } from "../_shared/logger.ts";
import { upsertCalendar, upsertBooking } from "../_shared/upsert.ts";
import { RateLimitError, shouldBackoff } from "../_shared/credit-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncRequest {
  type?: "bookings" | "calendar" | "both";
  hotelId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔐 SECURITY: Validate cron secret for automated calls
  const cronSecret = Deno.env.get('CRON_SECRET') ?? '';
  const incomingSecret = req.headers.get('x-cron-secret') ?? '';
  
  if (incomingSecret && cronSecret && incomingSecret !== cronSecret) {
    console.error('Invalid cron secret provided');
    return new Response('Forbidden', { status: 403 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { type = "both", hotelId }: SyncRequest = req.method === 'POST' ? await req.json() : {};
    
    const results = await runSync(supabase, type, hotelId);
    
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Sync error:', error);
    
    // Log error to audit
    await logAudit('delta_sync', {
      status: 'error',
      error_details: { message: error.message, type: error.name }
    });
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof RateLimitError 
          ? `Rate limited. Resets in ${error.resetsIn} seconds.` 
          : error.message 
      }),
      { 
        status: error instanceof RateLimitError ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

async function runSync(
  supabase: any, 
  type: string,
  specificHotelId?: string
): Promise<any> {
  const timer = createOperationTimer();
  const results: any = {
    success: true,
    hotels: [],
    duration_ms: 0,
    rateLimited: false
  };

  try {
    // Get hotels that need syncing
    let syncQuery = supabase
      .from('sync_state')
      .select('hotel_id, settings, last_bookings_modified_from, last_calendar_start, last_calendar_end')
      .eq('provider', 'beds24')
      .eq('sync_enabled', true)
      .not('bootstrap_completed_at', 'is', null);

    if (specificHotelId) {
      syncQuery = syncQuery.eq('hotel_id', specificHotelId);
    }

    const { data: syncStates, error: syncError } = await syncQuery;
    
    if (syncError) {
      throw new Error(`Failed to fetch sync states: ${syncError.message}`);
    }

    if (!syncStates || syncStates.length === 0) {
      console.log('No hotels found for syncing');
      results.duration_ms = timer.getDuration();
      return results;
    }

    console.log(`Starting sync for ${syncStates.length} hotels, type: ${type}`);

    for (const syncState of syncStates) {
      try {
        const hotelResult = await syncHotel(supabase, syncState, type);
        results.hotels.push(hotelResult);

        // Check if we hit rate limits
        if (hotelResult.rateLimited) {
          results.rateLimited = true;
          console.log('Rate limited detected, stopping sync');
          break;
        }
      } catch (error) {
        console.error(`Sync failed for hotel ${syncState.hotel_id}:`, error);
        results.hotels.push({
          hotel_id: syncState.hotel_id,
          success: false,
          error: error.message
        });
        
        if (error instanceof RateLimitError) {
          results.rateLimited = true;
          break;
        }
      }
    }

    results.duration_ms = timer.getDuration();

    // Log sync completion
    await logAudit('delta_sync', {
      status: results.rateLimited ? 'partial' : 'success',
      duration_ms: results.duration_ms,
      request_payload: { type, specificHotelId },
      response_payload: results
    });

    return results;

  } catch (error) {
    results.success = false;
    results.error = error.message;
    results.duration_ms = timer.getDuration();

    await logAudit('delta_sync', {
      status: 'error',
      duration_ms: results.duration_ms,
      request_payload: { type, specificHotelId },
      error_details: { message: error.message, type: error.name }
    });

    throw error;
  }
}

async function syncHotel(supabase: any, syncState: any, type: string): Promise<any> {
  const result = {
    hotel_id: syncState.hotel_id,
    success: true,
    bookings_synced: 0,
    calendar_synced: 0,
    rateLimited: false,
    errors: [] as string[]
  };

  const propertyId = syncState.settings?.beds24_property_id;
  if (!propertyId) {
    throw new Error('Property ID not found in sync state settings');
  }

  try {
    // Sync bookings
    if (type === 'bookings' || type === 'both') {
      console.log(`Syncing bookings for hotel ${syncState.hotel_id}`);
      
      const modifiedFrom = syncState.last_bookings_modified_from || 
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Last 7 days default

      const bookingsResponse = await beds24Client.getBookings(propertyId, {
        modifiedFrom,
        includeGuests: true,
        includeInvoiceItems: true,
        includeBookingGroup: true
      });

      if (bookingsResponse.data?.data) {
        const bookings = Array.isArray(bookingsResponse.data.data) 
          ? bookingsResponse.data.data 
          : [bookingsResponse.data.data];
        
        let latestModified = modifiedFrom;
        
        for (const booking of bookings) {
          const upsertResult = await upsertBooking(syncState.hotel_id, booking);
          result.bookings_synced += upsertResult.created + upsertResult.updated;
          
          if (upsertResult.errors.length > 0) {
            result.errors.push(...upsertResult.errors);
          }
          
          // Track latest modified time
          if (booking.modified && booking.modified > latestModified) {
            latestModified = booking.modified;
          }
        }

        // Update sync checkpoint
        await supabase
          .from('sync_state')
          .update({
            last_bookings_modified_from: latestModified,
            updated_at: new Date().toISOString()
          })
          .eq('provider', 'beds24')
          .eq('hotel_id', syncState.hotel_id);
      }

      // Check for rate limiting
      if (shouldBackoff(bookingsResponse.creditInfo.remaining)) {
        result.rateLimited = true;
        await logAudit('sync_bookings', {
          hotel_id: syncState.hotel_id,
          status: 'error',
          error_details: { type: 'rate_limit', remaining: bookingsResponse.creditInfo.remaining }
        });
        return result;
      }
    }

    // Sync calendar
    if (type === 'calendar' || type === 'both') {
      console.log(`Syncing calendar for hotel ${syncState.hotel_id}`);
      
      const calendarStart = new Date().toISOString().split('T')[0];
      const calendarEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const calendarResponse = await beds24Client.getRoomsCalendar(propertyId, {
        startDate: calendarStart,
        endDate: calendarEnd,
        includePrices: true,
        includeMinStay: true,
        includeMaxStay: true,
        includeNumAvail: true
      });

      if (calendarResponse.data) {
        // Group calendar data by room type
        const roomGroups: Record<string, any[]> = {};
        
        for (const dayData of calendarResponse.data) {
          if (!dayData.date || !dayData.roomId) continue;
          
          const roomId = dayData.roomId.toString();
          if (!roomGroups[roomId]) {
            roomGroups[roomId] = [];
          }
          roomGroups[roomId].push(dayData);
        }

        // Process each room type
        for (const [roomId, days] of Object.entries(roomGroups)) {
          // Get room type mapping
          const { data: roomMapping } = await supabase
            .from("v_external_ids")
            .select("otelciro_id")
            .eq("provider", "beds24")
            .eq("entity", "room_type")
            .eq("external_id", roomId)
            .maybeSingle();

          if (!roomMapping) continue;

          const upsertResult = await upsertCalendar(syncState.hotel_id, roomMapping.otelciro_id, days);
          result.calendar_synced += upsertResult.created + upsertResult.updated;
          
          if (upsertResult.errors.length > 0) {
            result.errors.push(...upsertResult.errors);
          }
        }

        // Update sync checkpoint
        await supabase
          .from('sync_state')
          .update({
            last_calendar_start: calendarStart,
            last_calendar_end: calendarEnd,
            updated_at: new Date().toISOString()
          })
          .eq('provider', 'beds24')
          .eq('hotel_id', syncState.hotel_id);
      }

      // Check for rate limiting
      if (shouldBackoff(calendarResponse.creditInfo.remaining)) {
        result.rateLimited = true;
        await logAudit('sync_calendar', {
          hotel_id: syncState.hotel_id,
          status: 'error',
          error_details: { type: 'rate_limit', remaining: calendarResponse.creditInfo.remaining }
        });
        return result;
      }
    }

    console.log(`Sync completed for hotel ${syncState.hotel_id}:`, result);
    return result;

  } catch (error) {
    result.success = false;
    result.errors.push(error.message);
    
    if (error instanceof RateLimitError) {
      result.rateLimited = true;
    }
    
    throw error;
  }
}