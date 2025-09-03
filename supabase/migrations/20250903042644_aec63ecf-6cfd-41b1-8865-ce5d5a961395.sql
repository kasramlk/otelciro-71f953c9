-- Add hotel_manager role to kmaleki account so they can access hotel features
INSERT INTO public.user_roles (user_id, role, org_id)
VALUES (
  'd0512e42-9072-4b6a-a483-4b9d87dfb353',
  'hotel_manager'::app_role,
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
  'test-prop-' || substr(md5(random()::text), 1, 8),
  'Kmaleki Test Property',
  '456 Test Avenue',
  'Test City',
  'Test Country', 
  '+1-555-TEST-123',
  'KTP001',
  '550e8400-e29b-41d4-a716-446655440000',
  'UTC'
) ON CONFLICT DO NOTHING;

-- Add some sample room types for the test property
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
FROM public.hotels h 
WHERE h.name = 'Kmaleki Test Property'
AND NOT EXISTS (
  SELECT 1 FROM public.room_types rt 
  WHERE rt.hotel_id = h.id AND rt.name = 'Standard Room'
);

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
FROM public.hotels h 
WHERE h.name = 'Kmaleki Test Property'
AND NOT EXISTS (
  SELECT 1 FROM public.room_types rt 
  WHERE rt.hotel_id = h.id AND rt.name = 'Deluxe Suite'
);