-- Disable email confirmation for easier testing
UPDATE auth.config SET enable_confirmations = false;