-- Check if the job already exists and update or insert
DELETE FROM scheduled_jobs WHERE job_name = 'beds24-auth-monitor';

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
  '*/10 * * * *',
  true,
  now() + INTERVAL '10 minutes',
  jsonb_build_object(
    'description', 'Monitor and refresh Beds24 authentication tokens',
    'endpoint', 'beds24-auth-monitor',
    'timeout_ms', 30000
  )
);