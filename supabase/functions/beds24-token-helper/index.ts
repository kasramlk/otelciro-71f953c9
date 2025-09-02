import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BEDS24_BASE_URL = "https://api.beds24.com/v2";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase service client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { hotelId, needWrite = false } = await req.json();

    if (!hotelId) {
      return new Response(JSON.stringify({ error: 'hotelId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find the connection for this hotel
    const { data: conn, error: connErr } = await supabase
      .from('beds24_connections')
      .select('id, secret_id')
      .eq('hotel_id', hotelId)
      .single();

    if (connErr || !conn) {
      console.error('No Beds24 connection for hotel:', connErr);
      return new Response(JSON.stringify({ error: 'No Beds24 connection for hotel' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Load secrets (service role only)
    const { data: secrets, error: secErr } = await supabase
      .from('beds24_connection_secrets')
      .select('refresh_token_read, refresh_token_write')
      .eq('id', conn.secret_id)
      .single();

    if (secErr || !secrets) {
      console.error('Failed to load Beds24 secrets:', secErr);
      return new Response(JSON.stringify({ error: 'Failed to load Beds24 secrets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const refreshToken = needWrite ? 
      (secrets.refresh_token_write || secrets.refresh_token_read) : 
      secrets.refresh_token_read;

    // Mint access token using GET /authentication/token with refresh token in header
    const tokenResp = await fetch(`${BEDS24_BASE_URL}/authentication/token`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'refreshToken': refreshToken, // Pass refresh token in header
      },
    });

    if (!tokenResp.ok) {
      const txt = await tokenResp.text();
      console.error('Beds24 token mint failed:', txt);
      return new Response(JSON.stringify({ error: `Beds24 token mint failed: ${txt}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const tokenData = await tokenResp.json();
    
    // Record last use
    await supabase
      .from('beds24_connections')
      .update({ last_token_use_at: new Date().toISOString() })
      .eq('id', conn.id);

    return new Response(JSON.stringify({ 
      token: tokenData.token,
      expiresIn: tokenData.expiresIn || 86400 // 24 hours default
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in beds24-token-helper:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});