-- Hotel PMS Database Schema
-- Multi-tenant architecture with RLS

-- Organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  billing_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Users table with roles
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Owner', 'Manager', 'FrontDesk', 'Housekeeping', 'ReadOnly')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Hotels table
CREATE TABLE public.hotels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  timezone TEXT DEFAULT 'UTC',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own organization" ON public.organizations
FOR SELECT USING (id IN (
  SELECT org_id FROM public.users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can view organization users" ON public.users
FOR SELECT USING (org_id IN (
  SELECT org_id FROM public.users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can view organization hotels" ON public.hotels
FOR SELECT USING (org_id IN (
  SELECT org_id FROM public.users WHERE auth_user_id = auth.uid()
));