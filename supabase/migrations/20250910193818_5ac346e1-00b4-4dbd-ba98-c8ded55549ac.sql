-- Create rooms for the existing hotel based on room types
-- Hotel ID: 6163aacb-81d7-4eb2-ab68-4d3e172bef3e

-- Insert Standard Rooms (STD) - 30 rooms
INSERT INTO rooms (hotel_id, room_type_id, number, floor, status, housekeeping_status)
SELECT 
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'::uuid,
  'de7df96a-10c1-40c9-a6ad-67907d38222e'::uuid,
  (100 + generate_series(1, 30))::text,
  CASE 
    WHEN generate_series(1, 30) <= 10 THEN 1
    WHEN generate_series(1, 30) <= 20 THEN 2
    ELSE 3
  END,
  'clean',
  'clean'
FROM generate_series(1, 30);

-- Insert Deluxe Suite Rooms (DLX) - 20 rooms  
INSERT INTO rooms (hotel_id, room_type_id, number, floor, status, housekeeping_status)
SELECT 
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'::uuid,
  'f6532ea0-2ce9-4b9d-8a63-9e93957cc22b'::uuid,
  (400 + generate_series(1, 20))::text,
  CASE 
    WHEN generate_series(1, 20) <= 10 THEN 4
    ELSE 5
  END,
  'clean',
  'clean'
FROM generate_series(1, 20);

-- Also create a default rate plan for the hotel if none exists
INSERT INTO rate_plans (hotel_id, name, code, description, currency)
VALUES (
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e',
  'Best Available Rate',
  'BAR', 
  'Standard best available rate',
  'USD'
) ON CONFLICT DO NOTHING;