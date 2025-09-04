-- Fix ingestion_audit table permissions for admin users
ALTER TABLE public.ingestion_audit ENABLE ROW LEVEL SECURITY;

-- Grant proper permissions to ingestion_audit table
CREATE POLICY "ingestion_audit_admin_all"
ON public.ingestion_audit
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Grant read access to authenticated users for their organization's data
CREATE POLICY "ingestion_audit_org_read"
ON public.ingestion_audit
FOR SELECT
USING (
  hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create view for audit logs with proper filtering
CREATE OR REPLACE VIEW public.v_ingestion_audit AS
SELECT 
  ia.*,
  h.name as hotel_name,
  h.code as hotel_code
FROM public.ingestion_audit ia
LEFT JOIN public.hotels h ON ia.hotel_id = h.id
WHERE 
  -- Admin can see all
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  -- Users can see their org's data
  ia.hotel_id IN (
    SELECT h2.id FROM hotels h2
    JOIN users u ON h2.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  );

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