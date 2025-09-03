import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeltaSyncRequest {
  syncType: "bookings" | "calendar" | "all";
  hotelId?: string; // If specified, sync only this hotel
  forceSync?: boolean; // Skip normal intervals
  traceId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { syncType, hotelId, forceSync = false, traceId = crypto.randomUUID() }: DeltaSyncRequest = await req.json();
    
    console.log(`Starting delta sync: ${syncType}, hotel: ${hotelId || 'all'}, trace: ${traceId}`);

    const results = await runDeltaSync(supabase, syncType, hotelId, forceSync, traceId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        traceId 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Delta sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function runDeltaSync(supabase: any, syncType: string, hotelId?: string, forceSync = false, traceId = crypto.randomUUID()) {
  const results = {
    bookings: { processed: 0, errors: 0 },
    calendar: { processed: 0, errors: 0 },
    hotels_synced: [] as string[]
  };

  // Get hotels to sync
  const hotelsToSync = await getHotelsToSync(supabase, hotelId);
  
  for (const hotel of hotelsToSync) {
    try {
      // Check if hotel has completed bootstrap
      const { data: syncState } = await supabase
        .from("sync_state")
        .select("*")
        .eq("provider", "beds24")
        .eq("hotel_id", hotel.hotel_id)
        .maybeSingle();

      if (!syncState?.bootstrap_completed) {
        console.log(`Skipping hotel ${hotel.hotel_id} - bootstrap not completed`);
        continue;
      }

      if (!syncState.sync_enabled) {
        console.log(`Skipping hotel ${hotel.hotel_id} - sync disabled`);
        continue;
      }

      // Get property ID from settings
      const propertyId = syncState.settings?.property_id;
      if (!propertyId) {
        console.log(`Skipping hotel ${hotel.hotel_id} - no property ID`);
        continue;
      }

      // Sync bookings
      if (syncType === "bookings" || syncType === "all") {
        const bookingResults = await syncBookings(supabase, hotel.hotel_id, propertyId, syncState, forceSync, traceId);
        results.bookings.processed += bookingResults.processed;
        results.bookings.errors += bookingResults.errors;
      }

      // Sync calendar
      if (syncType === "calendar" || syncType === "all") {
        const calendarResults = await syncCalendar(supabase, hotel.hotel_id, propertyId, syncState, forceSync, traceId);
        results.calendar.processed += calendarResults.processed;
        results.calendar.errors += calendarResults.errors;
      }

      results.hotels_synced.push(hotel.hotel_id);

    } catch (error) {
      console.error(`Error syncing hotel ${hotel.hotel_id}:`, error);
      results.bookings.errors++;
    }
  }

  return results;
}

async function getHotelsToSync(supabase: any, hotelId?: string) {
  const query = supabase
    .from("sync_state")
    .select("hotel_id, bootstrap_completed, sync_enabled, settings")
    .eq("provider", "beds24")
    .eq("bootstrap_completed", true)
    .eq("sync_enabled", true);

  if (hotelId) {
    query.eq("hotel_id", hotelId);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  return data || [];
}

async function syncBookings(supabase: any, hotelId: string, propertyId: string, syncState: any, forceSync: boolean, traceId: string) {
  const now = new Date();
  const lastSync = syncState.last_bookings_modified_from ? new Date(syncState.last_bookings_modified_from) : null;
  
  // Skip if synced recently and not forced
  if (!forceSync && lastSync) {
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    if (lastSync > hourAgo) {
      console.log(`Skipping booking sync for hotel ${hotelId} - synced recently`);
      return { processed: 0, errors: 0 };
    }
  }

  console.log(`Syncing bookings for hotel ${hotelId}, property ${propertyId}`);

  try {
    // Calculate modifiedFrom parameter
    const modifiedFrom = lastSync || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days ago

    const bookingsResponse = await supabase.functions.invoke("beds24-api-client", {
      body: {
        endpoint: "/bookings",
        params: {
          propertyId: propertyId,
          modifiedFrom: modifiedFrom.toISOString(),
          includeGuests: true,
          includeInvoiceItems: true,
          includeBookingGroup: true
        },
        tokenType: "read",
        hotelId,
        traceId
      }
    });

    if (bookingsResponse.error) {
      throw new Error(`Booking fetch failed: ${bookingsResponse.error}`);
    }

    const bookings = bookingsResponse.data?.data || [];
    let processed = 0;
    let latestModified = modifiedFrom;

    // Process bookings in batches
    for (const booking of bookings) {
      try {
        await processBookingUpdate(supabase, booking, hotelId, traceId);
        processed++;

        // Track latest modified time
        if (booking.modified) {
          const bookingModified = new Date(booking.modified);
          if (bookingModified > latestModified) {
            latestModified = bookingModified;
          }
        }
      } catch (error) {
        console.error(`Failed to process booking ${booking.id}:`, error);
      }
    }

    // Update sync checkpoint
    await supabase
      .from("sync_state")
      .update({
        last_bookings_modified_from: latestModified.toISOString(),
        updated_at: now.toISOString()
      })
      .eq("provider", "beds24")
      .eq("hotel_id", hotelId);

    console.log(`Booking sync completed for hotel ${hotelId}: ${processed} bookings processed`);
    return { processed, errors: 0 };

  } catch (error) {
    console.error(`Booking sync failed for hotel ${hotelId}:`, error);
    return { processed: 0, errors: 1 };
  }
}

async function syncCalendar(supabase: any, hotelId: string, propertyId: string, syncState: any, forceSync: boolean, traceId: string) {
  const now = new Date();
  const lastSync = syncState.last_calendar_start ? new Date(syncState.last_calendar_start) : null;
  
  // Skip if synced recently and not forced (6 hour interval)
  if (!forceSync && lastSync) {
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    if (lastSync > sixHoursAgo) {
      console.log(`Skipping calendar sync for hotel ${hotelId} - synced recently`);
      return { processed: 0, errors: 0 };
    }
  }

  console.log(`Syncing calendar for hotel ${hotelId}, property ${propertyId}`);

  try {
    // Sync next 365 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 365);

    const calendarResponse = await supabase.functions.invoke("beds24-api-client", {
      body: {
        endpoint: "/inventory/rooms/calendar",
        params: {
          propertyId: propertyId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          includePrices: true,
          includeMinStay: true,
          includeMaxStay: true,
          includeNumAvail: true
        },
        tokenType: "read",
        hotelId,
        traceId
      }
    });

    if (calendarResponse.error) {
      throw new Error(`Calendar fetch failed: ${calendarResponse.error}`);
    }

    const calendarData = calendarResponse.data?.data || [];
    const processed = await updateCalendarData(supabase, calendarData, hotelId);

    // Update sync checkpoint
    await supabase
      .from("sync_state")
      .update({
        last_calendar_start: startDate.toISOString().split('T')[0],
        last_calendar_end: endDate.toISOString().split('T')[0],
        updated_at: now.toISOString()
      })
      .eq("provider", "beds24")
      .eq("hotel_id", hotelId);

    console.log(`Calendar sync completed for hotel ${hotelId}: ${processed} records processed`);
    return { processed, errors: 0 };

  } catch (error) {
    console.error(`Calendar sync failed for hotel ${hotelId}:`, error);
    return { processed: 0, errors: 1 };
  }
}

async function processBookingUpdate(supabase: any, booking: any, hotelId: string, traceId: string) {
  // Check if booking already exists
  const { data: existingMapping } = await supabase
    .from("external_ids")
    .select("otelciro_id")
    .eq("provider", "beds24")
    .eq("entity_type", "reservation")
    .eq("external_id", booking.id.toString())
    .maybeSingle();

  const status = mapBookingStatus(booking.status);

  if (existingMapping) {
    // Update existing reservation
    const updates: any = {
      status: status,
      updated_at: new Date().toISOString()
    };

    // Handle cancellation
    if (status === "cancelled" && booking.cancelled) {
      updates.cancelled_at = booking.cancelled;
    }

    await supabase
      .from("reservations")
      .update(updates)
      .eq("id", existingMapping.otelciro_id);

    // Update external mapping metadata
    await supabase
      .from("external_ids")
      .update({
        metadata: {
          original_status: booking.status,
          modified_time: booking.modified,
          last_synced: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq("otelciro_id", existingMapping.otelciro_id)
      .eq("provider", "beds24")
      .eq("entity_type", "reservation");

  } else {
    // New booking - create it
    await createNewBooking(supabase, booking, hotelId);
  }
}

async function createNewBooking(supabase: any, booking: any, hotelId: string) {
  const status = mapBookingStatus(booking.status);
  
  // Create/find guest first
  let guestId = null;
  if (booking.guests && booking.guests.length > 0) {
    const primaryGuest = booking.guests[0];
    
    // Check for existing guest by external ID
    const { data: existingGuest } = await supabase
      .from("external_ids")
      .select("otelciro_id")
      .eq("provider", "beds24")
      .eq("entity_type", "guest")
      .eq("external_id", primaryGuest.id?.toString() || `${booking.id}_guest_0`)
      .maybeSingle();

    if (existingGuest) {
      guestId = existingGuest.otelciro_id;
    } else {
      // Create new guest
      const { data: newGuest } = await supabase
        .from("guests")
        .insert({
          hotel_id: hotelId,
          first_name: primaryGuest.firstName || "Unknown",
          last_name: primaryGuest.lastName || "Guest",
          email: primaryGuest.email || null,
          phone: primaryGuest.phone || null,
          nationality: primaryGuest.country || null
        })
        .select("id")
        .single();

      guestId = newGuest.id;

      // Store guest mapping
      await supabase
        .from("external_ids")
        .insert({
          provider: "beds24",
          entity_type: "guest",
          otelciro_id: guestId,
          external_id: primaryGuest.id?.toString() || `${booking.id}_guest_0`
        });
    }
  }

  // Create reservation
  const { data: newReservation } = await supabase
    .from("reservations")
    .insert({
      hotel_id: hotelId,
      guest_id: guestId,
      check_in: booking.arrival,
      check_out: booking.departure,
      adults: booking.numAdult || 1,
      children: booking.numChild || 0,
      status: status,
      channel: "Beds24",
      total_amount: parseFloat(booking.price || "0"),
      currency: booking.currency || "USD",
      special_requests: booking.comments || null
    })
    .select("id")
    .single();

  // Store booking mapping
  await supabase
    .from("external_ids")
    .insert({
      provider: "beds24",
      entity_type: "reservation",
      otelciro_id: newReservation.id,
      external_id: booking.id.toString(),
      metadata: {
        original_status: booking.status,
        modified_time: booking.modified,
        created_via: "delta_sync"
      }
    });
}

async function updateCalendarData(supabase: any, calendarData: any[], hotelId: string): Promise<number> {
  let processed = 0;
  
  // Group calendar data by room and process in batches
  const roomBatches = new Map();
  
  for (const dayData of calendarData) {
    if (!dayData.date || !dayData.roomId) continue;

    if (!roomBatches.has(dayData.roomId)) {
      roomBatches.set(dayData.roomId, []);
    }
    roomBatches.get(dayData.roomId).push(dayData);
  }

  for (const [roomId, roomDays] of roomBatches) {
    // Get room type mapping
    const { data: roomMapping } = await supabase
      .from("external_ids")
      .select("otelciro_id")
      .eq("provider", "beds24")
      .eq("entity_type", "room_type")
      .eq("external_id", roomId.toString())
      .maybeSingle();

    if (!roomMapping) continue;

    // Process days for this room in batch
    for (const dayData of roomDays) {
      try {
        // Update rates if available
        if (dayData.price1) {
          await supabase
            .from("daily_rates")
            .upsert({
              hotel_id: hotelId,
              room_type_id: roomMapping.otelciro_id,
              rate_plan_id: "00000000-0000-0000-0000-000000000000", // Default rate plan
              date: dayData.date,
              rate: parseFloat(dayData.price1)
            }, {
              onConflict: "hotel_id,room_type_id,rate_plan_id,date"
            });
        }

        // Update inventory
        await supabase
          .from("inventory")
          .upsert({
            hotel_id: hotelId,
            room_type_id: roomMapping.otelciro_id,
            date: dayData.date,
            allotment: dayData.numAvail || 0,
            stop_sell: dayData.stopSell || false
          }, {
            onConflict: "hotel_id,room_type_id,date"
          });

        processed++;
      } catch (error) {
        console.error(`Failed to process calendar day ${dayData.date} for room ${roomId}:`, error);
      }
    }
  }

  return processed;
}

function mapBookingStatus(beds24Status: string): string {
  const statusMap: Record<string, string> = {
    "confirmed": "confirmed",
    "new": "confirmed", 
    "request": "requested",
    "cancelled": "cancelled",
    "black": "blocked",
    "inquiry": "inquiry"
  };
  
  return statusMap[beds24Status?.toLowerCase()] || "confirmed";
}