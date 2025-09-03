-- Fix the handle_new_user function to work with the correct table structure
-- Remove role from users table insert and add role to user_roles table

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role text;
  new_user_id uuid;
BEGIN
  -- Get the role from metadata, default to 'staff' 
  user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'staff');
  
  -- Create user record in users table (without role column)
  INSERT INTO public.users (auth_user_id, email, name, org_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), 
    '550e8400-e29b-41d4-a716-446655440000'
  ) ON CONFLICT (auth_user_id) DO NOTHING
  RETURNING id INTO new_user_id;
  
  -- If user was just created, add their role to user_roles table
  IF new_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, org_id)
    VALUES (
      NEW.id,
      user_role::app_role,
      '550e8400-e29b-41d4-a716-446655440000'
    ) ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
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
  
  RETURN NEW;
END;
$$;