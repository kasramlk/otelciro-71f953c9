import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  operation: 'sync_all' | 'sync_channel' | 'sync_rates' | 'sync_inventory' | 'sync_reservations';
  channel_id?: string;
  start_date?: string;
  end_date?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { operation, channel_id, start_date, end_date }: SyncRequest = await req.json();

    console.log('Channel sync operation:', operation, { channel_id, start_date, end_date });

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    // Get user's hotel ID
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('org_id')
      .eq('auth_user_id', user.id)
      .single();

    if (userDataError) {
      throw new Error('Failed to get user data');
    }

    let channels = [];
    
    if (channel_id) {
      // Sync specific channel
      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channel_id)
        .eq('is_active', true)
        .single();

      if (channelError) {
        throw new Error('Channel not found');
      }
      
      channels = [channelData];
    } else {
      // Sync all channels for the user's hotels
      const { data: channelsData, error: channelsError } = await supabase
        .from('channels')
        .select(`
          *,
          hotels!inner (org_id)
        `)
        .eq('is_active', true)
        .eq('hotels.org_id', userData.org_id);

      if (channelsError) {
        throw new Error('Failed to fetch channels');
      }
      
      channels = channelsData;
    }

    // Process each channel
    const results = await Promise.all(
      channels.map(async (channel) => {
        const syncLogId = crypto.randomUUID();
        
        try {
          // Create sync log entry
          await supabase
            .from('channel_sync_logs')
            .insert({
              id: syncLogId,
              channel_id: channel.id,
              sync_type: operation.replace('sync_', ''),
              operation: 'push',
              status: 'running',
              start_time: new Date().toISOString()
            });

          let syncResult = { success: 0, failed: 0 };

          // Perform the actual sync based on operation
          switch (operation) {
            case 'sync_all':
              syncResult = await syncAllData(channel, supabase, start_date, end_date);
              break;
            case 'sync_rates':
              syncResult = await syncRates(channel, supabase, start_date, end_date);
              break;
            case 'sync_inventory':
              syncResult = await syncInventory(channel, supabase, start_date, end_date);
              break;
            case 'sync_reservations':
              syncResult = await syncReservations(channel, supabase);
              break;
            default:
              throw new Error(`Unknown operation: ${operation}`);
          }

          // Update sync log with success
          await supabase
            .from('channel_sync_logs')
            .update({
              status: 'success',
              end_time: new Date().toISOString(),
              records_processed: syncResult.success + syncResult.failed,
              records_success: syncResult.success,
              records_failed: syncResult.failed
            })
            .eq('id', syncLogId);

          return {
            channel_id: channel.id,
            channel_name: channel.channel_name,
            status: 'success',
            ...syncResult
          };

        } catch (error) {
          console.error(`Sync failed for channel ${channel.id}:`, error);

          // Update sync log with error
          await supabase
            .from('channel_sync_logs')
            .update({
              status: 'failed',
              end_time: new Date().toISOString(),
              error_details: { message: error.message }
            })
            .eq('id', syncLogId);

          return {
            channel_id: channel.id,
            channel_name: channel.channel_name,
            status: 'failed',
            error: error.message
          };
        }
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sync completed for ${channels.length} channels`,
        results 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Channel sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Sync failed' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function syncAllData(channel: any, supabase: any, startDate?: string, endDate?: string) {
  const ratesResult = await syncRates(channel, supabase, startDate, endDate);
  const inventoryResult = await syncInventory(channel, supabase, startDate, endDate);
  const reservationsResult = await syncReservations(channel, supabase);

  return {
    success: ratesResult.success + inventoryResult.success + reservationsResult.success,
    failed: ratesResult.failed + inventoryResult.failed + reservationsResult.failed
  };
}

async function syncRates(channel: any, supabase: any, startDate?: string, endDate?: string) {
  console.log(`Syncing rates for channel ${channel.channel_name}`);
  
  // Get rate mappings for this channel
  const { data: mappings } = await supabase
    .from('channel_mappings')
    .select('*')
    .eq('channel_id', channel.id)
    .eq('is_active', true);

  if (!mappings || mappings.length === 0) {
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  // Mock rate sync - in real implementation, this would call the actual channel API
  for (const mapping of mappings) {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Mock success for demonstration
      if (Math.random() > 0.1) { // 90% success rate
        success++;
        
        // Update rate status in database
        await supabase
          .from('channel_rates')
          .update({
            push_status: 'success',
            pushed_at: new Date().toISOString()
          })
          .eq('channel_id', channel.id)
          .eq('mapping_id', mapping.id);
      } else {
        failed++;
        
        // Update with failure
        await supabase
          .from('channel_rates')
          .update({
            push_status: 'failed',
            error_message: 'Mock API error for testing'
          })
          .eq('channel_id', channel.id)
          .eq('mapping_id', mapping.id);
      }
    } catch (error) {
      failed++;
      console.error(`Rate sync failed for mapping ${mapping.id}:`, error);
    }
  }

  return { success, failed };
}

async function syncInventory(channel: any, supabase: any, startDate?: string, endDate?: string) {
  console.log(`Syncing inventory for channel ${channel.channel_name}`);
  
  // Similar to rates but for inventory
  const { data: mappings } = await supabase
    .from('channel_mappings')
    .select('*')
    .eq('channel_id', channel.id)
    .eq('is_active', true);

  if (!mappings || mappings.length === 0) {
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  // Mock inventory sync
  for (const mapping of mappings) {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (Math.random() > 0.15) { // 85% success rate
        success++;
        
        await supabase
          .from('channel_inventory')
          .update({
            push_status: 'success',
            pushed_at: new Date().toISOString()
          })
          .eq('channel_id', channel.id)
          .eq('mapping_id', mapping.id);
      } else {
        failed++;
        
        await supabase
          .from('channel_inventory')
          .update({
            push_status: 'failed',
            error_message: 'Mock inventory sync error'
          })
          .eq('channel_id', channel.id)
          .eq('mapping_id', mapping.id);
      }
    } catch (error) {
      failed++;
      console.error(`Inventory sync failed for mapping ${mapping.id}:`, error);
    }
  }

  return { success, failed };
}

async function syncReservations(channel: any, supabase: any) {
  console.log(`Syncing reservations for channel ${channel.channel_name}`);
  
  // Mock reservation sync - in real implementation, this would pull reservations from channel API
  const mockReservations = Math.floor(Math.random() * 5) + 1;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < mockReservations; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Mock reservation data
      const mockReservation = {
        channel_id: channel.id,
        channel_reservation_id: `${channel.channel_name.toUpperCase()}-${Date.now()}-${i}`,
        hotel_id: channel.hotel_id,
        guest_name: `Guest ${i + 1}`,
        guest_email: `guest${i + 1}@example.com`,
        check_in: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        check_out: new Date(Date.now() + (i + 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        adults: Math.floor(Math.random() * 4) + 1,
        children: Math.floor(Math.random() * 3),
        room_type: 'Standard Room',
        total_amount: Math.floor(Math.random() * 500) + 100,
        currency: 'USD',
        commission_rate: 0.15,
        commission_amount: Math.floor(Math.random() * 75) + 15,
        status: 'confirmed'
      };

      if (Math.random() > 0.1) { // 90% success rate
        await supabase
          .from('channel_reservations')
          .insert(mockReservation);
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
      console.error(`Reservation sync failed:`, error);
    }
  }

  return { success, failed };
}