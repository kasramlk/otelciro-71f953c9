-- Fix infinite recursion in RLS policies and add missing schema

-- Create security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create security definer function to check if user belongs to hotel org
CREATE OR REPLACE FUNCTION public.user_belongs_to_hotel(hotel_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM hotels h
    WHERE h.id = hotel_uuid
    AND h.org_id = public.get_user_org_id()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop existing problematic policies and recreate them safely
DROP POLICY IF EXISTS "hotels_select" ON public.hotels;
DROP POLICY IF EXISTS "hotels_update" ON public.hotels;

CREATE POLICY "hotels_select" ON public.hotels
FOR SELECT USING (org_id = public.get_user_org_id());

CREATE POLICY "hotels_update" ON public.hotels  
FOR UPDATE USING (org_id = public.get_user_org_id());

-- Add missing columns to reservations if they don't exist
DO $$
BEGIN
    -- Add room_type_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'room_type_id') THEN
        ALTER TABLE public.reservations ADD COLUMN room_type_id UUID;
    END IF;
    
    -- Add room_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'room_id') THEN
        ALTER TABLE public.reservations ADD COLUMN room_id UUID;
    END IF;
    
    -- Add total_amount if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'total_amount') THEN
        ALTER TABLE public.reservations ADD COLUMN total_amount NUMERIC DEFAULT 0;
    END IF;
    
    -- Add source if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'source') THEN
        ALTER TABLE public.reservations ADD COLUMN source TEXT DEFAULT 'Direct';
    END IF;
END $$;

-- Create room_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.room_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id UUID NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    capacity_adults INTEGER NOT NULL DEFAULT 2,
    capacity_children INTEGER DEFAULT 0,
    base_rate NUMERIC NOT NULL DEFAULT 0,
    amenities JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(hotel_id, code)
);

-- Create rooms table if it doesn't exist  
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id UUID NOT NULL,
    room_type_id UUID,
    number TEXT NOT NULL,
    floor INTEGER,
    status TEXT NOT NULL DEFAULT 'clean' CHECK (status IN ('clean', 'dirty', 'out_of_order', 'maintenance')),
    features JSONB DEFAULT '[]',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(hotel_id, number)
);

-- Enable RLS on new tables
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create safe RLS policies using security definer functions
CREATE POLICY "room_types_rw" ON public.room_types
FOR ALL USING (public.user_belongs_to_hotel(hotel_id));

CREATE POLICY "rooms_rw" ON public.rooms
FOR ALL USING (public.user_belongs_to_hotel(hotel_id));

-- Update reservations RLS policy
DROP POLICY IF EXISTS "reservations_rw" ON public.reservations;
CREATE POLICY "reservations_rw" ON public.reservations
FOR ALL USING (public.user_belongs_to_hotel(hotel_id));