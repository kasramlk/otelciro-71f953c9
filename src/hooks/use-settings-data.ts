import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { roomTypeService, RoomTypeData, RoomTypeUpdate } from '@/lib/services/room-type-service';
import { ratePlanService, RatePlanData, RatePlanUpdate } from '@/lib/services/rate-plan-service';
import { useToast } from '@/hooks/use-toast';

// Hotel Settings Hook
export const useHotelSettings = (hotelId: string) => {
  return useQuery({
    queryKey: ['hotel-settings', hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', hotelId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
  });
};

// Update Hotel Hook
export const useUpdateHotel = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('hotels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hotel-settings', data.id] });
      toast({
        title: "Hotel Updated",
        description: "Hotel settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update hotel settings. Please try again.",
        variant: "destructive",
      });
      console.error('Hotel update error:', error);
    },
  });
};

// Room Types Hooks
export const useRoomTypes = (hotelId: string) => {
  return useQuery({
    queryKey: ['room-types', hotelId],
    queryFn: () => roomTypeService.getRoomTypes(hotelId),
    enabled: !!hotelId,
  });
};

export const useCreateRoomType = (hotelId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (roomTypeData: RoomTypeData) => 
      roomTypeService.createRoomType(hotelId, roomTypeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types', hotelId] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-rooms', hotelId] });
      toast({
        title: "Room Type Created",
        description: "New room type has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create room type. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateRoomType = (hotelId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (roomTypeUpdate: RoomTypeUpdate) => 
      roomTypeService.updateRoomType(roomTypeUpdate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types', hotelId] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-rooms', hotelId] });
      toast({
        title: "Room Type Updated",
        description: "Room type has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update room type. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteRoomType = (hotelId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (roomTypeId: string) => roomTypeService.deleteRoomType(roomTypeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types', hotelId] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-rooms', hotelId] });
      toast({
        title: "Room Type Deleted",
        description: "Room type has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete room type. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Rate Plans Hooks
export const useRatePlans = (hotelId: string) => {
  return useQuery({
    queryKey: ['rate-plans', hotelId],
    queryFn: () => ratePlanService.getRatePlans(hotelId),
    enabled: !!hotelId,
  });
};

export const useCreateRatePlan = (hotelId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (ratePlanData: RatePlanData) => 
      ratePlanService.createRatePlan(hotelId, ratePlanData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-plans', hotelId] });
      toast({
        title: "Rate Plan Created",
        description: "New rate plan has been created with default daily rates.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create rate plan. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateRatePlan = (hotelId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (ratePlanUpdate: RatePlanUpdate) => 
      ratePlanService.updateRatePlan(ratePlanUpdate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-plans', hotelId] });
      toast({
        title: "Rate Plan Updated",
        description: "Rate plan has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update rate plan. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteRatePlan = (hotelId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (ratePlanId: string) => ratePlanService.deleteRatePlan(ratePlanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-plans', hotelId] });
      toast({
        title: "Rate Plan Deleted",
        description: "Rate plan and associated rates have been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete rate plan. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Rooms Hook (for physical room management)
export const useRooms = (hotelId: string) => {
  return useQuery({
    queryKey: ['rooms', hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types (
            id,
            name,
            capacity_adults,
            capacity_children
          )
        `)
        .eq('hotel_id', hotelId)
        .order('number');

      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
  });
};

// Users Hook (for hotel staff management)
export const useHotelUsers = (hotelId: string) => {
  return useQuery({
    queryKey: ['hotel-users', hotelId],
    queryFn: async () => {
      // Get users who belong to the same org as the hotel
      const { data: hotel } = await supabase
        .from('hotels')
        .select('org_id')
        .eq('id', hotelId)
        .single();

      if (!hotel) return [];

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_roles (
            role
          )
        `)
        .eq('org_id', hotel.org_id);

      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
  });
};