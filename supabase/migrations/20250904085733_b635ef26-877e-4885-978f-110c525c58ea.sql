-- Continue with fixing database structure
-- Fix beds24_tokens table structure if needed
ALTER TABLE public.beds24_tokens 
ADD COLUMN IF NOT EXISTS refresh_token text,
ADD COLUMN IF NOT EXISTS token_metadata jsonb DEFAULT '{}';

-- Ensure sync_state table has proper structure
CREATE TABLE IF NOT EXISTS public.sync_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES public.hotels(id) NOT NULL,
  provider text NOT NULL DEFAULT 'beds24',
  sync_enabled boolean DEFAULT true,
  bootstrap_completed_at timestamp with time zone,
  last_bookings_sync timestamp with time zone,
  last_calendar_sync timestamp with time zone,
  last_bookings_modified_from timestamp with time zone,
  last_calendar_start date,
  last_calendar_end date,
  settings jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(hotel_id, provider)
);

-- Enable RLS on sync_state
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sync_state_org_access"
ON public.sync_state
FOR ALL
USING (
  hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ingestion_audit_hotel_provider ON public.ingestion_audit(hotel_id, provider);
CREATE INDEX IF NOT EXISTS idx_ingestion_audit_status ON public.ingestion_audit(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_audit_created_at ON public.ingestion_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_ids_provider_entity ON public.external_ids(provider, entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_state_provider ON public.sync_state(provider);

-- Create function to get hotel settings from sync_state
CREATE OR REPLACE FUNCTION public.get_hotel_beds24_settings(hotel_uuid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(settings, '{}'::jsonb)
  FROM sync_state 
  WHERE hotel_id = hotel_uuid AND provider = 'beds24'
  LIMIT 1;
$$;

-- Enable RLS on room_inventory table (fix security warning)
ALTER TABLE public.room_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_inventory_org_access"
ON public.room_inventory
FOR ALL
USING (
  hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Enable RLS on service_orders table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_orders' AND table_schema = 'public') THEN
    ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "service_orders_org_access" ON public.service_orders;
    CREATE POLICY "service_orders_org_access"
    ON public.service_orders
    FOR ALL
    USING (
      hotel_id IN (
        SELECT h.id FROM hotels h
        JOIN users u ON h.org_id = u.org_id
        WHERE u.auth_user_id = auth.uid()
      )
    );
  END IF;
END $$;