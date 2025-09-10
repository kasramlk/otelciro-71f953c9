-- Update the queue_rate_push function to work with existing table structure
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
           NEW.date, NEW.date, 'rate', 2 -- medium priority
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
           NEW.date, NEW.date, 'availability', 1 -- high priority
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

-- Create index for efficient queue processing if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_rate_push_queue_processing 
ON public.rate_push_queue (status, priority ASC, scheduled_at ASC)
WHERE status = 'pending';