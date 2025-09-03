import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecoveryRequest {
  action: 'auto_recovery' | 'manual_recovery' | 'reset_sync_state' | 'repair_data_integrity';
  hotel_id?: string;
  entity_type?: string;
  recovery_options?: {
    force_bootstrap?: boolean;
    reset_tokens?: boolean;
    clear_errors?: boolean;
    resync_from_date?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const { action, hotel_id, entity_type, recovery_options = {} }: RecoveryRequest = await req.json();
    
    console.log(`[RECOVERY] Starting ${action} for hotel ${hotel_id || 'all'}`);

    switch (action) {
      case 'auto_recovery':
        return await performAutoRecovery(supabase, hotel_id);
      
      case 'manual_recovery':
        return await performManualRecovery(supabase, hotel_id, entity_type, recovery_options);
      
      case 'reset_sync_state':
        return await resetSyncState(supabase, hotel_id, recovery_options);
      
      case 'repair_data_integrity':
        return await repairDataIntegrity(supabase, hotel_id);
      
      default:
        throw new Error(`Unknown recovery action: ${action}`);
    }
  } catch (error) {
    console.error('Recovery operation failed:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function performAutoRecovery(supabase: any, hotelId?: string) {
  console.log('[AUTO_RECOVERY] Analyzing system for recovery opportunities');
  
  const recoveryActions = [];
  let query = supabase
    .from('ingestion_audit')
    .select('*')
    .eq('status', 'error')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  if (hotelId) {
    query = query.eq('hotel_id', hotelId);
  }
  
  const { data: recentErrors } = await query;
  
  if (!recentErrors || recentErrors.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      message: 'No errors found requiring recovery',
      actions_taken: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Analyze error patterns
  const errorPatterns: any = {};
  recentErrors.forEach(error => {
    const key = `${error.hotel_id}_${error.entity_type}`;
    if (!errorPatterns[key]) {
      errorPatterns[key] = {
        hotel_id: error.hotel_id,
        entity_type: error.entity_type,
        errors: [],
        count: 0
      };
    }
    errorPatterns[key].errors.push(error);
    errorPatterns[key].count++;
  });

  // Attempt automatic recovery for each pattern
  for (const [key, pattern] of Object.entries(errorPatterns) as any) {
    if (pattern.count >= 3) { // Multiple errors indicate systemic issue
      console.log(`[AUTO_RECOVERY] Found ${pattern.count} errors for ${pattern.entity_type} in hotel ${pattern.hotel_id}`);
      
      // Check if errors are token-related
      const tokenErrors = pattern.errors.filter((e: any) => 
        e.error_message?.includes('token') || 
        e.error_message?.includes('auth') || 
        e.error_message?.includes('401')
      );
      
      if (tokenErrors.length > 0) {
        console.log('[AUTO_RECOVERY] Detected token-related errors, refreshing tokens');
        try {
          await supabase.functions.invoke('beds24-token-manager', {
            body: { action: 'refresh' }
          });
          recoveryActions.push(`Refreshed authentication tokens`);
        } catch (error) {
          console.error('[AUTO_RECOVERY] Failed to refresh tokens:', error);
        }
      }

      // Check if errors are rate-limiting related
      const rateLimitErrors = pattern.errors.filter((e: any) => 
        e.error_message?.includes('rate') || 
        e.error_message?.includes('limit') || 
        e.error_message?.includes('429')
      );
      
      if (rateLimitErrors.length > 0) {
        console.log('[AUTO_RECOVERY] Detected rate limiting, disabling sync temporarily');
        try {
          await supabase
            .from('sync_state')
            .update({ 
              sync_enabled: false,
              settings: { 
                ...pattern.settings,
                auto_disabled_due_to_rate_limit: true,
                disabled_at: new Date().toISOString()
              }
            })
            .eq('hotel_id', pattern.hotel_id);
          
          recoveryActions.push(`Temporarily disabled sync for hotel ${pattern.hotel_id} due to rate limiting`);
        } catch (error) {
          console.error('[AUTO_RECOVERY] Failed to disable sync:', error);
        }
      }

      // Schedule retry for failed operations
      if (pattern.entity_type === 'booking' || pattern.entity_type === 'calendar') {
        try {
          console.log(`[AUTO_RECOVERY] Scheduling retry sync for ${pattern.entity_type}`);
          await supabase.functions.invoke('beds24-scheduler', {
            body: { 
              action: 'manual_trigger',
              sync_type: pattern.entity_type,
              hotel_id: pattern.hotel_id
            }
          });
          recoveryActions.push(`Scheduled retry sync for ${pattern.entity_type} in hotel ${pattern.hotel_id}`);
        } catch (error) {
          console.error('[AUTO_RECOVERY] Failed to schedule retry:', error);
        }
      }
    }
  }

  return new Response(JSON.stringify({
    success: true,
    message: `Auto-recovery completed. ${recoveryActions.length} actions taken.`,
    actions_taken: recoveryActions,
    errors_analyzed: recentErrors.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function performManualRecovery(supabase: any, hotelId?: string, entityType?: string, options: any = {}) {
  console.log(`[MANUAL_RECOVERY] Starting manual recovery for hotel ${hotelId}, entity ${entityType}`);
  
  const recoveryActions = [];

  // Force bootstrap if requested
  if (options.force_bootstrap && hotelId) {
    console.log('[MANUAL_RECOVERY] Force bootstrapping hotel');
    try {
      await supabase.functions.invoke('beds24-bootstrap', {
        body: { 
          hotel_id: hotelId,
          force_refresh: true
        }
      });
      recoveryActions.push(`Force bootstrapped hotel ${hotelId}`);
    } catch (error) {
      console.error('[MANUAL_RECOVERY] Bootstrap failed:', error);
      recoveryActions.push(`Failed to bootstrap hotel ${hotelId}: ${error.message}`);
    }
  }

  // Reset tokens if requested
  if (options.reset_tokens) {
    console.log('[MANUAL_RECOVERY] Resetting authentication tokens');
    try {
      // Clear existing tokens
      await supabase.from('beds24_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Refresh tokens
      await supabase.functions.invoke('beds24-token-manager', {
        body: { action: 'refresh' }
      });
      
      recoveryActions.push('Reset and refreshed authentication tokens');
    } catch (error) {
      console.error('[MANUAL_RECOVERY] Token reset failed:', error);
      recoveryActions.push(`Failed to reset tokens: ${error.message}`);
    }
  }

  // Clear errors if requested
  if (options.clear_errors) {
    console.log('[MANUAL_RECOVERY] Clearing error logs');
    try {
      let query = supabase
        .from('ingestion_audit')
        .delete()
        .eq('status', 'error');
      
      if (hotelId) {
        query = query.eq('hotel_id', hotelId);
      }
      
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      
      const { error } = await query;
      if (error) throw error;
      
      recoveryActions.push(`Cleared error logs${hotelId ? ` for hotel ${hotelId}` : ''}${entityType ? ` for entity ${entityType}` : ''}`);
    } catch (error) {
      console.error('[MANUAL_RECOVERY] Error clearing failed:', error);
      recoveryActions.push(`Failed to clear errors: ${error.message}`);
    }
  }

  // Resync from specific date if requested
  if (options.resync_from_date && hotelId) {
    console.log(`[MANUAL_RECOVERY] Resyncing from date ${options.resync_from_date}`);
    try {
      // Update sync state to reset synchronization point
      await supabase
        .from('sync_state')
        .update({
          last_bookings_modified_from: options.resync_from_date,
          last_calendar_start: options.resync_from_date
        })
        .eq('hotel_id', hotelId);

      // Trigger immediate sync
      await supabase.functions.invoke('beds24-scheduler', {
        body: { 
          action: 'manual_trigger',
          sync_type: entityType || 'all',
          hotel_id: hotelId
        }
      });
      
      recoveryActions.push(`Reset sync point to ${options.resync_from_date} and triggered resync`);
    } catch (error) {
      console.error('[MANUAL_RECOVERY] Resync failed:', error);
      recoveryActions.push(`Failed to resync: ${error.message}`);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    message: `Manual recovery completed. ${recoveryActions.length} actions taken.`,
    actions_taken: recoveryActions
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function resetSyncState(supabase: any, hotelId?: string, options: any = {}) {
  console.log(`[RESET_SYNC_STATE] Resetting sync state for hotel ${hotelId || 'all'}`);
  
  try {
    let query = supabase.from('sync_state');
    
    const updateData: any = {
      bootstrap_completed: false,
      bootstrap_completed_at: null,
      last_bookings_modified_from: null,
      last_calendar_start: null,
      last_calendar_end: null,
      sync_enabled: false
    };

    if (hotelId) {
      await query.update(updateData).eq('hotel_id', hotelId);
    } else {
      await query.update(updateData).neq('hotel_id', '00000000-0000-0000-0000-000000000000');
    }

    const message = `Sync state reset${hotelId ? ` for hotel ${hotelId}` : ' for all hotels'}`;
    
    return new Response(JSON.stringify({
      success: true,
      message,
      note: 'You will need to re-bootstrap affected hotels before enabling sync'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[RESET_SYNC_STATE] Failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

async function repairDataIntegrity(supabase: any, hotelId?: string) {
  console.log(`[REPAIR_DATA_INTEGRITY] Checking data integrity for hotel ${hotelId || 'all'}`);
  
  const repairActions = [];
  
  try {
    // Check for orphaned external_ids
    const { data: orphanedIds } = await supabase
      .from('external_ids')
      .select('*')
      .eq('provider', 'beds24')
      .not('otelciro_id', 'in', '(SELECT id FROM hotels UNION SELECT id FROM room_types)');
    
    if (orphanedIds && orphanedIds.length > 0) {
      console.log(`[REPAIR] Found ${orphanedIds.length} orphaned external IDs`);
      await supabase
        .from('external_ids')
        .delete()
        .in('id', orphanedIds.map(id => id.id));
      
      repairActions.push(`Cleaned up ${orphanedIds.length} orphaned external ID mappings`);
    }

    // Check for duplicate external_ids
    const { data: duplicateIds } = await supabase
      .from('external_ids')
      .select('external_id, entity_type, COUNT(*) as count')
      .eq('provider', 'beds24')
      .group('external_id, entity_type')
      .having('COUNT(*) > 1');
    
    if (duplicateIds && duplicateIds.length > 0) {
      console.log(`[REPAIR] Found ${duplicateIds.length} duplicate external ID groups`);
      
      for (const duplicate of duplicateIds) {
        // Keep only the most recent one
        const { data: duplicateRecords } = await supabase
          .from('external_ids')
          .select('*')
          .eq('external_id', duplicate.external_id)
          .eq('entity_type', duplicate.entity_type)
          .eq('provider', 'beds24')
          .order('created_at', { ascending: false });
        
        if (duplicateRecords && duplicateRecords.length > 1) {
          const toDelete = duplicateRecords.slice(1); // Keep first (most recent), delete rest
          await supabase
            .from('external_ids')
            .delete()
            .in('id', toDelete.map(record => record.id));
        }
      }
      
      repairActions.push(`Cleaned up duplicate external ID mappings`);
    }

    // Check for sync_state without corresponding hotel
    let syncStateQuery = supabase
      .from('sync_state')
      .select('hotel_id')
      .not('hotel_id', 'in', '(SELECT id FROM hotels)');
    
    const { data: orphanedSyncStates } = await syncStateQuery;
    
    if (orphanedSyncStates && orphanedSyncStates.length > 0) {
      console.log(`[REPAIR] Found ${orphanedSyncStates.length} orphaned sync states`);
      await supabase
        .from('sync_state')
        .delete()
        .in('hotel_id', orphanedSyncStates.map(state => state.hotel_id));
      
      repairActions.push(`Cleaned up ${orphanedSyncStates.length} orphaned sync states`);
    }

    // Verify token integrity
    const { data: tokens } = await supabase
      .from('beds24_tokens')
      .select('*');
    
    if (tokens) {
      const now = new Date();
      const expiredTokens = tokens.filter(token => 
        token.expires_at && new Date(token.expires_at) < now
      );
      
      if (expiredTokens.length > 0) {
        console.log(`[REPAIR] Found ${expiredTokens.length} expired tokens`);
        await supabase
          .from('beds24_tokens')
          .delete()
          .in('id', expiredTokens.map(token => token.id));
        
        repairActions.push(`Removed ${expiredTokens.length} expired tokens`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Data integrity repair completed. ${repairActions.length} issues fixed.`,
      repairs_performed: repairActions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('[REPAIR_DATA_INTEGRITY] Failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
