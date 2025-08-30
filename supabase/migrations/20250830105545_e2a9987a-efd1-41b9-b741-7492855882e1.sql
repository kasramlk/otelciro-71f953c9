-- Drop existing beds24 tables to rebuild with correct OAuth2 structure
DROP TABLE IF EXISTS beds24_webhooks CASCADE;
DROP TABLE IF EXISTS beds24_sync_logs CASCADE;
DROP TABLE IF EXISTS beds24_api_usage CASCADE;
DROP TABLE IF EXISTS beds24_calendar_cache CASCADE;
DROP TABLE IF EXISTS beds24_channels CASCADE;
DROP TABLE IF EXISTS beds24_rate_mapping CASCADE;
DROP TABLE IF EXISTS beds24_rooms CASCADE;
DROP TABLE IF EXISTS beds24_bookings CASCADE;
DROP TABLE IF EXISTS beds24_properties CASCADE;
DROP TABLE IF EXISTS beds24_connections CASCADE;

-- Create proper beds24_connections table for OAuth2 flow
CREATE TABLE public.beds24_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  
  -- OAuth2 Authentication Fields
  invitation_token TEXT, -- Initial token from Beds24 (used once)
  refresh_token TEXT NOT NULL, -- Long-lived token for generating access tokens
  access_token TEXT, -- Short-lived Bearer token for API calls
  token_expires_at TIMESTAMP WITH TIME ZONE, -- When access token expires
  
  -- Account Information
  account_id INTEGER NOT NULL,
  account_name TEXT,
  account_email TEXT,
  
  -- Connection Status
  connection_status TEXT NOT NULL DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  
  -- API Credits & Rate Limiting
  api_credits_remaining INTEGER DEFAULT 1000,
  api_credits_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '1 hour'),
  
  -- Sync Settings
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_errors JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create beds24_properties table
CREATE TABLE public.beds24_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES beds24_connections(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL,
  
  -- Beds24 Property Details
  beds24_property_id INTEGER NOT NULL,
  property_name TEXT NOT NULL,
  property_code TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Sync Configuration
  sync_enabled BOOLEAN DEFAULT true,
  sync_settings JSONB DEFAULT '{
    "sync_bookings": true,
    "sync_inventory": true,
    "sync_rates": true,
    "sync_restrictions": true
  }'::jsonb,
  
  -- Last Sync Timestamps
  last_bookings_sync TIMESTAMP WITH TIME ZONE,
  last_inventory_sync TIMESTAMP WITH TIME ZONE,
  last_rates_sync TIMESTAMP WITH TIME ZONE,
  
  -- Status
  property_status TEXT DEFAULT 'active',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(connection_id, beds24_property_id)
);

-- Create beds24_rooms table
CREATE TABLE public.beds24_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  beds24_property_id UUID NOT NULL REFERENCES beds24_properties(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL,
  room_type_id UUID, -- Link to local room types
  
  -- Beds24 Room Details
  beds24_room_id INTEGER NOT NULL,
  room_name TEXT NOT NULL,
  room_code TEXT,
  max_occupancy INTEGER DEFAULT 2,
  
  -- Room Configuration
  room_settings JSONB DEFAULT '{}'::jsonb,
  sync_enabled BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(beds24_property_id, beds24_room_id)
);

-- Create beds24_bookings table for reservation sync
CREATE TABLE public.beds24_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES beds24_connections(id) ON DELETE CASCADE,
  beds24_property_id UUID NOT NULL REFERENCES beds24_properties(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL,
  reservation_id UUID, -- Link to local reservations
  
  -- Beds24 Booking Details
  beds24_booking_id INTEGER NOT NULL UNIQUE,
  beds24_room_id INTEGER NOT NULL,
  
  -- Booking Information
  status TEXT NOT NULL DEFAULT 'confirmed',
  arrival DATE NOT NULL,
  departure DATE NOT NULL,
  num_adult INTEGER NOT NULL DEFAULT 1,
  num_child INTEGER NOT NULL DEFAULT 0,
  
  -- Guest Information
  guest_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Financial Details
  amounts JSONB DEFAULT '{}'::jsonb,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Booking Data from Beds24
  booking_data JSONB DEFAULT '{}'::jsonb,
  
  -- Sync Information
  last_modified TIMESTAMP WITH TIME ZONE,
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create beds24_inventory table for rates and availability
CREATE TABLE public.beds24_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  beds24_property_id UUID NOT NULL REFERENCES beds24_properties(id) ON DELETE CASCADE,
  beds24_room_id INTEGER NOT NULL,
  date DATE NOT NULL,
  
  -- Inventory Data
  available INTEGER,
  price NUMERIC,
  min_stay INTEGER,
  max_stay INTEGER,
  closed_to_arrival BOOLEAN DEFAULT false,
  closed_to_departure BOOLEAN DEFAULT false,
  
  -- Additional Restrictions
  restrictions JSONB DEFAULT '{}'::jsonb,
  
  -- Sync Information
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  synced_from_beds24 BOOLEAN DEFAULT true,
  
  -- Cache Information
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '6 hours'),
  
  UNIQUE(beds24_property_id, beds24_room_id, date)
);

-- Create beds24_webhooks table for event processing
CREATE TABLE public.beds24_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES beds24_connections(id) ON DELETE CASCADE,
  
  -- Webhook Details
  event_type TEXT NOT NULL,
  webhook_type TEXT NOT NULL,
  beds24_property_id INTEGER,
  beds24_booking_id INTEGER,
  
  -- Webhook Payload
  payload JSONB NOT NULL,
  
  -- Processing Status
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_errors JSONB DEFAULT '[]'::jsonb,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create beds24_api_logs table for monitoring
CREATE TABLE public.beds24_api_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES beds24_connections(id) ON DELETE CASCADE,
  
  -- API Call Details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  
  -- Performance Metrics
  response_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- Rate Limiting
  credits_used INTEGER DEFAULT 1,
  credits_remaining INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create beds24_sync_logs table
CREATE TABLE public.beds24_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES beds24_connections(id) ON DELETE CASCADE,
  beds24_property_id UUID REFERENCES beds24_properties(id) ON DELETE CASCADE,
  
  -- Sync Details
  sync_type TEXT NOT NULL, -- 'bookings', 'inventory', 'properties', etc.
  sync_direction TEXT NOT NULL, -- 'pull', 'push', 'bidirectional'
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Sync Results
  records_processed INTEGER DEFAULT 0,
  records_succeeded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Performance & Errors
  sync_data JSONB DEFAULT '{}'::jsonb,
  error_details JSONB DEFAULT '[]'::jsonb,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE beds24_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for beds24_connections
CREATE POLICY "beds24_connections_rw" ON beds24_connections
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for beds24_properties
CREATE POLICY "beds24_properties_rw" ON beds24_properties
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for beds24_rooms
CREATE POLICY "beds24_rooms_rw" ON beds24_rooms
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for beds24_bookings
CREATE POLICY "beds24_bookings_rw" ON beds24_bookings
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for beds24_inventory
CREATE POLICY "beds24_inventory_rw" ON beds24_inventory
  FOR ALL USING (
    beds24_property_id IN (
      SELECT bp.id FROM beds24_properties bp
      JOIN hotels h ON bp.hotel_id = h.id
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for beds24_webhooks
CREATE POLICY "beds24_webhooks_rw" ON beds24_webhooks
  FOR ALL USING (
    connection_id IN (
      SELECT bc.id FROM beds24_connections bc
      JOIN hotels h ON bc.hotel_id = h.id
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for beds24_api_logs
CREATE POLICY "beds24_api_logs_rw" ON beds24_api_logs
  FOR ALL USING (
    connection_id IN (
      SELECT bc.id FROM beds24_connections bc
      JOIN hotels h ON bc.hotel_id = h.id
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create RLS policies for beds24_sync_logs
CREATE POLICY "beds24_sync_logs_rw" ON beds24_sync_logs
  FOR ALL USING (
    connection_id IN (
      SELECT bc.id FROM beds24_connections bc
      JOIN hotels h ON bc.hotel_id = h.id
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_beds24_connections_hotel_id ON beds24_connections(hotel_id);
CREATE INDEX idx_beds24_properties_connection_id ON beds24_properties(connection_id);
CREATE INDEX idx_beds24_properties_beds24_id ON beds24_properties(beds24_property_id);
CREATE INDEX idx_beds24_rooms_property_id ON beds24_rooms(beds24_property_id);
CREATE INDEX idx_beds24_bookings_connection_id ON beds24_bookings(connection_id);
CREATE INDEX idx_beds24_bookings_beds24_id ON beds24_bookings(beds24_booking_id);
CREATE INDEX idx_beds24_inventory_property_room_date ON beds24_inventory(beds24_property_id, beds24_room_id, date);
CREATE INDEX idx_beds24_webhooks_connection_id ON beds24_webhooks(connection_id);
CREATE INDEX idx_beds24_webhooks_processed ON beds24_webhooks(processed, created_at);
CREATE INDEX idx_beds24_api_logs_connection_id ON beds24_api_logs(connection_id);
CREATE INDEX idx_beds24_sync_logs_connection_id ON beds24_sync_logs(connection_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_beds24_connections_updated_at
  BEFORE UPDATE ON beds24_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds24_properties_updated_at
  BEFORE UPDATE ON beds24_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds24_rooms_updated_at
  BEFORE UPDATE ON beds24_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds24_bookings_updated_at
  BEFORE UPDATE ON beds24_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();