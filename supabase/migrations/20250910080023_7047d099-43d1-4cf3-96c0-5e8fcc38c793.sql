-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the rate push processor to run every 5 minutes
SELECT cron.schedule(
  'process-rate-push-queue',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://zldcotumxouasgzdsvmh.supabase.co/functions/v1/rate-push-processor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZGNvdHVteG91YXNnemRzdm1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY2Njk0MSwiZXhwIjoyMDcxMjQyOTQxfQ.Nm7V9_T3Y4TQfpnhDgLl9a_YWMf0hI4fQCaQdKIX6AE", "x-cron-secret": "' || current_setting('app.settings.cron_secret', true) || '"}'::jsonb,
        body:='{"source": "cron", "timestamp": "' || now()::text || '"}'::jsonb
    ) as request_id;
  $$
);

-- Clean up old completed/failed queue items (run daily at 2 AM)
SELECT cron.schedule(
  'cleanup-rate-push-queue',
  '0 2 * * *', -- Daily at 2 AM
  $$
  DELETE FROM public.rate_push_queue 
  WHERE status IN ('completed', 'failed') 
    AND completed_at < (now() - INTERVAL '7 days');
  $$
);