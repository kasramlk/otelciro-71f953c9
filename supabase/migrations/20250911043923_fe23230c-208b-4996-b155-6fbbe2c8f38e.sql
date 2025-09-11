-- Initialize missing data for proper hotel onboarding
-- This migration creates default rate plans, inventory, and daily rates for existing room types

-- Create default rate plans for hotel 6163aacb-81d7-4eb2-ab68-4d3e172bef3e
INSERT INTO rate_plans (
  id,
  hotel_id,
  name,
  description,
  rate_type,
  currency,
  base_rate,
  is_active,
  includes_breakfast,
  includes_tax,
  tax_rate,
  created_at
) VALUES 
(
  gen_random_uuid(),
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e',
  'Standard Rate',
  'Standard room rate with basic amenities',
  'standard',
  'USD',
  120.00,
  true,
  false,
  false,
  10.0,
  now()
),
(
  gen_random_uuid(),
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e',
  'Breakfast Included',
  'Room rate including continental breakfast',
  'package',
  'USD',
  150.00,
  true,
  true,
  false,
  10.0,
  now()
),
(
  gen_random_uuid(),
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e',
  'Non-Refundable',
  'Best rate with non-refundable policy',
  'promotional',
  'USD',
  100.00,
  true,
  false,
  false,
  10.0,
  now()
);

-- Create inventory records for the next 365 days for both room types
-- Standard Room inventory (30 rooms)
INSERT INTO inventory (
  hotel_id,
  room_type_id,
  date,
  allotment,
  available,
  stop_sell,
  min_stay,
  max_stay,
  cta,
  ctd
)
SELECT 
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'::uuid,
  'de7df96a-10c1-40c9-a6ad-67907d38222e'::uuid, -- Standard Room type ID
  (CURRENT_DATE + generate_series * INTERVAL '1 day')::date,
  30, -- 30 standard rooms available
  30,
  false,
  1,
  null,
  false,
  false
FROM generate_series(0, 364);

-- Deluxe Suite inventory (20 rooms)
INSERT INTO inventory (
  hotel_id,
  room_type_id,
  date,
  allotment,
  available,
  stop_sell,
  min_stay,
  max_stay,
  cta,
  ctd
)
SELECT 
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'::uuid,
  'f6532ea0-2ce9-4b9d-8a63-9e93957cc22b'::uuid, -- Deluxe Suite type ID
  (CURRENT_DATE + generate_series * INTERVAL '1 day')::date,
  20, -- 20 deluxe suites available
  20,
  false,
  1,
  null,
  false,
  false
FROM generate_series(0, 364);

-- Create daily rates for all combinations of rate plans and room types
-- This uses seasonal and weekend pricing logic

-- Function to get seasonal multiplier
CREATE OR REPLACE FUNCTION get_seasonal_multiplier(target_date date) 
RETURNS decimal AS $$
BEGIN
  -- High season: December, January, July, August (30% increase)
  IF EXTRACT(month FROM target_date) IN (12, 1, 7, 8) THEN
    RETURN 1.3;
  -- Medium season: June, September, November (10% increase)  
  ELSIF EXTRACT(month FROM target_date) IN (6, 9, 11) THEN
    RETURN 1.1;
  -- Low season: rest of the year
  ELSE
    RETURN 1.0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get weekend multiplier
CREATE OR REPLACE FUNCTION get_weekend_multiplier(target_date date)
RETURNS decimal AS $$
BEGIN
  -- Weekend rates (Friday, Saturday) - 20% increase
  IF EXTRACT(dow FROM target_date) IN (5, 6) THEN
    RETURN 1.2;
  ELSE
    RETURN 1.0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create daily rates for Standard Rooms
INSERT INTO daily_rates (
  hotel_id,
  room_type_id,
  rate_plan_id,
  date,
  rate
)
SELECT 
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'::uuid,
  'de7df96a-10c1-40c9-a6ad-67907d38222e'::uuid, -- Standard Room
  rp.id,
  (CURRENT_DATE + gs.day_offset * INTERVAL '1 day')::date,
  ROUND(
    (rp.base_rate + 0.00) * -- Standard room base rate (no room type adjustment)
    get_seasonal_multiplier((CURRENT_DATE + gs.day_offset * INTERVAL '1 day')::date) *
    get_weekend_multiplier((CURRENT_DATE + gs.day_offset * INTERVAL '1 day')::date)
    , 2
  ) as calculated_rate
FROM 
  rate_plans rp,
  generate_series(0, 364) as gs(day_offset)
WHERE 
  rp.hotel_id = '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'
ON CONFLICT (hotel_id, room_type_id, rate_plan_id, date) DO NOTHING;

-- Create daily rates for Deluxe Suites (25% premium over standard)
INSERT INTO daily_rates (
  hotel_id,
  room_type_id,
  rate_plan_id,
  date,
  rate
)
SELECT 
  '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'::uuid,
  'f6532ea0-2ce9-4b9d-8a63-9e93957cc22b'::uuid, -- Deluxe Suite
  rp.id,
  (CURRENT_DATE + gs.day_offset * INTERVAL '1 day')::date,
  ROUND(
    (rp.base_rate + 50.00) * -- Deluxe suite premium ($50 extra)
    get_seasonal_multiplier((CURRENT_DATE + gs.day_offset * INTERVAL '1 day')::date) *
    get_weekend_multiplier((CURRENT_DATE + gs.day_offset * INTERVAL '1 day')::date)
    , 2
  ) as calculated_rate
FROM 
  rate_plans rp,
  generate_series(0, 364) as gs(day_offset)
WHERE 
  rp.hotel_id = '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'
ON CONFLICT (hotel_id, room_type_id, rate_plan_id, date) DO NOTHING;

-- Clean up helper functions
DROP FUNCTION IF EXISTS get_seasonal_multiplier(date);
DROP FUNCTION IF EXISTS get_weekend_multiplier(date);

-- Update room types with proper base rates
UPDATE room_types 
SET base_rate = CASE 
  WHEN name = 'Standard Room' THEN 120.00
  WHEN name = 'Deluxe Suite' THEN 170.00
  ELSE base_rate
END
WHERE hotel_id = '6163aacb-81d7-4eb2-ab68-4d3e172bef3e';