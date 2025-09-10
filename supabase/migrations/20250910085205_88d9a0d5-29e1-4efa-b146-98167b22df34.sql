-- Create agency_users table to link users to agencies with roles
CREATE TABLE public.agency_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'agent'::text,
  invited_by UUID REFERENCES public.agency_users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, agency_id)
);

-- Enable RLS on agency_users
ALTER TABLE public.agency_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agency_users
CREATE POLICY "Users can view their own agency memberships"
ON public.agency_users
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Agency admins can manage agency users"
ON public.agency_users
FOR ALL
USING (
  agency_id IN (
    SELECT au.agency_id 
    FROM public.agency_users au 
    WHERE au.user_id = auth.uid() 
    AND au.role IN ('admin', 'owner')
    AND au.is_active = true
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_agency_users_updated_at
BEFORE UPDATE ON public.agency_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update agencies table to have owner tracking
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Function to get user's primary agency
CREATE OR REPLACE FUNCTION public.get_user_primary_agency()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.agency_id 
  FROM public.agency_users au 
  WHERE au.user_id = auth.uid() 
  AND au.is_active = true
  ORDER BY 
    CASE au.role 
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'manager' THEN 3
      WHEN 'agent' THEN 4
    END,
    au.joined_at ASC
  LIMIT 1;
$$;

-- Function to check if user has agency role
CREATE OR REPLACE FUNCTION public.has_agency_role(_user_id UUID, _agency_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agency_users au
    WHERE au.user_id = _user_id
      AND au.agency_id = _agency_id
      AND au.role = _role
      AND au.is_active = true
  )
$$;

-- Update booking_holds RLS policy to use agency_users
DROP POLICY IF EXISTS "holds_rw" ON public.booking_holds;
CREATE POLICY "holds_rw"
ON public.booking_holds
FOR ALL
USING (
  agency_id IN (
    SELECT au.agency_id 
    FROM public.agency_users au 
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  ) OR 
  hotel_id IN (
    SELECT h.id
    FROM (hotels h JOIN users u ON ((h.org_id = u.org_id)))
    WHERE (u.auth_user_id = auth.uid())
  )
);

-- Update agency_contracts RLS policy
DROP POLICY IF EXISTS "contracts_rw" ON public.agency_contracts;
CREATE POLICY "contracts_rw"
ON public.agency_contracts
FOR ALL
USING (
  agency_id IN (
    SELECT au.agency_id 
    FROM public.agency_users au 
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  ) OR 
  hotel_id IN (
    SELECT h.id
    FROM (hotels h JOIN users u ON ((h.org_id = u.org_id)))
    WHERE (u.auth_user_id = auth.uid())
  )
);

-- Update agencies RLS policy
DROP POLICY IF EXISTS "agencies_rw" ON public.agencies;
CREATE POLICY "agencies_rw"
ON public.agencies
FOR ALL
USING (
  id IN (
    SELECT au.agency_id 
    FROM public.agency_users au 
    WHERE au.user_id = auth.uid() 
    AND au.is_active = true
  ) OR 
  org_id IN (
    SELECT users.org_id
    FROM users
    WHERE (users.auth_user_id = auth.uid())
  )
);