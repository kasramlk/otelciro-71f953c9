-- Create user record for info@otelciro.com (without role column)
INSERT INTO public.users (auth_user_id, email, name, org_id)
VALUES (
  'a30fcf29-836f-4a83-b840-39666bcb35c8',
  'info@otelciro.com',
  'Otelciro Team',
  '550e8400-e29b-41d4-a716-446655440000'
) ON CONFLICT (auth_user_id) DO UPDATE SET
  email = 'info@otelciro.com',
  name = 'Otelciro Team';

-- Create profile record
INSERT INTO public.profiles (
  id,
  first_name,
  last_name,
  display_name,
  organization
)
VALUES (
  'a30fcf29-836f-4a83-b840-39666bcb35c8',
  'Otelciro',
  'Team',
  'Otelciro Team',
  'Otelciro Travel Agency'
) ON CONFLICT (id) DO UPDATE SET
  display_name = 'Otelciro Team',
  organization = 'Otelciro Travel Agency';

-- Create agency for Otelciro
INSERT INTO public.agencies (
  name,
  type,
  contact_email,
  owner_id,
  org_id
) VALUES (
  'Otelciro Travel Agency',
  'OTA',
  'info@otelciro.com',
  'a30fcf29-836f-4a83-b840-39666bcb35c8',
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
  'a30fcf29-836f-4a83-b840-39666bcb35c8',
  a.id,
  'owner',
  NOW(),
  true
FROM public.agencies a
WHERE a.owner_id = 'a30fcf29-836f-4a83-b840-39666bcb35c8';