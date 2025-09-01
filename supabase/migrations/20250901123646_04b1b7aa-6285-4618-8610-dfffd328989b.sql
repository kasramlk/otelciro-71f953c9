-- Create channels table for storing channel configurations
CREATE TABLE public.channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id uuid NOT NULL,
  channel_name text NOT NULL,
  channel_type text NOT NULL, -- 'OTA', 'GDS', 'Direct', 'Metasearch'
  api_endpoint text,
  api_credentials jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  sync_enabled boolean DEFAULT false,
  last_sync_at timestamp with time zone,
  sync_frequency integer DEFAULT 3600, -- seconds
  settings jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create channel_mappings table for room type mappings
CREATE TABLE public.channel_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL,
  hotel_room_type_id uuid NOT NULL,
  channel_room_type_id text NOT NULL,
  channel_room_type_name text,
  mapping_config jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create channel_rates table for rate management
CREATE TABLE public.channel_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL,
  mapping_id uuid NOT NULL,
  date date NOT NULL,
  rate numeric NOT NULL,
  currency text DEFAULT 'USD',
  rate_plan_name text,
  pushed_at timestamp with time zone,
  push_status text DEFAULT 'pending', -- 'pending', 'success', 'failed'
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create channel_inventory table for availability tracking
CREATE TABLE public.channel_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL,
  mapping_id uuid NOT NULL,
  date date NOT NULL,
  available_rooms integer NOT NULL DEFAULT 0,
  stop_sell boolean DEFAULT false,
  pushed_at timestamp with time zone,
  push_status text DEFAULT 'pending',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create channel_reservations table for imported reservations
CREATE TABLE public.channel_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL,
  channel_reservation_id text NOT NULL,
  hotel_id uuid NOT NULL,
  guest_name text NOT NULL,
  guest_email text,
  guest_phone text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  adults integer DEFAULT 1,
  children integer DEFAULT 0,
  room_type text,
  total_amount numeric,
  currency text DEFAULT 'USD',
  commission_rate numeric,
  commission_amount numeric,
  status text DEFAULT 'confirmed',
  special_requests text,
  imported_at timestamp with time zone NOT NULL DEFAULT now(),
  pms_reservation_id uuid, -- Link to local reservation if created
  sync_status text DEFAULT 'pending', -- 'pending', 'synced', 'conflict'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create channel_sync_logs table for tracking operations
CREATE TABLE public.channel_sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL,
  sync_type text NOT NULL, -- 'rates', 'inventory', 'reservations'
  operation text NOT NULL, -- 'push', 'pull'
  status text NOT NULL, -- 'success', 'failed', 'partial'
  records_processed integer DEFAULT 0,
  records_success integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  start_time timestamp with time zone NOT NULL DEFAULT now(),
  end_time timestamp with time zone,
  error_details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for channels
CREATE POLICY "channels_rw" ON public.channels 
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h 
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create RLS policies for channel_mappings
CREATE POLICY "channel_mappings_rw" ON public.channel_mappings 
FOR ALL USING (
  channel_id IN (
    SELECT c.id FROM channels c 
    JOIN hotels h ON c.hotel_id = h.id 
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create RLS policies for channel_rates
CREATE POLICY "channel_rates_rw" ON public.channel_rates 
FOR ALL USING (
  channel_id IN (
    SELECT c.id FROM channels c 
    JOIN hotels h ON c.hotel_id = h.id 
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create RLS policies for channel_inventory
CREATE POLICY "channel_inventory_rw" ON public.channel_inventory 
FOR ALL USING (
  channel_id IN (
    SELECT c.id FROM channels c 
    JOIN hotels h ON c.hotel_id = h.id 
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create RLS policies for channel_reservations
CREATE POLICY "channel_reservations_rw" ON public.channel_reservations 
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h 
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create RLS policies for channel_sync_logs
CREATE POLICY "channel_sync_logs_rw" ON public.channel_sync_logs 
FOR ALL USING (
  channel_id IN (
    SELECT c.id FROM channels c 
    JOIN hotels h ON c.hotel_id = h.id 
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_channels_hotel_id ON public.channels(hotel_id);
CREATE INDEX idx_channel_mappings_channel_id ON public.channel_mappings(channel_id);
CREATE INDEX idx_channel_rates_channel_date ON public.channel_rates(channel_id, date);
CREATE INDEX idx_channel_inventory_channel_date ON public.channel_inventory(channel_id, date);
CREATE INDEX idx_channel_reservations_hotel_id ON public.channel_reservations(hotel_id);
CREATE INDEX idx_channel_reservations_channel_id ON public.channel_reservations(channel_id);
CREATE INDEX idx_channel_sync_logs_channel_id ON public.channel_sync_logs(channel_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON public.channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_channel_mappings_updated_at
  BEFORE UPDATE ON public.channel_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_channel_rates_updated_at
  BEFORE UPDATE ON public.channel_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_channel_inventory_updated_at
  BEFORE UPDATE ON public.channel_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_channel_reservations_updated_at
  BEFORE UPDATE ON public.channel_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();