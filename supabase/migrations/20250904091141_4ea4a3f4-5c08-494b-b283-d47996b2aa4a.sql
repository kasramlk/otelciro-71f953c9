-- Phase 1: Grant admin role to current user and ensure proper user setup
INSERT INTO user_roles (user_id, role) 
SELECT auth.uid(), 'admin'::app_role 
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role
);

-- Ensure users table has current user
INSERT INTO users (auth_user_id, email, name, role, org_id)
SELECT 
  auth.uid(), 
  u.email, 
  COALESCE(u.raw_user_meta_data ->> 'name', u.email), 
  'admin',
  '550e8400-e29b-41d4-a716-446655440000'
FROM auth.users u 
WHERE u.id = auth.uid()
ON CONFLICT (auth_user_id) DO UPDATE SET role = 'admin';