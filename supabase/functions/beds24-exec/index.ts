import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { getTokenForOperation } from '../_shared/beds24-tokens.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BEDS24_BASE_URL = Deno.env.get('BEDS24_BASE_URL') || 'https://api.beds24.com/v2';

interface ExecBody {
  operation: 'property' | 'bookings' | 'calendar';
  propertyId: string;
  params?: Record<string, any>;
  method?: string;
}

// Get Beds24 token
async function getBeds24Token(): Promise<string> {
  return await getTokenForOperation('read');
}

// Make Beds24 API call
async function makeBeds24Request(endpoint: string, params: Record<string, any> = {}) {
  const token = await getBeds24Token();
  // Ensure proper URL construction by joining base URL with endpoint
  const url = new URL(BEDS24_BASE_URL + endpoint);
  
  console.log('Making Beds24 request:', {
    baseUrl: BEDS24_BASE_URL,
    endpoint: endpoint,
    fullUrl: url.toString(),
    params: params
  });
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  console.log('Final URL:', url.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'OtelCiro-PMS/1.0'
    }
  });

  console.log('Response status:', response.status, response.statusText);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  // Extract rate limit info
  const creditInfo = {
    remaining: parseInt(response.headers.get('X-FiveMinCreditLimit-Remaining') || '0'),
    resetsIn: parseInt(response.headers.get('X-FiveMinCreditLimit-ResetsIn') || '0'),
    requestCost: parseInt(response.headers.get('X-RequestCost') || '1')
  };

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Beds24 API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return { data, creditInfo };
}


Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Create authenticated client from the request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Check for cron secret (for automated calls)
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');

    let isAuthorized = false;

    if (cronSecret && expectedCronSecret && cronSecret === expectedCronSecret) {
      console.log('Authorized via cron secret');
      isAuthorized = true;
    } else {
      // Check if user is authenticated and has admin role
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Checking admin role for user: ${user.id}`);
      
      const { data: hasAdminRole, error: rpcError } = await supabaseClient.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (rpcError || !hasAdminRole) {
        return new Response(
          JSON.stringify({ error: 'Admin role required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User is admin via RPC');
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Not authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: ExecBody = await req.json();
    const { operation, propertyId, params = {} } = body;

    if (!operation || !propertyId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: operation and propertyId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let endpoint: string;
    let queryParams = { ...params };

    // Build endpoint based on operation
    switch (operation) {
      case 'property':
        endpoint = `/properties/${propertyId}`;
        break;
      case 'bookings':
        endpoint = `/properties/${propertyId}/bookings`;
        break;
      case 'calendar':
        endpoint = `/properties/${propertyId}/rooms/calendar`;
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown operation: ${operation}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Make the API call
    const result = await makeBeds24Request(endpoint, queryParams);
    
    // Create audit log entry
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseService
      .from('ingestion_audit')
      .insert({
        provider: 'beds24',
        entity_type: operation,
        external_id: propertyId,
        action: 'api_call',
        operation: `GET ${endpoint}`,
        status: 'success',
        request_cost: result.creditInfo.requestCost,
        limit_remaining: result.creditInfo.remaining,
        limit_resets_in: result.creditInfo.resetsIn,
        records_processed: Array.isArray(result.data) ? result.data.length : 1,
        request_payload: { operation, propertyId, params },
        response_payload: result.data,
        trace_id: crypto.randomUUID()
      });

    return new Response(
      JSON.stringify({
        success: true,
        operation,
        propertyId,
        data: result.data,
        creditInfo: result.creditInfo
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Beds24 exec error:', error);
    
    // Create error audit log entry
    try {
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseService
        .from('ingestion_audit')
        .insert({
          provider: 'beds24',
          entity_type: 'api_call',
          action: 'api_call',
          operation: 'beds24_exec',
          status: 'error',
          error_message: error.message,
          trace_id: crypto.randomUUID()
        });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        traceId: crypto.randomUUID()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});