-- Create additional tables needed for comprehensive reservation management

-- Create folio_items table for detailed charges
CREATE TABLE IF NOT EXISTS public.folio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  item_type TEXT NOT NULL DEFAULT 'charge',
  category TEXT NOT NULL DEFAULT 'accommodation',
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  posted_by UUID REFERENCES public.users(id),
  split_folio TEXT DEFAULT 'guest',
  split_percentage NUMERIC DEFAULT 100,
  is_voided BOOLEAN DEFAULT false,
  voided_at TIMESTAMP WITH TIME ZONE,
  voided_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table for file uploads
CREATE TABLE IF NOT EXISTS public.reservation_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL DEFAULT 'passport',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room_types table if not exists
CREATE TABLE IF NOT EXISTS public.room_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  max_occupancy INTEGER NOT NULL DEFAULT 2,
  max_adults INTEGER NOT NULL DEFAULT 2,
  max_children INTEGER NOT NULL DEFAULT 0,
  base_rate NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  amenities JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rooms table if not exists
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id),
  room_number TEXT NOT NULL,
  floor INTEGER,
  status TEXT NOT NULL DEFAULT 'clean',
  is_active BOOLEAN DEFAULT true,
  last_cleaned TIMESTAMP WITH TIME ZONE,
  maintenance_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing columns to reservations table
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS group_name TEXT,
ADD COLUMN IF NOT EXISTS meal_plan TEXT DEFAULT 'BB',
ADD COLUMN IF NOT EXISTS guarantee_type TEXT DEFAULT 'guarantee',
ADD COLUMN IF NOT EXISTS option_date DATE,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id),
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS special_requests TEXT[],
ADD COLUMN IF NOT EXISTS arrival_time TIME,
ADD COLUMN IF NOT EXISTS departure_time TIME,
ADD COLUMN IF NOT EXISTS infants INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.folio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "folio_items_rw" ON public.folio_items
FOR ALL USING (
  reservation_id IN (
    SELECT r.id FROM public.reservations r
    JOIN public.hotels h ON r.hotel_id = h.id
    JOIN public.users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "documents_rw" ON public.reservation_documents
FOR ALL USING (
  reservation_id IN (
    SELECT r.id FROM public.reservations r
    JOIN public.hotels h ON r.hotel_id = h.id
    JOIN public.users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "room_types_rw" ON public.room_types
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM public.hotels h
    JOIN public.users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "rooms_rw" ON public.rooms
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM public.hotels h
    JOIN public.users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_folio_items_updated_at
  BEFORE UPDATE ON public.folio_items
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

-- Insert sample room types if none exist
INSERT INTO public.room_types (hotel_id, name, code, max_occupancy, max_adults, max_children, base_rate)
SELECT h.id, 'Standard Room', 'STD', 2, 2, 1, 150.00
FROM public.hotels h
WHERE NOT EXISTS (SELECT 1 FROM public.room_types WHERE hotel_id = h.id)
LIMIT 1;

INSERT INTO public.room_types (hotel_id, name, code, max_occupancy, max_adults, max_children, base_rate)  
SELECT h.id, 'Deluxe Room', 'DLX', 3, 2, 2, 200.00
FROM public.hotels h
WHERE NOT EXISTS (SELECT 1 FROM public.room_types WHERE hotel_id = h.id AND code = 'DLX')
LIMIT 1;

-- Insert sample rooms if none exist
INSERT INTO public.rooms (hotel_id, room_type_id, room_number, floor)
SELECT h.id, rt.id, '101', 1
FROM public.hotels h
JOIN public.room_types rt ON rt.hotel_id = h.id
WHERE NOT EXISTS (SELECT 1 FROM public.rooms WHERE hotel_id = h.id)
LIMIT 5;