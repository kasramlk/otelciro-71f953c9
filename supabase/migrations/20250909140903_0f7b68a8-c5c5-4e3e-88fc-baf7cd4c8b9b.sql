-- Phase 1: Channel Connections and Management Tables
CREATE TABLE public.channel_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  channel_name TEXT NOT NULL,
  channel_type TEXT NOT NULL, -- 'gds', 'ota', 'direct', 'beds24'
  endpoint_url TEXT NOT NULL,
  api_credentials JSONB NOT NULL DEFAULT '{}',
  connection_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'error'
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency INTEGER DEFAULT 300, -- seconds
  rate_push_enabled BOOLEAN DEFAULT true,
  availability_push_enabled BOOLEAN DEFAULT true,
  receive_reservations BOOLEAN DEFAULT true,
  channel_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on channel_connections
ALTER TABLE public.channel_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channel_connections_rw" ON public.channel_connections
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Channel-specific rate mappings
CREATE TABLE public.channel_rate_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channel_connections(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL,
  channel_room_code TEXT NOT NULL,
  channel_rate_plan_code TEXT NOT NULL,
  markup_percentage NUMERIC DEFAULT 0,
  markup_amount NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.channel_rate_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channel_rate_mappings_rw" ON public.channel_rate_mappings
FOR ALL USING (
  channel_id IN (
    SELECT cc.id FROM channel_connections cc
    JOIN hotels h ON cc.hotel_id = h.id
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Channel sync logs for monitoring
CREATE TABLE public.channel_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channel_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'rate_push', 'availability_push', 'reservation_pull'
  sync_status TEXT NOT NULL, -- 'success', 'error', 'pending'
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  sync_data JSONB,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER
);

ALTER TABLE public.channel_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channel_sync_logs_rw" ON public.channel_sync_logs
FOR ALL USING (
  channel_id IN (
    SELECT cc.id FROM channel_connections cc
    JOIN hotels h ON cc.hotel_id = h.id
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Inbound reservations from GDS/channels
CREATE TABLE public.inbound_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channel_connections(id),
  channel_reservation_id TEXT NOT NULL,
  hotel_id UUID NOT NULL,
  reservation_id UUID REFERENCES public.reservations(id),
  guest_data JSONB NOT NULL,
  booking_data JSONB NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'error'
  error_message TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  raw_data JSONB NOT NULL
);

ALTER TABLE public.inbound_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inbound_reservations_rw" ON public.inbound_reservations
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Rate push queue for managing outbound updates
CREATE TABLE public.rate_push_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  room_type_id UUID NOT NULL,
  rate_plan_id UUID NOT NULL,
  channel_id UUID REFERENCES public.channel_connections(id),
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  push_type TEXT NOT NULL, -- 'rate', 'availability', 'both'
  priority INTEGER DEFAULT 5, -- 1-10, 1 is highest
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  push_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_push_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_push_queue_rw" ON public.rate_push_queue
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_channel_connections_hotel_id ON public.channel_connections(hotel_id);
CREATE INDEX idx_channel_rate_mappings_channel_id ON public.channel_rate_mappings(channel_id);
CREATE INDEX idx_channel_sync_logs_channel_id ON public.channel_sync_logs(channel_id);
CREATE INDEX idx_inbound_reservations_hotel_id ON public.inbound_reservations(hotel_id);
CREATE INDEX idx_rate_push_queue_status ON public.rate_push_queue(status, scheduled_at);

-- Triggers for updated_at columns
CREATE TRIGGER update_channel_connections_updated_at
  BEFORE UPDATE ON public.channel_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_channel_rate_mappings_updated_at
  BEFORE UPDATE ON public.channel_rate_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to queue rate pushes automatically
CREATE OR REPLACE FUNCTION public.queue_rate_push()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue rate push when daily_rates are updated
  IF TG_TABLE_NAME = 'daily_rates' THEN
    INSERT INTO public.rate_push_queue (
      hotel_id, room_type_id, rate_plan_id,
      date_from, date_to, push_type
    )
    SELECT NEW.hotel_id, NEW.room_type_id, NEW.rate_plan_id,
           NEW.date, NEW.date, 'rate'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.rate_push_queue
      WHERE hotel_id = NEW.hotel_id
        AND room_type_id = NEW.room_type_id
        AND rate_plan_id = NEW.rate_plan_id
        AND date_from = NEW.date
        AND status = 'pending'
    );
  END IF;

  -- Queue availability push when inventory is updated
  IF TG_TABLE_NAME = 'room_inventory' THEN
    INSERT INTO public.rate_push_queue (
      hotel_id, room_type_id, rate_plan_id,
      date_from, date_to, push_type
    )
    SELECT NEW.hotel_id, NEW.room_type_id, 
           (SELECT id FROM rate_plans WHERE hotel_id = NEW.hotel_id LIMIT 1),
           NEW.date, NEW.date, 'availability'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.rate_push_queue
      WHERE hotel_id = NEW.hotel_id
        AND room_type_id = NEW.room_type_id
        AND date_from = NEW.date
        AND push_type IN ('availability', 'both')
        AND status = 'pending'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to auto-queue rate pushes
CREATE TRIGGER trigger_queue_rate_push_on_rates
  AFTER INSERT OR UPDATE ON public.daily_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_rate_push();

CREATE TRIGGER trigger_queue_availability_push_on_inventory
  AFTER INSERT OR UPDATE ON public.room_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_rate_push();