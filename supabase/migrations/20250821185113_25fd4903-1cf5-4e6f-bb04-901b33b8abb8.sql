-- Create guests table
CREATE TABLE public.guests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  nationality TEXT,
  id_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room_types table
CREATE TABLE public.room_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  capacity_adults INTEGER NOT NULL DEFAULT 2,
  capacity_children INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  floor INTEGER,
  status TEXT NOT NULL DEFAULT 'Available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rate_plans table
CREATE TABLE public.rate_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_rates table
CREATE TABLE public.daily_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  rate_plan_id UUID NOT NULL REFERENCES public.rate_plans(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, room_type_id, rate_plan_id, date)
);

-- Create inventory table
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  allotment INTEGER NOT NULL DEFAULT 0,
  stop_sell BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, room_type_id, date)
);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  rate_plan_id UUID NOT NULL REFERENCES public.rate_plans(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Booked',
  source TEXT,
  total_price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for guests
CREATE POLICY "Users can view organization guests" 
ON public.guests 
FOR SELECT 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "Users can manage organization guests" 
ON public.guests 
FOR ALL 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

-- Create RLS policies for room_types
CREATE POLICY "Users can view organization room types" 
ON public.room_types 
FOR SELECT 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "Users can manage organization room types" 
ON public.room_types 
FOR ALL 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

-- Create RLS policies for rooms
CREATE POLICY "Users can view organization rooms" 
ON public.rooms 
FOR SELECT 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "Users can manage organization rooms" 
ON public.rooms 
FOR ALL 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

-- Create RLS policies for rate_plans
CREATE POLICY "Users can view organization rate plans" 
ON public.rate_plans 
FOR SELECT 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "Users can manage organization rate plans" 
ON public.rate_plans 
FOR ALL 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

-- Create RLS policies for daily_rates
CREATE POLICY "Users can view organization daily rates" 
ON public.daily_rates 
FOR SELECT 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "Users can manage organization daily rates" 
ON public.daily_rates 
FOR ALL 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

-- Create RLS policies for inventory
CREATE POLICY "Users can view organization inventory" 
ON public.inventory 
FOR SELECT 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "Users can manage organization inventory" 
ON public.inventory 
FOR ALL 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

-- Create RLS policies for reservations
CREATE POLICY "Users can view organization reservations" 
ON public.reservations 
FOR SELECT 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

CREATE POLICY "Users can manage organization reservations" 
ON public.reservations 
FOR ALL 
USING (hotel_id IN (
  SELECT h.id FROM public.hotels h
  JOIN public.users u ON h.org_id = u.org_id
  WHERE u.auth_user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_guests_updated_at
BEFORE UPDATE ON public.guests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate reservation codes
CREATE OR REPLACE FUNCTION public.generate_reservation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'RES' || LPAD(EXTRACT(epoch FROM now())::text, 10, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic reservation code generation
CREATE TRIGGER generate_reservation_code_trigger
BEFORE INSERT ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.generate_reservation_code();