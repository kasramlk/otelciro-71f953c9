import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BEDS24_API_URL = 'https://api.beds24.com/v2';
const BEDS24_ORGANIZATION = 'otelciro';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface InventoryPullRequest {
  connectionId: string;
  propertyId?: string;
  roomId?: string;
  startDate: string;
  endDate: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Inventory pull function called');
    const { connectionId, propertyId, roomId, startDate, endDate }: InventoryPullRequest = await req.json();
    
    if (!connectionId || !startDate || !endDate) {
      throw new Error('Connection ID, start date, and end date are required');
    }

    // Get connection details
    const { data: connection, error: connError } = await supabase
      .from('beds24_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connError || !connection) {
      throw new Error('Connection not found');
    }

    // Ensure we have a valid token
    let accessToken = connection.access_token;
    const tokenExpiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
    const now = new Date();

    if (!accessToken || !tokenExpiresAt || tokenExpiresAt <= now) {
      console.log('Token expired, refreshing...');
      
      const refreshResponse = await fetch(`${BEDS24_API_URL}/authentication/token`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'organization': BEDS24_ORGANIZATION,
          'refresh': connection.refresh_token,
        },
      });

      if (!refreshResponse.ok) {
        throw new Error(`Failed to refresh token: ${refreshResponse.status}`);
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.token;

      // Update connection with new token
      const expiresAt = new Date(now.getTime() + (refreshData.expiresIn * 1000));
      await supabase
        .from('beds24_connections')
        .update({ 
          access_token: accessToken,
          token_expires_at: expiresAt.toISOString(),
        })
        .eq('id', connectionId);
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
      includeAvailability: 'true',
      includePrices: 'true',
      includeRestrictions: 'true',
    });

    if (propertyId) queryParams.set('propertyId', propertyId);
    if (roomId) queryParams.set('roomId', roomId);

    // Fetch inventory calendar data
    console.log(`Pulling inventory data from ${startDate} to ${endDate}`);
    const inventoryResponse = await fetch(`${BEDS24_API_URL}/inventory/rooms/calendar?${queryParams}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'organization': BEDS24_ORGANIZATION,
        'token': accessToken,
      },
    });

    if (!inventoryResponse.ok) {
      const errorText = await inventoryResponse.text();
      throw new Error(`Failed to fetch inventory: ${inventoryResponse.status} ${errorText}`);
    }

    const inventoryData = await inventoryResponse.json();
    console.log(`Received inventory data for processing`);

    // Process and cache the inventory data
    const cachedRecords = [];
    const expiresAt = new Date(now.getTime() + (6 * 60 * 60 * 1000)); // 6 hours from now

    for (const item of inventoryData) {
      if (item.calendar && Array.isArray(item.calendar)) {
        // Get the property UUID from our database
        const { data: property } = await supabase
          .from('beds24_properties')
          .select('id')
          .eq('connection_id', connectionId)
          .eq('beds24_property_id', item.propertyId)
          .single();

        if (!property) {
          console.warn(`Property not found for beds24 property ID: ${item.propertyId}`);
          continue;
        }

        for (const calendarEntry of item.calendar) {
          const cacheRecord = {
            beds24_property_id: property.id,
            beds24_room_id: item.roomId,
            date: calendarEntry.date,
            price1: calendarEntry.price1 || null,
            price2: calendarEntry.price2 || null,
            num_avail: calendarEntry.numAvail || null,
            min_stay: calendarEntry.minStay || null,
            max_stay: calendarEntry.maxStay || null,
            multiplier: calendarEntry.multiplier || 1.0,
            channel_limit: calendarEntry.channelLimit || {},
            availability_status: calendarEntry.availability || 'available',
            restrictions: {
              closeOnArrival: calendarEntry.closeOnArrival || false,
              closeOnDeparture: calendarEntry.closeOnDeparture || false,
              minStayArrival: calendarEntry.minStayArrival || null,
            },
            cached_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          };

          // Upsert cache record
          const { error: upsertError } = await supabase
            .from('beds24_calendar_cache')
            .upsert(cacheRecord, {
              onConflict: 'beds24_property_id,beds24_room_id,date',
              ignoreDuplicates: false,
            });

          if (!upsertError) {
            cachedRecords.push(cacheRecord);
          }
        }
      }
    }

    // Log API usage
    await supabase
      .from('beds24_api_usage')
      .insert({
        connection_id: connectionId,
        endpoint: '/inventory/rooms/calendar',
        method: 'GET',
        success: true,
      });

    console.log(`Cached ${cachedRecords.length} inventory records`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          records_cached: cachedRecords.length,
          cache_expires_at: expiresAt.toISOString(),
          pulled_at: now.toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in inventory pull:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});