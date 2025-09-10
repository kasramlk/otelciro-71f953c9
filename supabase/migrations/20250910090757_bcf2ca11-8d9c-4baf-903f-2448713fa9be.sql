-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  phone text,
  organization text,
  department text,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  theme text DEFAULT 'light',
  preferences jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create user record in users table
  INSERT INTO public.users (auth_user_id, email, name, role, org_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), 
    COALESCE((NEW.raw_user_meta_data ->> 'role')::text, 'staff'),
    '550e8400-e29b-41d4-a716-446655440000'
  ) ON CONFLICT (auth_user_id) DO NOTHING;
  
  -- Create profile record
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    display_name,
    organization
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.raw_user_meta_data ->> 'org_name'
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Auto-create agency for travel_agency role users
  IF NEW.raw_user_meta_data ->> 'role' = 'travel_agency' THEN
    INSERT INTO public.agencies (
      name,
      type,
      contact_email,
      owner_id,
      org_id
    ) VALUES (
      COALESCE(NEW.raw_user_meta_data ->> 'org_name', 'My Travel Agency'),
      'OTA',
      NEW.email,
      NEW.id,
      '550e8400-e29b-41d4-a716-446655440000'
    );
    
    -- Create agency_users record linking user as owner
    INSERT INTO public.agency_users (
      user_id,
      agency_id,
      role,
      joined_at,
      is_active
    )
    SELECT 
      NEW.id,
      a.id,
      'owner',
      NOW(),
      true
    FROM public.agencies a
    WHERE a.owner_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();