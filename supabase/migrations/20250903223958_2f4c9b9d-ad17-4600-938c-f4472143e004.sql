-- 🔐 SECURITY FIX: Remove hard-coded service tokens from cron jobs

-- First, unschedule existing jobs with hard-coded tokens
SELECT cron.unschedule('beds24-bookings-sync');
SELECT cron.unschedule('beds24-calendar-sync');

-- Store private cron secret and functions base URL as database settings
ALTER DATABASE postgres SET app.settings.cron_secret = 'sk_beds24_cron_2024_a7f3e9d2b8c1f4e6a9b2c5d8e1f4g7h0j3k6l9m2n5o8p1q4r7s0t3u6v9w2x5y8z1a4b7';
ALTER DATABASE postgres SET app.settings.functions_base_url = 'https://zldcotumxouasgzdsvmh.supabase.co/functions/v1';

-- Recreate cron jobs using private header (NO service role JWT)
SELECT cron.schedule(
  'beds24-bookings-sync',
  '0 * * * *',  -- hourly
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.functions_base_url') || '/beds24-sync',
    headers := jsonb_build_object('x-cron-secret', current_setting('app.settings.cron_secret'), 'Content-Type', 'application/json'),
    body := '{"type":"bookings"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'beds24-calendar-sync',
  '0 */6 * * *', -- every 6 hours
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.functions_base_url') || '/beds24-sync',
    headers := jsonb_build_object('x-cron-secret', current_setting('app.settings.cron_secret'), 'Content-Type', 'application/json'),
    body := '{"type":"calendar"}'::jsonb
  );
  $$
);