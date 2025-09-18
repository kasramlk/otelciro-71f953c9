-- Add performance indexes for Daily Performance queries and general hotel operations

-- Critical index for reservations by hotel (used in every reservation query)
CREATE INDEX IF NOT EXISTS idx_reservations_hotel_id ON public.reservations (hotel_id);

-- Index for date-based queries (daily performance, occupancy reports)
CREATE INDEX IF NOT EXISTS idx_reservations_check_in ON public.reservations (check_in);
CREATE INDEX IF NOT EXISTS idx_reservations_check_out ON public.reservations (check_out);

-- Index for status filtering (used in daily performance and other queries)
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations (status);

-- Composite index for the most common daily performance query pattern
CREATE INDEX IF NOT EXISTS idx_reservations_hotel_checkin_status ON public.reservations (hotel_id, check_in, status);

-- Index for rooms by hotel (needed for occupancy calculations)
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON public.rooms (hotel_id);

-- Index for guests by hotel (improves RLS policy performance)
CREATE INDEX IF NOT EXISTS idx_guests_hotel_id ON public.guests (hotel_id);

-- Index for room_types by hotel 
CREATE INDEX IF NOT EXISTS idx_room_types_hotel_id ON public.room_types (hotel_id);

-- Foreign key indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_reservations_guest_id ON public.reservations (guest_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room_type_id ON public.reservations (room_type_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room_id ON public.reservations (room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_type_id ON public.rooms (room_type_id);