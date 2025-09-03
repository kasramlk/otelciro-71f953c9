-- Add support for long-lived tokens to beds24_connections
ALTER TABLE beds24_connections 
ADD COLUMN token_type text NOT NULL DEFAULT 'oauth',
ADD COLUMN long_lived_token text,
ADD COLUMN token_expires_at timestamp with time zone;

-- Add check constraint for token_type
ALTER TABLE beds24_connections 
ADD CONSTRAINT token_type_check CHECK (token_type IN ('oauth', 'long_lived'));

-- Update existing connections to be oauth type
UPDATE beds24_connections SET token_type = 'oauth' WHERE token_type IS NULL;

-- Add index for better performance
CREATE INDEX idx_beds24_connections_token_type ON beds24_connections(token_type);
CREATE INDEX idx_beds24_connections_expires_at ON beds24_connections(token_expires_at) WHERE token_expires_at IS NOT NULL;