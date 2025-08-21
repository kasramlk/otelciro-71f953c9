-- Fix infinite recursion in users table RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT u.role 
  FROM public.users u 
  WHERE u.auth_user_id = auth.uid() 
  LIMIT 1;
$$;

-- Create new non-recursive policies using security definer functions
CREATE POLICY "users_can_view_same_org" 
ON public.users 
FOR SELECT 
USING (org_id = get_user_org_id());

CREATE POLICY "owners_can_update_same_org" 
ON public.users 
FOR UPDATE 
USING (org_id = get_user_org_id() AND get_current_user_role() = 'Owner');

-- Fix public table access issues from security scan
-- Add proper RLS policies for currency and market data

-- Currencies table - restrict to authenticated users
DROP POLICY IF EXISTS "currencies_read" ON public.currencies;
CREATE POLICY "currencies_read" 
ON public.currencies 
FOR SELECT 
TO authenticated 
USING (true);

-- Market events table - restrict to authenticated users  
DROP POLICY IF EXISTS "events_read" ON public.market_events;
CREATE POLICY "events_read" 
ON public.market_events 
FOR SELECT 
TO authenticated 
USING (true);

-- Exchange rates table - restrict to authenticated users
DROP POLICY IF EXISTS "exchange_rates_read" ON public.exchange_rates;
CREATE POLICY "exchange_rates_read" 
ON public.exchange_rates 
FOR SELECT 
TO authenticated 
USING (true);