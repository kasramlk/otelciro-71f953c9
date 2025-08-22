-- Phase 1: Critical Security Fixes (Corrected)

-- 1. Fix public data exposure - restrict access to business reference data
DROP POLICY IF EXISTS "currencies_read" ON public.currencies;
DROP POLICY IF EXISTS "exchange_rates_read" ON public.exchange_rates;
DROP POLICY IF EXISTS "events_read" ON public.market_events;

-- Create restricted policies for business reference data
CREATE POLICY "currencies_org_access" ON public.currencies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "exchange_rates_org_access" ON public.exchange_rates
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "market_events_org_access" ON public.market_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.auth_user_id = auth.uid()
  )
);

-- 2. Create user roles system to prevent recursive RLS issues
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'staff', 'guest');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, org_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles without recursive RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 3. Drop the existing function first, then recreate with correct return type
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT ur.role::text 
  FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() 
  ORDER BY 
    CASE ur.role 
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'manager' THEN 3
      WHEN 'staff' THEN 4
      WHEN 'guest' THEN 5
    END
  LIMIT 1;
$$;

-- RLS policies for user_roles table
CREATE POLICY "user_roles_select" ON public.user_roles
FOR SELECT USING (
  user_id = auth.uid() OR 
  has_role(auth.uid(), 'owner') OR 
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "user_roles_insert" ON public.user_roles
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'owner') OR 
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "user_roles_update" ON public.user_roles
FOR UPDATE USING (
  has_role(auth.uid(), 'owner') OR 
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "user_roles_delete" ON public.user_roles
FOR DELETE USING (
  has_role(auth.uid(), 'owner') OR 
  has_role(auth.uid(), 'admin')
);

-- 4. Add updated_at trigger for user_roles
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Update existing users table to use the new role system
-- Remove the direct role column and use the user_roles table instead
ALTER TABLE public.users DROP COLUMN IF EXISTS role CASCADE;