-- Remove all beds24 and channel manager related columns and constraints
-- These were part of legacy integrations that are no longer needed

-- Drop beds24 related columns from reservations table
ALTER TABLE public.reservations 
DROP COLUMN IF EXISTS beds24_booking_id,
DROP COLUMN IF EXISTS beds24_last_sync,
DROP COLUMN IF EXISTS beds24_property_id,
DROP COLUMN IF EXISTS beds24_sync_status,
DROP COLUMN IF EXISTS channel_id,
DROP COLUMN IF EXISTS channel_source;

-- Drop beds24 related columns from room_types table
ALTER TABLE public.room_types 
DROP COLUMN IF EXISTS beds24_room_id,
DROP COLUMN IF EXISTS beds24_last_sync;

-- Drop beds24 related columns from rooms table
ALTER TABLE public.rooms 
DROP COLUMN IF EXISTS beds24_room_id,
DROP COLUMN IF EXISTS beds24_last_sync;

-- Drop any beds24 related indexes if they exist
DROP INDEX IF EXISTS idx_reservations_beds24_booking_id;
DROP INDEX IF EXISTS idx_reservations_channel_source;
DROP INDEX IF EXISTS idx_room_types_beds24_room_id;
DROP INDEX IF EXISTS idx_rooms_beds24_room_id;

-- Remove any beds24 related constraints
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS check_beds24_sync_status;