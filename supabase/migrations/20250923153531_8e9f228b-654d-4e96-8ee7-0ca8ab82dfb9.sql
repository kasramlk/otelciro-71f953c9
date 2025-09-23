-- Insert missing profile for the current user
INSERT INTO public.profiles (
  id, 
  first_name, 
  last_name, 
  display_name,
  organization
) VALUES (
  'd0512e42-9072-4b6a-a483-4b9d87dfb353',
  'User',
  'Admin', 
  'Admin User',
  'OtelCiro PMS'
) ON CONFLICT (id) DO NOTHING;

-- Update RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create proper RLS policies for profiles
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