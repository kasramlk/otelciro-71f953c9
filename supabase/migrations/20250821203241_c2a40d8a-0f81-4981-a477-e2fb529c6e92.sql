-- Add branding configuration to agencies table
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{}';

-- Update agency contracts table to include branding fields if needed
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS custom_domain TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agencies_branding_config ON agencies USING GIN (branding_config);
CREATE INDEX IF NOT EXISTS idx_agencies_custom_domain ON agencies (custom_domain);

-- Update comments
COMMENT ON COLUMN agencies.branding_config IS 'JSON configuration for white-label branding (colors, theme, etc.)';
COMMENT ON COLUMN agencies.logo_url IS 'URL to agency logo for white-label branding';
COMMENT ON COLUMN agencies.custom_domain IS 'Custom domain for white-label portal (e.g., agency.example.com)';