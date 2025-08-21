-- Fix security warnings

-- Set more secure OTP expiry (3600 seconds = 1 hour instead of default 24 hours)
UPDATE auth.config SET option_value = '3600' WHERE option_name = 'otp_expiry';

-- Enable leaked password protection
UPDATE auth.config SET option_value = 'true' WHERE option_name = 'password_protect_against_leaked_passwords';