-- Create rooms for the existing hotel
-- Hotel ID: 6163aacb-81d7-4eb2-ab68-4d3e172bef3e

-- Insert Standard Rooms (STD) - 30 rooms (101-130)
WITH room_data AS (
  SELECT 
    '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'::uuid as hotel_id,
    'de7df96a-10c1-40c9-a6ad-67907d38222e'::uuid as room_type_id,
    (100 + n)::text as room_number,
    CASE 
      WHEN n <= 10 THEN 1
      WHEN n <= 20 THEN 2
      ELSE 3
    END as floor_num
  FROM generate_series(1, 30) as n
)
INSERT INTO rooms (hotel_id, room_type_id, number, floor, status, housekeeping_status)
SELECT hotel_id, room_type_id, room_number, floor_num, 'clean', 'clean'
FROM room_data;

-- Insert Deluxe Suite Rooms (DLX) - 20 rooms (401-420)  
WITH suite_data AS (
  SELECT 
    '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'::uuid as hotel_id,
    'f6532ea0-2ce9-4b9d-8a63-9e93957cc22b'::uuid as room_type_id,
    (400 + n)::text as room_number,
    CASE 
      WHEN n <= 10 THEN 4
      ELSE 5
    END as floor_num
  FROM generate_series(1, 20) as n
)
INSERT INTO rooms (hotel_id, room_type_id, number, floor, status, housekeeping_status)
SELECT hotel_id, room_type_id, room_number, floor_num, 'clean', 'clean'
FROM suite_data;

-- Create a default rate plan for the hotel if none exists
INSERT INTO rate_plans (hotel_id, name, code, description, currency)
VALUES (
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e',
  'Best Available Rate',
  'BAR', 
  'Standard best available rate',
  'USD'
) ON CONFLICT DO NOTHING;