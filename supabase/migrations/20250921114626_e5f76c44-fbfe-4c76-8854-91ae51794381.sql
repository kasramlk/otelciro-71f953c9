-- Create integrations table for managing third-party integrations
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'beds24',
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(organization_id, provider)
);

-- Create integration_credentials table for storing encrypted credentials
CREATE TABLE IF NOT EXISTS public.integration_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value_encrypted TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(integration_id, key)
);

-- Create integration_usage table for rate limit tracking
CREATE TABLE IF NOT EXISTS public.integration_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  x_five_min_remaining INTEGER,
  x_five_min_resets_in INTEGER,
  x_request_cost INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for integrations
CREATE POLICY "integrations_org_access" ON public.integrations
  FOR ALL USING (
    organization_id IN (
      SELECT u.org_id 
      FROM public.users u 
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- RLS policies for integration_credentials
CREATE POLICY "integration_credentials_org_access" ON public.integration_credentials
  FOR ALL USING (
    integration_id IN (
      SELECT i.id 
      FROM public.integrations i
      JOIN public.users u ON i.organization_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- RLS policies for integration_usage
CREATE POLICY "integration_usage_org_access" ON public.integration_usage
  FOR ALL USING (
    integration_id IN (
      SELECT i.id 
      FROM public.integrations i
      JOIN public.users u ON i.organization_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Service role policies for edge functions
CREATE POLICY "integrations_service_all" ON public.integrations
  FOR ALL USING (true)
  WITH CHECK (true);

CREATE POLICY "integration_credentials_service_all" ON public.integration_credentials
  FOR ALL USING (true)
  WITH CHECK (true);

CREATE POLICY "integration_usage_service_all" ON public.integration_usage
  FOR ALL USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_integrations_org_provider ON public.integrations(organization_id, provider);
CREATE INDEX IF NOT EXISTS idx_integration_credentials_integration_key ON public.integration_credentials(integration_id, key);
CREATE INDEX IF NOT EXISTS idx_integration_usage_integration_created ON public.integration_usage(integration_id, created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integration_credentials_updated_at
  BEFORE UPDATE ON public.integration_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();