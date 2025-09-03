import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MonitoringRequest {
  action: 'health_overview' | 'performance_metrics' | 'error_analysis' | 'sync_status';
  hotel_id?: string;
  time_range?: '1h' | '24h' | '7d' | '30d';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const url = new URL(req.url);
    
    // Health endpoint for system monitoring
    if (url.pathname === '/health') {
      return await getHealthCheck(supabase);
    }

    // Legacy endpoint handling
    const { action, hotel_id, time_range = '24h' }: MonitoringRequest = await req.json();

    switch (action) {
      case 'health_overview':
        return await getHealthOverview(supabase);
      
      case 'performance_metrics':
        return await getPerformanceMetrics(supabase, time_range);
      
      case 'error_analysis':
        return await getErrorAnalysis(supabase, time_range, hotel_id);
      
      case 'sync_status':
        return await getSyncStatus(supabase);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in beds24-monitoring:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function getHealthCheck(supabase: any) {
  const timestamp = new Date().toISOString();
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check database accessibility
  let databaseAccessible = false;
  try {
    const { error } = await supabase.from('sync_state').select('id').limit(1);
    databaseAccessible = !error;
  } catch {
    databaseAccessible = false;
  }

  if (!databaseAccessible) {
    overallStatus = 'unhealthy';
  }

  // Get sync status for all hotels
  let syncStatus = {
    last_bookings_sync: null as string | null,
    last_calendar_sync: null as string | null,
    hotels_synced: 0
  };

  try {
    const { data: syncData } = await supabase
      .from('sync_state')
      .select('hotel_id, last_bookings_sync, last_calendar_sync, sync_enabled')
      .eq('sync_enabled', true);

    if (syncData && syncData.length > 0) {
      syncStatus.hotels_synced = syncData.length;
      
      // Get most recent sync timestamps
      const bookingsSyncs = syncData
        .map(s => s.last_bookings_sync)
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      const calendarSyncs = syncData
        .map(s => s.last_calendar_sync)
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      syncStatus.last_bookings_sync = bookingsSyncs[0] || null;
      syncStatus.last_calendar_sync = calendarSyncs[0] || null;

      // Check if syncs are stale
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

      const lastBookingSync = syncStatus.last_bookings_sync ? new Date(syncStatus.last_bookings_sync) : null;
      const lastCalendarSync = syncStatus.last_calendar_sync ? new Date(syncStatus.last_calendar_sync) : null;

      if (
        (lastBookingSync && lastBookingSync < hourAgo) ||
        (lastCalendarSync && lastCalendarSync < sixHoursAgo)
      ) {
        overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
      }
    }
  } catch (error) {
    console.error('Error fetching sync status:', error);
    overallStatus = 'unhealthy';
  }

  // Get credit status from most recent audit log
  let creditStatus = {
    remaining: 0,
    reset_eta: null as string | null,
    warning_threshold: false,
    critical_threshold: false
  };

  try {
    const { data: auditData } = await supabase
      .from('ingestion_audit')
      .select('limit_remaining, limit_resets_in, created_at')
      .not('limit_remaining', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (auditData && auditData.length > 0) {
      const latest = auditData[0];
      creditStatus.remaining = latest.limit_remaining || 0;
      
      if (latest.limit_resets_in) {
        const resetTime = new Date(Date.now() + latest.limit_resets_in * 1000);
        creditStatus.reset_eta = resetTime.toISOString();
      }

      creditStatus.warning_threshold = creditStatus.remaining < 100;
      creditStatus.critical_threshold = creditStatus.remaining < 50;

      if (creditStatus.critical_threshold) {
        console.warn('CRITICAL: Beds24 credit limit below 50', {
          remaining: creditStatus.remaining,
          reset_eta: creditStatus.reset_eta
        });
        overallStatus = 'unhealthy';
      } else if (creditStatus.warning_threshold) {
        console.warn('WARNING: Beds24 credit limit below 100', {
          remaining: creditStatus.remaining,
          reset_eta: creditStatus.reset_eta
        });
        overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
      }
    }
  } catch (error) {
    console.error('Error fetching credit status:', error);
  }

  // Check tokens validity
  let tokensValid = false;
  try {
    const { data: tokenData } = await supabase
      .from('beds24_tokens')
      .select('expires_at, token_type')
      .order('created_at', { ascending: false })
      .limit(1);

    if (tokenData && tokenData.length > 0) {
      const token = tokenData[0];
      if (!token.expires_at || new Date(token.expires_at) > new Date()) {
        tokensValid = true;
      }
    }
  } catch (error) {
    console.error('Error checking token validity:', error);
  }

  if (!tokensValid) {
    overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
  }

  const healthStatus = {
    status: overallStatus,
    timestamp,
    sync_status: syncStatus,
    credit_status: creditStatus,
    system_health: {
      database_accessible: databaseAccessible,
      tokens_valid: tokensValid
    }
  };

  return new Response(
    JSON.stringify(healthStatus, null, 2),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: overallStatus === 'healthy' ? 200 : 
              overallStatus === 'degraded' ? 200 : 503
    }
  );
}

async function getHealthOverview(supabase: any) {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Get system health metrics
  const [tokensData, syncStatesData, recentErrorsData, activeJobsData] = await Promise.all([
    // Token health
    supabase.from('beds24_tokens').select('*'),
    
    // Sync states
    supabase.from('sync_state').select('*, hotels(name)'),
    
    // Recent errors (last 24h)
    supabase
      .from('ingestion_audit')
      .select('*')
      .eq('status', 'error')
      .gte('created_at', last24h.toISOString()),
    
    // Active jobs
    supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('is_active', true)
  ]);

  const tokens = tokensData.data || [];
  const syncStates = syncStatesData.data || [];
  const recentErrors = recentErrorsData.data || [];
  const activeJobs = activeJobsData.data || [];

  // Calculate health metrics
  const totalTokens = tokens.length;
  const expiredTokens = tokens.filter(t => new Date(t.expires_at || 0) < now).length;
  const enabledHotels = syncStates.filter(s => s.sync_enabled).length;
  const totalHotels = syncStates.length;
  const errorRate = recentErrors.length;
  
  // System status determination
  let systemStatus = 'healthy';
  const issues = [];
  
  if (expiredTokens > 0) {
    systemStatus = 'warning';
    issues.push(`${expiredTokens} expired token(s)`);
  }
  
  if (errorRate > 50) {
    systemStatus = 'critical';
    issues.push(`High error rate: ${errorRate} errors in 24h`);
  } else if (errorRate > 10) {
    systemStatus = 'warning';
    issues.push(`${errorRate} errors in 24h`);
  }

  if (activeJobs.length === 0) {
    systemStatus = 'warning';
    issues.push('No active scheduled jobs');
  }

  const healthOverview = {
    system_status: systemStatus,
    issues,
    metrics: {
      total_tokens: totalTokens,
      expired_tokens: expiredTokens,
      enabled_hotels: enabledHotels,
      total_hotels: totalHotels,
      error_rate_24h: errorRate,
      active_jobs: activeJobs.length,
      sync_success_rate: syncStates.filter(s => s.bootstrap_completed).length / Math.max(totalHotels, 1) * 100
    },
    last_updated: now.toISOString()
  };

  return new Response(JSON.stringify(healthOverview), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getPerformanceMetrics(supabase: any, timeRange: string) {
  const now = new Date();
  let startTime: Date;
  
  switch (timeRange) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const { data: auditLogs } = await supabase
    .from('ingestion_audit')
    .select('*')
    .gte('created_at', startTime.toISOString())
    .order('created_at', { ascending: false });

  if (!auditLogs || auditLogs.length === 0) {
    return new Response(JSON.stringify({
      time_range: timeRange,
      total_operations: 0,
      avg_response_time: 0,
      success_rate: 100,
      api_usage: { total_cost: 0, avg_cost_per_operation: 0 },
      operations_by_type: {},
      performance_trends: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Calculate performance metrics
  const totalOperations = auditLogs.length;
  const successfulOps = auditLogs.filter(log => log.status === 'success');
  const avgResponseTime = auditLogs.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / totalOperations;
  const successRate = (successfulOps.length / totalOperations) * 100;
  
  const totalCost = auditLogs.reduce((sum, log) => sum + (log.request_cost || 0), 0);
  const avgCostPerOp = totalCost / totalOperations;

  // Operations by type
  const opsByType = auditLogs.reduce((acc: any, log) => {
    const key = `${log.entity_type}_${log.operation}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Performance trends (hourly buckets)
  const trends = [];
  const bucketSize = timeRange === '1h' ? 10 * 60 * 1000 : 60 * 60 * 1000; // 10min for 1h, 1h for others
  
  for (let time = startTime.getTime(); time <= now.getTime(); time += bucketSize) {
    const bucketStart = new Date(time);
    const bucketEnd = new Date(time + bucketSize);
    
    const bucketLogs = auditLogs.filter(log => {
      const logTime = new Date(log.created_at);
      return logTime >= bucketStart && logTime < bucketEnd;
    });

    if (bucketLogs.length > 0) {
      trends.push({
        timestamp: bucketStart.toISOString(),
        operations: bucketLogs.length,
        avg_response_time: bucketLogs.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / bucketLogs.length,
        success_rate: (bucketLogs.filter(log => log.status === 'success').length / bucketLogs.length) * 100,
        api_cost: bucketLogs.reduce((sum, log) => sum + (log.request_cost || 0), 0)
      });
    }
  }

  const metrics = {
    time_range: timeRange,
    total_operations: totalOperations,
    avg_response_time: Math.round(avgResponseTime),
    success_rate: Math.round(successRate * 100) / 100,
    api_usage: {
      total_cost: totalCost,
      avg_cost_per_operation: Math.round(avgCostPerOp * 100) / 100
    },
    operations_by_type: opsByType,
    performance_trends: trends
  };

  return new Response(JSON.stringify(metrics), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getErrorAnalysis(supabase: any, timeRange: string, hotelId?: string) {
  const now = new Date();
  let startTime: Date;
  
  switch (timeRange) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  let query = supabase
    .from('ingestion_audit')
    .select('*, hotels(name)')
    .eq('status', 'error')
    .gte('created_at', startTime.toISOString())
    .order('created_at', { ascending: false });

  if (hotelId) {
    query = query.eq('hotel_id', hotelId);
  }

  const { data: errorLogs } = await query;

  if (!errorLogs || errorLogs.length === 0) {
    return new Response(JSON.stringify({
      time_range: timeRange,
      total_errors: 0,
      error_categories: {},
      error_trends: [],
      recent_errors: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Categorize errors
  const errorCategories: any = {};
  errorLogs.forEach(log => {
    const message = log.error_message || 'Unknown error';
    let category = 'Other';
    
    if (message.includes('token') || message.includes('auth')) {
      category = 'Authentication';
    } else if (message.includes('network') || message.includes('timeout')) {
      category = 'Network';
    } else if (message.includes('validation') || message.includes('invalid')) {
      category = 'Validation';
    } else if (message.includes('rate') || message.includes('limit')) {
      category = 'Rate Limiting';
    }
    
    errorCategories[category] = (errorCategories[category] || 0) + 1;
  });

  // Error trends
  const trends = [];
  const bucketSize = timeRange === '1h' ? 10 * 60 * 1000 : 60 * 60 * 1000;
  
  for (let time = startTime.getTime(); time <= now.getTime(); time += bucketSize) {
    const bucketStart = new Date(time);
    const bucketEnd = new Date(time + bucketSize);
    
    const bucketErrors = errorLogs.filter(log => {
      const logTime = new Date(log.created_at);
      return logTime >= bucketStart && logTime < bucketEnd;
    });

    trends.push({
      timestamp: bucketStart.toISOString(),
      error_count: bucketErrors.length
    });
  }

  const analysis = {
    time_range: timeRange,
    total_errors: errorLogs.length,
    error_categories: errorCategories,
    error_trends: trends,
    recent_errors: errorLogs.slice(0, 20).map(log => ({
      id: log.id,
      hotel_name: log.hotels?.name || 'Unknown',
      entity_type: log.entity_type,
      operation: log.operation,
      error_message: log.error_message,
      created_at: log.created_at
    }))
  };

  return new Response(JSON.stringify(analysis), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getSyncStatus(supabase: any) {
  // Get sync status for all hotels
  const { data: syncStates } = await supabase
    .from('sync_state')
    .select(`
      *,
      hotels(name, code)
    `)
    .order('hotel_id');

  // Get recent sync activity
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { data: recentActivity } = await supabase
    .from('ingestion_audit')
    .select('hotel_id, entity_type, operation, status, created_at')
    .gte('created_at', last24h.toISOString())
    .order('created_at', { ascending: false });

  // Process sync status for each hotel
  const hotelSyncStatus = (syncStates || []).map((state: any) => {
    const hotelActivity = (recentActivity || []).filter(
      (activity: any) => activity.hotel_id === state.hotel_id
    );

    const lastBookingSync = hotelActivity
      .filter((a: any) => a.entity_type === 'booking')
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    const lastCalendarSync = hotelActivity
      .filter((a: any) => a.entity_type === 'calendar')
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    return {
      hotel_id: state.hotel_id,
      hotel_name: state.hotels?.name || 'Unknown',
      hotel_code: state.hotels?.code || '',
      sync_enabled: state.sync_enabled,
      bootstrap_completed: state.bootstrap_completed,
      bootstrap_completed_at: state.bootstrap_completed_at,
      last_booking_sync: lastBookingSync?.created_at || null,
      last_booking_sync_status: lastBookingSync?.status || null,
      last_calendar_sync: lastCalendarSync?.created_at || null,
      last_calendar_sync_status: lastCalendarSync?.status || null,
      recent_errors: hotelActivity.filter((a: any) => a.status === 'error').length,
      total_operations_24h: hotelActivity.length
    };
  });

  return new Response(JSON.stringify({
    hotel_sync_status: hotelSyncStatus,
    summary: {
      total_hotels: hotelSyncStatus.length,
      enabled_hotels: hotelSyncStatus.filter(h => h.sync_enabled).length,
      bootstrapped_hotels: hotelSyncStatus.filter(h => h.bootstrap_completed).length,
      hotels_with_errors: hotelSyncStatus.filter(h => h.recent_errors > 0).length
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}