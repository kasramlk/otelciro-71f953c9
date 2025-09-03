-- Create compatibility views and add cron scheduling for Beds24 sync

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.v_external_ids;
DROP VIEW IF EXISTS public.v_ingestion_audit;

-- Create compatibility view for external_ids
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

-- Create compatibility view for ingestion_audit  
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

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron jobs for Beds24 sync
-- Bookings sync: every hour at minute 0
SELECT cron.schedule(
  'beds24-bookings-sync',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zldcotumxouasgzdsvmh.supabase.co/functions/v1/beds24-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZGNvdHVteG91YXNnemRzdm1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY2Njk0MSwiZXhwIjoyMDcxMjQyOTQxfQ.6RoKH2oLJG2s6EbGNdEyGAyQ8kd3zXM_jLEYacAVQrM"}'::jsonb,
    body := '{"sync_type": "bookings"}'::jsonb
  );
  $$
);

-- Calendar sync: every 6 hours at minute 0  
SELECT cron.schedule(
  'beds24-calendar-sync',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zldcotumxouasgzdsvmh.supabase.co/functions/v1/beds24-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZGNvdHVteG91YXNnemRzdm1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY2Njk0MSwiZXhwIjoyMDcxMjQyOTQxfQ.6RoKH2oLJG2s6EbGNdEyGAyQ8kd3zXM_jLEYacAVQrM"}'::jsonb,
    body := '{"sync_type": "calendar"}'::jsonb
  );
  $$
);

-- Grant proper permissions on compatibility views
GRANT SELECT ON public.v_external_ids TO authenticated;
GRANT SELECT ON public.v_ingestion_audit TO authenticated;

-- Ensure service-owned tables have proper RLS and grants
ALTER TABLE public.external_ids DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state DISABLE ROW LEVEL SECURITY;  
ALTER TABLE public.ingestion_audit DISABLE ROW LEVEL SECURITY;

-- Grant service role access to service-owned tables
GRANT ALL ON public.external_ids TO service_role;
GRANT ALL ON public.sync_state TO service_role;
GRANT ALL ON public.ingestion_audit TO service_role;
GRANT ALL ON public.beds24_tokens TO service_role;

-- Grant authenticated users read-only access through views
REVOKE ALL ON public.external_ids FROM authenticated;
REVOKE ALL ON public.ingestion_audit FROM authenticated;
GRANT SELECT ON public.v_external_ids TO authenticated;
GRANT SELECT ON public.v_ingestion_audit TO authenticated;