-- 🔐 SECURITY FIX: Clean up and recreate secure cron settings

-- Drop existing table if it exists
DROP TABLE IF EXISTS private.cron_settings CASCADE;

-- Create secure settings table (service role only)
CREATE TABLE private.cron_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Disable RLS - only service role should access this
ALTER TABLE private.cron_settings DISABLE ROW LEVEL SECURITY;

-- Grant access only to service role
GRANT ALL ON private.cron_settings TO service_role;

-- Store the cron secret and functions URL
INSERT INTO private.cron_settings (key, value) VALUES 
('cron_secret', 'sk_beds24_cron_2024_a7f3e9d2b8c1f4e6a9b2c5d8e1f4g7h0j3k6l9m2n5o8p1q4r7s0t3u6v9w2x5y8z1a4b7'),
('functions_base_url', 'https://zldcotumxouasgzdsvmh.supabase.co/functions/v1');

-- Create helper function to get settings (service role only)
CREATE OR REPLACE FUNCTION private.get_cron_setting(setting_key TEXT)
RETURNS TEXT AS $$
DECLARE
  setting_value TEXT;
BEGIN
  SELECT value INTO setting_value FROM private.cron_settings WHERE key = setting_key;
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = private;

-- Grant execute to service role only
GRANT EXECUTE ON FUNCTION private.get_cron_setting(TEXT) TO service_role;

-- Recreate cron jobs using secure settings (NO service role JWT)
SELECT cron.schedule(
  'beds24-bookings-sync',
  '0 * * * *',  -- hourly
  $$
  SELECT net.http_post(
    url := private.get_cron_setting('functions_base_url') || '/beds24-sync',
    headers := jsonb_build_object('x-cron-secret', private.get_cron_setting('cron_secret'), 'Content-Type', 'application/json'),
    body := '{"type":"bookings"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'beds24-calendar-sync',
  '0 */6 * * *', -- every 6 hours  
  $$
  SELECT net.http_post(
    url := private.get_cron_setting('functions_base_url') || '/beds24-sync',
    headers := jsonb_build_object('x-cron-secret', private.get_cron_setting('cron_secret'), 'Content-Type', 'application/json'),
    body := '{"type":"calendar"}'::jsonb
  );
  $$
);