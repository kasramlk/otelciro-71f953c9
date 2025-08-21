-- ============= COMPLETE HOTEL PMS DATABASE EXTENSIONS =============

-- 1. COMPANIES & CORPORATE BILLING
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  tax_id TEXT,
  credit_limit NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. CURRENCIES & EXCHANGE RATES
CREATE TABLE IF NOT EXISTS public.currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_places INTEGER DEFAULT 2,
  is_base BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_currency, to_currency, date)
);

-- 3. GROUP RESERVATIONS & ROOM BLOCKS
CREATE TABLE IF NOT EXISTS public.reservation_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  name TEXT NOT NULL,
  group_code TEXT NOT NULL,
  group_type TEXT NOT NULL DEFAULT 'Wedding', -- Wedding, Conference, Tour, Corporate
  organizer_name TEXT,
  organizer_email TEXT,
  organizer_phone TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  room_block_size INTEGER NOT NULL DEFAULT 0,
  rooms_picked_up INTEGER DEFAULT 0,
  group_rate NUMERIC,
  cutoff_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Active', -- Active, Confirmed, Cancelled
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, group_code)
);

-- 4. PROMOTIONS & PACKAGES  
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  promotion_type TEXT NOT NULL DEFAULT 'Percentage', -- Percentage, FixedAmount, Package
  discount_value NUMERIC NOT NULL,
  min_nights INTEGER DEFAULT 1,
  max_nights INTEGER,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  advance_booking_days INTEGER DEFAULT 0,
  room_types TEXT[], -- Array of room type IDs
  blackout_dates DATE[],
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, code)
);

-- 5. CHANNEL MANAGER INTEGRATION
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  name TEXT NOT NULL,
  channel_type TEXT NOT NULL DEFAULT 'OTA', -- OTA, Direct, Corporate, Agency, GDS
  api_endpoint TEXT,
  api_key TEXT,
  username TEXT,
  password TEXT,
  commission_rate NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'Pending', -- Pending, Success, Error
  sync_errors JSONB,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. ROOM OUT OF ORDER/SERVICE MANAGEMENT
CREATE TABLE IF NOT EXISTS public.room_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  maintenance_type TEXT NOT NULL DEFAULT 'OOO', -- OOO (Out of Order), OOS (Out of Service), Maintenance
  reason TEXT NOT NULL,
  description TEXT,
  reported_by UUID,
  assigned_to UUID,
  priority TEXT DEFAULT 'Medium', -- Low, Medium, High, Critical
  status TEXT DEFAULT 'Open', -- Open, In Progress, Completed, Cancelled
  start_date DATE NOT NULL,
  end_date DATE,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  actual_completion TIMESTAMP WITH TIME ZONE,
  cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. GUEST PROFILES & PREFERENCES
CREATE TABLE IF NOT EXISTS public.guest_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID NOT NULL UNIQUE,
  loyalty_tier TEXT DEFAULT 'Standard', -- Standard, Silver, Gold, Platinum
  loyalty_points INTEGER DEFAULT 0,
  preferences JSONB, -- Room preferences, dietary restrictions, etc.
  special_requests TEXT[],
  blacklist_flag BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  vip_status BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  communication_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. WAITLIST FOR OVERBOOKING
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  guest_id UUID NOT NULL,
  room_type_id UUID NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 1, -- Higher number = higher priority
  status TEXT DEFAULT 'Active', -- Active, Confirmed, Cancelled, Expired
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. SPLIT FOLIO SUPPORT
ALTER TABLE public.reservation_charges 
ADD COLUMN IF NOT EXISTS folio_split TEXT DEFAULT 'Guest', -- Guest, Company, Group
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS split_percentage NUMERIC DEFAULT 100;

-- 10. RESERVATION ENHANCEMENTS
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS group_id UUID,
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS promotion_id UUID,
ADD COLUMN IF NOT EXISTS channel_id UUID,
ADD COLUMN IF NOT EXISTS booking_reference TEXT,
ADD COLUMN IF NOT EXISTS confirmation_number TEXT,
ADD COLUMN IF NOT EXISTS special_requests TEXT[],
ADD COLUMN IF NOT EXISTS arrival_time TIME,
ADD COLUMN IF NOT EXISTS departure_time TIME,
ADD COLUMN IF NOT EXISTS is_group_master BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash',
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_due NUMERIC DEFAULT 0;

-- Insert default currencies
INSERT INTO public.currencies (code, name, symbol, is_base, is_active) VALUES 
('USD', 'US Dollar', '$', true, true),
('EUR', 'Euro', '€', false, true),
('GBP', 'British Pound', '£', false, true),
('JPY', 'Japanese Yen', '¥', false, true),
('CAD', 'Canadian Dollar', 'C$', false, true),
('AUD', 'Australian Dollar', 'A$', false, true)
ON CONFLICT (code) DO NOTHING;

-- Insert sample exchange rates (today's rates)
INSERT INTO public.exchange_rates (from_currency, to_currency, rate, date) VALUES 
('USD', 'EUR', 0.85, CURRENT_DATE),
('USD', 'GBP', 0.73, CURRENT_DATE),
('USD', 'JPY', 110.50, CURRENT_DATE),
('USD', 'CAD', 1.25, CURRENT_DATE),
('USD', 'AUD', 1.35, CURRENT_DATE)
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "companies_rw" ON public.companies FOR ALL USING (
  org_id IN (SELECT org_id FROM users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "currencies_read" ON public.currencies FOR SELECT USING (true);
CREATE POLICY "exchange_rates_read" ON public.exchange_rates FOR SELECT USING (true);

CREATE POLICY "reservation_groups_rw" ON public.reservation_groups FOR ALL USING (
  hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
);

CREATE POLICY "promotions_rw" ON public.promotions FOR ALL USING (
  hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
);

CREATE POLICY "channels_rw" ON public.channels FOR ALL USING (
  hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
);

CREATE POLICY "room_maintenance_rw" ON public.room_maintenance FOR ALL USING (
  room_id IN (SELECT r.id FROM rooms r JOIN hotels h ON r.hotel_id = h.id JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
);

CREATE POLICY "guest_profiles_rw" ON public.guest_profiles FOR ALL USING (
  guest_id IN (SELECT g.id FROM guests g JOIN hotels h ON g.hotel_id = h.id JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
);

CREATE POLICY "waitlist_rw" ON public.waitlist FOR ALL USING (
  hotel_id IN (SELECT h.id FROM hotels h JOIN users u ON h.org_id = u.org_id WHERE u.auth_user_id = auth.uid())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_org_id ON public.companies(org_id);
CREATE INDEX IF NOT EXISTS idx_reservation_groups_hotel_id ON public.reservation_groups(hotel_id);
CREATE INDEX IF NOT EXISTS idx_promotions_hotel_id ON public.promotions(hotel_id);
CREATE INDEX IF NOT EXISTS idx_channels_hotel_id ON public.channels(hotel_id);
CREATE INDEX IF NOT EXISTS idx_room_maintenance_room_id ON public.room_maintenance(room_id);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_guest_id ON public.guest_profiles(guest_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_hotel_id ON public.waitlist(hotel_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON public.exchange_rates(date);

-- Update triggers for timestamps
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reservation_groups_updated_at BEFORE UPDATE ON public.reservation_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_room_maintenance_updated_at BEFORE UPDATE ON public.room_maintenance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_guest_profiles_updated_at BEFORE UPDATE ON public.guest_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON public.waitlist FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();