-- Fix security issues from previous migration

-- Add missing rate_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rate_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rate_plans
ALTER TABLE public.rate_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "rate_plans_rw" ON public.rate_plans
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Fix the queue_rate_push function with proper search_path
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
           (SELECT id FROM public.rate_plans WHERE hotel_id = NEW.hotel_id LIMIT 1),
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;