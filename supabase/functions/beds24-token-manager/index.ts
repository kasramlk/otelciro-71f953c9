import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TokenData {
  token: string;
  expires_at?: string;
  scopes: string[];
  properties_access?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key for token management
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, tokenType } = await req.json();

    switch (action) {
      case "get_token":
        return await getValidToken(supabase, tokenType);
      
      case "refresh_token":
        return await refreshToken(supabase, tokenType);
      
      case "store_token":
        const { tokenData } = await req.json();
        return await storeToken(supabase, tokenType, tokenData);
      
      case "diagnostics":
        return await getTokenDiagnostics(supabase);
      
      default:
        throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("Token manager error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function getValidToken(supabase: any, tokenType: string): Promise<Response> {
  // Get existing token
  const { data: tokenRow } = await supabase
    .from("beds24_tokens")
    .select("*")
    .eq("token_type", tokenType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!tokenRow) {
    return new Response(
      JSON.stringify({ error: "No token found", needsRefresh: true }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if token is still valid (with 5-minute buffer)
  const now = new Date();
  const expiresAt = tokenRow.expires_at ? new Date(tokenRow.expires_at) : null;
  const bufferTime = 5 * 60 * 1000; // 5 minutes

  if (expiresAt && (expiresAt.getTime() - now.getTime()) < bufferTime) {
    return new Response(
      JSON.stringify({ error: "Token expired", needsRefresh: true }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Update last_used_at
  await supabase
    .from("beds24_tokens")
    .update({ last_used_at: now.toISOString() })
    .eq("id", tokenRow.id);

  return new Response(
    JSON.stringify({ 
      token: tokenRow.encrypted_token,
      scopes: tokenRow.scopes,
      properties_access: tokenRow.properties_access 
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function refreshToken(supabase: any, tokenType: string): Promise<Response> {
  console.log(`Refreshing ${tokenType} token for Beds24`);
  
  // Get refresh token (stored in Supabase secrets)
  const refreshToken = Deno.env.get("BEDS24_REFRESH_TOKEN");
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  // Call Beds24 token endpoint
  const response = await fetch("https://beds24.com/api/v2/authentication/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refreshToken: refreshToken,
      scopes: tokenType === "read" 
        ? ["read:properties", "read:inventory", "read:bookings", "read:bookings-personal", "read:bookings-financial"]
        : ["write:inventory", "write:bookings-messages", "write:channels:stripe"]
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const tokenData = await response.json();
  
  // Store new token
  return await storeToken(supabase, tokenType, {
    token: tokenData.token,
    expires_at: tokenData.expiresAt,
    scopes: tokenData.scopes || [],
    properties_access: tokenData.properties || []
  });
}

async function storeToken(supabase: any, tokenType: string, tokenData: TokenData): Promise<Response> {
  const { data, error } = await supabase
    .from("beds24_tokens")
    .upsert({
      token_type: tokenType,
      encrypted_token: tokenData.token,
      scopes: tokenData.scopes,
      expires_at: tokenData.expires_at,
      properties_access: tokenData.properties_access || [],
      diagnostics: {
        last_refresh: new Date().toISOString(),
        scopes_count: tokenData.scopes.length
      }
    }, {
      onConflict: "token_type",
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store token: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ success: true, tokenId: data.id }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function getTokenDiagnostics(supabase: any): Promise<Response> {
  const { data: tokens } = await supabase
    .from("beds24_tokens")
    .select("token_type, scopes, expires_at, last_used_at, properties_access, diagnostics, created_at")
    .order("created_at", { ascending: false });

  const diagnostics = tokens?.map((token: any) => ({
    type: token.token_type,
    scopes: token.scopes,
    expires_at: token.expires_at,
    last_used_at: token.last_used_at,
    properties_count: token.properties_access?.length || 0,
    is_expired: token.expires_at ? new Date(token.expires_at) < new Date() : false,
    ...token.diagnostics
  })) || [];

  return new Response(
    JSON.stringify({ diagnostics }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}