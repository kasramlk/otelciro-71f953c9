-- Create missing tables for production-ready reservation system

-- Create reservation audit log table
CREATE TABLE IF NOT EXISTS public.reservation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'cancelled', 'checked_in', 'checked_out', 'no_show')),
  user_id UUID REFERENCES auth.users(id),
  old_data JSONB,
  new_data JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create channel allocations table for inventory management
CREATE TABLE IF NOT EXISTS public.channel_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.channel_connections(id) ON DELETE CASCADE,
  allocated_rooms INTEGER NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 5, -- 1 = highest priority
  allow_overbooking BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, room_type_id, channel_id)
);

-- Add missing columns to existing tables
ALTER TABLE public.channel_rate_mappings 
ADD COLUMN IF NOT EXISTS rate_plan_id UUID REFERENCES public.rate_plans(id);

-- Enable RLS on new tables
ALTER TABLE public.reservation_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_allocations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reservation_audit_log
CREATE POLICY "reservation_audit_rw" ON public.reservation_audit_log
FOR ALL USING (
  reservation_id IN (
    SELECT r.id FROM reservations r
    JOIN hotels h ON r.hotel_id = h.id
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create RLS policies for channel_allocations
CREATE POLICY "channel_allocations_rw" ON public.channel_allocations
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservation_audit_log_reservation_id ON public.reservation_audit_log(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_audit_log_timestamp ON public.reservation_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_channel_allocations_hotel_room_type ON public.channel_allocations(hotel_id, room_type_id);
CREATE INDEX IF NOT EXISTS idx_channel_allocations_channel ON public.channel_allocations(channel_id);

-- Add triggers for updated_at
CREATE TRIGGER update_channel_allocations_updated_at
  BEFORE UPDATE ON public.channel_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();