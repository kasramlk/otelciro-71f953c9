-- Add manager role to kmaleki account so they can access hotel features
INSERT INTO public.user_roles (user_id, role, org_id)
VALUES (
  'd0512e42-9072-4b6a-a483-4b9d87dfb353',
  'manager'::app_role,
  '550e8400-e29b-41d4-a716-446655440000'
) ON CONFLICT (user_id, role, org_id) DO NOTHING;

-- Create a test property specifically for kmaleki
INSERT INTO public.hotels (
  id,
  name,
  address,
  city,
  country,
  phone,
  code,
  org_id,
  timezone
) VALUES (
  gen_random_uuid(),
  'Kmaleki Test Property',
  '456 Test Avenue',
  'Test City',
  'Test Country', 
  '+1-555-TEST-123',
  'KTP001',
  '550e8400-e29b-41d4-a716-446655440000',
  'UTC'
);

-- Add sample room types for the test property
INSERT INTO public.room_types (
  hotel_id,
  name,
  code,
  description,
  capacity_adults,
  capacity_children,
  beds24_sync_enabled
) 
SELECT 
  h.id,
  'Standard Room',
  'STD',
  'Comfortable room with all basic amenities',
  2,
  1,
  false
FROM public.hotels h 
WHERE h.name = 'Kmaleki Test Property';

INSERT INTO public.room_types (
  hotel_id,
  name,
  code,
  description,
  capacity_adults,
  capacity_children,
  beds24_sync_enabled
) 
SELECT 
  h.id,
  'Deluxe Suite',
  'DLX',
  'Spacious suite with premium amenities',
  4,
  2,
  false
FROM public.hotels h 
WHERE h.name = 'Kmaleki Test Property';