import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SchedulerRequest {
  action: "run_scheduled" | "manual_trigger" | "health_check";
  syncType?: "bookings" | "calendar" | "all";
  hotelId?: string;
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

    const { action, syncType = "all", hotelId }: SchedulerRequest = await req.json();
    
    console.log(`Scheduler action: ${action}, syncType: ${syncType}, hotelId: ${hotelId || 'all'}`);

    let results;
    
    switch (action) {
      case "run_scheduled":
        results = await runScheduledSync(supabase);
        break;
      
      case "manual_trigger":
        results = await runManualSync(supabase, syncType, hotelId);
        break;
      
      case "health_check":
        results = await performHealthCheck(supabase);
        break;
      
      default:
        throw new Error("Invalid action");
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Scheduler error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function runScheduledSync(supabase: any) {
  const results = {
    booking_sync: null,
    calendar_sync: null,
    health_check: null,
    credit_status: null
  };

  try {
    // Check API credit limits first
    const creditStatus = await checkCreditLimits(supabase);
    results.credit_status = creditStatus;

    if (creditStatus.remaining < 50) {
      console.log(`Low credit limit (${creditStatus.remaining}), skipping sync`);
      return results;
    }

    // Run booking sync (hourly)
    console.log("Starting scheduled booking sync");
    const bookingResponse = await supabase.functions.invoke("beds24-delta-sync", {
      body: {
        syncType: "bookings",
        forceSync: false,
        traceId: `scheduled-bookings-${Date.now()}`
      }
    });

    if (bookingResponse.error) {
      console.error("Booking sync failed:", bookingResponse.error);
      results.booking_sync = { error: bookingResponse.error.message };
    } else {
      results.booking_sync = bookingResponse.data.results;
    }

    // Run calendar sync (every 6 hours)
    const now = new Date();
    const shouldSyncCalendar = now.getHours() % 6 === 0; // Run at 00:00, 06:00, 12:00, 18:00

    if (shouldSyncCalendar) {
      console.log("Starting scheduled calendar sync");
      const calendarResponse = await supabase.functions.invoke("beds24-delta-sync", {
        body: {
          syncType: "calendar",
          forceSync: false,
          traceId: `scheduled-calendar-${Date.now()}`
        }
      });

      if (calendarResponse.error) {
        console.error("Calendar sync failed:", calendarResponse.error);
        results.calendar_sync = { error: calendarResponse.error.message };
      } else {
        results.calendar_sync = calendarResponse.data.results;
      }
    }

    // Perform health check
    results.health_check = await performHealthCheck(supabase);

    return results;

  } catch (error) {
    console.error("Scheduled sync failed:", error);
    throw error;
  }
}

async function runManualSync(supabase: any, syncType: string, hotelId?: string) {
  console.log(`Running manual sync: ${syncType} for hotel ${hotelId || 'all'}`);

  const response = await supabase.functions.invoke("beds24-delta-sync", {
    body: {
      syncType,
      hotelId,
      forceSync: true,
      traceId: `manual-${syncType}-${Date.now()}`
    }
  });

  if (response.error) {
    throw new Error(`Manual sync failed: ${response.error.message}`);
  }

  return response.data.results;
}

async function performHealthCheck(supabase: any) {
  const health = {
    timestamp: new Date().toISOString(),
    database_connection: false,
    token_status: { read: null, write: null },
    active_hotels: 0,
    recent_errors: 0,
    credit_status: null
  };

  try {
    // Test database connection
    const { data: testQuery } = await supabase
      .from("sync_state")
      .select("count")
      .limit(1);
    health.database_connection = !!testQuery;

    // Check token status
    const tokenResponse = await supabase.functions.invoke("beds24-token-manager", {
      body: { action: "diagnostics" }
    });

    if (!tokenResponse.error && tokenResponse.data) {
      const diagnostics = tokenResponse.data.diagnostics;
      health.token_status.read = diagnostics.find((t: any) => t.type === "read")?.is_expired === false ? "valid" : "invalid";
      health.token_status.write = diagnostics.find((t: any) => t.type === "write")?.is_expired === false ? "valid" : "invalid";
    }

    // Count active hotels
    const { data: activeHotels } = await supabase
      .from("sync_state")
      .select("hotel_id")
      .eq("provider", "beds24")
      .eq("bootstrap_completed", true)
      .eq("sync_enabled", true);
    health.active_hotels = activeHotels?.length || 0;

    // Count recent errors (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: recentErrors } = await supabase
      .from("ingestion_audit")
      .select("id")
      .eq("provider", "beds24")
      .eq("status", "error")
      .gte("created_at", oneDayAgo.toISOString());
    health.recent_errors = recentErrors?.length || 0;

    // Check credit status
    health.credit_status = await checkCreditLimits(supabase);

    return health;

  } catch (error) {
    console.error("Health check failed:", error);
    health.database_connection = false;
    return health;
  }
}

async function checkCreditLimits(supabase: any) {
  try {
    // Get the most recent audit log entry with credit info
    const { data: recentAudit } = await supabase
      .from("ingestion_audit")
      .select("limit_remaining, limit_resets_in, created_at")
      .eq("provider", "beds24")
      .not("limit_remaining", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!recentAudit) {
      return { remaining: null, resets_in: null, last_check: null };
    }

    return {
      remaining: recentAudit.limit_remaining,
      resets_in: recentAudit.limit_resets_in,
      last_check: recentAudit.created_at
    };

  } catch (error) {
    console.error("Credit limit check failed:", error);
    return { remaining: null, resets_in: null, last_check: null, error: error.message };
  }
}

// Background task to send alerts if needed
async function checkAndSendAlerts(supabase: any, healthCheck: any) {
  try {
    const alerts = [];

    // Check for critical issues
    if (!healthCheck.database_connection) {
      alerts.push("Database connection failed");
    }

    if (healthCheck.token_status.read === "invalid") {
      alerts.push("Read token is invalid or expired");
    }

    if (healthCheck.recent_errors > 10) {
      alerts.push(`High error count: ${healthCheck.recent_errors} errors in last 24h`);
    }

    if (healthCheck.credit_status?.remaining !== null && healthCheck.credit_status.remaining < 20) {
      alerts.push(`Very low credit limit: ${healthCheck.credit_status.remaining} remaining`);
    }

    // Store alerts in audit log for monitoring
    if (alerts.length > 0) {
      await supabase
        .from("ingestion_audit")
        .insert({
          provider: "beds24",
          entity_type: "system",
          action: "health_alert",
          operation: "scheduler_health_check",
          status: "error",
          error_message: alerts.join("; "),
          response_payload: { alerts, health_check: healthCheck }
        });

      console.warn("Health check alerts:", alerts);
    }

  } catch (error) {
    console.error("Alert check failed:", error);
  }
}