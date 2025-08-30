-- Phase 1: Beds24 Database Schema & Core Setup

-- Create beds24_connections table for API credentials and connection status
CREATE TABLE public.beds24_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  account_id TEXT NOT NULL,
  account_email TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  api_credits_remaining INTEGER DEFAULT 1000,
  api_credits_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '5 minutes'),
  connection_status TEXT NOT NULL DEFAULT 'pending' CHECK (connection_status IN ('pending', 'active', 'error', 'expired')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_errors JSONB DEFAULT '[]'::jsonb,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read:bookings', 'write:bookings', 'read:inventory', 'write:inventory', 'read:properties', 'write:properties'],
  allow_linked_properties BOOLEAN DEFAULT false,
  ip_whitelist TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create beds24_properties table for property mapping
CREATE TABLE public.beds24_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  connection_id UUID NOT NULL,
  beds24_property_id INTEGER NOT NULL,
  property_name TEXT NOT NULL,
  property_code TEXT,
  property_status TEXT DEFAULT 'active' CHECK (property_status IN ('active', 'inactive', 'suspended')),
  sync_enabled BOOLEAN DEFAULT true,
  last_inventory_sync TIMESTAMP WITH TIME ZONE,
  last_rates_sync TIMESTAMP WITH TIME ZONE,
  last_bookings_sync TIMESTAMP WITH TIME ZONE,
  sync_settings JSONB DEFAULT '{
    "sync_rates": true,
    "sync_availability": true,
    "sync_restrictions": true,
    "sync_bookings": true,
    "sync_messages": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(connection_id, beds24_property_id)
);

-- Create beds24_channels table for channel configurations
CREATE TABLE public.beds24_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  beds24_property_id UUID NOT NULL,
  channel_name TEXT NOT NULL,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('OTA', 'GDS', 'Direct', 'Metasearch', 'Airbnb', 'Booking.com', 'Expedia', 'Agoda')),
  beds24_channel_id INTEGER,
  channel_code TEXT,
  commission_rate NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'error')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_errors JSONB DEFAULT '[]'::jsonb,
  channel_settings JSONB DEFAULT '{}'::jsonb,
  mapping_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create beds24_sync_logs table for operation tracking
CREATE TABLE public.beds24_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL,
  beds24_property_id UUID,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('bookings', 'inventory', 'rates', 'availability', 'restrictions', 'properties', 'channels', 'messages')),
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('push', 'pull', 'bidirectional')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  records_processed INTEGER DEFAULT 0,
  records_succeeded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  api_credits_used INTEGER DEFAULT 0,
  sync_data JSONB DEFAULT '{}'::jsonb,
  error_details JSONB DEFAULT '[]'::jsonb,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create beds24_webhooks table for incoming notifications
CREATE TABLE public.beds24_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL,
  webhook_type TEXT NOT NULL CHECK (webhook_type IN ('booking', 'inventory', 'rate', 'property', 'message', 'payment')),
  beds24_property_id INTEGER,
  beds24_booking_id INTEGER,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_errors JSONB DEFAULT '[]'::jsonb,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create beds24_rate_mapping table for rate plan mappings
CREATE TABLE public.beds24_rate_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  beds24_property_id UUID NOT NULL,
  rate_plan_id UUID NOT NULL,
  room_type_id UUID NOT NULL,
  beds24_rate_id INTEGER NOT NULL,
  beds24_rate_name TEXT NOT NULL,
  rate_type TEXT DEFAULT 'daily' CHECK (rate_type IN ('daily', 'fixed', 'package')),
  price_rule_position INTEGER CHECK (price_rule_position BETWEEN 1 AND 16),
  is_primary BOOLEAN DEFAULT false,
  markup_percentage NUMERIC(5,2) DEFAULT 0,
  markup_amount NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(beds24_property_id, rate_plan_id, room_type_id, beds24_rate_id)
);

-- Enhance existing reservations table
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS beds24_booking_id INTEGER;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS api_source_id TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS beds24_property_id INTEGER;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS channel_source TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS beds24_sync_status TEXT DEFAULT 'pending' CHECK (beds24_sync_status IN ('pending', 'synced', 'error'));
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS beds24_last_sync TIMESTAMP WITH TIME ZONE;

-- Enhance existing room_types table
ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS beds24_room_type_id INTEGER;
ALTER TABLE public.room_types ADD COLUMN IF NOT EXISTS beds24_sync_enabled BOOLEAN DEFAULT true;

-- Enhance existing rooms table  
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS beds24_room_id INTEGER;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS beds24_sync_enabled BOOLEAN DEFAULT true;

-- Enhance existing channels table
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS beds24_channel_id INTEGER;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS beds24_property_id INTEGER;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS beds24_mapping_config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS beds24_sync_enabled BOOLEAN DEFAULT false;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_beds24_connections_hotel_id ON public.beds24_connections(hotel_id);
CREATE INDEX IF NOT EXISTS idx_beds24_connections_status ON public.beds24_connections(connection_status, is_active);
CREATE INDEX IF NOT EXISTS idx_beds24_properties_connection_id ON public.beds24_properties(connection_id);
CREATE INDEX IF NOT EXISTS idx_beds24_properties_beds24_id ON public.beds24_properties(beds24_property_id);
CREATE INDEX IF NOT EXISTS idx_beds24_channels_property_id ON public.beds24_channels(beds24_property_id);
CREATE INDEX IF NOT EXISTS idx_beds24_channels_type_status ON public.beds24_channels(channel_type, is_active);
CREATE INDEX IF NOT EXISTS idx_beds24_sync_logs_connection ON public.beds24_sync_logs(connection_id, sync_type, status);
CREATE INDEX IF NOT EXISTS idx_beds24_sync_logs_created_at ON public.beds24_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beds24_webhooks_processed ON public.beds24_webhooks(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_beds24_webhooks_connection ON public.beds24_webhooks(connection_id, webhook_type);
CREATE INDEX IF NOT EXISTS idx_beds24_rate_mapping_property ON public.beds24_rate_mapping(beds24_property_id, is_active);
CREATE INDEX IF NOT EXISTS idx_reservations_beds24_booking ON public.reservations(beds24_booking_id) WHERE beds24_booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_room_types_beds24_id ON public.room_types(beds24_room_type_id) WHERE beds24_room_type_id IS NOT NULL;

-- Enable RLS on all new tables
ALTER TABLE public.beds24_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds24_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds24_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds24_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds24_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds24_rate_mapping ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for beds24_connections
CREATE POLICY "beds24_connections_rw" ON public.beds24_connections
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create RLS policies for beds24_properties
CREATE POLICY "beds24_properties_rw" ON public.beds24_properties
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create RLS policies for beds24_channels
CREATE POLICY "beds24_channels_rw" ON public.beds24_channels
FOR ALL USING (
  beds24_property_id IN (
    SELECT bp.id FROM beds24_properties bp
    JOIN hotels h ON bp.hotel_id = h.id
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create RLS policies for beds24_sync_logs
CREATE POLICY "beds24_sync_logs_rw" ON public.beds24_sync_logs
FOR ALL USING (
  connection_id IN (
    SELECT bc.id FROM beds24_connections bc
    JOIN hotels h ON bc.hotel_id = h.id
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create RLS policies for beds24_webhooks
CREATE POLICY "beds24_webhooks_rw" ON public.beds24_webhooks
FOR ALL USING (
  connection_id IN (
    SELECT bc.id FROM beds24_connections bc
    JOIN hotels h ON bc.hotel_id = h.id
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create RLS policies for beds24_rate_mapping
CREATE POLICY "beds24_rate_mapping_rw" ON public.beds24_rate_mapping
FOR ALL USING (
  beds24_property_id IN (
    SELECT bp.id FROM beds24_properties bp
    JOIN hotels h ON bp.hotel_id = h.id
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_beds24_connections_updated_at
  BEFORE UPDATE ON public.beds24_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beds24_properties_updated_at
  BEFORE UPDATE ON public.beds24_properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beds24_channels_updated_at
  BEFORE UPDATE ON public.beds24_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beds24_rate_mapping_updated_at
  BEFORE UPDATE ON public.beds24_rate_mapping
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();