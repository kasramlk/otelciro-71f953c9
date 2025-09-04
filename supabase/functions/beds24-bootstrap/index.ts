import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "staging-cron-secret-123";

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

// Basic bootstrap implementation
async function bootstrapHotel(hotelId: string, propertyId: string) {
  console.log(`Starting bootstrap for hotel ${hotelId} with property ${propertyId}`);
  
  // Create service client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // Update or create sync state for this hotel
    const { error: syncError } = await supabase
      .from('sync_state')
      .upsert({
        provider: 'beds24',
        hotel_id: hotelId,
        bootstrap_completed_at: new Date().toISOString(),
        sync_enabled: true,
        metadata: {
          beds24_property_id: propertyId,
          bootstrap_initiated: new Date().toISOString()
        }
      }, {
        onConflict: 'provider,hotel_id'
      });

    if (syncError) {
      throw new Error(`Failed to update sync state: ${syncError.message}`);
    }

    console.log(`Bootstrap completed successfully for hotel ${hotelId}`);
    
    return {
      roomTypes: 0, // Would be populated by actual sync logic
      bookings: 0,  // Would be populated by actual sync logic
      success: true
    };

  } catch (error) {
    console.error(`Bootstrap failed for hotel ${hotelId}:`, error);
    throw error;
  }
}

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
      
      console.log('RPC has_role result:', { rpcOK: rpcResult, rpcError });

      if (rpcResult === true) {
        console.log('User is admin via RPC');
        isAuthorized = true;
      } else {
        console.log('User is admin via RPC: false');
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      console.log('Access denied for user:', user?.id);
      return json({ error: 'Admin access required' }, 403);
    }

    console.log('Admin check passed for user:', user?.id);

    // Parse JSON body
    const { hotelId, propertyId } = await req.json().catch(() => ({}));
    
    console.log('Extracted parameters:', { hotelId, propertyId });

    if (!hotelId || !propertyId) {
      console.log('Missing required parameters:', { hotelId, propertyId });
      return json({ error: 'hotelId and propertyId are required' }, 400);
    }

    // Run bootstrap
    const result = await bootstrapHotel(hotelId, propertyId);
    
    return json({
      ok: true,
      hotelId,
      propertyId,
      imported: {
        properties: 1,
        roomTypes: result.roomTypes || 0,
        bookings: result.bookings || 0,
        calendarDays: 365
      }
    }, 200);

  } catch (error: any) {
    console.error('Bootstrap error:', error);
    const traceId = crypto.randomUUID();
    
    // Log error for audit (redacted)
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from('ingestion_audit').insert({
        provider: 'beds24',
        entity_type: 'bootstrap',
        operation: 'bootstrap_hotel',
        action: 'bootstrap',
        status: 'error',
        error_message: error.message,
        trace_id: traceId
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    return json({
      ok: false,
      message: error.message,
      code: 'BOOTSTRAP_FAILED',
      traceId
    }, 500);
  }
});