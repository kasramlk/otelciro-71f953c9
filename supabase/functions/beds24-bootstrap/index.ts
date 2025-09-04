import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// CORS headers for frontend calls
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Create external ID mapping
    const { error: mappingError } = await supabase
      .from('external_ids')
      .upsert({
        provider: 'beds24',
        entity_type: 'hotel',
        external_id: propertyId,
        otelciro_id: hotelId,
        metadata: {
          bootstrap_date: new Date().toISOString()
        }
      }, {
        onConflict: 'provider,entity_type,external_id'
      });

    if (mappingError) {
      throw new Error(`Failed to create mapping: ${mappingError.message}`);
    }

    return {
      success: true,
      message: `Bootstrap completed for hotel ${hotelId} with Beds24 property ${propertyId}`,
      hotelId,
      propertyId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Bootstrap error:', error);
    throw error;
  }
}

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    // NOTE: NO x-cron-secret check here (that is only for beds24-sync)
    // Authenticate caller using the incoming Authorization header
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userInfo } = await authClient.auth.getUser();
    const user = userInfo?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    // Admin check via RPC has_role(uid, 'admin'); fallback to users.role
    const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let isAdmin = false;

    console.log('Checking admin role for user:', user.id);
    
    const { data: rpcOK, error: rpcError } = await svc.rpc("has_role", { uid: user.id, role_name: "admin" });
    console.log('RPC has_role result:', { rpcOK, rpcError });
    
    if (rpcOK === true) {
      isAdmin = true;
      console.log('User is admin via RPC');
    } else {
      // fallback check: users table role column = 'admin'
      const { data: urow, error: userError } = await svc
        .from("users")
        .select("role")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      
      console.log('Fallback user role check:', { urow, userError });
      isAdmin = (urow?.role ?? "").toString().toLowerCase() === "admin";
      console.log('User is admin via fallback:', isAdmin);
    }
    
    if (!isAdmin) {
      console.log('Access denied for user:', user.id);
      return json({ error: "Forbidden: admin only", uid: user.id }, 403);
    }
    
    console.log('Admin check passed for user:', user.id);

    let body: any = {};
    try { body = await req.json(); } catch {}
    const hotelId = body?.hotelId;
    const propertyId = body?.propertyId?.toString()?.trim();

    if (!hotelId || !propertyId) {
      return json({ error: "hotelId and propertyId are required" }, 400);
    }

    // Environment diagnostics (clear messages if something is missing)
    const baseUrl = Deno.env.get("BEDS24_BASE_URL");
    const readToken = Deno.env.get("BEDS24_READ_TOKEN");
    if (!baseUrl) return json({ error: "Missing env: BEDS24_BASE_URL" }, 500);
    if (!readToken) return json({ error: "Missing env: BEDS24_READ_TOKEN" }, 500);

    // Call bootstrap implementation
    const result = await bootstrapHotel(hotelId, propertyId);
    return json({ ok: true, result }, 200);
  } catch (err: any) {
    console.error("beds24-bootstrap error:", err);
    return json({ error: err?.message ?? String(err) }, 500);
  }
});