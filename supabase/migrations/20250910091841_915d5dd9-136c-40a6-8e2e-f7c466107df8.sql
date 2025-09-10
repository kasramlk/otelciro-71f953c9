-- Insert user record (without ON CONFLICT since there might not be a unique constraint)
INSERT INTO public.users (auth_user_id, email, name, org_id)
SELECT 
  'a30fcf29-836f-4a83-b840-39666bcb35c8',
  'info@otelciro.com',
  'Otelciro Team',
  '550e8400-e29b-41d4-a716-446655440000'
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE auth_user_id = 'a30fcf29-836f-4a83-b840-39666bcb35c8'
);

-- Insert profile record
INSERT INTO public.profiles (
  id,
  first_name,
  last_name,
  display_name,
  organization
)
SELECT 
  'a30fcf29-836f-4a83-b840-39666bcb35c8',
  'Otelciro',
  'Team',
  'Otelciro Team',
  'Otelciro Travel Agency'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id = 'a30fcf29-836f-4a83-b840-39666bcb35c8'
);