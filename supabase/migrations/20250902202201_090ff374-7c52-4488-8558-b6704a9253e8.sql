-- Beds24 Integration Tables

-- Properties from Beds24
CREATE TABLE beds24_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  beds24_property_id TEXT NOT NULL,
  hotel_id UUID REFERENCES hotels(id),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  property_data JSONB DEFAULT '{}',
  sync_status TEXT DEFAULT 'active',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(beds24_property_id)
);

-- Room types/units from Beds24
CREATE TABLE beds24_room_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  beds24_room_id TEXT NOT NULL,
  beds24_property_id TEXT NOT NULL,
  hotel_id UUID REFERENCES hotels(id),
  room_type_id UUID REFERENCES room_types(id),
  name TEXT NOT NULL,
  max_occupancy INTEGER DEFAULT 2,
  room_data JSONB DEFAULT '{}',
  sync_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(beds24_room_id, beds24_property_id)
);

-- Calendar/ARI data from Beds24
CREATE TABLE beds24_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  beds24_property_id TEXT NOT NULL,
  beds24_room_id TEXT NOT NULL,
  date DATE NOT NULL,
  available INTEGER DEFAULT 0,
  rate NUMERIC(10,2),
  min_stay INTEGER DEFAULT 1,
  max_stay INTEGER,
  arrival_allowed BOOLEAN DEFAULT true,
  departure_allowed BOOLEAN DEFAULT true,
  closed_arrival BOOLEAN DEFAULT false,
  closed_departure BOOLEAN DEFAULT false,
  calendar_data JSONB DEFAULT '{}',
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(beds24_property_id, beds24_room_id, date)
);

-- Bookings from Beds24
CREATE TABLE beds24_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  beds24_booking_id TEXT NOT NULL,
  beds24_property_id TEXT NOT NULL,
  pms_reservation_id UUID REFERENCES reservations(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  total_amount NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  booking_source TEXT,
  status TEXT DEFAULT 'confirmed',
  booking_data JSONB DEFAULT '{}',
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(beds24_booking_id)
);

-- Messages/Communication from Beds24
CREATE TABLE beds24_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  beds24_message_id TEXT NOT NULL,
  beds24_booking_id TEXT,
  beds24_property_id TEXT NOT NULL,
  message_type TEXT DEFAULT 'guest',
  sender TEXT,
  recipient TEXT,
  subject TEXT,
  content TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  message_data JSONB DEFAULT '{}',
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(beds24_message_id)
);

-- Invoices from Beds24
CREATE TABLE beds24_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  beds24_invoice_id TEXT NOT NULL,
  beds24_booking_id TEXT,
  beds24_property_id TEXT NOT NULL,
  pms_invoice_id UUID REFERENCES invoices(id),
  invoice_number TEXT,
  total_amount NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'draft',
  due_date DATE,
  invoice_data JSONB DEFAULT '{}',
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(beds24_invoice_id)
);

-- Sync logs for tracking operations
CREATE TABLE beds24_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operation TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  status TEXT DEFAULT 'pending',
  records_processed INTEGER DEFAULT 0,
  records_success INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_details JSONB,
  rate_limit_info JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- API rate limit tracking
CREATE TABLE beds24_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  request_cost INTEGER DEFAULT 1,
  five_min_credits_remaining INTEGER,
  daily_credits_remaining INTEGER,
  response_headers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configuration table for Beds24 settings
CREATE TABLE beds24_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID REFERENCES hotels(id),
  beds24_property_id TEXT,
  sync_enabled BOOLEAN DEFAULT false,
  sync_frequency INTEGER DEFAULT 3600, -- seconds
  auto_sync_calendar BOOLEAN DEFAULT true,
  auto_sync_bookings BOOLEAN DEFAULT true,
  auto_sync_messages BOOLEAN DEFAULT false,
  auto_push_updates BOOLEAN DEFAULT false,
  last_full_sync TIMESTAMP WITH TIME ZONE,
  config_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(hotel_id)
);

-- Enable RLS
ALTER TABLE beds24_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin and hotel access)
CREATE POLICY "beds24_properties_rw" ON beds24_properties
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h 
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "beds24_room_types_rw" ON beds24_room_types
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h 
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "beds24_calendar_rw" ON beds24_calendar
FOR ALL USING (
  beds24_property_id IN (
    SELECT beds24_property_id FROM beds24_properties bp
    JOIN hotels h ON bp.hotel_id = h.id
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "beds24_bookings_rw" ON beds24_bookings
FOR ALL USING (
  beds24_property_id IN (
    SELECT beds24_property_id FROM beds24_properties bp
    JOIN hotels h ON bp.hotel_id = h.id
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "beds24_messages_rw" ON beds24_messages
FOR ALL USING (
  beds24_property_id IN (
    SELECT beds24_property_id FROM beds24_properties bp
    JOIN hotels h ON bp.hotel_id = h.id
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "beds24_invoices_rw" ON beds24_invoices
FOR ALL USING (
  beds24_property_id IN (
    SELECT beds24_property_id FROM beds24_properties bp
    JOIN hotels h ON bp.hotel_id = h.id
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "beds24_sync_logs_rw" ON beds24_sync_logs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner')
  )
);

CREATE POLICY "beds24_rate_limits_rw" ON beds24_rate_limits
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner')
  )
);

CREATE POLICY "beds24_config_rw" ON beds24_config
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h 
    JOIN users u ON h.org_id = u.org_id 
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_beds24_properties_updated_at
  BEFORE UPDATE ON beds24_properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds24_room_types_updated_at
  BEFORE UPDATE ON beds24_room_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds24_calendar_updated_at
  BEFORE UPDATE ON beds24_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds24_bookings_updated_at
  BEFORE UPDATE ON beds24_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds24_invoices_updated_at
  BEFORE UPDATE ON beds24_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds24_config_updated_at
  BEFORE UPDATE ON beds24_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();