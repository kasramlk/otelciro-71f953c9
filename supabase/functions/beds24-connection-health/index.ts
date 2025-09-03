import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { hotelId } = await req.json();

    // Get connection details
    const { data: connection } = await supabase
      .from('beds24_connections')
      .select('*')
      .eq('hotel_id', hotelId)
      .single();

    if (!connection) {
      return new Response(JSON.stringify({ error: 'No connection found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get sync state
    const { data: syncState } = await supabase
      .from('beds24_sync_state')
      .select('*')
      .eq('hotel_id', hotelId)
      .single();

    // Get recent API logs (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: apiLogs } = await supabase
      .from('beds24_api_logs')
      .select('*')
      .eq('hotel_id', hotelId)
      .gte('started_at', twentyFourHoursAgo.toISOString())
      .order('started_at', { ascending: false })
      .limit(50);

    // Try to get live account details
    let accountDetails = null;
    let rateLimitInfo = null;
    
    try {
      const accountResponse = await supabase.functions.invoke('beds24-api-client', {
        body: { 
          action: 'getAccount', 
          hotelId: hotelId 
        }
      });
      
      if (!accountResponse.error) {
        accountDetails = accountResponse.data;
        
        // Extract rate limit info from recent logs
        const recentLog = apiLogs?.[0];
        if (recentLog) {
          rateLimitInfo = {
            fiveMinRemaining: recentLog.five_min_remaining,
            fiveMinResetsIn: recentLog.five_min_resets_in,
            requestCost: recentLog.request_cost
          };
        }
      }
    } catch (error) {
      console.error('Failed to get live account details:', error);
    }

    // Calculate statistics
    const totalRequests = apiLogs?.length || 0;
    const errorRequests = apiLogs?.filter(log => log.status >= 400).length || 0;
    const avgResponseTime = apiLogs?.length > 0 ? 
      apiLogs.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / apiLogs.length : 0;

    const healthData = {
      connection: {
        id: connection.id,
        status: connection.status,
        beds24PropertyId: connection.beds24_property_id,
        scopes: connection.scopes,
        lastTokenUse: connection.last_token_use_at,
        accessTokenCached: !!connection.access_token_cache,
        accessExpiresAt: connection.access_expires_at,
        createdAt: connection.created_at
      },
      syncState: syncState ? {
        bookingsModifiedFrom: syncState.bookings_modified_from,
        messagesMaxAge: syncState.messages_max_age_days,
        lastCalendarRefresh: syncState.last_calendar_full_refresh,
        lastOffersRefresh: syncState.last_offers_refresh,
        lastPropertiesRefresh: syncState.last_properties_refresh
      } : null,
      accountDetails,
      rateLimitInfo,
      statistics: {
        totalRequests24h: totalRequests,
        errorRequests24h: errorRequests,
        errorRate: totalRequests > 0 ? (errorRequests / totalRequests * 100).toFixed(2) + '%' : '0%',
        avgResponseTime: Math.round(avgResponseTime) + 'ms'
      },
      recentLogs: apiLogs?.slice(0, 10) || []
    };

    return new Response(JSON.stringify(healthData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in beds24-connection-health:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});