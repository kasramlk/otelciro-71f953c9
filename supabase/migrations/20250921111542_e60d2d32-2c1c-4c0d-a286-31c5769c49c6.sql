-- Create integrations table
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create integration_credentials table for encrypted secrets
CREATE TABLE public.integration_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value_encrypted TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create integration_usage table for rate limiting tracking
CREATE TABLE public.integration_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  x_five_min_remaining INTEGER,
  x_five_min_resets_in INTEGER,
  x_request_cost INTEGER,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for integrations table
CREATE POLICY "integrations_org_access" ON public.integrations
  FOR ALL USING (organization_id IN (
    SELECT org_id FROM public.users WHERE auth_user_id = auth.uid()
  ));

-- RLS policies for integration_credentials table
CREATE POLICY "integration_credentials_org_access" ON public.integration_credentials
  FOR ALL USING (integration_id IN (
    SELECT i.id FROM public.integrations i
    JOIN public.users u ON i.organization_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  ));

-- RLS policies for integration_usage table
CREATE POLICY "integration_usage_org_access" ON public.integration_usage
  FOR ALL USING (integration_id IN (
    SELECT i.id FROM public.integrations i
    JOIN public.users u ON i.organization_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_integrations_org_provider ON public.integrations(organization_id, provider);
CREATE INDEX idx_integration_credentials_integration_key ON public.integration_credentials(integration_id, key);
CREATE INDEX idx_integration_usage_integration_captured ON public.integration_usage(integration_id, captured_at DESC);

-- Add updated_at trigger for integrations
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for integration_credentials
CREATE TRIGGER update_integration_credentials_updated_at
  BEFORE UPDATE ON public.integration_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();