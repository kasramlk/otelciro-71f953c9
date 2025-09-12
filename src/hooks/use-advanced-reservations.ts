// Advanced Reservation Management Hooks
// Real backend integration for Phase 2: Advanced reservation operations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { auditLogger } from '@/lib/audit-logger';

export const ADVANCED_RESERVATION_KEYS = {
  reservations: (hotelId: string, filters?: any) => ['advanced-reservations', hotelId, filters],
  groupReservations: (hotelId: string) => ['group-reservations', hotelId],
  waitlist: (hotelId: string) => ['waitlist', hotelId],
  roomAssignments: (hotelId: string, date: string) => ['room-assignments', hotelId, date],
  overbookingReport: (hotelId: string, date: string) => ['overbooking-report', hotelId, date],
  walkInAvailability: (hotelId: string, date: string) => ['walkin-availability', hotelId, date],
} as const;

// Enhanced Reservations with Full Relationships
export function useAdvancedReservations(hotelId: string, filters?: {
  startDate?: string;
  endDate?: string;
  status?: string[];
  source?: string[];
  roomType?: string;
  hasBalance?: boolean;
  isGroup?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: ADVANCED_RESERVATION_KEYS.reservations(hotelId, filters),
    queryFn: async () => {
      if (!hotelId) return [];
      
      let query = supabase
        .from('reservations')
        .select(`
          *,
          guests(
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          rooms(
            id,
            number,
            status,
            housekeeping_status
          ),
          room_types(
            id,
            name,
            capacity_adults,
            capacity_children
          )
        `)
        .eq('hotel_id', hotelId);

      // Apply filters
      if (filters?.startDate) {
        query = query.gte('check_in', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('check_out', filters.endDate);
      }
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters?.source && filters.source.length > 0) {
        query = query.in('source', filters.source);
      }
      if (filters?.roomType) {
        query = query.eq('room_type_id', filters.roomType);
      }
      if (filters?.hasBalance) {
        query = query.gt('balance_due', 0);
      }
      if (filters?.isGroup) {
        query = query.not('group_id', 'is', null);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data with computed fields
      return data?.map(reservation => {
        const balance = reservation.balance_due || 0;

        return {
          ...reservation,
          guestName: reservation.guests 
            ? `${reservation.guests.first_name} ${reservation.guests.last_name}`.trim()
            : 'Unknown Guest',
          roomNumber: reservation.rooms?.number,
          roomTypeName: reservation.room_types?.name,
          isVip: false, // Simplified for now
          loyaltyTier: 'Standard', // Simplified for now
          groupName: undefined, // Simplified for now
          companyName: undefined, // Simplified for now
          actualBalance: balance,
          hasOutstandingBalance: balance > 0,
          nights: Math.ceil(
            (new Date(reservation.check_out).getTime() - new Date(reservation.check_in).getTime()) 
            / (1000 * 60 * 60 * 24)
          ),
          isOverdue: reservation.status === 'Checked Out' && balance > 0
        };
      });
    },
    enabled: !!hotelId,
    staleTime: 2 * 60 * 1000
  });
}

// Group Reservations Management
export function useGroupReservations(hotelId: string) {
  return useQuery({
    queryKey: ADVANCED_RESERVATION_KEYS.groupReservations(hotelId),
    queryFn: async () => {
      if (!hotelId) return [];
      
      const { data, error } = await supabase
        .from('reservation_groups')
        .select(`*`)
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(group => ({
        ...group,
        totalReservations: 0, // Will be calculated when we have proper relationships
        confirmedReservations: 0,
        totalRevenue: 0,
        roomsPickedUp: 0
      })) || [];
    },
    enabled: !!hotelId,
    staleTime: 5 * 60 * 1000
  });
}

// Create Group Reservation
export function useCreateGroupReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupData: {
      hotelId: string;
      name: string;
      groupCode: string;
      groupType: string;
      startDate: string;
      endDate: string;
      roomBlockSize: number;
      groupRate?: number;
      cutoffDate?: string;
      organizerName?: string;
      organizerEmail?: string;
      organizerPhone?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('reservation_groups')
        .insert({
          hotel_id: groupData.hotelId,
          name: groupData.name,
          group_code: groupData.groupCode,
          group_type: groupData.groupType,
          start_date: groupData.startDate,
          end_date: groupData.endDate,
          room_block_size: groupData.roomBlockSize,
          group_rate: groupData.groupRate,
          cutoff_date: groupData.cutoffDate,
          organizer_name: groupData.organizerName,
          organizer_email: groupData.organizerEmail,
          organizer_phone: groupData.organizerPhone,
          notes: groupData.notes,
          status: 'Active'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ADVANCED_RESERVATION_KEYS.groupReservations(variables.hotelId) 
      });

      toast({
        title: "Group Created",
        description: `Group "${variables.name}" has been created with ${variables.roomBlockSize} room block.`
      });
    }
  });
}

// Waitlist Management  
export function useWaitlist(hotelId: string) {
  return useQuery({
    queryKey: ADVANCED_RESERVATION_KEYS.waitlist(hotelId),
    queryFn: async () => {
      if (!hotelId) return [];
      
      // For now, we'll simulate waitlist with reservations that couldn't be assigned rooms
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          guests(
            first_name,
            last_name,
            email,
            phone
          ),
          room_types(name)
        `)
        .eq('hotel_id', hotelId)
        .is('room_id', null)
        .in('status', ['Confirmed', 'Booked'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data?.map(reservation => ({
        ...reservation,
        guestName: `${reservation.guests?.first_name} ${reservation.guests?.last_name}`.trim(),
        isVip: false, // Simplified for now
        loyaltyTier: 'Standard', // Simplified for now
        roomTypeName: reservation.room_types?.name,
        priority: 4, // Default priority
        waitingDays: Math.floor(
          (new Date().getTime() - new Date(reservation.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )
      })) || [];
    },
    enabled: !!hotelId,
    staleTime: 2 * 60 * 1000
  });
}

// Room Assignment with Optimization
export function useOptimizeRoomAssignments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ hotelId, date, preferences }: {
      hotelId: string;
      date: string;
      preferences?: {
        prioritizeVips?: boolean;
        prioritizeLoyalty?: boolean;
        minimizeWalking?: boolean;
      };
    }) => {
      // Get unassigned reservations for the date
      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select(`
          *,
          guests(
            guest_profiles(vip_status, loyalty_tier)
          ),
          room_types(id, name)
        `)
        .eq('hotel_id', hotelId)
        .eq('check_in', date)
        .is('room_id', null)
        .in('status', ['Confirmed', 'Booked']);

      if (resError) throw resError;

      // Get available rooms
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('status', 'available')
        .eq('housekeeping_status', 'clean');

      if (roomsError) throw roomsError;

      // Simple assignment algorithm
      const assignments: Array<{ reservationId: string; roomId: string }> = [];
      
      if (reservations && rooms) {
        // Sort reservations by created date (FIFO)
        const sortedReservations = reservations.sort((a, b) => {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        const availableRooms = [...rooms];
        
        for (const reservation of sortedReservations) {
          // Find suitable room for this reservation
          const suitableRoom = availableRooms.find(room => 
            room.room_type_id === reservation.room_type_id
          );
          
          if (suitableRoom) {
            assignments.push({
              reservationId: reservation.id,
              roomId: suitableRoom.id
            });
            
            // Remove assigned room from available list
            const roomIndex = availableRooms.findIndex(r => r.id === suitableRoom.id);
            availableRooms.splice(roomIndex, 1);
          }
        }
      }

      return assignments;
    },
    onSuccess: async (assignments, variables) => {
      // Apply the assignments
      for (const assignment of assignments) {
        await supabase
          .from('reservations')
          .update({ room_id: assignment.roomId })
          .eq('id', assignment.reservationId);

        await supabase
          .from('rooms')
          .update({ status: 'reserved' })
          .eq('id', assignment.roomId);
      }

      queryClient.invalidateQueries({ 
        queryKey: ADVANCED_RESERVATION_KEYS.reservations(variables.hotelId) 
      });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      toast({
        title: "Room Assignments Optimized",
        description: `${assignments.length} reservations have been assigned rooms.`
      });
    }
  });
}

// Overbooking Analysis
export function useOverbookingReport(hotelId: string, date: string) {
  return useQuery({
    queryKey: ADVANCED_RESERVATION_KEYS.overbookingReport(hotelId, date),
    queryFn: async () => {
      // Get reservations for the date
      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select(`
          id,
          room_type_id,
          status,
          room_types(name)
        `)
        .eq('hotel_id', hotelId)
        .lte('check_in', date)
        .gte('check_out', date)
        .in('status', ['Confirmed', 'Booked', 'Checked In']);

      if (resError) throw resError;

      // Get room inventory
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('room_type_id')
        .eq('hotel_id', hotelId);

      if (roomsError) throw roomsError;

      // Calculate overbooking by room type
      const roomTypeStats: Record<string, {
        name: string;
        totalRooms: number;
        reservations: number;
        overbooking: number;
        overbookingPercentage: number;
      }> = {};

      // Count rooms by type
      rooms?.forEach(room => {
        const typeId = room.room_type_id;
        if (!roomTypeStats[typeId]) {
          roomTypeStats[typeId] = {
            name: '',
            totalRooms: 0,
            reservations: 0,
            overbooking: 0,
            overbookingPercentage: 0
          };
        }
        roomTypeStats[typeId].totalRooms++;
      });

      // Count reservations by type
      reservations?.forEach(reservation => {
        const typeId = reservation.room_type_id;
        if (roomTypeStats[typeId]) {
          roomTypeStats[typeId].name = reservation.room_types?.name || '';
          roomTypeStats[typeId].reservations++;
        }
      });

      // Calculate overbooking
      Object.values(roomTypeStats).forEach(stats => {
        stats.overbooking = Math.max(0, stats.reservations - stats.totalRooms);
        stats.overbookingPercentage = stats.totalRooms > 0 
          ? (stats.overbooking / stats.totalRooms) * 100 
          : 0;
      });

      return Object.values(roomTypeStats);
    },
    enabled: !!hotelId && !!date,
    staleTime: 5 * 60 * 1000
  });
}

// Walk-in Availability Check
export function useWalkInAvailability(hotelId: string, checkIn: string, checkOut: string, guests: number) {
  return useQuery({
    queryKey: ADVANCED_RESERVATION_KEYS.walkInAvailability(hotelId, `${checkIn}-${checkOut}-${guests}`),
    queryFn: async () => {
      // Get all rooms
      const { data: allRooms, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types(
            name,
            capacity_adults,
            capacity_children
          )
        `)
        .eq('hotel_id', hotelId)
        .eq('status', 'available');

      if (roomsError) throw roomsError;

      // Get reservations that overlap with the requested dates
      const { data: overlappingReservations, error: resError } = await supabase
        .from('reservations')
        .select('room_id')
        .eq('hotel_id', hotelId)
        .not('room_id', 'is', null)
        .lte('check_in', checkOut)
        .gte('check_out', checkIn)
        .in('status', ['Confirmed', 'Booked', 'Checked In']);

      if (resError) throw resError;

      // Filter out occupied rooms
      const occupiedRoomIds = new Set(overlappingReservations?.map(r => r.room_id));
      const availableRooms = allRooms?.filter(room => 
        !occupiedRoomIds.has(room.id) &&
        (room.room_types?.capacity_adults || 0) >= guests
      );

      // Group by room type
      const availability = availableRooms?.reduce((acc, room) => {
        const typeName = room.room_types?.name || 'Unknown';
        if (!acc[typeName]) {
          acc[typeName] = {
            roomType: typeName,
            capacity: room.room_types?.capacity_adults || 0,
            availableRooms: [],
            count: 0
          };
        }
        acc[typeName].availableRooms.push(room);
        acc[typeName].count++;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(availability || {});
    },
    enabled: !!hotelId && !!checkIn && !!checkOut && guests > 0,
    staleTime: 30 * 1000 // 30 seconds - availability changes quickly
  });
}

// Modify Reservation (Dates, Room Type, Guests)
export function useModifyReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reservationId, modifications, recalculateCharges }: {
      reservationId: string;
      modifications: {
        checkIn?: string;
        checkOut?: string;
        roomTypeId?: string;
        adults?: number;
        children?: number;
        specialRequests?: string[];
      };
      recalculateCharges?: boolean;
    }) => {
      // Get current reservation
      const { data: currentRes, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (fetchError) throw fetchError;

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (modifications.checkIn) updateData.check_in = modifications.checkIn;
      if (modifications.checkOut) updateData.check_out = modifications.checkOut;
      if (modifications.roomTypeId) updateData.room_type_id = modifications.roomTypeId;
      if (modifications.adults) updateData.adults = modifications.adults;
      if (modifications.children) updateData.children = modifications.children;
      if (modifications.specialRequests) updateData.special_requests = modifications.specialRequests;

      // Recalculate total if dates changed
      if (recalculateCharges && (modifications.checkIn || modifications.checkOut)) {
        const checkIn = new Date(modifications.checkIn || currentRes.check_in);
        const checkOut = new Date(modifications.checkOut || currentRes.check_out);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        
        // Simple rate calculation - in real system this would use rate plans
        const baseRate = 100; // Mock rate
        updateData.total_amount = nights * baseRate;
      }

      const { data, error } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', reservationId)
        .select(`
          *,
          guests(first_name, last_name)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['advanced-reservations'] });

      toast({
        title: "Reservation Modified",
        description: `Reservation for ${data.guests?.first_name} ${data.guests?.last_name} has been updated.`
      });
    }
  });
}