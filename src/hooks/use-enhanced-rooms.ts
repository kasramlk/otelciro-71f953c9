import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type RoomWithDetails = {
  id: string;
  created_at: string;
  floor: number | null;
  hotel_id: string;
  housekeeping_status: string;
  number: string;
  room_type_id: string;
  status: string;
  room_types: {
    id: string;
    name: string;
    description: string | null;
    capacity_adults: number;
  } | null;
};

export const useEnhancedRooms = (hotelId: string) => {
  return useQuery({
    queryKey: ['enhanced-rooms', hotelId],
    queryFn: async (): Promise<RoomWithDetails[]> => {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types (id, name, description, capacity_adults)
        `)
        .eq('hotel_id', hotelId)
        .order('number');

      if (error) throw error;
      return (data || []) as RoomWithDetails[];
    },
    enabled: !!hotelId,
  });
};