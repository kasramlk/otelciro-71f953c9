-- Add missing columns to rate_plans to match trigger expectations
ALTER TABLE rate_plans ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create default rate plans with correct schema
INSERT INTO rate_plans (
  hotel_id,
  name,
  code,
  description,
  currency,
  is_active
) VALUES 
(
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e',
  'Standard Rate',
  'STD',
  'Standard room rate with basic amenities',
  'USD',
  true
),
(
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e',
  'Breakfast Included',
  'BB',
  'Room rate including continental breakfast',
  'USD',
  true
),
(
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e',
  'Non-Refundable',
  'NR',
  'Best rate with non-refundable policy',
  'USD',
  true
)
ON CONFLICT (hotel_id, code) DO NOTHING;

-- Create inventory records for next 365 days
INSERT INTO inventory (
  hotel_id,
  room_type_id,
  date,
  allotment,
  stop_sell
)
SELECT 
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'::uuid,
  'de7df96a-10c1-40c9-a6ad-67907d38222e'::uuid, -- Standard Room
  (CURRENT_DATE + generate_series * INTERVAL '1 day')::date,
  30, -- 30 standard rooms allotment
  false
FROM generate_series(0, 364)
ON CONFLICT (hotel_id, room_type_id, date) DO NOTHING;

INSERT INTO inventory (
  hotel_id,
  room_type_id,
  date,
  allotment,
  stop_sell
)
SELECT 
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'::uuid,
  'f6532ea0-2ce9-4b9d-8a63-9e93957cc22b'::uuid, -- Deluxe Suite
  (CURRENT_DATE + generate_series * INTERVAL '1 day')::date,
  20, -- 20 deluxe suites allotment
  false
FROM generate_series(0, 364)
ON CONFLICT (hotel_id, room_type_id, date) DO NOTHING;

-- Create daily rates for all combinations
INSERT INTO daily_rates (
  hotel_id,
  room_type_id,
  rate_plan_id,
  date,
  rate
)
SELECT 
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'::uuid,
  rt.id,
  rp.id,
  (CURRENT_DATE + gs.day_offset * INTERVAL '1 day')::date,
  CASE 
    WHEN rt.name = 'Standard Room' AND rp.code = 'STD' THEN 120.00
    WHEN rt.name = 'Standard Room' AND rp.code = 'BB' THEN 150.00
    WHEN rt.name = 'Standard Room' AND rp.code = 'NR' THEN 100.00
    WHEN rt.name = 'Deluxe Suite' AND rp.code = 'STD' THEN 180.00
    WHEN rt.name = 'Deluxe Suite' AND rp.code = 'BB' THEN 210.00
    WHEN rt.name = 'Deluxe Suite' AND rp.code = 'NR' THEN 160.00
    ELSE 120.00
  END as rate
FROM 
  room_types rt
  CROSS JOIN rate_plans rp
  CROSS JOIN generate_series(0, 364) as gs(day_offset)
WHERE 
  rt.hotel_id = '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'
  AND rp.hotel_id = '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'
ON CONFLICT (hotel_id, room_type_id, rate_plan_id, date) DO NOTHING;