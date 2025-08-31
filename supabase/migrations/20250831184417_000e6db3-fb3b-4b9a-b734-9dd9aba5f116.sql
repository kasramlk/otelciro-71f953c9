-- Create missing hotel record for the test user
INSERT INTO public.hotels (
  id, 
  name, 
  org_id, 
  address, 
  city, 
  country,
  phone,
  email,
  website,
  currency,
  timezone,
  is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Test Hotel - Beds24 Integration',
  '550e8400-e29b-41d4-a716-446655440000',
  '123 Main Street',
  'Test City', 
  'Test Country',
  '+1234567890',
  'test@hotel.com',
  'https://testhotel.com',
  'USD',
  'UTC',
  true
) ON CONFLICT (id) DO NOTHING;