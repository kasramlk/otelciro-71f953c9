-- Create Airbnb integration tables
CREATE TABLE public.airbnb_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  account_id TEXT NOT NULL,
  account_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending',
  sync_errors JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Airbnb listings mapping table
CREATE TABLE public.airbnb_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.airbnb_connections(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL,
  airbnb_listing_id TEXT NOT NULL,
  airbnb_listing_name TEXT,
  sync_rates BOOLEAN NOT NULL DEFAULT true,
  sync_availability BOOLEAN NOT NULL DEFAULT true,
  sync_restrictions BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(connection_id, airbnb_listing_id)
);

-- Create Airbnb sync logs table
CREATE TABLE public.airbnb_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.airbnb_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'rates', 'availability', 'restrictions', 'reservations'
  sync_direction TEXT NOT NULL, -- 'push', 'pull'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'error'
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_details JSONB,
  sync_data JSONB,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Airbnb reservations table for imported reservations
CREATE TABLE public.airbnb_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.airbnb_connections(id) ON DELETE CASCADE,
  airbnb_reservation_id TEXT NOT NULL,
  airbnb_listing_id TEXT NOT NULL,
  reservation_id UUID REFERENCES public.reservations(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL,
  airbnb_status TEXT NOT NULL,
  special_requests TEXT,
  reservation_data JSONB,
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(connection_id, airbnb_reservation_id)
);

-- Enable RLS on all tables
ALTER TABLE public.airbnb_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airbnb_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airbnb_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airbnb_reservations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for airbnb_connections
CREATE POLICY "Hotel Airbnb connections access" 
ON public.airbnb_connections 
FOR ALL 
USING (hotel_id IN (
  SELECT h.id FROM hotels h 
  JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

-- Create RLS policies for airbnb_listings
CREATE POLICY "Hotel Airbnb listings access" 
ON public.airbnb_listings 
FOR ALL 
USING (hotel_id IN (
  SELECT h.id FROM hotels h 
  JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

-- Create RLS policies for airbnb_sync_logs
CREATE POLICY "Hotel Airbnb sync logs access" 
ON public.airbnb_sync_logs 
FOR ALL 
USING (connection_id IN (
  SELECT ac.id FROM airbnb_connections ac
  JOIN hotels h ON ac.hotel_id = h.id
  JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

-- Create RLS policies for airbnb_reservations
CREATE POLICY "Hotel Airbnb reservations access" 
ON public.airbnb_reservations 
FOR ALL 
USING (connection_id IN (
  SELECT ac.id FROM airbnb_connections ac
  JOIN hotels h ON ac.hotel_id = h.id
  JOIN users u ON h.org_id = u.org_id 
  WHERE u.auth_user_id = auth.uid()
));

-- Create update triggers for updated_at columns
CREATE TRIGGER update_airbnb_connections_updated_at
  BEFORE UPDATE ON public.airbnb_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_airbnb_listings_updated_at
  BEFORE UPDATE ON public.airbnb_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_airbnb_reservations_updated_at
  BEFORE UPDATE ON public.airbnb_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_airbnb_connections_hotel_id ON public.airbnb_connections(hotel_id);
CREATE INDEX idx_airbnb_connections_account_id ON public.airbnb_connections(account_id);
CREATE INDEX idx_airbnb_listings_hotel_id ON public.airbnb_listings(hotel_id);
CREATE INDEX idx_airbnb_listings_connection_id ON public.airbnb_listings(connection_id);
CREATE INDEX idx_airbnb_listings_listing_id ON public.airbnb_listings(airbnb_listing_id);
CREATE INDEX idx_airbnb_sync_logs_connection_id ON public.airbnb_sync_logs(connection_id);
CREATE INDEX idx_airbnb_reservations_connection_id ON public.airbnb_reservations(connection_id);
CREATE INDEX idx_airbnb_reservations_airbnb_id ON public.airbnb_reservations(airbnb_reservation_id);