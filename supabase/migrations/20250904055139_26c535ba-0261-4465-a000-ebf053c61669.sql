-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create bootstrap trigger function for testing
CREATE OR REPLACE FUNCTION trigger_bootstrap_test()
RETURNS TABLE(result jsonb) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT net.http_post(
    url := 'https://zldcotumxouasgzdsvmh.supabase.co/functions/v1/beds24-bootstrap',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'staging-cron-secret-123',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZGNvdHVteG91YXNnemRzdm1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY2Njk0MSwiZXhwIjoyMDcxMjQyOTQxfQ.Nm7V9_T3Y4TQfpnhDgLl9a_YWMf0hI4fQCaQdKIX6AE'
    ),
    body := jsonb_build_object(
      'hotelId', '6163aacb-81d7-4eb2-ab68-4d3e172bef3e',
      'propertyId', '177452'
    )
  ) as result;
END;
$$;