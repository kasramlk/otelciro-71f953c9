-- Fix security linter issues for Beds24 integration

-- Fix the views to not use SECURITY DEFINER 
DROP VIEW IF EXISTS public.v_external_ids;
DROP VIEW IF EXISTS public.v_ingestion_audit;

-- Recreate views without SECURITY DEFINER (they will use SECURITY INVOKER by default)
CREATE VIEW public.v_external_ids AS
SELECT 
  id,
  provider,
  entity_type,
  external_id,
  otelciro_id,
  metadata,
  created_at,
  updated_at
FROM public.external_ids;

CREATE VIEW public.v_ingestion_audit AS
SELECT 
  id,
  provider,
  entity_type,
  external_id,
  hotel_id,
  operation,
  action,
  status,
  error_message,
  request_payload,
  response_payload,
  request_cost,
  limit_remaining,
  limit_resets_in,
  duration_ms,
  records_processed,
  trace_id,
  created_at
FROM public.ingestion_audit;

-- Fix function search paths by updating existing functions
-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create user record in users table
  INSERT INTO public.users (auth_user_id, email, name, role, org_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), 
    COALESCE((NEW.raw_user_meta_data ->> 'role')::text, 'staff'),
    '550e8400-e29b-41d4-a716-446655440000'
  ) ON CONFLICT (auth_user_id) DO NOTHING;
  
  -- Create profile record
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    display_name,
    organization
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'org_name'
  ) ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Update check_user_permissions function  
CREATE OR REPLACE FUNCTION public.check_user_permissions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user has permission for price changes
  IF TG_TABLE_NAME = 'daily_rates' AND TG_OP = 'UPDATE' THEN
    IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) AND NOT public.has_role(auth.uid(), 'manager'::public.app_role) THEN
      RAISE EXCEPTION 'Insufficient permissions to modify pricing';
    END IF;
  END IF;
  
  -- Check if user has permission to delete housekeeping tasks
  IF TG_TABLE_NAME = 'housekeeping_tasks' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) AND NOT public.has_role(auth.uid(), 'manager'::public.app_role) THEN
      RAISE EXCEPTION 'Insufficient permissions to delete tasks';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update calculate_next_run function
CREATE OR REPLACE FUNCTION public.calculate_next_run(cron_expression text, from_time timestamp with time zone DEFAULT now())
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    next_run TIMESTAMPTZ;
BEGIN
    -- Simple cron parsing for common patterns
    IF cron_expression = '0 * * * *' THEN
        -- Every hour at minute 0
        next_run := date_trunc('hour', from_time) + INTERVAL '1 hour';
    ELSIF cron_expression = '0 */6 * * *' THEN
        -- Every 6 hours at minute 0
        next_run := date_trunc('hour', from_time) + 
                   INTERVAL '6 hours' * CEIL(EXTRACT(hour FROM from_time)::float / 6.0);
    ELSIF cron_expression = '0 8 * * *' THEN
        -- Daily at 8 AM
        next_run := date_trunc('day', from_time) + INTERVAL '1 day' + INTERVAL '8 hours';
        IF next_run <= from_time THEN
            next_run := next_run + INTERVAL '1 day';
        END IF;
    ELSE
        -- Default to 1 hour for unknown patterns
        next_run := from_time + INTERVAL '1 hour';
    END IF;
    
    RETURN next_run;
END;
$function$;

-- Service-owned tables don't need RLS as they're accessed only by service role
-- This is intentional for: external_ids, sync_state, ingestion_audit, beds24_tokens
-- Regular application tables keep their existing RLS policies

-- Grant necessary permissions
GRANT SELECT ON public.v_external_ids TO authenticated;
GRANT SELECT ON public.v_ingestion_audit TO authenticated;

-- Ensure proper permissions on service tables
GRANT ALL ON public.external_ids TO service_role;
GRANT ALL ON public.sync_state TO service_role;
GRANT ALL ON public.ingestion_audit TO service_role;
GRANT ALL ON public.beds24_tokens TO service_role;