import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetupRequest {
  organizationId: string;
  inviteCode: string;
  deviceName?: string;
}

interface Beds24SetupResponse {
  token: string;
  expiresIn: number;
  refreshToken: string;
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

  // Handle DELETE requests for clearing integration
  if (req.method === 'DELETE') {
    try {
      const { organizationId } = await req.json();

      if (!organizationId) {
        return new Response(JSON.stringify({ error: 'Missing organizationId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Initialize Supabase client
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Delete integration and its credentials
      const { data: integrations } = await supabase
        .from('integrations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('provider', 'beds24');

      if (integrations && integrations.length > 0) {
        const integrationId = integrations[0].id;

        // Delete credentials first
        await supabase
          .from('integration_credentials')
          .delete()
          .eq('integration_id', integrationId);

        // Delete integration
        await supabase
          .from('integrations')
          .delete()
          .eq('id', integrationId);
      }

      console.log('Beds24 integration disconnected successfully');

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Delete integration error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to delete integration',
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Handle POST requests for setting up integration
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('🔧 Beds24 auth setup started');
    const { organizationId, inviteCode, deviceName }: SetupRequest = await req.json();
    console.log('🔧 Parsed request body:', { organizationId, inviteCodeLength: inviteCode?.length, deviceName });

    if (!organizationId || !inviteCode) {
      console.log('🔧 Missing required fields:', { organizationId: !!organizationId, inviteCode: !!inviteCode });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Clear any existing integrations first
    const { data: existingIntegrations } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('provider', 'beds24');

    if (existingIntegrations && existingIntegrations.length > 0) {
      for (const integration of existingIntegrations) {
        await supabase
          .from('integration_credentials')
          .delete()
          .eq('integration_id', integration.id);
        
        await supabase
          .from('integrations')
          .delete()
          .eq('id', integration.id);
      }
      console.log('🔧 Cleared existing integrations');
    }

    // Call Beds24 authentication setup according to official docs
    // Reference: https://wiki.beds24.com/index.php/API_Authentication#Step_2:_If_using_an_invite_code.2C_get_a_refresh_token
    const beds24BaseUrl = Deno.env.get('BEDS24_BASE_URL') || 'https://api.beds24.com/v2';
    const setupHeaders: Record<string, string> = {
      'code': inviteCode,
    };

    if (deviceName) {
      setupHeaders['deviceName'] = deviceName;
    }

    console.log('🔧 Calling Beds24 /authentication/setup with headers:', { ...setupHeaders, code: `${inviteCode.slice(0, 4)}...` });
    console.log('🔧 Full URL:', `${beds24BaseUrl}/authentication/setup`);

    const beds24Response = await fetch(`${beds24BaseUrl}/authentication/setup`, {
      method: 'GET',
      headers: setupHeaders,
    });

    console.log('🔧 Beds24 response status:', beds24Response.status);
    console.log('🔧 Beds24 response headers:', Object.fromEntries(beds24Response.headers.entries()));

    if (!beds24Response.ok) {
      const errorText = await beds24Response.text();
      console.error('🔧 Beds24 setup failed:', beds24Response.status, errorText);
      
      // Provide more helpful error messages based on common issues
      let userMessage = 'Beds24 authentication failed';
      if (beds24Response.status === 400) {
        userMessage = 'Invalid invite code. Please verify the code was generated on the Beds24 platform.';
      } else if (beds24Response.status === 401) {
        userMessage = 'Unauthorized. The invite code may be expired or invalid.';
      } else if (beds24Response.status === 403) {
        userMessage = 'Access denied. Check your Beds24 account permissions.';
      }
      
      return new Response(JSON.stringify({ 
        error: userMessage,
        details: errorText,
        status: beds24Response.status
      }), {
        status: beds24Response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const beds24Data: Beds24SetupResponse = await beds24Response.json();
    console.log('🔧 Beds24 setup successful, expires in:', beds24Data.expiresIn);

    // Create or update integration record
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .upsert({
        organization_id: organizationId,
        provider: 'beds24',
        status: 'active',
      }, {
        onConflict: 'organization_id,provider'
      })
      .select()
      .single();

    if (integrationError) {
      console.error('Failed to create integration:', integrationError);
      return new Response(JSON.stringify({ error: 'Failed to save integration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + (beds24Data.expiresIn * 1000));
    const encryptionKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 32) || 'default-key-32-chars-long-here';

    // Encrypt and store credentials
    const credentials = [
      {
        integration_id: integration.id,
        key: 'access_token',
        value_encrypted: await encrypt(beds24Data.token, encryptionKey),
      },
      {
        integration_id: integration.id,
        key: 'refresh_token',
        value_encrypted: await encrypt(beds24Data.refreshToken, encryptionKey),
      },
      {
        integration_id: integration.id,
        key: 'token_expires_at',
        value_encrypted: await encrypt(tokenExpiresAt.toISOString(), encryptionKey),
      },
    ];

    const { error: credentialsError } = await supabase
      .from('integration_credentials')
      .upsert(credentials, {
        onConflict: 'integration_id,key'
      });

    if (credentialsError) {
      console.error('Failed to store credentials:', credentialsError);
      return new Response(JSON.stringify({ error: 'Failed to store credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Beds24 integration setup completed successfully');

    return new Response(JSON.stringify({
      success: true,
      integrationId: integration.id,
      expiresAt: tokenExpiresAt.toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Setup error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}