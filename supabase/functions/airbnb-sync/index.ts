import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { connectionId, syncType, direction, startDate, endDate } = await req.json();
    console.log(`Starting ${direction} sync for type: ${syncType}`);

    // Get connection details
    const { data: connection, error: connectionError } = await supabaseClient
      .from('airbnb_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection) {
      throw new Error('Connection not found');
    }

    // Check token validity and refresh if needed
    const now = new Date();
    const tokenExpiry = new Date(connection.token_expires_at || 0);
    
    let accessToken = connection.access_token;
    
    if (tokenExpiry <= now && connection.refresh_token) {
      console.log('Token expired, refreshing...');
      accessToken = await refreshToken(connection, supabaseClient);
    }

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabaseClient
      .from('airbnb_sync_logs')
      .insert({
        connection_id: connectionId,
        sync_type: syncType,
        sync_direction: direction,
        status: 'pending'
      })
      .select()
      .single();

    if (logError) {
      throw new Error('Failed to create sync log');
    }

    let result;
    
    try {
      switch (syncType) {
        case 'rates':
          result = await syncRates(connection, accessToken, direction, startDate, endDate, supabaseClient);
          break;
        case 'availability':
          result = await syncAvailability(connection, accessToken, direction, startDate, endDate, supabaseClient);
          break;
        case 'restrictions':
          result = await syncRestrictions(connection, accessToken, direction, startDate, endDate, supabaseClient);
          break;
        case 'listings':
          result = await syncListings(connection, accessToken, supabaseClient);
          break;
        default:
          throw new Error(`Unsupported sync type: ${syncType}`);
      }

      // Update sync log with success
      await supabaseClient
        .from('airbnb_sync_logs')
        .update({
          status: 'success',
          records_processed: result.processed,
          records_failed: result.failed,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id);

      // Update connection last sync time
      await supabaseClient
        .from('airbnb_connections')
        .update({
          last_sync: new Date().toISOString(),
          sync_status: 'synced'
        })
        .eq('id', connectionId);

      console.log(`Sync completed successfully. Processed: ${result.processed}, Failed: ${result.failed}`);

      return new Response(JSON.stringify({ 
        success: true,
        syncLogId: syncLog.id,
        processed: result.processed,
        failed: result.failed
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (syncError) {
      console.error('Sync error:', syncError);
      
      // Update sync log with error
      await supabaseClient
        .from('airbnb_sync_logs')
        .update({
          status: 'error',
          error_details: { message: syncError.message },
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id);

      throw syncError;
    }

  } catch (error) {
    console.error('Error in airbnb-sync:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function refreshToken(connection: any, supabaseClient: any): Promise<string> {
  const apiKey = Deno.env.get('AIRBNB_API_KEY');
  const apiSecret = Deno.env.get('AIRBNB_API_SECRET');

  const response = await fetch('https://api.airbnb.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${apiKey}:${apiSecret}`)}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: connection.refresh_token
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const tokenData = await response.json();

  // Update connection with new token
  await supabaseClient
    .from('airbnb_connections')
    .update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || connection.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    })
    .eq('id', connection.id);

  return tokenData.access_token;
}

async function syncRates(connection: any, accessToken: string, direction: string, startDate: string, endDate: string, supabaseClient: any) {
  console.log('Syncing rates...');
  
  if (direction === 'push') {
    // Get rates from PMS and push to Airbnb
    const { data: listings } = await supabaseClient
      .from('airbnb_listings')
      .select('*')
      .eq('connection_id', connection.id)
      .eq('sync_rates', true);

    let processed = 0;
    let failed = 0;

    for (const listing of listings || []) {
      try {
        // Get rates from daily_rates table
        const { data: rates } = await supabaseClient
          .from('daily_rates')
          .select('*')
          .eq('hotel_id', listing.hotel_id)
          .eq('room_type_id', listing.room_type_id)
          .gte('date', startDate)
          .lte('date', endDate);

        if (rates && rates.length > 0) {
          // Convert rates to Airbnb format and push
          const airbnbRates = rates.map(rate => ({
            date: rate.date,
            price: {
              amount: rate.rate,
              currency: 'USD'
            }
          }));

          const response = await fetch(`https://api.airbnb.com/v1/listings/${listing.airbnb_listing_id}/calendar`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rates: airbnbRates })
          });

          if (response.ok) {
            processed += rates.length;
          } else {
            failed += rates.length;
            console.error(`Failed to update rates for listing ${listing.airbnb_listing_id}`);
          }
        }
      } catch (error) {
        console.error(`Error processing listing ${listing.airbnb_listing_id}:`, error);
        failed++;
      }
    }

    return { processed, failed };
  } else {
    // Pull rates from Airbnb (typically not supported, as Airbnb doesn't provide rate data)
    console.log('Pulling rates from Airbnb not supported');
    return { processed: 0, failed: 0 };
  }
}

async function syncAvailability(connection: any, accessToken: string, direction: string, startDate: string, endDate: string, supabaseClient: any) {
  console.log('Syncing availability...');
  
  if (direction === 'push') {
    // Get availability from PMS and push to Airbnb
    const { data: listings } = await supabaseClient
      .from('airbnb_listings')
      .select('*')
      .eq('connection_id', connection.id)
      .eq('sync_availability', true);

    let processed = 0;
    let failed = 0;

    for (const listing of listings || []) {
      try {
        // Get inventory from inventory table
        const { data: inventory } = await supabaseClient
          .from('inventory')
          .select('*')
          .eq('hotel_id', listing.hotel_id)
          .eq('room_type_id', listing.room_type_id)
          .gte('date', startDate)
          .lte('date', endDate);

        if (inventory && inventory.length > 0) {
          // Convert inventory to Airbnb format and push
          const airbnbAvailability = inventory.map(inv => ({
            date: inv.date,
            available: inv.allotment > 0 && !inv.stop_sell
          }));

          const response = await fetch(`https://api.airbnb.com/v1/listings/${listing.airbnb_listing_id}/calendar`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ availability: airbnbAvailability })
          });

          if (response.ok) {
            processed += inventory.length;
          } else {
            failed += inventory.length;
            console.error(`Failed to update availability for listing ${listing.airbnb_listing_id}`);
          }
        }
      } catch (error) {
        console.error(`Error processing listing ${listing.airbnb_listing_id}:`, error);
        failed++;
      }
    }

    return { processed, failed };
  } else {
    // Pull availability from Airbnb
    console.log('Pulling availability from Airbnb not typically needed');
    return { processed: 0, failed: 0 };
  }
}

async function syncRestrictions(connection: any, accessToken: string, direction: string, startDate: string, endDate: string, supabaseClient: any) {
  console.log('Syncing restrictions...');
  // Placeholder for restrictions sync (minimum stay, etc.)
  return { processed: 0, failed: 0 };
}

async function syncListings(connection: any, accessToken: string, supabaseClient: any) {
  console.log('Syncing listings...');
  
  try {
    // Get listings from Airbnb
    const response = await fetch('https://api.airbnb.com/v1/listings', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch listings from Airbnb');
    }

    const data = await response.json();
    const listings = data.listings || [];

    let processed = 0;

    for (const listing of listings) {
      try {
        // Check if listing already exists
        const { data: existingListing } = await supabaseClient
          .from('airbnb_listings')
          .select('*')
          .eq('connection_id', connection.id)
          .eq('airbnb_listing_id', listing.id.toString())
          .single();

        if (!existingListing) {
          // Insert new listing (will need manual room type mapping)
          await supabaseClient
            .from('airbnb_listings')
            .insert({
              hotel_id: connection.hotel_id,
              connection_id: connection.id,
              room_type_id: '00000000-0000-0000-0000-000000000000', // Placeholder, needs manual mapping
              airbnb_listing_id: listing.id.toString(),
              airbnb_listing_name: listing.name,
              is_active: false // Inactive until room type is mapped
            });
        } else {
          // Update existing listing name if changed
          await supabaseClient
            .from('airbnb_listings')
            .update({
              airbnb_listing_name: listing.name
            })
            .eq('id', existingListing.id);
        }

        processed++;
      } catch (error) {
        console.error(`Error processing listing ${listing.id}:`, error);
      }
    }

    return { processed, failed: 0 };
  } catch (error) {
    console.error('Error syncing listings:', error);
    throw error;
  }
}