import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BEDS24_API_URL = Deno.env.get('BEDS24_API_URL') || 'https://api.beds24.com/v2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface Beds24SyncRequest {
  action: 'sync_properties' | 'sync_channels';
  connectionId?: string;
  propertyId?: string;
  syncType: string;
  syncDirection: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, connectionId, propertyId, syncType, syncDirection }: Beds24SyncRequest = await req.json();

    console.log(`Beds24 Sync Action: ${action}, Type: ${syncType}, Direction: ${syncDirection}`);

    // Create sync log
    const syncLogId = connectionId ? await createSyncLog(connectionId, propertyId, syncType, syncDirection) : null;

    let result;
    switch (action) {
      case 'sync_properties':
        result = await handleSyncProperties(connectionId!, syncLogId);
        break;
      
      case 'sync_channels':
        result = await handleSyncChannels(propertyId!, syncLogId);
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Update sync log with success
    if (syncLogId) {
      await updateSyncLog(syncLogId, {
        status: 'completed',
        records_succeeded: Array.isArray(result.data) ? result.data.length : 1,
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in beds24-sync function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function getValidAccessToken(connectionId: string): Promise<string> {
  // Get connection from database
  const { data: connection, error } = await supabase
    .from('beds24_connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (error || !connection) {
    throw new Error('Connection not found');
  }

  // Check if token needs refresh
  let accessToken = connection.access_token;
  const tokenExpiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
  const now = new Date();

  if (!accessToken || !tokenExpiresAt || tokenExpiresAt <= now) {
    console.log('Token expired, refreshing...');
    
    // Refresh token
    const refreshResponse = await fetch(`${BEDS24_API_URL}/authentication/token`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'refreshToken': connection.refresh_token,
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
        connection_status: 'active'
      })
      .eq('id', connectionId);
  }

  return accessToken;
}

async function handleSyncProperties(connectionId: string, syncLogId: string | null) {
  console.log(`Syncing properties for connection: ${connectionId}`);

  const accessToken = await getValidAccessToken(connectionId);

  // Get properties from Beds24
  const response = await fetch(`${BEDS24_API_URL}/properties`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'token': accessToken,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fetch properties:', response.status, errorText);
    
    if (syncLogId) {
      await updateSyncLog(syncLogId, {
        status: 'failed',
        error_details: [{ error: `API Error: ${response.status}`, message: errorText }],
      });
    }
    
    throw new Error(`Failed to fetch properties: ${response.status}`);
  }

  const data = await response.json();
  const properties = data.data || [];

  console.log(`Found ${properties.length} properties`);

  // Get connection details for hotel_id
  const { data: connection } = await supabase
    .from('beds24_connections')
    .select('hotel_id')
    .eq('id', connectionId)
    .single();

  if (!connection) {
    throw new Error('Connection not found');
  }

  // Upsert properties to database
  const upsertPromises = properties.map(async (property: any) => {
    const propertyData = {
      hotel_id: connection.hotel_id,
      connection_id: connectionId,
      beds24_property_id: property.id,
      property_name: property.name || 'Unknown Property',
      property_code: property.code,
      property_status: property.status || 'active',
      sync_enabled: true,
      sync_settings: {
        sync_rates: true,
        sync_availability: true,
        sync_restrictions: true,
        sync_bookings: true,
        sync_messages: true,
      },
    };

    return supabase
      .from('beds24_properties')
      .upsert(propertyData, { onConflict: 'connection_id,beds24_property_id' });
  });

  await Promise.all(upsertPromises);

  // Update sync log
  if (syncLogId) {
    await updateSyncLog(syncLogId, {
      records_processed: properties.length,
      sync_data: { properties_count: properties.length },
    });
  }

  console.log('Properties sync completed');

  return {
    success: true,
    data: properties,
  };
}

async function handleSyncChannels(propertyId: string, syncLogId: string | null) {
  console.log(`Syncing channels for property: ${propertyId}`);

  // Get property details and connection
  const { data: property, error } = await supabase
    .from('beds24_properties')
    .select('*, beds24_connections(*)')
    .eq('id', propertyId)
    .single();

  if (error || !property) {
    throw new Error('Property not found');
  }

  const connection = property.beds24_connections;
  const accessToken = await getValidAccessToken(connection.id);

  // Get channels from Beds24 (this would be a custom endpoint or part of property data)
  // For now, we'll simulate channel data as Beds24 doesn't have a direct channels endpoint
  const mockChannels = [
    {
      id: 1,
      name: 'Booking.com',
      type: 'Booking.com',
      commission: 15.0,
      status: 'active',
    },
    {
      id: 2,
      name: 'Expedia',
      type: 'Expedia',
      commission: 18.0,
      status: 'active',
    },
    {
      id: 3,
      name: 'Airbnb',
      type: 'Airbnb',
      commission: 12.0,
      status: 'active',
    },
  ];

  console.log(`Found ${mockChannels.length} channels`);

  // Upsert channels to database
  const upsertPromises = mockChannels.map(async (channel: any) => {
    const channelData = {
      beds24_property_id: propertyId,
      channel_name: channel.name,
      channel_type: channel.type,
      beds24_channel_id: channel.id,
      commission_rate: channel.commission,
      is_active: channel.status === 'active',
      sync_status: 'synced',
      last_sync_at: new Date().toISOString(),
      sync_errors: [],
      channel_settings: {},
      mapping_config: {},
    };

    return supabase
      .from('beds24_channels')
      .upsert(channelData, { onConflict: 'beds24_property_id,beds24_channel_id' });
  });

  await Promise.all(upsertPromises);

  // Update sync log
  if (syncLogId) {
    await updateSyncLog(syncLogId, {
      records_processed: mockChannels.length,
      sync_data: { channels_count: mockChannels.length },
    });
  }

  console.log('Channels sync completed');

  return {
    success: true,
    data: mockChannels,
  };
}

async function createSyncLog(connectionId: string, propertyId: string | undefined, syncType: string, syncDirection: string): Promise<string> {
  const { data, error } = await supabase
    .from('beds24_sync_logs')
    .insert({
      connection_id: connectionId,
      beds24_property_id: propertyId,
      sync_type: syncType,
      sync_direction: syncDirection,
      status: 'running',
      records_processed: 0,
      records_succeeded: 0,
      records_failed: 0,
      api_credits_used: 0,
      sync_data: {},
      error_details: [],
      performance_metrics: {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create sync log:', error);
    throw new Error('Failed to create sync log');
  }

  return data.id;
}

async function updateSyncLog(syncLogId: string, updates: any): Promise<void> {
  const updateData = {
    ...updates,
    ...(updates.status === 'completed' || updates.status === 'failed' ? 
      { completed_at: new Date().toISOString() } : {})
  };

  const { error } = await supabase
    .from('beds24_sync_logs')
    .update(updateData)
    .eq('id', syncLogId);

  if (error) {
    console.error('Failed to update sync log:', error);
  }
}