-- Additive-only migrations for Beds24 integration compatibility

-- 1. Create room_inventory table if not exists
CREATE TABLE IF NOT EXISTS public.room_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL,
  room_type_id UUID NOT NULL,
  date DATE NOT NULL,
  allotment INTEGER,
  min_stay INTEGER,
  max_stay INTEGER,
  closed_to_arrival BOOLEAN DEFAULT FALSE,
  closed_to_departure BOOLEAN DEFAULT FALSE,
  stop_sell BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_type_id, date)
);

-- 2. Add missing columns to existing tables
ALTER TABLE public.daily_rates 
  ADD COLUMN IF NOT EXISTS beds24_price_index INTEGER;

ALTER TABLE public.hotels 
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Create compatibility views for existing table schema differences

-- View for external_ids to normalize entity_type -> entity
CREATE OR REPLACE VIEW public.v_external_ids AS
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

-- View for ingestion_audit to normalize column names
CREATE OR REPLACE VIEW public.v_ingestion_audit AS
SELECT 
  id,
  provider,
  operation,
  hotel_id,
  external_id,
  status,
  request_cost,
  limit_remaining AS credit_limit_remaining,
  limit_resets_in AS credit_limit_resets_in,
  duration_ms,
  request_payload,
  response_payload,
  error_message AS error_details,
  created_at
FROM public.ingestion_audit;

-- 4. Create indexes for room_inventory
CREATE INDEX IF NOT EXISTS idx_room_inventory_hotel_date 
  ON public.room_inventory(hotel_id, date);
CREATE INDEX IF NOT EXISTS idx_room_inventory_room_type 
  ON public.room_inventory(room_type_id);

-- 5. Create updated_at trigger for room_inventory
CREATE TRIGGER update_room_inventory_updated_at
  BEFORE UPDATE ON public.room_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Ensure RLS is disabled on service-owned tables
ALTER TABLE public.external_ids DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_audit DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds24_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_inventory DISABLE ROW LEVEL SECURITY;

-- 7. Grant service role access to all service-owned tables
GRANT ALL ON public.external_ids TO service_role;
GRANT ALL ON public.sync_state TO service_role;
GRANT ALL ON public.ingestion_audit TO service_role;
GRANT ALL ON public.beds24_tokens TO service_role;
GRANT ALL ON public.room_inventory TO service_role;

-- Grant access to views as well
GRANT SELECT ON public.v_external_ids TO service_role;
GRANT SELECT ON public.v_ingestion_audit TO service_role;