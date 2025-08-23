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

    const { code, state, hotelId } = await req.json();
    console.log('Starting OAuth token exchange for hotel:', hotelId);

    // Validate state parameter for security
    if (!state || !state.startsWith('airbnb_auth_')) {
      throw new Error('Invalid state parameter');
    }

    // Get API credentials from secrets
    const apiKey = Deno.env.get('AIRBNB_API_KEY');
    const apiSecret = Deno.env.get('AIRBNB_API_SECRET');

    if (!apiKey || !apiSecret) {
      throw new Error('Airbnb API credentials not configured');
    }

    // Exchange authorization code for access token
    console.log('Exchanging code for access token...');
    const tokenResponse = await fetch('https://api.airbnb.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${apiKey}:${apiSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/auth/airbnb/callback`
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');

    // Get user profile to extract account information
    console.log('Fetching user profile...');
    const profileResponse = await fetch('https://api.airbnb.com/v1/account/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profileData = await profileResponse.json();
    console.log('Profile data retrieved');

    // Store connection in database
    const connectionData = {
      hotel_id: hotelId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      account_id: profileData.user.id.toString(),
      account_name: profileData.user.first_name + ' ' + (profileData.user.last_name || ''),
      sync_status: 'connected'
    };

    const { data: connection, error: connectionError } = await supabaseClient
      .from('airbnb_connections')
      .upsert(connectionData, { 
        onConflict: 'hotel_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (connectionError) {
      console.error('Database error:', connectionError);
      throw new Error('Failed to store connection');
    }

    console.log('Connection stored successfully:', connection.id);

    return new Response(JSON.stringify({ 
      success: true, 
      connectionId: connection.id,
      accountName: connectionData.account_name 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in airbnb-oauth-token:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});