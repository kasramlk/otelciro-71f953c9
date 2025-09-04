-- Fix critical RLS issues and create proper policies for ingestion_audit
-- Enable RLS on ingestion_audit table and create proper policies
ALTER TABLE public.ingestion_audit ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (clean slate)
DROP POLICY IF EXISTS "Admin users can view all audit logs" ON public.ingestion_audit;
DROP POLICY IF EXISTS "Service role can access audit logs" ON public.ingestion_audit;
DROP POLICY IF EXISTS "Edge functions can insert audit logs" ON public.ingestion_audit;

-- Create comprehensive RLS policies for ingestion_audit table
-- Policy 1: Admin users can view all audit logs
CREATE POLICY "Admin users can view all audit logs" 
ON public.ingestion_audit 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Policy 2: Service role can do everything (for edge functions)
CREATE POLICY "Service role full access"
ON public.ingestion_audit
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 3: Authenticated users can insert audit logs (for system operations)
CREATE POLICY "Authenticated can insert audit logs"
ON public.ingestion_audit
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable RLS on beds24_tokens table and create policies
ALTER TABLE public.beds24_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for beds24_tokens (admin only access)
CREATE POLICY "Admin users can manage tokens"
ON public.beds24_tokens
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Service role full access to tokens
CREATE POLICY "Service role can manage tokens"
ON public.beds24_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Enable RLS on external_ids table
ALTER TABLE public.external_ids ENABLE ROW LEVEL SECURITY;

-- Create policies for external_ids (system access only)
CREATE POLICY "Service role can manage external_ids"
ON public.external_ids
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admin users can view external_ids
CREATE POLICY "Admin users can view external_ids"
ON public.external_ids
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));