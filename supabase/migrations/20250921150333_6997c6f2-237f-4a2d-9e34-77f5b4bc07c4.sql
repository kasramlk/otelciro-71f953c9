-- Create scheduled job for Beds24 authentication monitoring
INSERT INTO scheduled_jobs (
  job_name,
  job_type,
  schedule_cron,
  is_enabled,
  next_run_at,
  settings
) VALUES (
  'beds24-auth-monitor',
  'authentication',
  '*/10 * * * *', -- Every 10 minutes
  true,
  now() + INTERVAL '10 minutes',
  jsonb_build_object(
    'description', 'Monitor and refresh Beds24 authentication tokens',
    'endpoint', 'beds24-auth-monitor',
    'timeout_ms', 30000
  )
) ON CONFLICT (job_name) DO UPDATE SET
  schedule_cron = EXCLUDED.schedule_cron,
  is_enabled = EXCLUDED.is_enabled,
  next_run_at = EXCLUDED.next_run_at,
  settings = EXCLUDED.settings;