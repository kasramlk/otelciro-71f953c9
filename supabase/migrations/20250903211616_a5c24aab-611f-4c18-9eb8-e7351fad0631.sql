-- Complete removal of Beds24 and Airbnb integration tables and columns
-- This migration removes all traces of channel manager integrations

-- Drop all Beds24 tables
DROP TABLE IF EXISTS beds24_webhooks CASCADE;
DROP TABLE IF EXISTS beds24_api_logs CASCADE;
DROP TABLE IF EXISTS beds24_sync_logs CASCADE;
DROP TABLE IF EXISTS beds24_inventory CASCADE;
DROP TABLE IF EXISTS beds24_bookings CASCADE;
DROP TABLE IF EXISTS beds24_rooms CASCADE;
DROP TABLE IF EXISTS beds24_properties CASCADE;
DROP TABLE IF EXISTS beds24_connections CASCADE;

-- Drop all Airbnb tables
DROP TABLE IF EXISTS airbnb_sync_logs CASCADE;
DROP TABLE IF EXISTS airbnb_reservations CASCADE;
DROP TABLE IF EXISTS airbnb_listings CASCADE;
DROP TABLE IF EXISTS airbnb_connections CASCADE;

-- Remove Beds24 columns from room_types table
ALTER TABLE room_types 
DROP COLUMN IF EXISTS beds24_room_type_id,
DROP COLUMN IF EXISTS beds24_sync_enabled;

-- Remove Beds24 columns from rooms table
ALTER TABLE rooms 
DROP COLUMN IF EXISTS beds24_sync_enabled;

-- Clean up any remaining indexes or constraints related to these tables
-- (PostgreSQL CASCADE should handle most of this automatically)

-- Add audit log entry for this cleanup
INSERT INTO audit_log (
  entity_type, 
  action, 
  entity_id, 
  org_id, 
  new_values
) VALUES (
  'system',
  'CLEANUP_INTEGRATIONS', 
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000',
  '{"message": "Removed all Beds24 and Airbnb integration tables and columns", "tables_dropped": ["beds24_connections", "beds24_properties", "beds24_rooms", "beds24_bookings", "beds24_inventory", "beds24_sync_logs", "beds24_api_logs", "beds24_webhooks", "airbnb_connections", "airbnb_listings", "airbnb_reservations", "airbnb_sync_logs"], "columns_removed": ["room_types.beds24_room_type_id", "room_types.beds24_sync_enabled", "rooms.beds24_sync_enabled"]}'::jsonb
);