// Production Data Hooks
// Replaces mock data with real Supabase integration using React Query

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { services } from '@/lib/services/supabase-service';
import { toast } from '@/hooks/use-toast';
import { auditLogger } from '@/lib/audit-logger';
import { supabase } from '@/integrations/supabase/client';

// Query Keys
export const QUERY_KEYS = {
  hotels: ['hotels'],
  hotel: (id: string) => ['hotel', id],
  reservations: (hotelId: string, filters?: any) => ['reservations', hotelId, filters],
  guests: (hotelId: string, filters?: any) => ['guests', hotelId, filters],
  rooms: (hotelId: string) => ['rooms', hotelId],
  housekeepingTasks: (hotelId: string, filters?: any) => ['housekeeping', hotelId, filters],
  occupancy: (hotelId: string, startDate: string, endDate: string) => ['occupancy', hotelId, startDate, endDate],
  analytics: (hotelId: string, startDate: string, endDate: string) => ['analytics', hotelId, startDate, endDate],
  channelPerformance: (hotelId: string, period: string) => ['channelPerformance', hotelId, period]
} as const;

// Hotels Hooks
export function useHotels() {
  return useQuery({
    queryKey: QUERY_KEYS.hotels,
    queryFn: () => services.hotel.getCurrentUserHotels(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000
  });
}

export function useHotel(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.hotel(id),
    queryFn: () => services.hotel.getHotelById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  });
}

// Reservations Hooks
export function useReservations(hotelId: string, filters?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.reservations(hotelId, filters),
    queryFn: () => services.reservation.getReservations(hotelId, filters),
    enabled: !!hotelId,
    staleTime: 2 * 60 * 1000, // 2 minutes - fresher data for reservations
    retry: 2
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: services.reservation.createReservation,
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['occupancy'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      
      // Audit log
      auditLogger.logReservationCreated(
        data.id,
        { 
          code: data.code,
          total_amount: data.total_amount,
          status: data.status 
        }
      );
      
      toast({
        title: "Reservation Created",
        description: `Reservation ${data.code} has been created successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error Creating Reservation",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      services.reservation.updateReservation(id, updates),
    onSuccess: (data) => {
      // Update specific queries
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['occupancy'] });
      
      // Audit log
      auditLogger.logReservationUpdated(data.id, {}, {});
      
      toast({
        title: "Reservation Updated", 
        description: `Reservation ${data.code} has been updated.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error Updating Reservation",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Guests Hooks
export function useGuests(hotelId: string, filters?: {
  search?: string;
  vipOnly?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.guests(hotelId, filters),
    queryFn: () => services.guest.getGuests(hotelId, filters),
    enabled: !!hotelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: services.guest.createGuest,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      
      auditLogger.logGuestCreated(
        data.id,
        { 
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email 
        }
      );
      
      toast({
        title: "Guest Created",
        description: `Guest ${data.first_name} ${data.last_name} has been added.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error Creating Guest",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Rooms Hooks
export function useRooms(hotelId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.rooms(hotelId),
    queryFn: () => services.room.getRooms(hotelId),
    enabled: !!hotelId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: 2
  });
}

export function useUpdateRoomStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) => 
      services.room.updateRoomStatus(id, status, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['housekeeping'] });
      
      // Simple audit logging for room status update
      console.log(`Room ${data.number} status updated to ${data.status}`);
      
      toast({
        title: "Room Status Updated",
        description: `Room ${data.number} status changed to ${data.status}.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error Updating Room",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Housekeeping Hooks
export function useHousekeepingTasks(hotelId: string, filters?: {
  status?: string;
  assignedTo?: string;
  roomId?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.housekeepingTasks(hotelId, filters),
    queryFn: () => services.housekeeping.getTasks(hotelId, filters),
    enabled: !!hotelId,
    staleTime: 2 * 60 * 1000, // 2 minutes - housekeeping needs fresh data
    retry: 2
  });
}

export function useCreateHousekeepingTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: services.housekeeping.createTask,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      
      toast({
        title: "Task Created", 
        description: `Housekeeping task has been created.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error Creating Task",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useUpdateHousekeepingTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      services.housekeeping.updateTask(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping'] });
      
      if (data.status === 'Completed') {
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      }
      
      toast({
        title: "Task Updated",
        description: "Housekeeping task updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error Updating Task", 
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Analytics Hooks
export function useOccupancyData(hotelId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: QUERY_KEYS.occupancy(hotelId, startDate, endDate),
    queryFn: () => services.reservation.getOccupancyData(hotelId, startDate, endDate),
    enabled: !!hotelId && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
}

export function useAnalytics(hotelId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: QUERY_KEYS.analytics(hotelId, startDate, endDate),
    queryFn: () => services.analytics.getKPIData(hotelId, startDate, endDate),
    enabled: !!hotelId && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes  
    retry: 2
  });
}

export function useChannelPerformance(hotelId: string, period: 'week' | 'month' = 'month') {
  return useQuery({
    queryKey: QUERY_KEYS.channelPerformance(hotelId, period),
    queryFn: () => services.analytics.getChannelPerformance(hotelId, period),
    enabled: !!hotelId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  });
}

// Real-time subscriptions (using Supabase realtime)
export function useReservationSubscription(hotelId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hotelId) return;

    const channel = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `hotel_id=eq.${hotelId}`
        },
        (payload) => {
          // Invalidate related queries to refetch fresh data
          queryClient.invalidateQueries({ queryKey: ['reservations'] });
          queryClient.invalidateQueries({ queryKey: ['occupancy'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          
          // Show toast for real-time updates
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Reservation",
              description: "A new reservation has been created."
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId, queryClient]);
}

// Export convenience function to prefetch all hotel data
export function usePrefetchHotelData(hotelId: string) {
  const queryClient = useQueryClient();
  
  return {
    prefetchAll: () => {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Prefetch all essential data
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.reservations(hotelId),
        queryFn: () => services.reservation.getReservations(hotelId)
      });
      
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.rooms(hotelId),
        queryFn: () => services.room.getRooms(hotelId)
      });
      
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.guests(hotelId),
        queryFn: () => services.guest.getGuests(hotelId)
      });
      
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.occupancy(hotelId, today, nextMonth),
        queryFn: () => services.reservation.getOccupancyData(hotelId, today, nextMonth)
      });
    }
  };
}
