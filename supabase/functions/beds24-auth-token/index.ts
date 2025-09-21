import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenRequest {
  organizationId: string;
}

interface Beds24TokenResponse {
  access_token: string;
  expires_in: number;
}

// Simple decryption using built-in crypto
async function decrypt(encryptedText: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const combined = new Uint8Array(
    atob(encryptedText).split('').map(c => c.charCodeAt(0))
  );
  
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
}

// Simple encryption using built-in crypto
async function encrypt(text: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  // Combine iv and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'Missing organizationId parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find the integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('provider', 'beds24')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      console.error('Integration not found:', integrationError);
      return new Response(JSON.stringify({ error: 'Integration not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from('integration_credentials')
      .select('key, value_encrypted')
      .eq('integration_id', integration.id)
      .in('key', ['access_token', 'refresh_token', 'token_expires_at']);

    if (credentialsError) {
      console.error('Failed to fetch credentials:', credentialsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const encryptionKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 32) || 'default-key-32-chars-long-here';
    
    // Decrypt credentials
    const credMap = new Map(credentials.map(c => [c.key, c.value_encrypted]));
    const currentToken = credMap.get('access_token') ? await decrypt(credMap.get('access_token')!, encryptionKey) : null;
    const refreshToken = credMap.get('refresh_token') ? await decrypt(credMap.get('refresh_token')!, encryptionKey) : null;
    const tokenExpiresAt = credMap.get('token_expires_at') ? new Date(await decrypt(credMap.get('token_expires_at')!, encryptionKey)) : null;

    if (!refreshToken) {
      return new Response(JSON.stringify({ error: 'No refresh token found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token needs refresh (5 minutes buffer)
    const now = new Date();
    const needsRefresh = !currentToken || !tokenExpiresAt || now >= new Date(tokenExpiresAt.getTime() - 5 * 60 * 1000);

    if (!needsRefresh && currentToken) {
      console.log('Returning cached token');
    const expiresIn = Math.floor((tokenExpiresAt.getTime() - now.getTime()) / 1000);
    return new Response(JSON.stringify({
      token: currentToken,
      expiresIn: expiresIn,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    }

    // Refresh token
    console.log('Refreshing token using refresh token');
    const beds24BaseUrl = Deno.env.get('BEDS24_BASE_URL') || 'https://api.beds24.com/v2';
    
    const refreshResponse = await fetch(`${beds24BaseUrl}/authentication/token`, {
      method: 'GET',
      headers: {
        'refreshToken': refreshToken,
        'Content-Type': 'application/json',
      },
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('Token refresh failed:', refreshResponse.status, errorText);
      
      if (refreshResponse.status === 400) {
        return new Response(JSON.stringify({
          success: false,
          type: "error",
          code: 400,
          error: errorText || "Bad request"
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'Token refresh failed',
        details: errorText 
      }), {
        status: refreshResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const refreshData: Beds24TokenResponse = await refreshResponse.json();
    const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000));
    
    // Extract rate limit headers
    const rateLimitHeaders = {
      'X-FiveMinCreditLimit': refreshResponse.headers.get('X-FiveMinCreditLimit'),
      'X-FiveMinCreditLimit-ResetsIn': refreshResponse.headers.get('X-FiveMinCreditLimit-ResetsIn'),
      'X-FiveMinCreditLimit-Remaining': refreshResponse.headers.get('X-FiveMinCreditLimit-Remaining'),
      'X-RequestCost': refreshResponse.headers.get('X-RequestCost'),
    };

    // Update stored credentials
    const updatedCredentials = [
      {
        integration_id: integration.id,
        key: 'access_token',
        value_encrypted: await encrypt(refreshData.access_token, encryptionKey),
      },
      {
        integration_id: integration.id,
        key: 'token_expires_at',
        value_encrypted: await encrypt(newExpiresAt.toISOString(), encryptionKey),
      },
    ];

    const { error: updateError } = await supabase
      .from('integration_credentials')
      .upsert(updatedCredentials, {
        onConflict: 'integration_id,key'
      });

    if (updateError) {
      console.error('Failed to update credentials:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Token refreshed successfully');

    // Create response headers with rate limits
    const responseHeaders = { 
      ...corsHeaders, 
      'Content-Type': 'application/json',
    };
    
    // Add rate limit headers if present
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      if (value) responseHeaders[key] = value;
    });

    return new Response(JSON.stringify({
      token: refreshData.access_token,
      expiresIn: refreshData.expires_in,
    }), {
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}