import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import { format } from 'date-fns';
import { useHousekeepingTasks, useCreateHousekeepingTask, useUpdateTaskStatus, useUpdateRoomStatus, useCreateMaintenanceRequest } from '@/hooks/use-advanced-housekeeping';
import { useHotelContext } from '@/hooks/use-hotel-context';
import { useEnhancedRooms } from '@/hooks/use-enhanced-rooms';
import { RealtimeNotificationSystem } from '@/components/realtime/RealtimeNotificationSystem';
import { BulkOperations } from '@/components/bulk/BulkOperations';
import { EnhancedExportSystem } from '@/components/export/EnhancedExportSystem';

export const HMSHousekeeping = () => {
  const { selectedHotelId } = useHotelContext();
  const { data: rooms = [] } = useEnhancedRooms(selectedHotelId || '');
  const { data: housekeepingTasks = [] } = useHousekeepingTasks(selectedHotelId || '');
  const createTaskMutation = useCreateHousekeepingTask();
  const updateTaskStatusMutation = useUpdateTaskStatus();
  const updateRoomStatusMutation = useUpdateRoomStatus();
  const createMaintenanceMutation = useCreateMaintenanceRequest();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isRoomStatusOpen, setIsRoomStatusOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const { toast } = useToast();
  const { showConfirmation, ConfirmationComponent } = useConfirmation();

  // Handle task deletion (mark as deleted)
  const handleTaskDelete = async (taskId: string) => {
    // Note: In real implementation, you would create a delete mutation
    toast({ title: 'Delete functionality will be implemented in next update' });
  };

  // Group rooms by status
  const roomsByStatus = useMemo(() => {
    return {
      clean: rooms.filter(r => r.housekeeping_status === 'Clean'),
      dirty: rooms.filter(r => r.housekeeping_status === 'Dirty'),
      occupied: rooms.filter(r => r.status === 'Occupied'),
      ooo: rooms.filter(r => r.status === 'Out of Order')
    };
  }, [rooms]);

  // Group tasks by status (exclude deleted ones)
  const tasksByStatus = {
    open: housekeepingTasks.filter(t => t.status === 'open'),
    'in-progress': housekeepingTasks.filter(t => t.status === 'in-progress'),
    completed: housekeepingTasks.filter(t => t.status === 'completed')
  };

  // Handle room status change
  const handleRoomStatusChange = async (roomId: string, newStatus: 'Clean' | 'Dirty' | 'Occupied' | 'Out of Order', notes?: string) => {
    try {
      await updateRoomStatusMutation.mutateAsync({
        roomId,
        status: newStatus === 'Out of Order' ? 'Out of Order' : 'Available',
        housekeepingStatus: newStatus
      });
      
      toast({ 
        title: 'Room status updated', 
        description: `Room status changed to ${newStatus}` 
      });
      
      setIsRoomStatusOpen(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error('Failed to update room status:', error);
      toast({ title: 'Failed to update room status', variant: 'destructive' });
    }
  };

  // Handle task status toggle
  const handleTaskStatusToggle = async (taskId: string, currentStatus: string) => {
    const statusMap = {
      'open': 'pending',
      'pending': 'in_progress', 
      'in_progress': 'completed',
      'completed': 'pending'
    };
    
    const newStatus = statusMap[currentStatus as keyof typeof statusMap] as 'open' | 'in_progress' | 'completed';
    
    try {
      await updateTaskStatusMutation.mutateAsync({
        taskId,
        status: newStatus
      });
      
      toast({ title: `Task marked as ${newStatus.replace('_', ' ')}` });
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast({ title: 'Failed to update task status', variant: 'destructive' });
    }
  };

  // Handle new task creation
  const handleNewTask = async (taskData: any) => {
    if (!selectedHotelId) {
      toast({ title: 'No hotel selected', variant: 'destructive' });
      return;
    }

    try {
      await createTaskMutation.mutateAsync({
        hotelId: selectedHotelId,
        roomId: taskData.roomId,
        taskType: taskData.taskType,
        priority: taskData.priority,
        assignedTo: taskData.assignedTo,
        description: taskData.description,
        dueDate: new Date(taskData.dueDate)
      });

      toast({ title: 'Task created successfully' });
      setIsNewTaskOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      toast({ title: 'Failed to create task', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Clean': return 'border-green-500 bg-green-50';
      case 'Dirty': return 'border-yellow-500 bg-yellow-50';
      case 'Occupied': return 'border-blue-500 bg-blue-50';
      case 'Out of Order': return 'border-red-500 bg-red-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'open': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const bulkTaskItems = housekeepingTasks
    .filter(task => task.status === 'open' || task.status === 'in-progress' || task.status === 'completed')
    .map(task => ({
      id: task.id,
      type: 'reservation' as const, // Using 'reservation' as closest match
      name: `${task.taskType} - Room ${task.roomNumber}`,
      status: task.status,
      details: task.description
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Housekeeping</h1>
          <p className="text-muted-foreground">Manage room status and maintenance tasks</p>
        </div>
        
        <div className="flex items-center gap-2">
          <RealtimeNotificationSystem />
          <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <NewTaskForm onSave={handleNewTask} rooms={rooms} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Room Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(roomsByStatus).map(([status, roomList]) => (
          <Card key={status}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground capitalize">
                {status === 'ooo' ? 'Out of Order' : status} Rooms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roomList.length}</div>
              <div className="grid grid-cols-3 gap-2 mt-4 max-h-32 overflow-y-auto">
                {roomList.map(room => (
                  <Button
                    key={room.id}
                    variant="outline"
                    size="sm"
                    className={`p-2 h-auto ${getStatusColor(room.housekeeping_status || room.status)}`}
                    onClick={() => {
                      setSelectedRoom(room);
                      setIsRoomStatusOpen(true);
                    }}
                  >
                       <div className="text-center">
                         <div className="font-medium">{room.number}</div>
                         <div className="text-xs text-muted-foreground">{room.room_types?.name || 'Room'}</div>
                       </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export System */}
      <EnhancedExportSystem
        dataType="housekeeping"
        title="Housekeeping Data"
        onExport={async (format) => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast({ title: `Housekeeping data exported as ${format.toUpperCase()}` });
        }}
      />

      {/* Bulk Operations */}
      <BulkOperations
        items={bulkTaskItems}
        onSelectionChange={setSelectedTasks}
      />

      {/* Tasks Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(tasksByStatus).map(([status, taskList]) => (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                {getTaskStatusIcon(status)}
                {status === 'in-progress' ? 'In Progress' : status} Tasks ({taskList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {taskList.map(task => (
                  <div key={task.id} className="border rounded-lg p-3 hover:bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                         <div className="flex items-center gap-2">
                           <span className="font-medium text-sm">Room {task.rooms?.number || 'N/A'}</span>
                           <Badge variant={getTaskPriorityColor(task.priority)} className="text-xs">
                             {task.priority}
                           </Badge>
                         </div>
                         <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                         <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                           <span className="flex items-center gap-1">
                             <User className="h-3 w-3" />
                             {task.assigned_to}
                           </span>
                           <span className="flex items-center gap-1">
                             <Calendar className="h-3 w-3" />
                             {format(new Date(task.due_date), 'MMM dd')}
                           </span>
                         </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTaskStatusToggle(task.id, task.status)}
                        >
                          {status === 'open' ? 'Start' : status === 'in-progress' ? 'Complete' : 'Reopen'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTaskDelete(task.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {taskList.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No {status} tasks</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Room Status Modal */}
      <Dialog open={isRoomStatusOpen} onOpenChange={setIsRoomStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Room {selectedRoom?.number} Status
            </DialogTitle>
          </DialogHeader>
          
          {selectedRoom && (
            <RoomStatusForm 
              room={selectedRoom} 
              onSave={handleRoomStatusChange}
              onCancel={() => {
                setIsRoomStatusOpen(false);
                setSelectedRoom(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationComponent />
    </motion.div>
  );
};

// New Task Form Component
const NewTaskForm = ({ onSave, rooms }: { onSave: (data: any) => void; rooms: any[] }) => {
  const [formData, setFormData] = useState({
    roomId: '',
    taskType: 'cleaning',
    priority: 'medium',
    assignedTo: 'Staff 1',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomId || !formData.description) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="roomId">Room</Label>
        <Select value={formData.roomId} onValueChange={(value) => setFormData({...formData, roomId: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select room" />
          </SelectTrigger>
          <SelectContent>
            {rooms.map(room => (
              <SelectItem key={room.id} value={room.id}>
                Room {room.number} - {room.roomType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="taskType">Task Type</Label>
          <Select value={formData.taskType} onValueChange={(value) => setFormData({...formData, taskType: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
              <SelectItem value="amenity-restock">Amenity Restock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="assignedTo">Assigned To</Label>
        <Select value={formData.assignedTo} onValueChange={(value) => setFormData({...formData, assignedTo: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Staff 1">Staff 1</SelectItem>
            <SelectItem value="Staff 2">Staff 2</SelectItem>
            <SelectItem value="Staff 3">Staff 3</SelectItem>
            <SelectItem value="Staff 4">Staff 4</SelectItem>
            <SelectItem value="Staff 5">Staff 5</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Input 
          type="date" 
          value={formData.dueDate}
          onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea 
          placeholder="Task description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" className="bg-gradient-primary">Create Task</Button>
      </div>
    </form>
  );
};

// Room Status Form Component
const RoomStatusForm = ({ room, onSave, onCancel }: { room: any; onSave: (id: string, status: any, notes?: string) => void; onCancel: () => void }) => {
  const [selectedStatus, setSelectedStatus] = useState(room.status);
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    onSave(room.id, selectedStatus, notes);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <label className="font-medium">Room Type:</label>
          <p>{room.roomType}</p>
        </div>
        <div>
          <label className="font-medium">Floor:</label>
          <p>{room.floor}</p>
        </div>
        <div>
          <label className="font-medium">Current Status:</label>
          <Badge variant="outline">{room.status}</Badge>
        </div>
        <div>
          <label className="font-medium">Last Cleaned:</label>
          <p>{format(room.lastCleaned, 'MMM dd, HH:mm')}</p>
        </div>
      </div>

      <div>
        <Label htmlFor="status">New Status</Label>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clean">Clean</SelectItem>
            <SelectItem value="dirty">Dirty</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="ooo">Out of Order</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea 
          placeholder="Optional notes about status change"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} className="bg-gradient-primary">Update Status</Button>
      </div>
    </div>
  );
};