-- Fix RLS security issues and add missing schema

-- Create missing tables first
CREATE TABLE public.staff (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    org_id UUID NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    hire_date DATE DEFAULT CURRENT_DATE,
    hourly_rate NUMERIC,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.room_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
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

CREATE TABLE public.rooms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
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

-- Update reservations table to add missing columns
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS room_type_id UUID REFERENCES room_types(id),
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id),
ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Direct';

-- Enable RLS on all tables
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for staff
CREATE POLICY "staff_rw" ON public.staff
FOR ALL USING (org_id IN (
    SELECT users.org_id FROM users
    WHERE users.auth_user_id = auth.uid()
));

-- Create RLS policies for room_types  
CREATE POLICY "room_types_rw" ON public.room_types
FOR ALL USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
));

-- Create RLS policies for rooms
CREATE POLICY "rooms_rw" ON public.rooms
FOR ALL USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
));

-- Create RLS policies for reservations
CREATE POLICY "reservations_rw" ON public.reservations
FOR ALL USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
));

-- Add indexes for performance
CREATE INDEX idx_staff_hotel ON public.staff(hotel_id);
CREATE INDEX idx_room_types_hotel ON public.room_types(hotel_id);
CREATE INDEX idx_rooms_hotel ON public.rooms(hotel_id);
CREATE INDEX idx_reservations_hotel ON public.reservations(hotel_id);
CREATE INDEX idx_reservations_dates ON public.reservations(check_in, check_out);

-- Create triggers for timestamps
CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON public.staff
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_room_types_updated_at
    BEFORE UPDATE ON public.room_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for demonstration
INSERT INTO room_types (hotel_id, name, code, capacity_adults, base_rate)
SELECT id, 'Standard Room', 'STD', 2, 150.00 FROM hotels LIMIT 1;

INSERT INTO room_types (hotel_id, name, code, capacity_adults, base_rate)  
SELECT id, 'Deluxe Room', 'DLX', 2, 250.00 FROM hotels LIMIT 1;

INSERT INTO room_types (hotel_id, name, code, capacity_adults, base_rate)
SELECT id, 'Suite', 'STE', 4, 450.00 FROM hotels LIMIT 1;