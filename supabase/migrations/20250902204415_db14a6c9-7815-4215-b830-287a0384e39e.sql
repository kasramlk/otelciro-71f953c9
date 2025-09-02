-- Drop existing beds24 tables to rebuild with new architecture
DROP TABLE IF EXISTS beds24_calendar CASCADE;
DROP TABLE IF EXISTS beds24_bookings CASCADE;
DROP TABLE IF EXISTS beds24_invoices CASCADE;
DROP TABLE IF EXISTS beds24_messages CASCADE;
DROP TABLE IF EXISTS beds24_room_types CASCADE;
DROP TABLE IF EXISTS beds24_properties CASCADE;
DROP TABLE IF EXISTS beds24_config CASCADE;
DROP TABLE IF EXISTS beds24_sync_logs CASCADE;
DROP TABLE IF EXISTS beds24_rate_limits CASCADE;

-- 1) Secure connections table (refresh tokens stored in vault/encrypted)
CREATE TABLE beds24_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  hotel_id UUID NOT NULL,
  beds24_property_id INTEGER NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{bookings,inventory,properties,accounts,channels}',
  refresh_token_read_secret TEXT NOT NULL, -- reference to Supabase secret
  refresh_token_write_secret TEXT, -- reference to Supabase secret (optional)
  access_token_cache TEXT, -- ephemeral cache; can be null
  access_expires_at TIMESTAMPTZ,
  last_token_use_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active', -- active | error | disabled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, beds24_property_id)
);

-- 2) Rolling cursors/state for delta syncs
CREATE TABLE beds24_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL,
  beds24_property_id INTEGER NOT NULL,
  bookings_modified_from TIMESTAMPTZ,
  messages_max_age_days INTEGER DEFAULT 30,
  last_calendar_full_refresh DATE,
  last_offers_refresh TIMESTAMPTZ,
  last_properties_refresh TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, beds24_property_id)
);

-- 3) Remote↔local id mapping for idempotent operations
CREATE TABLE beds24_id_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL,
  entity TEXT NOT NULL, -- 'room','unit','booking','invoice','message','offer','fixedPrice'
  remote_id TEXT NOT NULL,
  local_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, entity, remote_id)
);

-- 4) API call audit for debugging/rate-limit telemetry
CREATE TABLE beds24_api_logs (
  id BIGSERIAL PRIMARY KEY,
  hotel_id UUID,
  beds24_property_id INTEGER,
  method TEXT,
  path TEXT,
  status INTEGER,
  request_cost NUMERIC,
  five_min_remaining NUMERIC,
  five_min_resets_in INTEGER,
  started_at TIMESTAMPTZ DEFAULT now(),
  duration_ms INTEGER,
  error TEXT
);

-- 5) Imported data tables (rebuilt with proper structure)
CREATE TABLE beds24_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL,
  beds24_property_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  property_data JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id, beds24_property_id)
);

CREATE TABLE beds24_room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL,
  beds24_property_id INTEGER NOT NULL,
  beds24_room_id TEXT NOT NULL,
  name TEXT NOT NULL,
  max_occupancy INTEGER DEFAULT 2,
  room_type_id UUID, -- link to PMS room type
  room_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id, beds24_room_id)
);

CREATE TABLE beds24_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL,
  beds24_property_id INTEGER NOT NULL,
  beds24_booking_id TEXT NOT NULL,
  pms_reservation_id UUID, -- link to PMS reservation
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  status TEXT DEFAULT 'confirmed',
  total_amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  booking_source TEXT,
  booking_data JSONB DEFAULT '{}',
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id, beds24_booking_id)
);

CREATE TABLE beds24_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL,
  beds24_property_id INTEGER NOT NULL,
  beds24_message_id TEXT NOT NULL,
  beds24_booking_id TEXT,
  message_type TEXT DEFAULT 'guest',
  sender TEXT,
  recipient TEXT,
  subject TEXT,
  content TEXT,
  sent_at TIMESTAMPTZ,
  message_data JSONB DEFAULT '{}',
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id, beds24_message_id)
);

CREATE TABLE beds24_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL,
  beds24_property_id INTEGER NOT NULL,
  beds24_room_id TEXT NOT NULL,
  date DATE NOT NULL,
  available INTEGER DEFAULT 0,
  rate NUMERIC,
  min_stay INTEGER DEFAULT 1,
  max_stay INTEGER,
  arrival_allowed BOOLEAN DEFAULT true,
  departure_allowed BOOLEAN DEFAULT true,
  closed_arrival BOOLEAN DEFAULT false,
  closed_departure BOOLEAN DEFAULT false,
  stop_sell BOOLEAN DEFAULT false,
  calendar_data JSONB DEFAULT '{}',
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id, beds24_room_id, date)
);

-- Enable RLS on all tables
ALTER TABLE beds24_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_id_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds24_calendar ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- beds24_connections: Admin-only access
CREATE POLICY "Admin only connections access" ON beds24_connections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = ANY(ARRAY['admin'::app_role, 'owner'::app_role])
    )
  );

-- Other tables: Scoped by hotel_id with user org access
CREATE POLICY "Sync state hotel access" ON beds24_sync_state
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "ID map hotel access" ON beds24_id_map
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "API logs hotel access" ON beds24_api_logs
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Properties hotel access" ON beds24_properties
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Room types hotel access" ON beds24_room_types
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Bookings hotel access" ON beds24_bookings
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Messages hotel access" ON beds24_messages
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Calendar hotel access" ON beds24_calendar
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN users u ON h.org_id = u.org_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_beds24_connections_updated_at
  BEFORE UPDATE ON beds24_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds24_sync_state_updated_at
  BEFORE UPDATE ON beds24_sync_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds24_properties_updated_at
  BEFORE UPDATE ON beds24_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds24_room_types_updated_at
  BEFORE UPDATE ON beds24_room_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds24_bookings_updated_at
  BEFORE UPDATE ON beds24_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds24_calendar_updated_at
  BEFORE UPDATE ON beds24_calendar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();