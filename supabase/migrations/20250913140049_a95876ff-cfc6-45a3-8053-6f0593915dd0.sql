-- Add missing inventory data for existing hotels to make the system work

-- First, let's create some default inventory for the existing hotels
-- Insert default inventory for the next 365 days for existing room types

INSERT INTO public.inventory (hotel_id, room_type_id, date, allotment, stop_sell, created_at, updated_at)
SELECT 
    rt.hotel_id,
    rt.id as room_type_id,
    d.date,
    CASE 
        WHEN rt.name ILIKE '%suite%' OR rt.name ILIKE '%premium%' THEN 5
        ELSE 10
    END as allotment,
    false as stop_sell,
    now() as created_at,
    now() as updated_at
FROM 
    room_types rt
CROSS JOIN (
    SELECT generate_series(
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '365 days',
        '1 day'::interval
    )::date as date
) d
WHERE NOT EXISTS (
    SELECT 1 FROM inventory i 
    WHERE i.hotel_id = rt.hotel_id 
    AND i.room_type_id = rt.id 
    AND i.date = d.date
);

-- Insert default daily rates for the next 365 days
INSERT INTO public.daily_rates (hotel_id, room_type_id, rate_plan_id, date, rate, created_at)
SELECT 
    rt.hotel_id,
    rt.id as room_type_id,
    rp.id as rate_plan_id,
    d.date,
    CASE 
        WHEN rt.name ILIKE '%suite%' OR rt.name ILIKE '%premium%' THEN 300
        WHEN rt.name ILIKE '%deluxe%' THEN 200
        ELSE 150
    END as rate,
    now() as created_at
FROM 
    room_types rt
CROSS JOIN (
    SELECT generate_series(
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '365 days',
        '1 day'::interval
    )::date as date
) d
JOIN rate_plans rp ON rp.hotel_id = rt.hotel_id AND rp.is_active = true
WHERE NOT EXISTS (
    SELECT 1 FROM daily_rates dr 
    WHERE dr.hotel_id = rt.hotel_id 
    AND dr.room_type_id = rt.id 
    AND dr.rate_plan_id = rp.id
    AND dr.date = d.date
);