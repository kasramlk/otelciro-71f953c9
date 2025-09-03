-- Fix security issues: Enable RLS on service tables and fix function search paths

-- Enable RLS on all service tables (no policies needed as they're service-managed)
ALTER TABLE public.external_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds24_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_push_history ENABLE ROW LEVEL SECURITY;

-- Fix function search paths
DROP FUNCTION IF EXISTS public.calculate_next_run(TEXT, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION public.calculate_next_run(cron_expression TEXT, from_time TIMESTAMPTZ DEFAULT now())
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Update existing functions to have proper search paths
DROP FUNCTION IF EXISTS public.generate_reservation_code();
CREATE OR REPLACE FUNCTION public.generate_reservation_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'RES' || LPAD(EXTRACT(epoch FROM now())::text, 10, '0');
  END IF;
  RETURN NEW;
END;
$$;