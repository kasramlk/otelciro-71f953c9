-- Create or update user record for kmaleki922@gmail.com
-- First, let's use a simpler INSERT without ON CONFLICT
DELETE FROM public.users WHERE email = 'kmaleki922@gmail.com';

INSERT INTO public.users (
  id,
  auth_user_id,
  email,
  name,
  org_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'd0512e42-9072-4b6a-a483-4b9d87dfb353', -- Current auth user ID from the JWT token
  'kmaleki922@gmail.com',
  'Kaveh Maleki',
  '550e8400-e29b-41d4-a716-446655440000', -- Same org_id as existing hotels
  now()
);