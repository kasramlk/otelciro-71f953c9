-- Create secure secrets table (service role only access)
CREATE TABLE IF NOT EXISTS beds24_connection_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refresh_token_read TEXT NOT NULL,
  refresh_token_write TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and deny all access (only service role can access)
ALTER TABLE beds24_connection_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_secrets" ON beds24_connection_secrets FOR ALL USING (false);

-- Update beds24_connections table to reference secrets
ALTER TABLE beds24_connections DROP COLUMN IF EXISTS refresh_token_read_secret;
ALTER TABLE beds24_connections DROP COLUMN IF EXISTS refresh_token_write_secret;
ALTER TABLE beds24_connections DROP COLUMN IF EXISTS access_token_cache;
ALTER TABLE beds24_connections DROP COLUMN IF EXISTS access_expires_at;
ALTER TABLE beds24_connections ADD COLUMN IF NOT EXISTS secret_id UUID REFERENCES beds24_connection_secrets(id) ON DELETE CASCADE;
ALTER TABLE beds24_connections ALTER COLUMN beds24_property_id TYPE TEXT;