-- 🧱 FIX VIEWS: Drop and recreate with correct column names

-- Drop existing views
DROP VIEW IF EXISTS public.v_external_ids;
DROP VIEW IF EXISTS public.v_ingestion_audit;

-- Recreate v_external_ids view with 'entity' column
CREATE VIEW public.v_external_ids AS
SELECT
  id,
  provider,
  entity_type AS entity,
  otelciro_id,
  external_id,
  metadata,
  created_at,
  updated_at
FROM public.external_ids;

-- Recreate v_ingestion_audit view with normalized credit headers
CREATE VIEW public.v_ingestion_audit AS
SELECT
  id,
  provider,
  operation,
  hotel_id,
  external_id,
  status,
  request_cost,
  limit_remaining      AS credit_limit_remaining,
  limit_resets_in      AS credit_limit_resets_in,
  duration_ms,
  request_payload,
  response_payload,
  error_message        AS error_details,
  created_at
FROM public.ingestion_audit;

-- REVOKE direct access to underlying tables from authenticated users
REVOKE SELECT ON public.external_ids FROM authenticated;
REVOKE SELECT ON public.ingestion_audit FROM authenticated;

-- Keep views accessible only via proper channels (admin functions)  
REVOKE SELECT ON public.v_external_ids FROM authenticated;
REVOKE SELECT ON public.v_ingestion_audit FROM authenticated;