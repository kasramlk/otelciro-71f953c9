-- Create system_errors table for logging application errors
CREATE TABLE public.system_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_stack TEXT,
  context TEXT,
  error_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add org_id to audit_log table 
ALTER TABLE public.audit_log 
ADD COLUMN IF NOT EXISTS org_id UUID;

-- Create indexes for better performance
CREATE INDEX idx_system_errors_created_at ON public.system_errors(created_at);
CREATE INDEX idx_system_errors_error_type ON public.system_errors(error_type);
CREATE INDEX idx_system_errors_user_id ON public.system_errors(user_id);
CREATE INDEX idx_audit_log_entity_type ON public.audit_log(entity_type);
CREATE INDEX idx_audit_log_entity_id ON public.audit_log(entity_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);

-- Enable RLS on system_errors
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

-- Create policy for system_errors (admin only)
CREATE POLICY "system_errors_admin_only" 
ON public.system_errors 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.role = 'Owner'
  )
);

-- Update audit_log policy to include org_id requirement
DROP POLICY IF EXISTS audit_select ON public.audit_log;

CREATE POLICY "audit_select_org" 
ON public.audit_log 
FOR SELECT 
USING (
  org_id IN (
    SELECT users.org_id 
    FROM users 
    WHERE users.auth_user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.role = 'Owner'
  )
);

-- Function to get user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;