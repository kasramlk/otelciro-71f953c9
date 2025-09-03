-- Fix the handle_new_user function with correct ON CONFLICT clauses
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role text;
  existing_user_count int;
BEGIN
  -- Get the role from metadata, default to 'staff' 
  user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'staff');
  
  -- Check if user already exists to avoid duplicates
  SELECT COUNT(*) INTO existing_user_count 
  FROM public.users 
  WHERE auth_user_id = NEW.id;
  
  -- Create user record only if doesn't exist
  IF existing_user_count = 0 THEN
    INSERT INTO public.users (auth_user_id, email, name, org_id)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), 
      '550e8400-e29b-41d4-a716-446655440000'
    );
    
    -- Add user role (using the unique constraint on user_id, role, org_id)
    INSERT INTO public.user_roles (user_id, role, org_id)
    VALUES (
      NEW.id,
      user_role::app_role,
      '550e8400-e29b-41d4-a716-446655440000'
    ) ON CONFLICT (user_id, role, org_id) DO NOTHING;
  END IF;
  
  -- Create profile record (using primary key conflict resolution)
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