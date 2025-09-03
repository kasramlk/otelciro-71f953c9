-- Create a hotel manager user account directly
-- Insert into auth.users first (this simulates what Supabase auth would do)
-- Note: In production, you'd create this through Supabase Admin API

-- Create user in our users table
INSERT INTO public.users (id, auth_user_id, email, name, org_id)
VALUES (
  gen_random_uuid(),
  '11111111-2222-3333-4444-555555555555', -- placeholder auth_user_id
  'hotel.manager@testhotel.com',
  'Hotel Manager',
  '550e8400-e29b-41d4-a716-446655440000'
) ON CONFLICT DO NOTHING;

-- Add hotel_manager role
INSERT INTO public.user_roles (user_id, role, org_id)
VALUES (
  '11111111-2222-3333-4444-555555555555',
  'hotel_manager'::app_role,
  '550e8400-e29b-41d4-a716-446655440000'
) ON CONFLICT (user_id, role, org_id) DO NOTHING;

-- Create profile
INSERT INTO public.profiles (
  id, 
  first_name, 
  last_name, 
  display_name,
  organization
)
VALUES (
  '11111111-2222-3333-4444-555555555555', 
  'Hotel',
  'Manager',
  'Hotel Manager',
  'Test Hotel - Beds24 Integration'
) ON CONFLICT (id) DO NOTHING;