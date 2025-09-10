-- Create 50 rooms for hotel 6163aacb-81d7-4eb2-ab68-4d3e172bef3e
-- Using the correct room_type_ids and proper column values

-- Insert Standard Rooms (30 rooms: 101-130)
INSERT INTO rooms (hotel_id, room_type_id, number, floor, status, housekeeping_status)
SELECT 
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'::uuid as hotel_id,
  'de7df96a-10c1-40c9-a6ad-67907d38222e'::uuid as room_type_id,
  (100 + generate_series)::text as number,
  CASE 
    WHEN generate_series <= 10 THEN 1
    WHEN generate_series <= 20 THEN 2
    ELSE 3
  END as floor,
  'Available' as status,
  'Clean' as housekeeping_status
FROM generate_series(1, 30);

-- Insert Deluxe Suite Rooms (20 rooms: 401-420)  
INSERT INTO rooms (hotel_id, room_type_id, number, floor, status, housekeeping_status)
SELECT 
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'::uuid as hotel_id,
  'f6532ea0-2ce9-4b9d-8a63-9e93957cc22b'::uuid as room_type_id,
  (400 + generate_series)::text as number,
  CASE 
    WHEN generate_series <= 10 THEN 4
    ELSE 5
  END as floor,
  'Available' as status,
  'Clean' as housekeeping_status
FROM generate_series(1, 20);