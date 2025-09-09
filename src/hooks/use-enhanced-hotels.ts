import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type HotelWithDetails = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  created_at: string;
  room_types: {
    id: string;
    name: string;
    description: string | null;
    capacity_adults: number;
    capacity_children: number | null;
  }[];
  daily_rates: {
    id: string;
    date: string;
    rate: number;
    room_type_id: string;
  }[];
  inventory: {
    id: string;
    date: string;
    allotment: number;
    stop_sell: boolean;
    room_type_id: string;
  }[];
};

export const useEnhancedHotels = (searchFilters?: {
  city?: string;
  country?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
}) => {
  return useQuery({
    queryKey: ['enhanced-hotels', searchFilters],
    queryFn: async (): Promise<HotelWithDetails[]> => {
      let query = supabase
        .from('hotels')
        .select(`
          *,
          room_types (
            id, name, description, capacity_adults, capacity_children
          )
        `);

      // Apply search filters
      if (searchFilters?.city) {
        query = query.ilike('city', `%${searchFilters.city}%`);
      }
      if (searchFilters?.country) {
        query = query.ilike('country', `%${searchFilters.country}%`);
      }

      const { data: hotels, error } = await query.order('name');
      if (error) throw error;

      // For each hotel, get rates and inventory if dates provided
      if (searchFilters?.checkIn && searchFilters?.checkOut && hotels) {
        const hotelsWithRatesAndInventory = await Promise.all(
          hotels.map(async (hotel) => {
            // Get daily rates for the period
            const { data: rates } = await supabase
              .from('daily_rates')
              .select('*')
              .eq('hotel_id', hotel.id)
              .gte('date', searchFilters.checkIn!)
              .lte('date', searchFilters.checkOut!);

            // Get inventory for the period
            const { data: inventory } = await supabase
              .from('inventory')
              .select('*')
              .eq('hotel_id', hotel.id)
              .gte('date', searchFilters.checkIn!)
              .lte('date', searchFilters.checkOut!);

            return {
              ...hotel,
              daily_rates: rates || [],
              inventory: inventory || []
            } as HotelWithDetails;
          })
        );
        return hotelsWithRatesAndInventory;
      }

      return (hotels || []).map(hotel => ({
        ...hotel,
        daily_rates: [],
        inventory: []
      })) as HotelWithDetails[];
    },
    enabled: true,
  });
};

export const useHotelAvailability = (hotelId: string, checkIn: string, checkOut: string, roomTypeId?: string) => {
  return useQuery({
    queryKey: ['hotel-availability', hotelId, checkIn, checkOut, roomTypeId],
    queryFn: async () => {
      let inventoryQuery = supabase
        .from('inventory')
        .select('*')
        .eq('hotel_id', hotelId)
        .gte('date', checkIn)
        .lte('date', checkOut);

      if (roomTypeId) {
        inventoryQuery = inventoryQuery.eq('room_type_id', roomTypeId);
      }

      const { data: inventory, error: inventoryError } = await inventoryQuery;
      if (inventoryError) throw inventoryError;

      // Get existing reservations for the period
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('room_type_id, check_in, check_out')
        .eq('hotel_id', hotelId)
        .or(`check_in.lte.${checkOut},check_out.gte.${checkIn}`)
        .neq('status', 'Cancelled');

      if (reservationsError) throw reservationsError;

      // Calculate availability by subtracting booked rooms from allotment
      const availabilityMap = new Map<string, { available: number; stopSell: boolean }>();
      
      inventory?.forEach(inv => {
        const key = `${inv.room_type_id}-${inv.date}`;
        const bookedForDate = reservations?.filter(res => 
          res.room_type_id === inv.room_type_id &&
          res.check_in <= inv.date &&
          res.check_out > inv.date
        ).length || 0;
        
        availabilityMap.set(key, {
          available: Math.max(0, inv.allotment - bookedForDate),
          stopSell: inv.stop_sell
        });
      });

      return availabilityMap;
    },
    enabled: !!hotelId && !!checkIn && !!checkOut,
  });
};