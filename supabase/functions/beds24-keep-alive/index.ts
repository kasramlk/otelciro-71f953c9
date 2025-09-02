import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting Beds24 keep-alive job');

    // Get all active connections that need keep-alive
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { data: connections, error: connectionsError } = await supabase
      .from('beds24_connections')
      .select('id, hotel_id, beds24_property_id, last_token_use_at')
      .eq('status', 'active')
      .or(`last_token_use_at.is.null,last_token_use_at.lt.${thirtyDaysAgo.toISOString()}`);

    if (connectionsError) {
      throw new Error(`Failed to fetch connections: ${connectionsError.message}`);
    }

    if (!connections || connections.length === 0) {
      console.log('No connections require keep-alive');
      return new Response(JSON.stringify({ 
        message: 'No connections require keep-alive',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${connections.length} connections that need keep-alive`);

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    // Process each connection
    for (const connection of connections) {
      try {
        console.log(`Processing keep-alive for hotel ${connection.hotel_id}, property ${connection.beds24_property_id}`);

        // Call the token service to refresh tokens (this keeps them alive)
        const response = await supabase.functions.invoke('beds24-token-service', {
          body: { 
            action: 'keepAlive', 
            hotelId: connection.hotel_id 
          }
        });

        if (response.error) {
          throw new Error(`Token service error: ${response.error.message}`);
        }

        successCount++;
        console.log(`Keep-alive successful for hotel ${connection.hotel_id}`);

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`Keep-alive failed for hotel ${connection.hotel_id}:`, error);
        failureCount++;
        errors.push(`Hotel ${connection.hotel_id}: ${error.message}`);

        // Mark connection as error if keep-alive fails
        await supabase
          .from('beds24_connections')
          .update({ 
            status: 'error',
            updated_at: new Date().toISOString()
          })
          .eq('id', connection.id);
      }
    }

    const result = {
      message: 'Keep-alive job completed',
      totalConnections: connections.length,
      successCount,
      failureCount,
      errors: errors.slice(0, 10) // Limit error details
    };

    console.log('Keep-alive job completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in beds24-keep-alive:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Keep-alive job failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
