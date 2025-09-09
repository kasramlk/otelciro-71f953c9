// Simplified Advanced Housekeeping Operations Hooks
// Real backend integration for Phase 2: Housekeeping workflows (Type-safe version)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const HOUSEKEEPING_KEYS = {
  housekeepingTasks: (hotelId: string, filters?: any) => ['housekeeping-tasks', hotelId, filters],
  roomStatus: (hotelId: string) => ['room-status', hotelId],
  staffSchedule: (hotelId: string, date: string) => ['staff-schedule', hotelId, date],
  roomMaintenance: (hotelId: string) => ['room-maintenance', hotelId],
  equipment: (hotelId: string) => ['equipment', hotelId],
} as const;

// Simplified types
interface HousekeepingTask {
  id: string;
  hotel_id: string;
  room_id: string;
  task_type: string;
  priority: string;
  assigned_to?: string;
  description?: string;
  status: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

interface RoomMaintenanceRecord {
  id: string;
  hotel_id: string;
  room_id: string;
  maintenance_type: string;
  reason: string;
  description?: string;
  priority: string;
  cost: number;
  start_date: string;
  end_date?: string;
  status: string;
  created_at: string;
}

// Get Housekeeping Tasks with simple typing
export function useHousekeepingTasks(hotelId: string) {
  return useQuery({
    queryKey: HOUSEKEEPING_KEYS.housekeepingTasks(hotelId),
    queryFn: async (): Promise<HousekeepingTask[]> => {
      try {
        const { data, error } = await supabase
          .from('housekeeping_tasks')
          .select('*')
          .eq('hotel_id', hotelId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching housekeeping tasks:', error);
          throw error;
        }
        
        return (data as unknown as HousekeepingTask[]) || [];
      } catch (error) {
        console.error('Failed to fetch housekeeping tasks:', error);
        return [];
      }
    },
    enabled: !!hotelId,
    staleTime: 30 * 1000
  });
}

// Create Housekeeping Task
export function useCreateHousekeepingTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: {
      hotelId: string;
      roomId: string;
      taskType: string;
      priority: string;
      assignedTo?: string;
      description?: string;
      dueDate?: Date;
    }): Promise<HousekeepingTask> => {
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .insert({
          hotel_id: taskData.hotelId,
          room_id: taskData.roomId,
          task_type: taskData.taskType,
          priority: taskData.priority,
          assigned_to: taskData.assignedTo,
          description: taskData.description,
          due_date: taskData.dueDate?.toISOString(),
          status: 'pending'
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as unknown as HousekeepingTask;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: HOUSEKEEPING_KEYS.housekeepingTasks(variables.hotelId) 
      });

      toast({
        title: "Task Created",
        description: `${variables.taskType} task created successfully.`
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

// Update Task Status
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status, notes }: {
      taskId: string;
      status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      notes?: string;
    }): Promise<HousekeepingTask> => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      }
      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .update(updateData)
        .eq('id', taskId)
        .select('*')
        .single();

      if (error) throw error;
      return data as unknown as HousekeepingTask;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: HOUSEKEEPING_KEYS.housekeepingTasks(data.hotel_id) 
      });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      toast({
        title: "Task Updated",
        description: `Task marked as ${variables.status}.`
      });
    }
  });
}

// Update Room Status
export function useUpdateRoomStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, status, housekeepingStatus }: {
      roomId: string;
      status?: string;
      housekeepingStatus?: string;
    }) => {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (status) updateData.status = status;
      if (housekeepingStatus) updateData.housekeeping_status = housekeepingStatus;

      const { data, error } = await supabase
        .from('rooms')
        .update(updateData)
        .eq('id', roomId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ 
        queryKey: HOUSEKEEPING_KEYS.housekeepingTasks(data.hotel_id) 
      });

      toast({
        title: "Room Status Updated",
        description: `Room ${data.number} status updated successfully.`
      });
    }
  });
}

// Room Maintenance Operations
export function useRoomMaintenance(hotelId: string) {
  return useQuery({
    queryKey: ['room-maintenance', hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_maintenance')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false });

      if (error) return [];
      return data || [];
    },
    enabled: !!hotelId,
    staleTime: 5 * 60 * 1000
  });
}

// Create Maintenance Request
export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (maintenanceData: {
      hotelId: string;
      roomId: string;
      maintenanceType: string;
      reason: string;
      description?: string;
      priority: string;
      estimatedCost?: number;
    }): Promise<RoomMaintenanceRecord> => {
      const { data, error } = await supabase
        .from('room_maintenance')
        .insert({
          hotel_id: maintenanceData.hotelId,
          room_id: maintenanceData.roomId,
          maintenance_type: maintenanceData.maintenanceType,
          reason: maintenanceData.reason,
          description: maintenanceData.description,
          priority: maintenanceData.priority,
          cost: maintenanceData.estimatedCost || 0,
          start_date: new Date().toISOString().split('T')[0],
          status: 'Open'
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as unknown as RoomMaintenanceRecord;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: HOUSEKEEPING_KEYS.roomMaintenance(variables.hotelId) 
      });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      toast({
        title: "Maintenance Request Created",
        description: "Maintenance request has been submitted successfully."
      });
    }
  });
}
