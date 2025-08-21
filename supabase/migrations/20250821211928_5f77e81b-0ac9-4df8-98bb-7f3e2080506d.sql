-- Add missing tables and columns for complete functionality

-- Room types table (if not exists)
CREATE TABLE IF NOT EXISTS public.room_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  base_capacity INTEGER NOT NULL DEFAULT 2,
  max_capacity INTEGER NOT NULL DEFAULT 4,
  size_sqm INTEGER,
  amenities JSONB DEFAULT '[]'::jsonb,
  base_rate NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rooms table (if not exists)  
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  room_type_id UUID NOT NULL,
  room_number TEXT NOT NULL,
  floor INTEGER,
  status TEXT NOT NULL DEFAULT 'Available',
  condition TEXT NOT NULL DEFAULT 'Clean',
  last_occupied DATE,
  out_of_order_reason TEXT,
  out_of_order_from DATE,
  out_of_order_until DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, room_number)
);

-- Add missing columns to reservations
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS room_id UUID,
ADD COLUMN IF NOT EXISTS actual_checkin_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_checkout_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS folio_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pre_auth_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Credit Card',
ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Folio charges/payments table
CREATE TABLE IF NOT EXISTS public.folio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL,
  hotel_id UUID NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  item_type TEXT NOT NULL CHECK (item_type IN ('Charge', 'Payment', 'Tax', 'Fee')),
  category TEXT NOT NULL DEFAULT 'Room',
  posted_by UUID,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  voided_at TIMESTAMP WITH TIME ZONE,
  voided_by UUID,
  void_reason TEXT,
  split_folio TEXT DEFAULT 'Guest',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  guest_id UUID NOT NULL,
  room_type_id UUID NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Out of order/service log
CREATE TABLE IF NOT EXISTS public.room_status_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  hotel_id UUID NOT NULL,
  status TEXT NOT NULL,
  reason TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  priority TEXT NOT NULL DEFAULT 'Medium',
  assigned_to UUID,
  created_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Export requests tracking
CREATE TABLE IF NOT EXISTS public.export_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  user_id UUID NOT NULL,
  export_type TEXT NOT NULL,
  format TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Processing',
  file_url TEXT,
  filters JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Enable RLS on all new tables
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "room_types_rw" ON public.room_types FOR ALL USING (
  hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
);

CREATE POLICY "rooms_rw" ON public.rooms FOR ALL USING (
  hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
);

CREATE POLICY "folio_items_rw" ON public.folio_items FOR ALL USING (
  hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
);

CREATE POLICY "waitlist_rw" ON public.waitlist FOR ALL USING (
  hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
);

CREATE POLICY "room_status_log_rw" ON public.room_status_log FOR ALL USING (
  hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
);

CREATE POLICY "export_requests_rw" ON public.export_requests FOR ALL USING (
  hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_types_hotel_id ON public.room_types(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON public.rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_type_id ON public.rooms(room_type_id);
CREATE INDEX IF NOT EXISTS idx_folio_items_reservation_id ON public.folio_items(reservation_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_hotel_id ON public.waitlist(hotel_id);
CREATE INDEX IF NOT EXISTS idx_room_status_log_room_id ON public.room_status_log(room_id);

-- Add triggers for updated_at
CREATE TRIGGER update_room_types_updated_at BEFORE UPDATE ON public.room_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms  
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();