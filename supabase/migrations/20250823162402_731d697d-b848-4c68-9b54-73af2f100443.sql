-- Create user record for kmaleki922@gmail.com with access to existing hotels
-- This user will be assigned to the same org_id as the existing hotels

INSERT INTO public.users (
  id,
  auth_user_id,
  email,
  name,
  org_id,
  created_at
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(), -- This will be updated when they actually sign up
  'kmaleki922@gmail.com',
  'Kaveh Maleki',
  '550e8400-e29b-41d4-a716-446655440000', -- Same org_id as existing hotels
  now()
) ON CONFLICT (email) DO UPDATE SET
  org_id = '550e8400-e29b-41d4-a716-446655440000',
  name = 'Kaveh Maleki';

-- Also create a profiles record for better integration
INSERT INTO public.profiles (
  id,
  first_name,
  last_name,
  display_name,
  organization
) VALUES (
  (SELECT auth_user_id FROM users WHERE email = 'kmaleki922@gmail.com'),
  'Kaveh',
  'Maleki', 
  'Kaveh Maleki',
  'Hotel Management System'
) ON CONFLICT (id) DO UPDATE SET
  first_name = 'Kaveh',
  last_name = 'Maleki',
  display_name = 'Kaveh Maleki',
  organization = 'Hotel Management System';