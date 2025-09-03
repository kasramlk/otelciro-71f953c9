import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { beds24Client } from "../_shared/beds24-client.ts";
import { logAudit, createOperationTimer } from "../_shared/logger.ts";
import { upsertHotelFromBeds24, upsertRoomTypesFromBeds24, upsertCalendar, upsertBooking } from "../_shared/upsert.ts";
import { RateLimitError } from "../_shared/credit-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BootstrapRequest {
  propertyId: string;
  hotelId: string;
  traceId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { propertyId, hotelId, traceId = crypto.randomUUID() }: BootstrapRequest = await req.json();
    
    if (!propertyId || !hotelId) {
      return new Response(
        JSON.stringify({ error: "propertyId and hotelId are required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Check if bootstrap already completed
    const { data: syncState } = await supabase
      .from("sync_state")
      .select("bootstrap_completed_at")
      .eq("provider", "beds24")
      .eq("hotel_id", hotelId)
      .maybeSingle();

    if (syncState?.bootstrap_completed_at) {
      return new Response(
        JSON.stringify({ error: "Bootstrap already completed for this hotel" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await runBootstrap(supabase, propertyId, hotelId, traceId);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    
    const hotelId = req.url.includes('hotelId') ? new URL(req.url).searchParams.get('hotelId') : undefined;
    
    // Log error to audit
    await logAudit('bootstrap_property', {
      hotel_id: hotelId,
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

async function runBootstrap(
  supabase: any,
  propertyId: string,
  hotelId: string,
  traceId: string
): Promise<any> {
  const timer = createOperationTimer();
  
  try {
    console.log(`Starting bootstrap for property ${propertyId}, hotel ${hotelId}`);

    // 1. Get property details with all related data
    const propertyResponse = await beds24Client.getProperty(propertyId, {
      includeAllRooms: true,
      includePriceRules: true,
      includeOffers: true,
      includeTexts: true
    });

    const property = propertyResponse.data;
    console.log(`Fetched property: ${property.propName || property.name}`);

    // 2. Upsert hotel and mapping
    const hotelResult = await upsertHotelFromBeds24(property);
    if (hotelResult.errors.length > 0) {
      console.error('Hotel upsert errors:', hotelResult.errors);
    }

    console.log(`Hotel upsert: ${hotelResult.created} created, ${hotelResult.updated} updated`);

    // 3. Import room types
    const roomTypesResult = await upsertRoomTypesFromBeds24(hotelId, property.rooms || []);
    if (roomTypesResult.errors.length > 0) {
      console.error('Room types upsert errors:', roomTypesResult.errors);
    }

    console.log(`Room types upsert: ${roomTypesResult.created} created, ${roomTypesResult.updated} updated`);

    // 4. Import calendar data for next 365 days
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

    let calendarImported = 0;
    if (calendarResponse.data) {
      calendarImported = await importCalendarData(supabase, calendarResponse.data, hotelId);
    }

    console.log(`Calendar imported: ${calendarImported} entries`);

    // 5. Import bookings  
    const bookingsResponse = await beds24Client.getBookings(propertyId, {
      status: 'all',
      includeGuests: true,
      includeInvoiceItems: true,
      includeBookingGroup: true
    });

    let bookingsImported = 0;
    let guestsImported = 0;
    let invoicesImported = 0;
    
    if (bookingsResponse.data?.data) {
      const bookings = Array.isArray(bookingsResponse.data.data) ? bookingsResponse.data.data : [bookingsResponse.data.data];
      for (const booking of bookings) {
        const result = await upsertBooking(hotelId, booking);
        bookingsImported += result.created + result.updated;
        if (result.errors.length > 0) {
          console.error('Booking upsert errors:', result.errors);
        }
      }
    }

    console.log(`Bookings imported: ${bookingsImported}`);

    // 6. Mark bootstrap as completed
    await supabase
      .from('sync_state')
      .upsert({
        provider: 'beds24',
        hotel_id: hotelId,
        last_bookings_modified_from: new Date().toISOString(),
        last_calendar_start: calendarStart,
        last_calendar_end: calendarEnd,
        bootstrap_completed_at: new Date().toISOString(),
        sync_enabled: true,
        metadata: {
          propertyId,
          traceId,
          hotelResult: hotelResult,
          roomTypesResult: roomTypesResult,
          calendarImported,
          bookingsImported,
          guestsImported,
          invoicesImported
        }
      }, {
        onConflict: "provider,hotel_id"
      });

    const result = {
      success: true,
      property: property.propName || property.name,
      hotel: hotelResult,
      roomTypes: roomTypesResult,
      calendar: calendarImported,
      bookings: bookingsImported,
      guests: guestsImported,
      invoices: invoicesImported,
      traceId,
      duration_ms: timer.getDuration()
    };

    // Log successful bootstrap
    await logAudit('bootstrap_property', {
      hotel_id: hotelId,
      status: 'success',
      duration_ms: timer.getDuration(),
      request_payload: { propertyId, hotelId },
      response_payload: result
    });

    console.log('Bootstrap completed successfully:', result);
    return result;

  } catch (error) {
    console.error('Bootstrap failed:', error);

    // Log bootstrap failure
    await logAudit('bootstrap_property', {
      hotel_id: hotelId,
      status: 'error',
      duration_ms: timer.getDuration(),
      request_payload: { propertyId, hotelId },
      error_details: { message: error.message, type: error.name }
    });

    // Update sync_state with error
    await supabase
      .from('sync_state')
      .upsert({
        provider: 'beds24',
        hotel_id: hotelId,
        sync_enabled: false,
        metadata: {
          propertyId,
          traceId,
          error: error.message,
          lastAttempt: new Date().toISOString()
        }
      }, {
        onConflict: "provider,hotel_id"
      });

    throw error;
  }
}

async function importCalendarData(supabase: any, calendarData: any[], hotelId: string): Promise<number> {
  let imported = 0;
  
  // Group by room type for batch processing
  const roomGroups: Record<string, any[]> = {};
  
  for (const dayData of calendarData) {
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

    const result = await upsertCalendar(hotelId, roomMapping.otelciro_id, days);
    imported += result.created + result.updated;
  }

  return imported;
}