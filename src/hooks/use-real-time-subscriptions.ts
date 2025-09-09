import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRealtimeSubscriptions = (hotelId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!hotelId) return;

    // Reservations subscription
    const reservationsChannel = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `hotel_id=eq.${hotelId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['enhanced-reservations', hotelId] });
          queryClient.invalidateQueries({ queryKey: ['production-data', hotelId] });
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: 'New Reservation',
              description: 'A new reservation has been created',
            });
          } else if (payload.eventType === 'UPDATE') {
            toast({
              title: 'Reservation Updated',
              description: 'A reservation has been modified',
            });
          }
        }
      )
      .subscribe();

    // Rooms subscription
    const roomsChannel = supabase
      .channel('rooms-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `hotel_id=eq.${hotelId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['enhanced-rooms', hotelId] });
          queryClient.invalidateQueries({ queryKey: ['production-data', hotelId] });
          
          if (payload.eventType === 'UPDATE' && payload.new?.status !== payload.old?.status) {
            toast({
              title: 'Room Status Updated',
              description: `Room ${payload.new?.number} status changed to ${payload.new?.status}`,
            });
          }
        }
      )
      .subscribe();

    // Guests subscription
    const guestsChannel = supabase
      .channel('guests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests',
          filter: `hotel_id=eq.${hotelId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['guests', hotelId] });
          queryClient.invalidateQueries({ queryKey: ['production-data', hotelId] });
        }
      )
      .subscribe();

    // Housekeeping tasks subscription
    const housekeepingChannel = supabase
      .channel('housekeeping-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'housekeeping_tasks',
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks', hotelId] });
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: 'New Housekeeping Task',
              description: 'A new task has been assigned',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reservationsChannel);
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(guestsChannel);
      supabase.removeChannel(housekeepingChannel);
    };
  }, [hotelId, queryClient, toast]);
};
