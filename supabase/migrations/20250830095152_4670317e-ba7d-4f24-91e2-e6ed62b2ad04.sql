-- Create beds24_rooms table to store room details from Beds24
CREATE TABLE beds24_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  beds24_property_id uuid NOT NULL REFERENCES beds24_properties(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  beds24_room_id integer NOT NULL,
  room_name text NOT NULL,
  room_code text,
  room_type_id uuid REFERENCES room_types(id),
  max_occupancy integer DEFAULT 2,
  room_settings jsonb DEFAULT '{}',
  sync_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(beds24_property_id, beds24_room_id)
);

-- Create beds24_calendar_cache table for caching inventory data
CREATE TABLE beds24_calendar_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  beds24_property_id uuid NOT NULL REFERENCES beds24_properties(id) ON DELETE CASCADE,
  beds24_room_id integer NOT NULL,
  date date NOT NULL,
  price1 numeric,
  price2 numeric,
  num_avail integer,
  min_stay integer,
  max_stay integer,
  multiplier numeric DEFAULT 1.0,
  channel_limit jsonb DEFAULT '{}',
  availability_status text DEFAULT 'available',
  restrictions jsonb DEFAULT '{}',
  cached_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '6 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(beds24_property_id, beds24_room_id, date)
);

-- Create beds24_api_usage table for tracking API credits and rate limiting
CREATE TABLE beds24_api_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id uuid NOT NULL REFERENCES beds24_connections(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  method text NOT NULL,
  request_cost integer DEFAULT 1,
  credits_before integer,
  credits_after integer,
  response_time_ms integer,
  success boolean DEFAULT true,
  error_details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create beds24_bookings table for storing bookings from Beds24
CREATE TABLE beds24_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id uuid NOT NULL REFERENCES beds24_connections(id) ON DELETE CASCADE,
  beds24_property_id uuid NOT NULL REFERENCES beds24_properties(id) ON DELETE CASCADE,
  beds24_booking_id integer NOT NULL UNIQUE,
  reservation_id uuid REFERENCES reservations(id),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  beds24_room_id integer NOT NULL,
  arrival date NOT NULL,
  departure date NOT NULL,
  num_adult integer NOT NULL DEFAULT 1,
  num_child integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'confirmed',
  guest_info jsonb NOT NULL DEFAULT '{}',
  amounts jsonb DEFAULT '{}',
  invoice_items jsonb DEFAULT '[]',
  booking_data jsonb DEFAULT '{}',
  imported_at timestamp with time zone NOT NULL DEFAULT now(),
  last_modified timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS policies for new tables
ALTER TABLE beds24_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_calendar_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for beds24_rooms
CREATE POLICY "beds24_rooms_rw" ON beds24_rooms
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h 
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

-- RLS policies for beds24_calendar_cache
CREATE POLICY "beds24_calendar_cache_rw" ON beds24_calendar_cache
FOR ALL USING (
  beds24_property_id IN (
    SELECT bp.id FROM beds24_properties bp 
    JOIN hotels h ON bp.hotel_id = h.id 
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

-- RLS policies for beds24_api_usage
CREATE POLICY "beds24_api_usage_rw" ON beds24_api_usage
FOR ALL USING (
  connection_id IN (
    SELECT bc.id FROM beds24_connections bc 
    JOIN hotels h ON bc.hotel_id = h.id 
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

-- RLS policies for beds24_bookings
CREATE POLICY "beds24_bookings_rw" ON beds24_bookings
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h 
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX idx_beds24_rooms_property_id ON beds24_rooms(beds24_property_id);
CREATE INDEX idx_beds24_rooms_hotel_id ON beds24_rooms(hotel_id);
CREATE INDEX idx_beds24_calendar_cache_property_room_date ON beds24_calendar_cache(beds24_property_id, beds24_room_id, date);
CREATE INDEX idx_beds24_calendar_cache_expires_at ON beds24_calendar_cache(expires_at);
CREATE INDEX idx_beds24_api_usage_connection_id ON beds24_api_usage(connection_id);
CREATE INDEX idx_beds24_api_usage_created_at ON beds24_api_usage(created_at);
CREATE INDEX idx_beds24_bookings_connection_id ON beds24_bookings(connection_id);
CREATE INDEX idx_beds24_bookings_beds24_booking_id ON beds24_bookings(beds24_booking_id);
CREATE INDEX idx_beds24_bookings_hotel_id ON beds24_bookings(hotel_id);

-- Add trigger for updated_at columns
CREATE TRIGGER update_beds24_rooms_updated_at
BEFORE UPDATE ON beds24_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beds24_calendar_cache_updated_at
BEFORE UPDATE ON beds24_calendar_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beds24_bookings_updated_at
BEFORE UPDATE ON beds24_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();