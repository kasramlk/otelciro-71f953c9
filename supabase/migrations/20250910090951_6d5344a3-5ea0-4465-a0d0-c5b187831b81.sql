-- Update the handle_new_user function to remove agency auto-creation
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
  
  RETURN NEW;
END;
$$;