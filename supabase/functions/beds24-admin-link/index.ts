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
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Service client for database operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    // User client for auth validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Get user from JWT token
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid token', details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check admin role using service client
    const { data: roles } = await supabaseService
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

    // Exchange invite code for refresh tokens
    const tokenExchangeResponse = await fetch(`${BEDS24_BASE_URL}/authentication/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        code: inviteCode,
        grant_type: 'invitation'
      })
    });

    if (!tokenExchangeResponse.ok) {
      const errorData = await tokenExchangeResponse.text();
      console.error('Beds24 token exchange failed:', errorData);
      return new Response(JSON.stringify({ 
        error: 'Failed to exchange invite code', 
        details: errorData 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const tokenData = await tokenExchangeResponse.json();
    console.log('Token exchange successful');

    // Store refresh tokens as Supabase secrets (simulate with IDs for now)
    const readTokenSecretId = `beds24_refresh_read_${crypto.randomUUID()}`;
    const writeTokenSecretId = tokenData.refresh_token_write ? 
      `beds24_refresh_write_${crypto.randomUUID()}` : null;

    // Create connection record
    const { data: connection, error: connectionError } = await supabaseService
      .from('beds24_connections')
      .insert([{
        org_id: orgId,
        hotel_id: hotelId,
        beds24_property_id: beds24PropertyId,
        scopes: scopes || ['bookings', 'inventory', 'properties', 'accounts', 'channels'],
        refresh_token_read_secret: readTokenSecretId,
        refresh_token_write_secret: writeTokenSecretId,
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
    await supabaseService
      .from('beds24_sync_state')
      .insert([{
        hotel_id: hotelId,
        beds24_property_id: beds24PropertyId,
        bookings_modified_from: new Date().toISOString()
      }]);

    // Trigger initial import (async)
    supabaseService.functions.invoke('beds24-initial-import', {
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