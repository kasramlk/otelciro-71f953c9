import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { propertyId, hotelId, traceId = crypto.randomUUID() }: BootstrapRequest = await req.json();
    
    console.log(`Starting bootstrap for property ${propertyId}, hotel ${hotelId}, trace ${traceId}`);
    
    // Check if bootstrap already completed
    const { data: syncState } = await supabase
      .from("sync_state")
      .select("bootstrap_completed")
      .eq("provider", "beds24")
      .eq("hotel_id", hotelId)
      .maybeSingle();

    if (syncState?.bootstrap_completed) {
      return new Response(
        JSON.stringify({ error: "Bootstrap already completed for this hotel" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Start bootstrap process
    const results = await runBootstrap(supabase, propertyId, hotelId, traceId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        traceId 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Bootstrap error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function runBootstrap(supabase: any, propertyId: string, hotelId: string, traceId: string) {
  const results = {
    property: false,
    roomTypes: 0,
    calendar: 0,
    bookings: 0,
    guests: 0,
    invoices: 0
  };

  try {
    // Step 1: Import property and rooms
    console.log(`Bootstrap step 1: Importing property ${propertyId}`);
    
    const propertyResponse = await supabase.functions.invoke("beds24-api-client", {
      body: {
        endpoint: "/properties",
        params: {
          includeAllRooms: true,
          includePriceRules: true,
          includeOffers: true,
          includeTexts: true
        },
        tokenType: "read",
        hotelId,
        traceId
      }
    });

    if (propertyResponse.error) {
      throw new Error(`Property fetch failed: ${propertyResponse.error}`);
    }

    const properties = propertyResponse.data?.data || [];
    const property = properties.find((p: any) => p.id.toString() === propertyId);
    
    if (!property) {
      throw new Error(`Property ${propertyId} not found`);
    }

    // Update hotel with Beds24 data
    await supabase
      .from("hotels")
      .update({
        name: property.name || undefined,
        address: property.address || undefined,
        city: property.city || undefined,
        country: property.country || undefined,
        phone: property.phone || undefined,
        timezone: property.timezone || undefined
      })
      .eq("id", hotelId);

    // Store property mapping
    await supabase
      .from("external_ids")
      .upsert({
        provider: "beds24",
        entity_type: "property",
        otelciro_id: hotelId,
        external_id: propertyId,
        metadata: {
          name: property.name,
          currency: property.currency,
          imported_at: new Date().toISOString()
        }
      }, {
        onConflict: "provider,entity_type,external_id"
      });

    results.property = true;

    // Step 2: Import room types
    console.log(`Bootstrap step 2: Importing room types`);
    
    if (property.rooms && Array.isArray(property.rooms)) {
      for (const room of property.rooms) {
        // Check if room type already exists
        const { data: existingRoomType } = await supabase
          .from("external_ids")
          .select("otelciro_id")
          .eq("provider", "beds24")
          .eq("entity_type", "room_type")
          .eq("external_id", room.id.toString())
          .maybeSingle();

        let roomTypeId;

        if (existingRoomType) {
          roomTypeId = existingRoomType.otelciro_id;
        } else {
          // Create new room type
          const { data: newRoomType } = await supabase
            .from("room_types")
            .insert({
              hotel_id: hotelId,
              name: room.name || `Room Type ${room.id}`,
              code: `BED24_${room.id}`,
              capacity_adults: room.maxGuests || 2,
              capacity_children: room.maxChildren || 0
            })
            .select("id")
            .single();

          roomTypeId = newRoomType.id;

          // Store room type mapping
          await supabase
            .from("external_ids")
            .insert({
              provider: "beds24",
              entity_type: "room_type",
              otelciro_id: roomTypeId,
              external_id: room.id.toString(),
              metadata: {
                name: room.name,
                maxGuests: room.maxGuests,
                imported_at: new Date().toISOString()
              }
            });
        }

        results.roomTypes++;
      }
    }

    // Step 3: Import calendar data (365 days)
    console.log(`Bootstrap step 3: Importing calendar data`);
    
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

    if (calendarResponse.data?.data) {
      const calendarData = calendarResponse.data.data;
      results.calendar = await importCalendarData(supabase, calendarData, hotelId);
    }

    // Step 4: Import historical bookings
    console.log(`Bootstrap step 4: Importing historical bookings`);
    
    const bookingsResponse = await supabase.functions.invoke("beds24-api-client", {
      body: {
        endpoint: "/bookings",
        params: {
          propertyId: propertyId,
          includeGuests: true,
          includeInvoiceItems: true,
          includeBookingGroup: true
        },
        tokenType: "read",
        hotelId,
        traceId
      }
    });

    if (bookingsResponse.data?.data) {
      const bookings = bookingsResponse.data.data;
      const importResults = await importBookings(supabase, bookings, hotelId);
      results.bookings = importResults.bookings;
      results.guests = importResults.guests;
      results.invoices = importResults.invoices;
    }

    // Step 5: Mark bootstrap as completed
    await supabase
      .from("sync_state")
      .upsert({
        provider: "beds24",
        hotel_id: hotelId,
        bootstrap_completed: true,
        bootstrap_completed_at: new Date().toISOString(),
        last_calendar_start: startDate.toISOString().split('T')[0],
        last_calendar_end: endDate.toISOString().split('T')[0],
        settings: {
          property_id: propertyId,
          bootstrap_trace_id: traceId
        }
      }, {
        onConflict: "provider,hotel_id"
      });

    console.log(`Bootstrap completed successfully for hotel ${hotelId}:`, results);
    return results;

  } catch (error) {
    console.error(`Bootstrap failed for hotel ${hotelId}:`, error);
    
    // Mark sync state with error
    await supabase
      .from("sync_state")
      .upsert({
        provider: "beds24",
        hotel_id: hotelId,
        bootstrap_completed: false,
        settings: {
          property_id: propertyId,
          last_error: error.message,
          failed_at: new Date().toISOString()
        }
      }, {
        onConflict: "provider,hotel_id"
      });

    throw error;
  }
}

async function importCalendarData(supabase: any, calendarData: any[], hotelId: string): Promise<number> {
  let imported = 0;
  
  // Process calendar data in batches
  for (const dayData of calendarData) {
    if (!dayData.date || !dayData.roomId) continue;

    // Get room type mapping
    const { data: roomMapping } = await supabase
      .from("external_ids")
      .select("otelciro_id")
      .eq("provider", "beds24")
      .eq("entity_type", "room_type")
      .eq("external_id", dayData.roomId.toString())
      .maybeSingle();

    if (!roomMapping) continue;

    // Import rates if available
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

    // Import inventory
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

    imported++;
  }

  return imported;
}

async function importBookings(supabase: any, bookings: any[], hotelId: string): Promise<{bookings: number, guests: number, invoices: number}> {
  let bookingCount = 0;
  let guestCount = 0;
  let invoiceCount = 0;

  for (const booking of bookings) {
    try {
      // Map booking status
      const status = mapBookingStatus(booking.status);
      
      // Create/update guest first
      let guestId = null;
      if (booking.guests && booking.guests.length > 0) {
        const primaryGuest = booking.guests[0];
        
        // Check for existing guest
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
          guestCount++;

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

      bookingCount++;

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
            modified_time: booking.modified
          }
        });

    } catch (error) {
      console.error(`Failed to import booking ${booking.id}:`, error);
    }
  }

  return { bookings: bookingCount, guests: guestCount, invoices: invoiceCount };
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