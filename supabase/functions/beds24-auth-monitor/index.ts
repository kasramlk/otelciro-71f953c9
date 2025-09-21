import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// Simple decryption function
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

// Simple encryption function
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
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify this is a cron job or admin request
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');
  
  if (!cronSecret || cronSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  console.log('🔍 Monitoring Beds24 authentication status for all integrations');

  try {
    // Get all active Beds24 integrations
    const { data: integrations, error: integrationsError } = await supabase
      .from('integrations')
      .select('id, organization_id')
      .eq('provider', 'beds24')
      .eq('status', 'active');

    if (integrationsError) {
      throw integrationsError;
    }

    console.log(`📊 Found ${integrations?.length || 0} active Beds24 integrations`);

    if (!integrations?.length) {
      return new Response(JSON.stringify({ 
        message: 'No active Beds24 integrations found',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const encryptionKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 32) || 'default-key-32-chars-long-here';
    const beds24BaseUrl = Deno.env.get('BEDS24_BASE_URL') || 'https://api.beds24.com/v2';
    let refreshedCount = 0;

    // Check each integration
    for (const integration of integrations) {
      try {
        console.log(`🔄 Checking integration ${integration.id}`);

        // Get credentials
        const { data: credentials, error: credentialsError } = await supabase
          .from('integration_credentials')
          .select('key, value_encrypted')
          .eq('integration_id', integration.id)
          .in('key', ['access_token', 'refresh_token', 'token_expires_at']);

        if (credentialsError || !credentials) {
          console.warn(`⚠️ No credentials found for integration ${integration.id}`);
          continue;
        }

        const credMap = new Map(credentials.map(c => [c.key, c.value_encrypted]));
        const refreshToken = credMap.get('refresh_token') ? await decrypt(credMap.get('refresh_token')!, encryptionKey) : null;
        const tokenExpiresAt = credMap.get('token_expires_at') ? new Date(await decrypt(credMap.get('token_expires_at')!, encryptionKey)) : null;

        if (!refreshToken) {
          console.warn(`⚠️ No refresh token found for integration ${integration.id}`);
          continue;
        }

        // Check if token needs refresh (10 minutes buffer for background refresh)
        const now = new Date();
        const needsRefresh = !tokenExpiresAt || now >= new Date(tokenExpiresAt.getTime() - 10 * 60 * 1000);

        if (!needsRefresh) {
          console.log(`✅ Token for integration ${integration.id} is still valid`);
          continue;
        }

        console.log(`🔄 Refreshing token for integration ${integration.id}`);

        // Refresh token
        const refreshResponse = await fetch(`${beds24BaseUrl}/authentication/token`, {
          method: 'GET',
          headers: {
            'refreshToken': refreshToken,
            'Content-Type': 'application/json',
          },
        });

        if (!refreshResponse.ok) {
          console.error(`❌ Token refresh failed for integration ${integration.id}:`, refreshResponse.status);
          continue;
        }

        const refreshData = await refreshResponse.json();
        const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000));

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
          console.error(`❌ Failed to update credentials for integration ${integration.id}:`, updateError);
          continue;
        }

        console.log(`✅ Token refreshed successfully for integration ${integration.id}`);
        refreshedCount++;

      } catch (error) {
        console.error(`❌ Error processing integration ${integration.id}:`, error);
      }
    }

    console.log(`🎉 Auth monitoring complete. Refreshed ${refreshedCount} tokens`);

    return new Response(JSON.stringify({ 
      message: 'Auth monitoring completed',
      totalIntegrations: integrations.length,
      tokensRefreshed: refreshedCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Auth monitoring error:', error);
    return new Response(JSON.stringify({ 
      error: 'Auth monitoring failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}