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

interface InventoryPushRequest {
  propertyId: string;
  inventoryData: {
    roomTypeId: string;
    dateRange: { from: string; to: string };
    availability?: number;
    rates?: { [key: string]: number };
    restrictions?: any;
  };
  syncType: string;
  syncDirection: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyId, inventoryData, syncType, syncDirection }: InventoryPushRequest = await req.json();

    console.log(`Pushing inventory for property: ${propertyId}`);

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
    
    // Create sync log
    const syncLogId = await createSyncLog(connection.id, propertyId, syncType, syncDirection);

    try {
      const result = await pushInventoryToBeds24(property, inventoryData);
      
      // Update sync log with success
      await updateSyncLog(syncLogId, {
        status: 'completed',
        records_processed: 1,
        records_succeeded: 1,
        sync_data: { inventory_pushed: inventoryData },
        performance_metrics: { push_duration_ms: Date.now() - new Date(syncLogId).getTime() }
      });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // Update sync log with error
      await updateSyncLog(syncLogId, {
        status: 'failed',
        records_processed: 1,
        records_failed: 1,
        error_details: [{ error: error instanceof Error ? error.message : 'Unknown error' }]
      });
      
      throw error;
    }

  } catch (error) {
    console.error('Error in beds24-inventory-push function:', error);
    
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

async function pushInventoryToBeds24(property: any, inventoryData: any) {
  console.log('Pushing inventory to Beds24...');

  const accessToken = await getValidAccessToken(property.beds24_connections.id);

  // Get room type mapping
  const { data: roomType } = await supabase
    .from('room_types')
    .select('beds24_room_type_id')
    .eq('id', inventoryData.roomTypeId)
    .single();

  if (!roomType?.beds24_room_type_id) {
    throw new Error('Room type not mapped to Beds24');
  }

  // Prepare calendar data for Beds24 API
  const calendarData = [];
  const startDate = new Date(inventoryData.dateRange.from);
  const endDate = new Date(inventoryData.dateRange.to);

  // Generate data for each date in the range
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const dayData: any = {
      date: dateStr,
      roomId: roomType.beds24_room_type_id,
    };

    // Add availability if provided
    if (inventoryData.availability !== undefined) {
      dayData.allotment = inventoryData.availability;
    }

    // Add rates if provided
    if (inventoryData.rates) {
      Object.entries(inventoryData.rates).forEach(([rateKey, rateValue], index) => {
        dayData[`price${index + 1}`] = rateValue;
      });
    }

    // Add restrictions if provided
    if (inventoryData.restrictions) {
      if (inventoryData.restrictions.stopSell) {
        dayData.stopSell = true;
      }
      if (inventoryData.restrictions.minStay) {
        dayData.minStay = inventoryData.restrictions.minStay;
      }
      if (inventoryData.restrictions.maxStay) {
        dayData.maxStay = inventoryData.restrictions.maxStay;
      }
    }

    calendarData.push(dayData);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Push to Beds24 calendar endpoint
  const response = await fetch(`${BEDS24_API_URL}/inventory/rooms/calendar`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'token': accessToken,
    },
    body: JSON.stringify({
      propertyId: property.beds24_property_id,
      calendar: calendarData,
    }),
  });

  const creditsUsed = response.headers.get('x-request-cost');
  const creditsRemaining = response.headers.get('x-five-min-limit-remaining');

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to push inventory:', response.status, errorText);
    throw new Error(`Failed to push inventory: ${response.status} ${errorText}`);
  }

  const result = await response.json();

  // Update API credits in connection
  if (creditsRemaining) {
    await supabase
      .from('beds24_connections')
      .update({ 
        api_credits_remaining: parseInt(creditsRemaining),
        last_sync_at: new Date().toISOString()
      })
      .eq('id', property.beds24_connections.id);
  }

  console.log('Inventory pushed successfully');

  return {
    success: true,
    data: result,
    credits_used: creditsUsed ? parseInt(creditsUsed) : 0,
    credits_remaining: creditsRemaining ? parseInt(creditsRemaining) : 0,
  };
}

async function createSyncLog(connectionId: string, propertyId: string, syncType: string, syncDirection: string): Promise<string> {
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