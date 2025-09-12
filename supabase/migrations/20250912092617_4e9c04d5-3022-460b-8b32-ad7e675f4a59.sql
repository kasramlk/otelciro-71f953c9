-- First, create a unique constraint on room_inventory table
ALTER TABLE room_inventory 
ADD CONSTRAINT room_inventory_unique_hotel_room_date 
UNIQUE (hotel_id, room_type_id, date);

-- Now populate room_inventory table with default data for existing room types
WITH room_type_data AS (
  SELECT 
    rt.id as room_type_id,
    rt.hotel_id,
    COUNT(r.id) as physical_room_count
  FROM room_types rt
  LEFT JOIN rooms r ON r.room_type_id = rt.id
  GROUP BY rt.id, rt.hotel_id
),
date_series AS (
  SELECT generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '365 days',
    INTERVAL '1 day'
  )::date as inventory_date
)
INSERT INTO room_inventory (
  hotel_id,
  room_type_id,
  date,
  allotment,
  min_stay,
  max_stay,
  closed_to_arrival,
  closed_to_departure,
  stop_sell
)
SELECT 
  rtd.hotel_id,
  rtd.room_type_id,
  ds.inventory_date,
  GREATEST(rtd.physical_room_count, 1) as allotment, -- At least 1 room even if no physical rooms
  1 as min_stay,
  30 as max_stay,
  false as closed_to_arrival,
  false as closed_to_departure,
  false as stop_sell
FROM room_type_data rtd
CROSS JOIN date_series ds
ON CONFLICT (hotel_id, room_type_id, date) DO NOTHING;