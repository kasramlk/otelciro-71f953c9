-- Fix database schema inconsistencies and add missing tables (fixed version)

-- First, let's ensure we have the agencies table
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'OTA',
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure guests table exists properly
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  nationality TEXT,
  passport_number TEXT,
  vip_status BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure rate_plans table exists
CREATE TABLE IF NOT EXISTS public.rate_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Standardize on 'inventory' table - add missing columns
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS allotment INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stay INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_stay INTEGER,
ADD COLUMN IF NOT EXISTS closed_to_arrival BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS closed_to_departure BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stop_sell BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Enable RLS on tables
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing agencies policy if it exists (to fix infinite recursion)
DROP POLICY IF EXISTS "agencies_org_access" ON public.agencies;

-- Create correct RLS policies for agencies (fixed recursion)
CREATE POLICY "agencies_org_access" ON public.agencies
FOR ALL USING (org_id = get_user_org_id());

-- Create RLS policies for guests
DROP POLICY IF EXISTS "guests_rw" ON public.guests;
CREATE POLICY "guests_rw" ON public.guests
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h 
  JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

-- Create RLS policies for rate_plans
DROP POLICY IF EXISTS "rate_plans_rw" ON public.rate_plans;
CREATE POLICY "rate_plans_rw" ON public.rate_plans
FOR ALL USING (hotel_id IN (
  SELECT h.id FROM hotels h 
  JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

-- Add inventory reduction trigger for reservations
CREATE OR REPLACE FUNCTION reduce_inventory_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only reduce inventory for new confirmed reservations
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    -- Check if we have enough inventory for each day
    DECLARE
      check_date DATE;
      current_inventory INTEGER;
    BEGIN
      check_date := NEW.check_in;
      WHILE check_date < NEW.check_out LOOP
        SELECT allotment INTO current_inventory
        FROM inventory 
        WHERE hotel_id = NEW.hotel_id 
          AND room_type_id = NEW.room_type_id 
          AND date = check_date;
        
        IF current_inventory IS NULL OR current_inventory < 1 THEN
          RAISE EXCEPTION 'Insufficient inventory for date %', check_date;
        END IF;
        
        -- Reduce inventory by 1
        UPDATE inventory 
        SET allotment = allotment - 1
        WHERE hotel_id = NEW.hotel_id 
          AND room_type_id = NEW.room_type_id 
          AND date = check_date;
          
        check_date := check_date + INTERVAL '1 day';
      END LOOP;
    END;
  END IF;
  
  -- Restore inventory when reservation is cancelled
  IF OLD IS NOT NULL AND OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
    DECLARE
      check_date DATE;
    BEGIN
      check_date := OLD.check_in;
      WHILE check_date < OLD.check_out LOOP
        UPDATE inventory 
        SET allotment = allotment + 1
        WHERE hotel_id = OLD.hotel_id 
          AND room_type_id = OLD.room_type_id 
          AND date = check_date;
          
        check_date := check_date + INTERVAL '1 day';
      END LOOP;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_reduce_inventory_on_booking ON reservations;
CREATE TRIGGER trigger_reduce_inventory_on_booking
AFTER INSERT OR UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION reduce_inventory_on_booking();