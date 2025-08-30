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

interface InventoryPushRequest {
  connectionId: string;
  updates: Array<{
    roomId: number;
    calendar: Array<{
      from: string;
      to: string;
      price1?: number;
      price2?: number;
      numAvail?: number;
      minStay?: number;
      maxStay?: number;
      multiplier?: number;
      channelLimit?: Record<string, any>;
      closeOnArrival?: boolean;
      closeOnDeparture?: boolean;
    }>;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Enhanced inventory push function called');
    const { connectionId, updates }: InventoryPushRequest = await req.json();
    
    if (!connectionId || !updates || !Array.isArray(updates)) {
      throw new Error('Connection ID and updates array are required');
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

    // Push inventory updates to Beds24
    console.log(`Pushing inventory updates for ${updates.length} rooms...`);
    const pushResponse = await fetch(`${BEDS24_API_URL}/inventory/rooms/calendar`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'organization': BEDS24_ORGANIZATION,
        'token': accessToken,
      },
      body: JSON.stringify(updates),
    });

    const responseHeaders = {
      creditsRemaining: pushResponse.headers.get('x-five-min-limit-remaining'),
      creditsResetIn: pushResponse.headers.get('x-five-min-limit-resets-in'),
      requestCost: pushResponse.headers.get('x-request-cost'),
    };

    if (!pushResponse.ok) {
      const errorText = await pushResponse.text();
      
      // Log API usage even for failures
      await supabase
        .from('beds24_api_usage')
        .insert({
          connection_id: connectionId,
          endpoint: '/inventory/rooms/calendar',
          method: 'POST',
          success: false,
          error_details: { status: pushResponse.status, error: errorText },
        });

      throw new Error(`Failed to push inventory: ${pushResponse.status} ${errorText}`);
    }

    const responseData = await pushResponse.json();
    console.log('Inventory pushed successfully');

    // Update our local cache with the pushed data
    const cacheUpdates = [];
    for (const update of updates) {
      for (const calendarEntry of update.calendar) {
        // Generate dates between from and to
        const fromDate = new Date(calendarEntry.from);
        const toDate = new Date(calendarEntry.to);
        
        for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          
          // Find the property for this room
          const { data: room } = await supabase
            .from('beds24_rooms')
            .select('beds24_property_id')
            .eq('beds24_room_id', update.roomId)
            .single();

          if (room) {
            const cacheRecord = {
              beds24_property_id: room.beds24_property_id,
              beds24_room_id: update.roomId,
              date: dateStr,
              price1: calendarEntry.price1 || null,
              price2: calendarEntry.price2 || null,
              num_avail: calendarEntry.numAvail || null,
              min_stay: calendarEntry.minStay || null,
              max_stay: calendarEntry.maxStay || null,
              multiplier: calendarEntry.multiplier || 1.0,
              channel_limit: calendarEntry.channelLimit || {},
              restrictions: {
                closeOnArrival: calendarEntry.closeOnArrival || false,
                closeOnDeparture: calendarEntry.closeOnDeparture || false,
              },
              cached_at: now.toISOString(),
              expires_at: new Date(now.getTime() + (6 * 60 * 60 * 1000)).toISOString(), // 6 hours
            };

            // Upsert cache record
            await supabase
              .from('beds24_calendar_cache')
              .upsert(cacheRecord, {
                onConflict: 'beds24_property_id,beds24_room_id,date',
                ignoreDuplicates: false,
              });

            cacheUpdates.push(cacheRecord);
          }
        }
      }
    }

    // Update API credits tracking
    if (responseHeaders.creditsRemaining) {
      await supabase
        .from('beds24_connections')
        .update({
          api_credits_remaining: parseInt(responseHeaders.creditsRemaining),
          api_credits_reset_at: responseHeaders.creditsResetIn ? 
            new Date(now.getTime() + parseInt(responseHeaders.creditsResetIn) * 1000).toISOString() : 
            connection.api_credits_reset_at,
        })
        .eq('id', connectionId);
    }

    // Log API usage
    await supabase
      .from('beds24_api_usage')
      .insert({
        connection_id: connectionId,
        endpoint: '/inventory/rooms/calendar',
        method: 'POST',
        request_cost: responseHeaders.requestCost ? parseInt(responseHeaders.requestCost) : 1,
        credits_before: connection.api_credits_remaining,
        credits_after: responseHeaders.creditsRemaining ? parseInt(responseHeaders.creditsRemaining) : null,
        success: true,
      });

    console.log(`Updated cache for ${cacheUpdates.length} date records`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          updates_processed: updates.length,
          cache_records_updated: cacheUpdates.length,
          api_credits_remaining: responseHeaders.creditsRemaining ? parseInt(responseHeaders.creditsRemaining) : null,
          pushed_at: now.toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in inventory push:', error);
    
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