import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BEDS24_API_URL = 'https://api.beds24.com/v2';
const BEDS24_ORGANIZATION = 'otelciro';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface Beds24AuthRequest {
  action: 'exchange_invite_code' | 'refresh_token' | 'test_connection';
  inviteCode?: string;
  refreshToken?: string;
  connectionId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Beds24-auth function called');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body));
    
    const { action, inviteCode, refreshToken, connectionId }: Beds24AuthRequest = body;

    console.log(`Beds24 Auth Action: ${action}`);

    switch (action) {
      case 'exchange_invite_code':
        return await handleExchangeInviteCode(inviteCode);
      
      case 'refresh_token':
        return await handleRefreshToken(refreshToken);
      
      case 'test_connection':
        return await handleTestConnection(connectionId);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in beds24-auth function:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function handleExchangeInviteCode(inviteCode?: string) {
  if (!inviteCode) {
    throw new Error('Invite code is required');
  }

  console.log('Exchanging invite code for tokens');
  console.log('Invite code length:', inviteCode.length);
  console.log('API URL:', BEDS24_API_URL);

  try {
    // Call Beds24 API to exchange invite code for tokens
    const response = await fetch(`${BEDS24_API_URL}/authentication/setup`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'organization': BEDS24_ORGANIZATION,
        'code': inviteCode,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Beds24 API error:', response.status, errorText);
      throw new Error(`Failed to exchange invite code: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    console.log('Successfully exchanged invite code');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          token: data.token,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in handleExchangeInviteCode:', error);
    throw error;
  }
}

async function handleRefreshToken(refreshToken?: string) {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  console.log('Refreshing access token');

  // Call Beds24 API to refresh token
  const response = await fetch(`${BEDS24_API_URL}/authentication/token`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'organization': BEDS24_ORGANIZATION,
      'refresh': refreshToken,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Beds24 API error:', response.status, errorText);
    throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
  console.log('Successfully refreshed token');

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        token: data.token,
        expiresIn: data.expiresIn,
      },
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleTestConnection(connectionId?: string) {
  if (!connectionId) {
    throw new Error('Connection ID is required');
  }

  console.log(`Testing connection: ${connectionId}`);

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
        'organization': BEDS24_ORGANIZATION,
        'refresh': connection.refresh_token,
      },
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('Failed to refresh token:', refreshResponse.status, errorText);
      
      // Update connection status to error
      await supabase
        .from('beds24_connections')
        .update({ 
          connection_status: 'error',
          sync_errors: [{ error: 'Token refresh failed', timestamp: now.toISOString() }]
        })
        .eq('id', connectionId);

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

  // Test the connection by making a simple API call
  const testResponse = await fetch(`${BEDS24_API_URL}/accounts`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'organization': BEDS24_ORGANIZATION,
      'token': accessToken,
    },
  });

  const creditsRemaining = testResponse.headers.get('x-five-min-limit-remaining');
  const creditsResetIn = testResponse.headers.get('x-five-min-limit-resets-in');
  const requestCost = testResponse.headers.get('x-request-cost');

  if (!testResponse.ok) {
    const errorText = await testResponse.text();
    console.error('Connection test failed:', testResponse.status, errorText);
    
    // Update connection status
    await supabase
      .from('beds24_connections')
      .update({ 
        connection_status: 'error',
        sync_errors: [{ error: `Connection test failed: ${testResponse.status}`, timestamp: now.toISOString() }]
      })
      .eq('id', connectionId);

    throw new Error(`Connection test failed: ${testResponse.status}`);
  }

  // Update connection status and credits
  await supabase
    .from('beds24_connections')
    .update({ 
      connection_status: 'active',
      api_credits_remaining: creditsRemaining ? parseInt(creditsRemaining) : connection.api_credits_remaining,
      api_credits_reset_at: creditsResetIn ? new Date(now.getTime() + parseInt(creditsResetIn) * 1000).toISOString() : connection.api_credits_reset_at,
      last_sync_at: now.toISOString(),
      sync_errors: []
    })
    .eq('id', connectionId);

  console.log('Connection test successful');

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        status: 'active',
        credits_remaining: creditsRemaining ? parseInt(creditsRemaining) : 0,
        credits_reset_in: creditsResetIn ? parseInt(creditsResetIn) : 0,
        request_cost: requestCost ? parseInt(requestCost) : 0,
      },
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}