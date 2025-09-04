import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "staging-cron-secret-123";
const BEDS24_BASE_URL = Deno.env.get("BEDS24_BASE_URL") || "https://api.beds24.com/v2";

// CORS headers for frontend calls
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization, x-cron-secret',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 
      "Content-Type": "application/json",
      ...corsHeaders
    },
  });
}

// Get Beds24 token (simplified version)
async function getBeds24Token(): Promise<string> {
  const token = Deno.env.get('BEDS24_READ_TOKEN');
  if (!token) {
    throw new Error('BEDS24_READ_TOKEN not configured');
  }
  return token;
}

// Make Beds24 API call
async function makeBeds24Request(endpoint: string, params: Record<string, any> = {}) {
  const token = await getBeds24Token();
  const url = new URL(endpoint, BEDS24_BASE_URL);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  const startTime = Date.now();
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  const durationMs = Date.now() - startTime;
  
  // Check if response is JSON before parsing
  const contentType = response.headers.get('content-type') || '';
  let responseData;
  
  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      const textResponse = await response.text();
      throw new Error(`Invalid JSON response from Beds24 API: ${textResponse.substring(0, 200)}...`);
    }
  } else {
    // If not JSON, read as text and provide better error message
    const textResponse = await response.text();
    
    if (!response.ok) {
      throw new Error(`Beds24 API error (${response.status}): ${textResponse.substring(0, 200)}...`);
    }
    
    // Even if OK but not JSON, that's unexpected
    throw new Error(`Expected JSON response but got ${contentType}: ${textResponse.substring(0, 200)}...`);
  }

  // Extract credit information from headers
  const requestCost = parseInt(response.headers.get('X-RequestCost') || '0', 10);
  const remaining = parseInt(response.headers.get('X-RemainingCredits') || '0', 10);
  const resetsIn = parseInt(response.headers.get('X-ResetsIn') || '0', 10);

  return {
    ok: response.ok,
    status: response.status,
    durationMs,
    credits: {
      requestCost,
      remaining,
      resetsIn,
    },
    data: responseData,
  };
}

// Type definitions for request body
type ExecBody =
  | { op: 'property'; propertyId: string; includeAllRooms?: boolean; includePriceRules?: boolean; includeOffers?: boolean; includeTexts?: boolean }
  | { op: 'bookings'; propertyId: string; modifiedFrom?: string; status?: 'all'|'confirmed'|'cancelled'|'request'; includeGuests?: boolean; includeInvoiceItems?: boolean; limit?: number; offset?: number }
  | { op: 'calendar'; propertyId: string; start: string; end: string; includePrices?: boolean; includeMinStay?: boolean; includeMaxStay?: boolean; includeNumAvail?: boolean };

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Accept POST only
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed. Use POST.' }, 405);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check admin authorization (Bearer token or cron secret)
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('x-cron-secret');
    
    let isAuthorized = false;
    let user: any = null;

    // Check cron secret first
    if (cronSecret === CRON_SECRET) {
      console.log('Admin check passed via cron secret');
      isAuthorized = true;
    } else if (authHeader?.startsWith('Bearer ')) {
      // Check user authentication and admin role
      const token = authHeader.split(' ')[1];
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authUser) {
        console.log('Authentication failed:', authError);
        return json({ error: 'Unauthorized' }, 401);
      }

      user = authUser;
      console.log('Checking admin role for user:', user.id);

      // Check admin role via RPC
      const { data: rpcResult, error: rpcError } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });

      if (rpcResult === true) {
        console.log('User is admin via RPC');
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      console.log('Access denied for user:', user?.id);
      return json({ error: 'Admin access required' }, 403);
    }

    // Parse JSON body
    const body: ExecBody = await req.json().catch(() => ({}));
    
    if (!body || !body.op) {
      return json({ error: 'Invalid request body. Must include "op" field.' }, 400);
    }

    let result;

    switch (body.op) {
      case 'property': {
        if (!body.propertyId) {
          return json({ error: 'propertyId is required for property operation' }, 400);
        }
        
        const params: Record<string, any> = {};
        if (body.includeAllRooms) params.includeAllRooms = '1';
        if (body.includePriceRules) params.includePriceRules = '1';
        if (body.includeOffers) params.includeOffers = '1';
        if (body.includeTexts) params.includeTexts = '1';
        
        result = await makeBeds24Request(`/properties/${body.propertyId}`, params);
        break;
      }
      
      case 'bookings': {
        if (!body.propertyId) {
          return json({ error: 'propertyId is required for bookings operation' }, 400);
        }
        
        const params: Record<string, any> = { propertyId: body.propertyId };
        if (body.modifiedFrom) params.modifiedFrom = body.modifiedFrom;
        if (body.status) params.status = body.status;
        if (body.includeGuests) params.includeGuests = '1';
        if (body.includeInvoiceItems) params.includeInvoiceItems = '1';
        if (body.limit) params.limit = body.limit;
        if (body.offset) params.offset = body.offset;
        
        result = await makeBeds24Request('/bookings', params);
        break;
      }
      
      case 'calendar': {
        if (!body.propertyId || !body.start || !body.end) {
          return json({ error: 'propertyId, start, and end are required for calendar operation' }, 400);
        }
        
        const params: Record<string, any> = {
          propertyId: body.propertyId,
          start: body.start,
          end: body.end,
        };
        if (body.includePrices) params.includePrices = '1';
        if (body.includeMinStay) params.includeMinStay = '1';
        if (body.includeMaxStay) params.includeMaxStay = '1';
        if (body.includeNumAvail) params.includeNumAvail = '1';
        
        result = await makeBeds24Request('/calendar', params);
        break;
      }
      
      default:
        return json({ error: `Unknown operation: ${(body as any).op}` }, 400);
    }

    // Log audit entry (without sensitive data)
    try {
      await supabase.from('ingestion_audit').insert({
        provider: 'beds24',
        entity_type: 'api_explorer',
        operation: body.op,
        action: 'api_call',
        status: result.ok ? 'success' : 'error',
        duration_ms: result.durationMs,
        request_cost: result.credits.requestCost,
        limit_remaining: result.credits.remaining,
        limit_resets_in: result.credits.resetsIn,
        records_processed: Array.isArray(result.data) ? result.data.length : 1,
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    return json(result);

  } catch (error: any) {
    console.error('Exec error:', error);
    return json({
      ok: false,
      message: error.message,
      code: 'EXEC_FAILED',
    }, 500);
  }
});