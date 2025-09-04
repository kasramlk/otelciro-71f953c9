-- Fix RLS policies for ingestion_audit table to allow admin access
-- First, check if the table exists and enable RLS if needed
DO $$ 
BEGIN
  -- Enable RLS on ingestion_audit if not already enabled
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ingestion_audit' AND table_schema = 'public') THEN
    ALTER TABLE public.ingestion_audit ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Admin users can view all audit logs" ON public.ingestion_audit;
    DROP POLICY IF EXISTS "Service role can access audit logs" ON public.ingestion_audit;
    
    -- Create policy for admin users to view all audit logs
    CREATE POLICY "Admin users can view all audit logs" 
    ON public.ingestion_audit 
    FOR SELECT 
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));
    
    -- Create policy for service role (for edge functions)
    CREATE POLICY "Service role can access audit logs"
    ON public.ingestion_audit
    FOR ALL
    TO service_role
    USING (true);
    
    -- Create policy for inserting audit logs (for edge functions)
    CREATE POLICY "Edge functions can insert audit logs"
    ON public.ingestion_audit
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
    
    RAISE NOTICE 'RLS policies updated for ingestion_audit table';
  ELSE
    RAISE NOTICE 'ingestion_audit table does not exist';
  END IF;
END $$;