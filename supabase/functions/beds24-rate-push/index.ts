import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RatePushRequest {
  hotelId: string;
  roomTypeId: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  updates: {
    rate?: number;
    availability?: number;
    stopSell?: boolean;
    closedArrival?: boolean;
    closedDeparture?: boolean;
    minStay?: number;
    maxStay?: number;
  };
  traceId?: string;
}

interface CalendarLine {
  roomId: number;
  date: string;
  price1?: number;
  numAvail?: number;
  stopSell?: boolean;
  closedArrival?: boolean;
  closedDeparture?: boolean;
  minStay?: number;
  maxStay?: number;
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

    const { hotelId, roomTypeId, dateRange, updates, traceId = crypto.randomUUID() }: RatePushRequest = await req.json();
    
    console.log(`Starting rate push for hotel ${hotelId}, room type ${roomTypeId}, trace ${traceId}`);

    const result = await pushRatesAndAvailability(supabase, hotelId, roomTypeId, dateRange, updates, traceId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        traceId 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Rate push error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function pushRatesAndAvailability(
  supabase: any, 
  hotelId: string, 
  roomTypeId: string, 
  dateRange: { startDate: string; endDate: string }, 
  updates: any, 
  traceId: string
) {
  // Get hotel's Beds24 property ID and room mapping
  const mappings = await getHotelMappings(supabase, hotelId, roomTypeId);
  if (!mappings.propertyId || !mappings.beds24RoomId) {
    throw new Error("Hotel or room type not mapped to Beds24");
  }

  // Generate calendar lines for the date range
  const calendarLines = generateCalendarLines(
    mappings.beds24RoomId, 
    dateRange.startDate, 
    dateRange.endDate, 
    updates
  );

  // Merge contiguous lines with same values for efficiency
  const mergedLines = mergeContiguousLines(calendarLines);

  // Split into batches of 50 lines (Beds24 API limit)
  const batches = [];
  for (let i = 0; i < mergedLines.length; i += 50) {
    batches.push(mergedLines.slice(i, i + 50));
  }

  const results = {
    total_lines: calendarLines.length,
    merged_lines: mergedLines.length,
    batches: batches.length,
    successful_batches: 0,
    errors: [] as any[]
  };

  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    try {
      console.log(`Pushing batch ${i + 1}/${batches.length} with ${batch.length} lines`);
      
      const batchResult = await pushCalendarBatch(supabase, mappings.propertyId, batch, traceId);
      
      if (batchResult.success) {
        results.successful_batches++;
      } else {
        results.errors.push({
          batch: i + 1,
          error: batchResult.error,
          warnings: batchResult.warnings
        });
      }

      // Small delay between batches to respect API limits
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.error(`Batch ${i + 1} failed:`, error);
      results.errors.push({
        batch: i + 1,
        error: error.message
      });
    }
  }

  // Update our local data to match what was pushed
  await updateLocalRatesAndInventory(supabase, hotelId, roomTypeId, dateRange, updates);

  return results;
}

async function getHotelMappings(supabase: any, hotelId: string, roomTypeId: string) {
  // Get hotel's property ID
  const { data: hotelMapping } = await supabase
    .from("external_ids")
    .select("external_id, metadata")
    .eq("provider", "beds24")
    .eq("entity_type", "property")
    .eq("otelciro_id", hotelId)
    .maybeSingle();

  if (!hotelMapping) {
    throw new Error("Hotel not found in Beds24 mappings");
  }

  // Get room type's Beds24 room ID
  const { data: roomMapping } = await supabase
    .from("external_ids")
    .select("external_id")
    .eq("provider", "beds24")
    .eq("entity_type", "room_type")
    .eq("otelciro_id", roomTypeId)
    .maybeSingle();

  if (!roomMapping) {
    throw new Error("Room type not found in Beds24 mappings");
  }

  return {
    propertyId: hotelMapping.external_id,
    beds24RoomId: parseInt(roomMapping.external_id)
  };
}

function generateCalendarLines(
  roomId: number, 
  startDate: string, 
  endDate: string, 
  updates: any
): CalendarLine[] {
  const lines: CalendarLine[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Generate a line for each date in the range
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    
    const line: CalendarLine = {
      roomId,
      date: dateStr
    };

    // Add only the fields that are being updated (field whitelist)
    if (updates.rate !== undefined) line.price1 = updates.rate;
    if (updates.availability !== undefined) line.numAvail = updates.availability;
    if (updates.stopSell !== undefined) line.stopSell = updates.stopSell;
    if (updates.closedArrival !== undefined) line.closedArrival = updates.closedArrival;
    if (updates.closedDeparture !== undefined) line.closedDeparture = updates.closedDeparture;
    if (updates.minStay !== undefined) line.minStay = updates.minStay;
    if (updates.maxStay !== undefined) line.maxStay = updates.maxStay;

    lines.push(line);
  }

  return lines;
}

function mergeContiguousLines(lines: CalendarLine[]): CalendarLine[] {
  if (lines.length <= 1) return lines;

  const merged: CalendarLine[] = [];
  let currentGroup = [lines[0]];

  for (let i = 1; i < lines.length; i++) {
    const current = lines[i];
    const previous = lines[i - 1];

    // Check if current line has same values as previous and is next day
    const currentDate = new Date(current.date);
    const previousDate = new Date(previous.date);
    const isNextDay = (currentDate.getTime() - previousDate.getTime()) === 24 * 60 * 60 * 1000;
    
    const hasSameValues = 
      current.price1 === previous.price1 &&
      current.numAvail === previous.numAvail &&
      current.stopSell === previous.stopSell &&
      current.closedArrival === previous.closedArrival &&
      current.closedDeparture === previous.closedDeparture &&
      current.minStay === previous.minStay &&
      current.maxStay === previous.maxStay;

    if (isNextDay && hasSameValues) {
      // Add to current group
      currentGroup.push(current);
    } else {
      // Finalize current group and start new one
      if (currentGroup.length > 1) {
        // Create a range line
        const firstDate = currentGroup[0].date;
        const lastDate = currentGroup[currentGroup.length - 1].date;
        merged.push({
          ...currentGroup[0],
          date: `${firstDate}:${lastDate}` // Beds24 range format
        });
      } else {
        merged.push(currentGroup[0]);
      }
      
      currentGroup = [current];
    }
  }

  // Handle final group
  if (currentGroup.length > 1) {
    const firstDate = currentGroup[0].date;
    const lastDate = currentGroup[currentGroup.length - 1].date;
    merged.push({
      ...currentGroup[0],
      date: `${firstDate}:${lastDate}`
    });
  } else {
    merged.push(currentGroup[0]);
  }

  return merged;
}

async function pushCalendarBatch(supabase: any, propertyId: string, batch: CalendarLine[], traceId: string) {
  try {
    const response = await supabase.functions.invoke("beds24-api-client", {
      body: {
        endpoint: "/inventory/rooms/calendar",
        method: "POST",
        body: {
          propertyId,
          data: batch
        },
        tokenType: "write",
        traceId
      }
    });

    if (response.error) {
      throw new Error(`API call failed: ${response.error}`);
    }

    const apiResponse = response.data?.data;
    
    // Parse Beds24 response format
    const result = {
      success: true,
      modified: apiResponse?.modified || 0,
      errors: apiResponse?.errors || [],
      warnings: apiResponse?.warnings || [],
      info: apiResponse?.info || []
    };

    if (result.errors.length > 0) {
      result.success = false;
      console.error("Beds24 API errors:", result.errors);
    }

    return result;

  } catch (error) {
    console.error("Calendar batch push failed:", error);
    return {
      success: false,
      error: error.message,
      modified: 0,
      errors: [error.message],
      warnings: [],
      info: []
    };
  }
}

async function updateLocalRatesAndInventory(
  supabase: any, 
  hotelId: string, 
  roomTypeId: string, 
  dateRange: { startDate: string; endDate: string }, 
  updates: any
) {
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);

  // Update daily rates if rate was changed
  if (updates.rate !== undefined) {
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      await supabase
        .from("daily_rates")
        .upsert({
          hotel_id: hotelId,
          room_type_id: roomTypeId,
          rate_plan_id: "00000000-0000-0000-0000-000000000000", // Default rate plan
          date: dateStr,
          rate: updates.rate
        }, {
          onConflict: "hotel_id,room_type_id,rate_plan_id,date",
          ignoreDuplicates: false
        });
    }
  }

  // Update inventory if availability or stop_sell changed
  if (updates.availability !== undefined || updates.stopSell !== undefined) {
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      const inventoryUpdate: any = {
        hotel_id: hotelId,
        room_type_id: roomTypeId,
        date: dateStr
      };

      if (updates.availability !== undefined) {
        inventoryUpdate.allotment = updates.availability;
      }

      if (updates.stopSell !== undefined) {
        inventoryUpdate.stop_sell = updates.stopSell;
      }

      await supabase
        .from("inventory")
        .upsert(inventoryUpdate, {
          onConflict: "hotel_id,room_type_id,date",
          ignoreDuplicates: false
        });
    }
  }
}