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

-- Get the hotel ID for room types
WITH new_hotel AS (
  SELECT id FROM public.hotels WHERE name = 'Kmaleki Test Property' LIMIT 1
)
-- Add sample room types for the test property
INSERT INTO public.room_types (
  hotel_id,
  name,
  description,
  capacity,
  base_rate
) 
SELECT 
  h.id,
  'Standard Room',
  'Comfortable room with all basic amenities',
  2,
  120.00
FROM new_hotel h;

WITH new_hotel AS (
  SELECT id FROM public.hotels WHERE name = 'Kmaleki Test Property' LIMIT 1
)
INSERT INTO public.room_types (
  hotel_id,
  name,
  description,
  capacity,
  base_rate
) 
SELECT 
  h.id,
  'Deluxe Suite',
  'Spacious suite with premium amenities',
  4,
  200.00
FROM new_hotel h;