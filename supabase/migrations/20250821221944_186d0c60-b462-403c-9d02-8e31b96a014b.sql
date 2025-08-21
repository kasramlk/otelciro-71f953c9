-- Create missing tables for Front Office operations

-- Check-in logs
CREATE TABLE IF NOT EXISTS public.checkin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checked_in_by UUID REFERENCES public.users(id),
  room_id UUID REFERENCES public.rooms(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Check-out logs
CREATE TABLE IF NOT EXISTS public.checkout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  checked_out_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checked_out_by UUID REFERENCES public.users(id),
  room_id UUID REFERENCES public.rooms(id),
  final_balance NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stay extensions
CREATE TABLE IF NOT EXISTS public.stay_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  extension_type TEXT NOT NULL CHECK (extension_type IN ('early_checkin', 'late_checkout', 'extend_stay')),
  original_date DATE,
  new_date DATE,
  charge_amount NUMERIC DEFAULT 0,
  currency_id UUID REFERENCES public.currencies(id),
  approved_by UUID REFERENCES public.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- No-show logs
CREATE TABLE IF NOT EXISTS public.no_show_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  penalty_amount NUMERIC DEFAULT 0,
  currency_id UUID REFERENCES public.currencies(id),
  policy_applied TEXT,
  marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  marked_by UUID REFERENCES public.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing columns to reservations table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'reservations' AND column_name = 'status') THEN
    ALTER TABLE public.reservations ADD COLUMN status TEXT DEFAULT 'confirmed' 
    CHECK (status IN ('confirmed', 'option', 'cancelled', 'checked_in', 'checked_out', 'no_show'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'reservations' AND column_name = 'guarantee_type') THEN
    ALTER TABLE public.reservations ADD COLUMN guarantee_type TEXT DEFAULT 'guarantee'
    CHECK (guarantee_type IN ('guarantee', 'non_guarantee', 'option'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'reservations' AND column_name = 'meal_plan') THEN
    ALTER TABLE public.reservations ADD COLUMN meal_plan TEXT DEFAULT 'BB'
    CHECK (meal_plan IN ('BB', 'HB', 'FB', 'AI'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'reservations' AND column_name = 'payment_type') THEN
    ALTER TABLE public.reservations ADD COLUMN payment_type TEXT DEFAULT 'cash';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'reservations' AND column_name = 'discount_percent') THEN
    ALTER TABLE public.reservations ADD COLUMN discount_percent NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'reservations' AND column_name = 'discount_amount') THEN
    ALTER TABLE public.reservations ADD COLUMN discount_amount NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Add missing columns to guests table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'guests' AND column_name = 'dob') THEN
    ALTER TABLE public.guests ADD COLUMN dob DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'guests' AND column_name = 'id_scan_url') THEN
    ALTER TABLE public.guests ADD COLUMN id_scan_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'guests' AND column_name = 'signature_url') THEN
    ALTER TABLE public.guests ADD COLUMN signature_url TEXT;
  END IF;
END $$;

-- Add missing columns to rooms table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'rooms' AND column_name = 'status') THEN
    ALTER TABLE public.rooms ADD COLUMN status TEXT DEFAULT 'available'
    CHECK (status IN ('available', 'occupied', 'dirty', 'clean', 'out_of_order', 'maintenance'));
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.checkin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stay_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.no_show_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Front office logs access" ON public.checkin_logs
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM public.hotels h
    JOIN public.users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Front office checkout logs access" ON public.checkout_logs
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM public.hotels h
    JOIN public.users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Stay extensions access" ON public.stay_extensions
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM public.hotels h
    JOIN public.users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "No-show logs access" ON public.no_show_logs
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM public.hotels h
    JOIN public.users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Add updated_at triggers
CREATE TRIGGER update_stay_extensions_updated_at
  BEFORE UPDATE ON public.stay_extensions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();