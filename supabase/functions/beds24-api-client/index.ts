import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BEDS24_BASE_URL = Deno.env.get("BEDS24_BASE_URL") || "https://api.beds24.com/v2";

interface ApiCallOptions {
  endpoint: string;
  method?: string;
  params?: Record<string, any>;
  body?: any;
  tokenType?: "read" | "write";
  hotelId?: string;
  traceId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const options: ApiCallOptions = await req.json();
    return await makeApiCall(supabase, options);
    
  } catch (error) {
    console.error("Beds24 API client error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function makeApiCall(supabase: any, options: ApiCallOptions): Promise<Response> {
  const startTime = Date.now();
  const traceId = options.traceId || crypto.randomUUID();
  
  try {
    // Get valid token
    const tokenResponse = await supabase.functions.invoke("beds24-token-manager", {
      body: { action: "get_token", tokenType: options.tokenType || "read" }
    });

    if (tokenResponse.error) {
      throw new Error(`Token error: ${tokenResponse.error.message}`);
    }

    const { token } = tokenResponse.data;

    // Build URL with query parameters
    const url = new URL(`${BEDS24_BASE_URL}${options.endpoint}`);
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Make API call
    const response = await fetch(url.toString(), {
      method: options.method || "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "OtelCiro-PMS/1.0"
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const duration = Date.now() - startTime;
    
    // Extract credit limit headers
    const limitRemaining = parseInt(response.headers.get("X-FiveMinCreditLimit-Remaining") || "0");
    const limitResetsIn = parseInt(response.headers.get("X-FiveMinCreditLimit-ResetsIn") || "0");
    const requestCost = parseInt(response.headers.get("X-RequestCost") || "1");

    // Get response data
    let responseData;
    let status = "success";
    let errorMessage = null;

    if (!response.ok) {
      status = "error";
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      responseData = await response.text();
    } else {
      responseData = await response.json();
    }

    // Audit the API call (redact sensitive data)
    await auditApiCall(supabase, {
      provider: "beds24",
      entity_type: options.endpoint.split("/")[1] || "unknown",
      external_id: null,
      action: "api_call",
      operation: `${options.method || "GET"} ${options.endpoint}`,
      status,
      hotel_id: options.hotelId,
      request_cost: requestCost,
      limit_remaining: limitRemaining,
      limit_resets_in: limitResetsIn,
      duration_ms: duration,
      records_processed: Array.isArray(responseData) ? responseData.length : (responseData ? 1 : 0),
      request_payload: redactSensitiveData(options.params || options.body),
      response_payload: redactSensitiveData(responseData),
      error_message: errorMessage,
      trace_id: traceId
    });

    // Check credit limit and warn if low
    if (limitRemaining < 50) {
      console.warn(`Low credit limit remaining: ${limitRemaining}, resets in ${limitResetsIn}s`);
    }

    // Return response with metadata
    return new Response(
      JSON.stringify({
        data: responseData,
        metadata: {
          duration_ms: duration,
          request_cost: requestCost,
          limit_remaining: limitRemaining,
          limit_resets_in: limitResetsIn,
          trace_id: traceId
        }
      }),
      { 
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Audit failed call
    await auditApiCall(supabase, {
      provider: "beds24",
      entity_type: options.endpoint.split("/")[1] || "unknown",
      external_id: null,
      action: "api_call",
      operation: `${options.method || "GET"} ${options.endpoint}`,
      status: "error",
      hotel_id: options.hotelId,
      duration_ms: duration,
      error_message: error.message,
      trace_id: traceId
    });

    throw error;
  }
}

async function auditApiCall(supabase: any, auditData: any) {
  try {
    await supabase
      .from("ingestion_audit")
      .insert(auditData);
  } catch (error) {
    console.error("Failed to audit API call:", error);
    // Don't throw - audit failure shouldn't break the API call
  }
}

function redactSensitiveData(data: any): any {
  if (!data) return data;
  
  const redacted = JSON.parse(JSON.stringify(data));
  
  // Recursively redact email, phone, and other PII
  function redactObject(obj: any): void {
    if (typeof obj !== "object" || obj === null) return;
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        if (key.toLowerCase().includes("email") || 
            key.toLowerCase().includes("mail") ||
            value.includes("@")) {
          obj[key] = "[REDACTED_EMAIL]";
        } else if (key.toLowerCase().includes("phone") ||
                   key.toLowerCase().includes("mobile") ||
                   /^\+?[\d\s\-\(\)]+$/.test(value)) {
          obj[key] = "[REDACTED_PHONE]";
        }
      } else if (typeof value === "object") {
        redactObject(value);
      }
    }
  }
  
  redactObject(redacted);
  return redacted;
}