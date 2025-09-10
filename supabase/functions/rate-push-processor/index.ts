import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

interface QueueItem {
  id: string;
  hotel_id: string;
  room_type_id: string;
  rate_plan_id: string;
  channel_id?: string;
  date_from: string;
  date_to: string;
  push_type: 'rate' | 'availability' | 'both';
  priority: number;
  status: string;
  retry_count: number;
  max_retries: number;
  scheduled_at: string;
  error_message?: string;
  push_data?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Processing rate push queue...');

    // Fetch pending queue items, prioritizing high priority and older items
    const { data: queueItems, error: fetchError } = await supabase
      .from('rate_push_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .lt('retry_count', supabase.rpc('max_retries'))
      .order('priority', { ascending: true }) // 1=high, 2=medium, 3=low
      .order('scheduled_at', { ascending: true })
      .limit(20);

    if (fetchError) {
      console.error('❌ Error fetching queue items:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('✅ No pending items in queue');
      return new Response(JSON.stringify({ 
        message: 'No pending items to process',
        processed: 0,
        failed: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 Found ${queueItems.length} items to process`);

    let processedCount = 0;
    let failedCount = 0;

    // Process each queue item
    for (const item of queueItems as QueueItem[]) {
      try {
        console.log(`🚀 Processing item ${item.id} - ${item.push_type} push for hotel ${item.hotel_id}`);

        // Update status to processing
        await supabase
          .from('rate_push_queue')
          .update({
            status: 'processing',
            started_at: new Date().toISOString(),
            retry_count: item.retry_count + 1
          })
          .eq('id', item.id);

        // Call the channel manager function to process the push
        const { data: result, error: invokeError } = await supabase.functions.invoke('channel-manager', {
          body: {
            syncType: 'pushRates',
            hotelId: item.hotel_id,
            roomTypeId: item.room_type_id,
            ratePlanId: item.rate_plan_id,
            channelId: item.channel_id,
            dateFrom: item.date_from,
            dateTo: item.date_to,
            pushType: item.push_type
          }
        });

        if (invokeError) {
          throw new Error(`Channel manager error: ${invokeError.message}`);
        }

        // Mark as completed
        await supabase
          .from('rate_push_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            error_message: null
          })
          .eq('id', item.id);

        processedCount++;
        console.log(`✅ Successfully processed item ${item.id}`);

      } catch (error) {
        console.error(`❌ Error processing item ${item.id}:`, error);

        const isMaxRetries = item.retry_count + 1 >= item.max_retries;
        
        if (isMaxRetries) {
          // Mark as failed if max retries reached
          await supabase
            .from('rate_push_queue')
            .update({
              status: 'failed',
              error_message: error.message,
              completed_at: new Date().toISOString()
            })
            .eq('id', item.id);
          
          failedCount++;
          console.log(`💀 Item ${item.id} failed permanently after ${item.retry_count + 1} attempts`);
        } else {
          // Reschedule for later with exponential backoff
          const backoffMinutes = Math.pow(2, item.retry_count + 1) * 5; // 10, 20, 40 minutes
          const nextScheduled = new Date(Date.now() + backoffMinutes * 60 * 1000);
          
          await supabase
            .from('rate_push_queue')
            .update({
              status: 'pending',
              scheduled_at: nextScheduled.toISOString(),
              error_message: error.message
            })
            .eq('id', item.id);
          
          console.log(`⏳ Item ${item.id} rescheduled for ${nextScheduled.toISOString()}`);
        }
      }

      // Add small delay between items to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const summary = {
      message: 'Queue processing completed',
      totalItems: queueItems.length,
      processed: processedCount,
      failed: failedCount,
      rescheduled: queueItems.length - processedCount - failedCount
    };

    console.log('📊 Processing summary:', summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Fatal error in rate push processor:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});