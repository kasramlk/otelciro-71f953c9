-- Simplify beds24_connections table to only essential fields for OAuth2
ALTER TABLE beds24_connections 
DROP COLUMN IF EXISTS invitation_token,
DROP COLUMN IF EXISTS connection_status,
DROP COLUMN IF EXISTS api_credits_remaining,
DROP COLUMN IF EXISTS api_credits_reset_at,
DROP COLUMN IF EXISTS sync_errors,
DROP COLUMN IF EXISTS last_sync_at;

-- Ensure required fields are properly set up
ALTER TABLE beds24_connections 
ALTER COLUMN refresh_token SET NOT NULL,
ALTER COLUMN account_id SET NOT NULL;