-- Fix the function security issue by setting proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'admin@hotel-pms.com' THEN
    INSERT INTO public.users (auth_user_id, email, name, role, org_id)
    VALUES (NEW.id, NEW.email, 'Admin User', 'Owner', '550e8400-e29b-41d4-a716-446655440000');
  END IF;
  RETURN NEW;
END;
$$;