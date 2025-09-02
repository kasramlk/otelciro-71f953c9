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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from Supabase JWT verification (automatic with verify_jwt = true)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create a client with the user's JWT for user validation
    const supabaseAuth = createClient(
      supabaseUrl, 
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error('User validation error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid user session', details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check admin role using service client
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => ['admin', 'owner'].includes(r.role));
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { orgId, hotelId, beds24PropertyId, inviteCode, scopes } = await req.json();

    console.log('Processing admin link request:', { orgId, hotelId, beds24PropertyId });

    // Exchange invite code for refresh tokens using correct Beds24 v2 flow
    const setupResponse = await fetch(`${BEDS24_BASE_URL}/authentication/setup`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'code': inviteCode, // Pass invite code in header, not body
      },
    });

    if (!setupResponse.ok) {
      const errorData = await setupResponse.text();
      console.error('Beds24 setup exchange failed:', errorData);
      return new Response(JSON.stringify({ 
        error: 'Failed to exchange invite code at /authentication/setup', 
        details: errorData 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const setupData = await setupResponse.json();
    console.log('Beds24 setup successful');

    // Extract refresh tokens from response
    const refreshRead = setupData.refreshToken || setupData.refresh_token || setupData.read?.refreshToken;
    const refreshWrite = setupData.refreshTokenWrite || setupData.refresh_token_write || setupData.write?.refreshToken;

    if (!refreshRead) {
      return new Response(JSON.stringify({
        error: 'Beds24 did not return a refresh token',
        raw: setupData,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Store refresh tokens securely in secrets table
    const { data: secret, error: secretError } = await supabase
      .from('beds24_connection_secrets')
      .insert({
        refresh_token_read: refreshRead,
        refresh_token_write: refreshWrite || null,
      })
      .select('id')
      .single();

    if (secretError) {
      console.error('Failed to store Beds24 secrets:', secretError);
      return new Response(JSON.stringify({ error: 'Failed to store Beds24 secrets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create connection record with reference to secrets
    const { data: connection, error: connectionError } = await supabase
      .from('beds24_connections')
      .insert([{
        org_id: orgId,
        hotel_id: hotelId,
        beds24_property_id: beds24PropertyId.toString(),
        scopes: scopes || ['properties', 'inventory', 'bookings', 'channels', 'accounts'],
        secret_id: secret.id,
        last_token_use_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (connectionError) {
      console.error('Failed to create connection:', connectionError);
      return new Response(JSON.stringify({ error: 'Failed to store connection' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize sync state
    await supabase
      .from('beds24_sync_state')
      .insert([{
        hotel_id: hotelId,
        beds24_property_id: beds24PropertyId.toString(),
        bookings_modified_from: new Date().toISOString()
      }]);

    // Trigger initial import (async)
    supabase.functions.invoke('beds24-initial-import', {
      body: { hotelId, beds24PropertyId }
    }).catch(error => {
      console.error('Failed to trigger initial import:', error);
    });

    return new Response(JSON.stringify({ 
      success: true, 
      connection: connection 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in beds24-admin-link:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});