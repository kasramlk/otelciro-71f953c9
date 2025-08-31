-- Create missing hotel record for the test user with correct columns
INSERT INTO public.hotels (
  id, 
  name, 
  code,
  org_id, 
  address, 
  city, 
  country,
  phone,
  timezone
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Test Hotel - Beds24 Integration',
  'TH001',
  '550e8400-e29b-41d4-a716-446655440000',
  '123 Main Street',
  'Test City', 
  'Test Country',
  '+1234567890',
  'UTC'
) ON CONFLICT (id) DO NOTHING;