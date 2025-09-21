import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get current token by calling the token endpoint using supabase client
    const tokenUrl = `https://zldcotumxouasgzdsvmh.supabase.co/functions/v1/beds24-auth-token?organizationId=${organizationId}`;
    const tokenResponse = await fetch(tokenUrl, {
      headers: {
        'Authorization': req.headers.get('Authorization') || '',
        'apikey': req.headers.get('apikey') || '',
      }
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return new Response(JSON.stringify(errorData), {
        status: tokenResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { token } = await tokenResponse.json();

    // Call Beds24 authentication details
    const beds24BaseUrl = Deno.env.get('BEDS24_BASE_URL') || 'https://api.beds24.com/v2';
    
    const detailsResponse = await fetch(`${beds24BaseUrl}/authentication/details`, {
      method: 'GET',
      headers: {
        'token': token,
        'Content-Type': 'application/json',
      },
    });

    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      console.error('Auth details failed:', detailsResponse.status, errorText);
      
      if (detailsResponse.status === 400) {
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorText;
        } catch {}
        
        return new Response(JSON.stringify({
          success: false,
          type: "error", 
          code: 400,
          error: errorMessage
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'Failed to get auth details',
        details: errorText 
      }), {
        status: detailsResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authDetails = await detailsResponse.json();

    // Extract rate limit headers if present
    const rateLimitHeaders = {
      fiveMinRemaining: detailsResponse.headers.get('X-FiveMinCreditLimit-Remaining'),
      fiveMinResetsIn: detailsResponse.headers.get('X-FiveMinCreditLimit-ResetsIn'),
      requestCost: detailsResponse.headers.get('X-RequestCost'),
      fiveMinLimit: detailsResponse.headers.get('X-FiveMinCreditLimit'),
    };

    // Store usage data if rate limit headers are present
    if (rateLimitHeaders.fiveMinRemaining || rateLimitHeaders.requestCost) {
      const { data: integration } = await supabase
        .from('integrations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('provider', 'beds24')
        .single();

      if (integration) {
        await supabase
          .from('integration_usage')
          .insert({
            integration_id: integration.id,
            x_five_min_remaining: rateLimitHeaders.fiveMinRemaining ? parseInt(rateLimitHeaders.fiveMinRemaining) : null,
            x_five_min_resets_in: rateLimitHeaders.fiveMinResetsIn ? parseInt(rateLimitHeaders.fiveMinResetsIn) : null,
            x_request_cost: rateLimitHeaders.requestCost ? parseInt(rateLimitHeaders.requestCost) : null,
          });
      }
    }

    console.log('Auth details retrieved successfully');

    // Create response headers with rate limits
    const responseHeaders = { 
      ...corsHeaders, 
      'Content-Type': 'application/json',
    };
    
    // Add rate limit headers if present
    if (rateLimitHeaders.fiveMinLimit) responseHeaders['X-FiveMinCreditLimit'] = rateLimitHeaders.fiveMinLimit;
    if (rateLimitHeaders.fiveMinResetsIn) responseHeaders['X-FiveMinCreditLimit-ResetsIn'] = rateLimitHeaders.fiveMinResetsIn;
    if (rateLimitHeaders.fiveMinRemaining) responseHeaders['X-FiveMinCreditLimit-Remaining'] = rateLimitHeaders.fiveMinRemaining;
    if (rateLimitHeaders.requestCost) responseHeaders['X-RequestCost'] = rateLimitHeaders.requestCost;

    return new Response(JSON.stringify({
      ...authDetails,
      rateLimits: rateLimitHeaders,
    }), {
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Auth details error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}