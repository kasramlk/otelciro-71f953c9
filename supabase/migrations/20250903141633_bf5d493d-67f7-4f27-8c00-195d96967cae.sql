-- Drop all beds24 and channel manager related tables
DROP TABLE IF EXISTS public.beds24_api_logs CASCADE;
DROP TABLE IF EXISTS public.beds24_bookings CASCADE;
DROP TABLE IF EXISTS public.beds24_calendar CASCADE;
DROP TABLE IF EXISTS public.beds24_connection_secrets CASCADE;
DROP TABLE IF EXISTS public.beds24_connections CASCADE;
DROP TABLE IF EXISTS public.beds24_id_map CASCADE;
DROP TABLE IF EXISTS public.beds24_messages CASCADE;
DROP TABLE IF EXISTS public.beds24_properties CASCADE;
DROP TABLE IF EXISTS public.beds24_room_types CASCADE;
DROP TABLE IF EXISTS public.beds24_sync_state CASCADE;
DROP TABLE IF EXISTS public.channel_inventory CASCADE;
DROP TABLE IF EXISTS public.channel_mappings CASCADE;
DROP TABLE IF EXISTS public.channel_rates CASCADE;
DROP TABLE IF EXISTS public.channel_reservations CASCADE;
DROP TABLE IF EXISTS public.channel_sync_logs CASCADE;
DROP TABLE IF EXISTS public.channels CASCADE;