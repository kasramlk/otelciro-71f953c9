-- Drop existing view first to avoid conflicts
DROP VIEW IF EXISTS public.v_ingestion_audit;

-- Fix ingestion_audit table permissions for admin users
ALTER TABLE public.ingestion_audit ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "ingestion_audit_admin_all" ON public.ingestion_audit;
DROP POLICY IF EXISTS "ingestion_audit_org_read" ON public.ingestion_audit;
DROP POLICY IF EXISTS "ingestion_audit_admin_select" ON public.ingestion_audit;
DROP POLICY IF EXISTS "ingestion_audit_auth_insert" ON public.ingestion_audit;
DROP POLICY IF EXISTS "ingestion_audit_service_all" ON public.ingestion_audit;

-- Create new comprehensive policies
CREATE POLICY "ingestion_audit_admin_all"
ON public.ingestion_audit
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

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

CREATE POLICY "ingestion_audit_service_insert"
ON public.ingestion_audit
FOR INSERT
WITH CHECK (true);

-- Create view for audit logs with proper filtering
CREATE VIEW public.v_ingestion_audit AS
SELECT 
  ia.id,
  ia.provider,
  ia.entity_type,
  ia.external_id,
  ia.action,
  ia.operation,
  ia.status,
  ia.hotel_id,
  ia.request_cost,
  ia.limit_remaining,
  ia.limit_resets_in,
  ia.duration_ms,
  ia.records_processed,
  ia.request_payload,
  ia.response_payload,
  ia.error_message,
  ia.trace_id,
  ia.created_at,
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