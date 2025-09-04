import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { beds24Client } from '../_shared/beds24-client.ts';
import { upsertHotelFromBeds24, upsertRoomTypesFromBeds24, upsertCalendar } from '../_shared/upsert.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function bootstrapHotel(hotelId: string, propertyId: string) {
  console.log(`Starting bootstrap for hotel ${hotelId} with property ${propertyId}`);
  
  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let importedData = {
    hotel: { created: 0, updated: 0, errors: [] },
    roomTypes: { created: 0, updated: 0, errors: [] },
    calendar: { created: 0, updated: 0, errors: [] },
    totalImported: 0
  };

  try {
    // 1. Fetch and import hotel/property data
    console.log('Fetching property data from Beds24...');
    const propertyResponse = await beds24Client.getProperty(propertyId, {
      includeAllRooms: true,
      includePriceRules: true,
      includeTexts: true
    });
    
    if (propertyResponse.data) {
      console.log('Upserting hotel data...');
      const hotelResult = await upsertHotelFromBeds24(propertyResponse.data);
      importedData.hotel = hotelResult;
      importedData.totalImported += hotelResult.created + hotelResult.updated;
    }

    // 2. Import room types if available
    if (propertyResponse.data?.rooms && Array.isArray(propertyResponse.data.rooms)) {
      console.log(`Upserting ${propertyResponse.data.rooms.length} room types...`);
      const roomTypesResult = await upsertRoomTypesFromBeds24(hotelId, propertyResponse.data.rooms);
      importedData.roomTypes = roomTypesResult;
      importedData.totalImported += roomTypesResult.created + roomTypesResult.updated;
    }

    // 3. Import initial calendar data (next 90 days)
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`Fetching calendar data from ${startDate} to ${endDate}...`);
    const calendarResponse = await beds24Client.getRoomsCalendar(propertyId, {
      startDate,
      endDate,
      includePrices: true,
      includeNumAvail: true
    });

    if (calendarResponse.data && Array.isArray(calendarResponse.data)) {
      console.log(`Processing ${calendarResponse.data.length} calendar entries...`);
      
      // Group calendar data by room ID
      const roomGroups = calendarResponse.data.reduce((acc: any, item: any) => {
        const roomId = item.roomId || 'default';
        if (!acc[roomId]) acc[roomId] = [];
        acc[roomId].push(item);
        return acc;
      }, {});

      // Process each room's calendar data
      for (const [roomId, days] of Object.entries(roomGroups)) {
        try {
          // Map Beds24 room ID to internal room type ID
          const { data: roomMapping } = await supabaseService
            .from('external_ids')
            .select('otelciro_id')
            .eq('provider', 'beds24')
            .eq('entity_type', 'room_type')
            .eq('external_id', roomId)
            .maybeSingle();

          if (roomMapping) {
            const calendarResult = await upsertCalendar(hotelId, roomMapping.otelciro_id, days as any[]);
            importedData.calendar.created += calendarResult.created;
            importedData.calendar.updated += calendarResult.updated;
            importedData.calendar.errors.push(...calendarResult.errors);
            importedData.totalImported += calendarResult.created + calendarResult.updated;
          } else {
            console.warn(`No mapping found for Beds24 room ID: ${roomId}`);
          }
        } catch (error) {
          console.error(`Error processing calendar for room ${roomId}:`, error);
          importedData.calendar.errors.push(`Room ${roomId}: ${error.message}`);
        }
      }
    }

    // 4. Update sync state to mark bootstrap as completed
    console.log('Updating sync state...');
    await supabaseService
      .from('sync_state')
      .upsert({
        hotel_id: hotelId,
        provider: 'beds24',
        sync_enabled: true,
        bootstrap_completed_at: new Date().toISOString(),
        last_calendar_start: startDate,
        last_calendar_end: endDate,
        settings: {
          property_id: propertyId,
          bootstrap_date: new Date().toISOString(),
          initial_sync_range: { start: startDate, end: endDate }
        }
      }, {
        onConflict: 'hotel_id,provider'
      });

    console.log('Bootstrap completed successfully for hotel', hotelId);
    return importedData;

  } catch (error) {
    console.error('Bootstrap error:', error);
    
    // Log the error in audit table
    await supabaseService
      .from('ingestion_audit')
      .insert({
        provider: 'beds24',
        entity_type: 'hotel',
        external_id: propertyId,
        action: 'bootstrap',
        operation: 'hotel_bootstrap',
        status: 'error',
        hotel_id: hotelId,
        error_message: error.message,
        request_payload: { hotelId, propertyId },
        trace_id: crypto.randomUUID()
      });

    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    // Create authenticated client from the request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Check for cron secret (for automated calls)
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');

    let isAuthorized = false;
    let user: any = null;

    if (cronSecret && expectedCronSecret && cronSecret === expectedCronSecret) {
      console.log('Authorized via cron secret');
      isAuthorized = true;
    } else {
      // Check if user is authenticated and has admin role
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !authUser) {
        return json({ error: 'Unauthorized - no valid user' }, 401);
      }

      user = authUser;
      console.log(`Checking admin role for user: ${user.id}`);
      
      const { data: hasAdminRole, error: rpcError } = await supabaseClient.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      console.log('RPC has_role result:', { rpcOK: !rpcError, rpcError: rpcError });

      if (rpcError || !hasAdminRole) {
        return json({ error: 'Admin role required' }, 403);
      }

      console.log('User is admin via RPC');
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return json({ error: 'Not authorized' }, 403);
    }

    // Parse request body
    const { hotelId, propertyId } = await req.json();
    console.log('Extracted parameters:', { hotelId, propertyId });

    if (!hotelId || !propertyId) {
      return json({ error: 'Missing required parameters: hotelId and propertyId' }, 400);
    }

    console.log(`Admin check passed for user: ${user?.id || 'cron'}`);
    
    // Execute bootstrap
    const result = await bootstrapHotel(hotelId, propertyId);
    
    return json({
      success: true,
      message: 'Bootstrap completed successfully',
      data: result
    });

  } catch (error) {
    console.error('Bootstrap endpoint error:', error);
    
    const traceId = crypto.randomUUID();
    
    // Try to log error to audit table
    try {
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseService
        .from('ingestion_audit')
        .insert({
          provider: 'beds24',
          entity_type: 'system',
          action: 'bootstrap',
          operation: 'bootstrap_endpoint',
          status: 'error',
          error_message: error.message,
          trace_id: traceId
        });
    } catch (auditError) {
      console.error('Failed to log error to audit table:', auditError);
    }

    return json({
      error: error.message,
      traceId
    }, 500);
  }
});