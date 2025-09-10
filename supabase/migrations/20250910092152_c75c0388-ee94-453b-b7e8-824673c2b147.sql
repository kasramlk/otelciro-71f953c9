-- Drop existing policies that are causing infinite recursion
DROP POLICY IF EXISTS "Agency admins can manage agency users" ON public.agency_users;
DROP POLICY IF EXISTS "Users can view their own agency memberships" ON public.agency_users;

-- Create security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_agency_access(_user_id uuid)
RETURNS TABLE(agency_id uuid, role text)
LANGUAGE sql
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT au.agency_id, au.role::text
  FROM agency_users au
  WHERE au.user_id = _user_id AND au.is_active = true;
$$;

-- Create non-recursive policies
CREATE POLICY "Users can view their own agency memberships" 
ON public.agency_users 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Agency owners and admins can manage users" 
ON public.agency_users 
FOR ALL 
USING (
  agency_id IN (
    SELECT a.id 
    FROM agencies a 
    WHERE a.owner_id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 
    FROM agency_users au2 
    WHERE au2.agency_id = agency_users.agency_id 
    AND au2.user_id = auth.uid() 
    AND au2.role IN ('owner', 'admin') 
    AND au2.is_active = true
  )
);