import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminRequest {
  action: 'get_audit_logs' | 'trigger_sync' | 'get_sync_status';
  filters?: {
    operation?: string;
    status?: string;
    hotel_id?: string;
    limit?: number;
  };
  sync_type?: 'bookings' | 'calendar';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

  // Create service role client for admin operations
  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: userRole, error: roleError } = await supabaseClient.rpc('get_current_user_role');
    
    if (roleError || userRole !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, filters = {}, sync_type }: AdminRequest = await req.json();

    switch (action) {
      case 'get_audit_logs':
        return await getAuditLogs(supabaseService, filters);
      
      case 'trigger_sync':
        return await triggerSync(sync_type || 'both');
      
      case 'get_sync_status':
        return await getSyncStatus(supabaseService);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Admin endpoint error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getAuditLogs(supabase: any, filters: any) {
  let query = supabase
    .from('v_ingestion_audit')
    .select('*')
    .eq('provider', 'beds24')
    .order('created_at', { ascending: false })
    .limit(filters.limit || 100);

  if (filters.operation) {
    query = query.ilike('operation', `%${filters.operation}%`);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.hotel_id) {
    query = query.eq('hotel_id', filters.hotel_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  // Redact sensitive data
  const redactedData = data?.map(log => ({
    ...log,
    request_payload: redactSensitiveFields(log.request_payload),
    response_payload: redactSensitiveFields(log.response_payload)
  }));

  return new Response(
    JSON.stringify({ data: redactedData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function triggerSync(syncType: string) {
  const cronSecret = Deno.env.get('CRON_SECRET') ?? '';
  
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/beds24-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': cronSecret,
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
    },
    body: JSON.stringify({ type: syncType })
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.statusText}`);
  }

  const result = await response.json();

  return new Response(
    JSON.stringify({ success: true, result }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getSyncStatus(supabase: any) {
  const { data, error } = await supabase
    .from('sync_state')
    .select(`
      hotel_id,
      sync_enabled,
      last_bookings_sync,
      last_calendar_sync,
      bootstrap_completed_at,
      metadata,
      hotels!sync_state_hotel_id_fkey(name, code)
    `)
    .eq('provider', 'beds24');

  if (error) {
    throw new Error(`Failed to fetch sync status: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function redactSensitiveFields(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const redactKeys = ['authorization', 'access_token', 'refresh_token', 'token', 'apiKey', 'password', 'email', 'phone', 'cardNumber', 'cvv'];
  
  const redacted = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in redacted) {
    if (redactKeys.some(redactKey => key.toLowerCase().includes(redactKey.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveFields(redacted[key]);
    }
  }
  
  return redacted;
}