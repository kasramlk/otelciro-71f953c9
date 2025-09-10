-- Create agency for Otelciro
INSERT INTO public.agencies (
  name,
  type,
  contact_email,
  owner_id,
  org_id
)
SELECT 
  'Otelciro Travel Agency',
  'OTA',
  'info@otelciro.com',
  'a30fcf29-836f-4a83-b840-39666bcb35c8',
  '550e8400-e29b-41d4-a716-446655440000'
WHERE NOT EXISTS (
  SELECT 1 FROM public.agencies WHERE owner_id = 'a30fcf29-836f-4a83-b840-39666bcb35c8'
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
WHERE a.owner_id = 'a30fcf29-836f-4a83-b840-39666bcb35c8'
AND NOT EXISTS (
  SELECT 1 FROM public.agency_users 
  WHERE user_id = 'a30fcf29-836f-4a83-b840-39666bcb35c8' 
  AND agency_id = a.id
);