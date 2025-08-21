-- Fix infinite recursion in RLS policies only

-- Create security definer function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update hotels policies to use security definer function
DROP POLICY IF EXISTS "hotels_select" ON public.hotels;
DROP POLICY IF EXISTS "hotels_update" ON public.hotels;

CREATE POLICY "hotels_select" ON public.hotels
FOR SELECT USING (org_id = public.get_user_org_id());

CREATE POLICY "hotels_update" ON public.hotels  
FOR UPDATE USING (org_id = public.get_user_org_id());

-- Add missing columns to reservations only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'total_amount') THEN
        ALTER TABLE public.reservations ADD COLUMN total_amount NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'source') THEN
        ALTER TABLE public.reservations ADD COLUMN source TEXT DEFAULT 'Direct';
    END IF;
END $$;