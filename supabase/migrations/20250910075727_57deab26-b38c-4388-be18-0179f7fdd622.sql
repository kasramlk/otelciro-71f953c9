-- Enable triggers for automatic rate push queue population
CREATE OR REPLACE FUNCTION public.queue_rate_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Queue rate push when daily_rates are updated
  IF TG_TABLE_NAME = 'daily_rates' THEN
    INSERT INTO public.rate_push_queue (
      hotel_id, room_type_id, rate_plan_id,
      date_from, date_to, push_type, priority
    )
    SELECT NEW.hotel_id, NEW.room_type_id, NEW.rate_plan_id,
           NEW.date, NEW.date, 'rate', 'medium'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.rate_push_queue
      WHERE hotel_id = NEW.hotel_id
        AND room_type_id = NEW.room_type_id
        AND rate_plan_id = NEW.rate_plan_id
        AND date_from = NEW.date
        AND status = 'pending'
        AND push_type IN ('rate', 'both')
    );
  END IF;

  -- Queue availability push when inventory is updated
  IF TG_TABLE_NAME = 'inventory' THEN
    INSERT INTO public.rate_push_queue (
      hotel_id, room_type_id, rate_plan_id,
      date_from, date_to, push_type, priority
    )
    SELECT NEW.hotel_id, NEW.room_type_id, 
           (SELECT id FROM public.rate_plans WHERE hotel_id = NEW.hotel_id AND is_active = true LIMIT 1),
           NEW.date, NEW.date, 'availability', 'high'
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
$function$;

-- Create triggers for automatic rate push queue population
DROP TRIGGER IF EXISTS trigger_queue_rate_push_daily_rates ON public.daily_rates;
CREATE TRIGGER trigger_queue_rate_push_daily_rates
  AFTER INSERT OR UPDATE ON public.daily_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_rate_push();

DROP TRIGGER IF EXISTS trigger_queue_rate_push_inventory ON public.inventory;
CREATE TRIGGER trigger_queue_rate_push_inventory
  AFTER INSERT OR UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_rate_push();

-- Create rate_push_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rate_push_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  room_type_id uuid NOT NULL,
  rate_plan_id uuid,
  date_from date NOT NULL,
  date_to date NOT NULL,
  push_type text NOT NULL CHECK (push_type IN ('rate', 'availability', 'both')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  scheduled_for timestamp with time zone DEFAULT now(),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone
);

-- Enable RLS on rate_push_queue
ALTER TABLE public.rate_push_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for rate_push_queue
CREATE POLICY "rate_push_queue_rw" ON public.rate_push_queue
FOR ALL USING (
  hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN users u ON h.org_id = u.org_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_rate_push_queue_processing 
ON public.rate_push_queue (status, priority DESC, scheduled_for ASC)
WHERE status = 'pending';

-- Create function to process rate push queue
CREATE OR REPLACE FUNCTION public.process_rate_push_queue()
RETURNS TABLE(processed_count integer, failed_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  queue_item RECORD;
  total_processed INTEGER := 0;
  total_failed INTEGER := 0;
  result RECORD;
BEGIN
  -- Process pending items, prioritizing high priority and older items
  FOR queue_item IN 
    SELECT * FROM public.rate_push_queue 
    WHERE status = 'pending' 
      AND scheduled_for <= now()
      AND attempts < max_attempts
    ORDER BY 
      CASE priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
      END,
      scheduled_for ASC
    LIMIT 50
  LOOP
    BEGIN
      -- Update status to processing
      UPDATE public.rate_push_queue 
      SET status = 'processing', 
          attempts = attempts + 1,
          updated_at = now()
      WHERE id = queue_item.id;

      -- Call the channel manager function to process the push
      SELECT * INTO result FROM net.http_post(
        url := 'https://zldcotumxouasgzdsvmh.supabase.co/functions/v1/channel-manager',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'syncType', 'pushRates',
          'hotelId', queue_item.hotel_id,
          'roomTypeId', queue_item.room_type_id,
          'ratePlanId', queue_item.rate_plan_id,
          'dateFrom', queue_item.date_from,
          'dateTo', queue_item.date_to,
          'pushType', queue_item.push_type
        )
      );

      -- Mark as completed if successful
      UPDATE public.rate_push_queue 
      SET status = 'completed',
          processed_at = now(),
          updated_at = now(),
          error_message = NULL
      WHERE id = queue_item.id;

      total_processed := total_processed + 1;

    EXCEPTION WHEN OTHERS THEN
      -- Mark as failed if max attempts reached, otherwise reschedule
      IF queue_item.attempts + 1 >= queue_item.max_attempts THEN
        UPDATE public.rate_push_queue 
        SET status = 'failed',
            error_message = SQLERRM,
            updated_at = now()
        WHERE id = queue_item.id;
        total_failed := total_failed + 1;
      ELSE
        -- Reschedule for later with exponential backoff
        UPDATE public.rate_push_queue 
        SET status = 'pending',
            scheduled_for = now() + (INTERVAL '5 minutes' * POWER(2, attempts + 1)),
            error_message = SQLERRM,
            updated_at = now()
        WHERE id = queue_item.id;
      END IF;
    END;
  END LOOP;

  processed_count := total_processed;
  failed_count := total_failed;
  RETURN NEXT;
END;
$function$;