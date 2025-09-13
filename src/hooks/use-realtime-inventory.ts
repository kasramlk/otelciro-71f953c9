import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface InventoryUpdate {
  hotel_id: string;
  room_type_id: string;
  date: string;
  allotment: number;
  stop_sell: boolean;
}

export const useRealtimeInventory = (hotelId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hotelId) return;

    const channel = supabase
      .channel(`inventory-updates-${hotelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `hotel_id=eq.${hotelId}`
        },
        (payload) => {
          console.log('Inventory updated:', payload);
          
          // Invalidate related queries
          queryClient.invalidateQueries({ queryKey: ['enhanced-hotels'] });
          queryClient.invalidateQueries({ queryKey: ['hotel-availability'] });
          
          // Update specific availability cache if we have the data
          if (payload.new) {
            const update = payload.new as InventoryUpdate;
            queryClient.setQueryData(
              ['hotel-availability', update.hotel_id, update.room_type_id],
              (oldData: any) => {
                if (oldData) {
                  const key = `${update.room_type_id}-${update.date}`;
                  oldData.set(key, {
                    available: update.allotment,
                    stopSell: update.stop_sell
                  });
                }
                return oldData;
              }
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `hotel_id=eq.${hotelId}`
        },
        (payload) => {
          console.log('Reservation updated:', payload);
          
          // Invalidate availability queries when reservations change
          queryClient.invalidateQueries({ queryKey: ['hotel-availability'] });
          queryClient.invalidateQueries({ queryKey: ['enhanced-hotels'] });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        console.log('Realtime connection status:', status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, [hotelId, queryClient]);

  return { isConnected };
};