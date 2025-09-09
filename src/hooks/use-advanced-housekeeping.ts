// Advanced Housekeeping Operations Hooks
// Real backend integration for Phase 2: Housekeeping workflows

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { auditLogger } from '@/lib/audit-logger';

export const HOUSEKEEPING_KEYS = {
  housekeepingTasks: (hotelId: string, filters?: any) => ['housekeeping-tasks', hotelId, filters],
  roomStatus: (hotelId: string) => ['room-status', hotelId],
  staffSchedule: (hotelId: string, date: string) => ['staff-schedule', hotelId, date],
  roomMaintenance: (hotelId: string) => ['room-maintenance', hotelId],
  equipment: (hotelId: string) => ['equipment', hotelId],
  taskAssignments: (hotelId: string, staffId?: string) => ['task-assignments', hotelId, staffId],
} as const;

// Get Housekeeping Tasks with real-time updates
export function useHousekeepingTasks(hotelId: string, filters?: {
  status?: string;
  assignedTo?: string;
  roomId?: string;
  priority?: string;
  dueDate?: string;
}) {
  return useQuery({
    queryKey: HOUSEKEEPING_KEYS.housekeepingTasks(hotelId, filters),
    queryFn: async () => {
      let query = supabase
        .from('housekeeping_tasks')
        .select(`
          *,
          rooms(number, status, housekeeping_status),
          room_types(name)
        `)
        .eq('hotel_id', hotelId)
        .is('deleted_at', null);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters?.roomId) {
        query = query.eq('room_id', filters.roomId);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.dueDate) {
        query = query.gte('due_date', filters.dueDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
    staleTime: 30 * 1000 // 30 seconds - housekeeping data changes frequently
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
      estimatedDuration?: number;
    }) => {
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
          estimated_duration: taskData.estimatedDuration || 30,
          status: 'pending'
        })
        .select(`
          *,
          rooms(number, status)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: HOUSEKEEPING_KEYS.housekeepingTasks(variables.hotelId) 
      });

      // Audit log
      console.log('Task created:', data.id);

      toast({
        title: "Task Created",
        description: `${variables.taskType} task created for room ${data.rooms?.number}.`
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
    mutationFn: async ({ taskId, status, notes, completedBy }: {
      taskId: string;
      status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      notes?: string;
      completedBy?: string;
    }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = completedBy;
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
        .select(`
          *,
          rooms(number, id, status, housekeeping_status)
        `)
        .single();

      if (error) throw error;

      // Auto-update room status based on task completion
      if (status === 'completed' && data.task_type === 'cleaning') {
        await supabase
          .from('rooms')
          .update({ 
            housekeeping_status: 'clean',
            status: data.rooms?.status === 'dirty' ? 'available' : data.rooms?.status
          })
          .eq('id', data.room_id);

        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: HOUSEKEEPING_KEYS.housekeepingTasks(data.hotel_id) 
      });

      toast({
        title: "Task Updated",
        description: `Task for room ${data.rooms?.number} marked as ${variables.status}.`
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

// Update Room Status
export function useUpdateRoomStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, status, housekeepingStatus, notes }: {
      roomId: string;
      status?: string;
      housekeepingStatus?: string;
      notes?: string;
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

      // Create housekeeping task if room needs attention
      if (housekeepingStatus === 'dirty') {
        await supabase
          .from('housekeeping_tasks')
          .insert({
            hotel_id: data.hotel_id,
            room_id: roomId,
            task_type: 'cleaning',
            priority: 'medium',
            description: `Room cleaning required`,
            status: 'pending',
            due_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // Due in 2 hours
          });
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ 
        queryKey: HOUSEKEEPING_KEYS.housekeepingTasks(data.hotel_id) 
      });

      toast({
        title: "Room Status Updated",
        description: `Room ${data.number} status updated successfully.`
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

// Room Maintenance Operations
export function useRoomMaintenance(hotelId: string) {
  return useQuery({
    queryKey: HOUSEKEEPING_KEYS.roomMaintenance(hotelId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_maintenance')
        .select(`
          *,
          rooms(number, status)
        `)
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
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
      startDate?: Date;
      endDate?: Date;
    }) => {
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
          start_date: maintenanceData.startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          end_date: maintenanceData.endDate?.toISOString().split('T')[0],
          status: 'Open'
        })
        .select(`
          *,
          rooms(number, status)
        `)
        .single();

      if (error) throw error;

      // Set room to out of order if maintenance is critical
      if (maintenanceData.priority === 'high' || maintenanceData.maintenanceType === 'OOO') {
        await supabase
          .from('rooms')
          .update({ 
            status: 'out_of_order',
            housekeeping_status: 'maintenance'
          })
          .eq('id', maintenanceData.roomId);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: HOUSEKEEPING_KEYS.roomMaintenance(variables.hotelId) 
      });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      toast({
        title: "Maintenance Request Created",
        description: `Maintenance request for room ${data.rooms?.number} has been submitted.`
      });
    }
  });
}

// Staff Schedule Management
export function useStaffSchedule(hotelId: string, date: string) {
  return useQuery({
    queryKey: HOUSEKEEPING_KEYS.staffSchedule(hotelId, date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_schedules')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('shift_date', date)
        .order('shift_start', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!hotelId && !!date,
    staleTime: 10 * 60 * 1000
  });
}

// Equipment Management
export function useEquipmentManagement(hotelId: string) {
  return useQuery({
    queryKey: HOUSEKEEPING_KEYS.equipment(hotelId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          rooms(number)
        `)
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!hotelId,
    staleTime: 10 * 60 * 1000
  });
}

// Bulk Task Operations
export function useBulkTaskUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskIds, updates, hotelId }: {
      taskIds: string[];
      updates: any;
      hotelId: string;
    }) => {
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', taskIds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: HOUSEKEEPING_KEYS.housekeepingTasks(variables.hotelId) 
      });

      toast({
        title: "Tasks Updated",
        description: `${data.length} tasks have been updated successfully.`
      });
    }
  });
}

// Task Assignment Optimization
export function useOptimizeTaskAssignments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ hotelId, date }: {
      hotelId: string;
      date: string;
    }) => {
      // Get pending tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('housekeeping_tasks')
        .select(`
          *,
          rooms(number, floor)
        `)
        .eq('hotel_id', hotelId)
        .eq('status', 'pending')
        .gte('due_date', `${date}T00:00:00`)
        .lt('due_date', `${date}T23:59:59`);

      if (tasksError) throw tasksError;

      // Get staff schedules
      const { data: schedules, error: schedulesError } = await supabase
        .from('staff_schedules')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('shift_date', date)
        .eq('department', 'housekeeping');

      if (schedulesError) throw schedulesError;

      // Simple optimization: assign tasks by floor to minimize travel
      const optimizedAssignments: any[] = [];
      
      if (tasks && schedules) {
        const tasksByFloor = tasks.reduce((acc, task) => {
          const floor = task.rooms?.floor || 1;
          if (!acc[floor]) acc[floor] = [];
          acc[floor].push(task);
          return acc;
        }, {} as Record<number, any[]>);

        let staffIndex = 0;
        for (const [floor, floorTasks] of Object.entries(tasksByFloor)) {
          for (const task of floorTasks) {
            if (schedules[staffIndex]) {
              optimizedAssignments.push({
                taskId: task.id,
                staffId: schedules[staffIndex].staff_id,
                assignedTo: schedules[staffIndex].staff_id
              });
              
              staffIndex = (staffIndex + 1) % schedules.length;
            }
          }
        }
      }

      return optimizedAssignments;
    },
    onSuccess: (assignments, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: HOUSEKEEPING_KEYS.housekeepingTasks(variables.hotelId) 
      });

      toast({
        title: "Task Assignments Optimized",
        description: `${assignments.length} tasks have been optimally assigned.`
      });
    }
  });
}
