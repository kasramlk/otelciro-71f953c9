-- Drop all existing policies on ingestion_audit, beds24_tokens, and external_ids tables first
-- This ensures a clean slate for policy creation

-- Drop policies on ingestion_audit
DROP POLICY IF EXISTS "Admin users can view all audit logs" ON public.ingestion_audit;
DROP POLICY IF EXISTS "Service role can access audit logs" ON public.ingestion_audit;
DROP POLICY IF EXISTS "Edge functions can insert audit logs" ON public.ingestion_audit;
DROP POLICY IF EXISTS "Service role full access" ON public.ingestion_audit;
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.ingestion_audit;

-- Drop policies on beds24_tokens
DROP POLICY IF EXISTS "Admin users can manage tokens" ON public.beds24_tokens;
DROP POLICY IF EXISTS "Service role can manage tokens" ON public.beds24_tokens;

-- Drop policies on external_ids
DROP POLICY IF EXISTS "Service role can manage external_ids" ON public.external_ids;
DROP POLICY IF EXISTS "Admin users can view external_ids" ON public.external_ids;

-- Now recreate all policies with proper naming to avoid conflicts
-- Enable RLS on all tables
ALTER TABLE public.ingestion_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds24_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_ids ENABLE ROW LEVEL SECURITY;

-- ingestion_audit policies
CREATE POLICY "ingestion_audit_admin_select" 
ON public.ingestion_audit 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "ingestion_audit_service_all"
ON public.ingestion_audit
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "ingestion_audit_auth_insert"
ON public.ingestion_audit
FOR INSERT
TO authenticated
WITH CHECK (true);

-- beds24_tokens policies  
CREATE POLICY "beds24_tokens_admin_all"
ON public.beds24_tokens
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "beds24_tokens_service_all"
ON public.beds24_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- external_ids policies
CREATE POLICY "external_ids_service_all"
ON public.external_ids
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "external_ids_admin_select"
ON public.external_ids
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));