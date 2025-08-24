import { useState } from 'react';
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
import { useHMSStore } from '@/stores/hms-store';
import { useToast } from "@/hooks/use-toast";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import { format } from 'date-fns';

export const HMSHousekeeping = () => {
  const { rooms, housekeepingTasks, updateRoomStatus, addTask, updateTask, addAuditEntry } = useHMSStore();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isRoomStatusOpen, setIsRoomStatusOpen] = useState(false);
  const { toast } = useToast();
  const { showConfirmation, ConfirmationComponent } = useConfirmation();

  // Handle task deletion (mark as deleted)
  const handleTaskDelete = async (taskId: string) => {
    const task = housekeepingTasks.find(t => t.id === taskId);
    if (!task) return;

    showConfirmation({
      title: "Delete Task",
      description: `Are you sure you want to delete the task "${task.description}"?`,
      confirmText: "Delete Task",
      variant: "destructive",
      onConfirm: () => {
        // Mark as deleted in local store (simulate soft delete)
        updateTask(taskId, { 
          status: 'deleted' as any
        });

        addAuditEntry('Task Deleted', `Task "${task.description}" for room ${task.roomNumber} was deleted`);
        toast({ 
          title: 'Task deleted', 
          description: 'Task has been removed successfully.',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Undo deletion by restoring to open status
                updateTask(taskId, { status: 'open' });
                toast({ title: 'Task restored' });
              }}
            >
              Undo
            </Button>
          )
        });
      }
    });
  };

  // Group rooms by status
  const roomsByStatus = {
    clean: rooms.filter(r => r.status === 'clean'),
    dirty: rooms.filter(r => r.status === 'dirty'),
    occupied: rooms.filter(r => r.status === 'occupied'),
    ooo: rooms.filter(r => r.status === 'ooo')
  };

  // Group tasks by status (exclude deleted ones)
  const tasksByStatus = {
    open: housekeepingTasks.filter(t => t.status === 'open'),
    'in-progress': housekeepingTasks.filter(t => t.status === 'in-progress'),
    completed: housekeepingTasks.filter(t => t.status === 'completed')
  };

  // Handle room status change
  const handleRoomStatusChange = (roomId: string, newStatus: 'clean' | 'dirty' | 'occupied' | 'ooo', notes?: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    updateRoomStatus(roomId, newStatus);
    addAuditEntry('Room Status Changed', `Room ${room.number} status changed to ${newStatus}${notes ? `: ${notes}` : ''}`);
    
    toast({ 
      title: 'Room status updated', 
      description: `Room ${room.number} is now ${newStatus}` 
    });
    
    setIsRoomStatusOpen(false);
    setSelectedRoom(null);
  };

  // Handle task status toggle
  const handleTaskStatusToggle = (taskId: string, currentStatus: string) => {
    const statusMap = {
      'open': 'in-progress',
      'in-progress': 'completed',
      'completed': 'open'
    };
    
    const newStatus = statusMap[currentStatus as keyof typeof statusMap] as 'open' | 'in-progress' | 'completed';
    updateTask(taskId, { 
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date() : null
    });

    const task = housekeepingTasks.find(t => t.id === taskId);
    if (task) {
      addAuditEntry('Task Status Changed', `Task "${task.description}" status changed to ${newStatus}`);
      toast({ title: `Task marked as ${newStatus}` });
    }
  };

  // Handle new task creation
  const handleNewTask = (taskData: any) => {
    const room = rooms.find(r => r.id === taskData.roomId);
    if (!room) return;

    addTask({
      roomId: taskData.roomId,
      roomNumber: room.number,
      taskType: taskData.taskType,
      status: 'open',
      priority: taskData.priority,
      assignedTo: taskData.assignedTo,
      description: taskData.description,
      dueDate: new Date(taskData.dueDate),
      notes: taskData.notes || '',
      createdAt: new Date(),
      completedAt: null
    });

    addAuditEntry('New Task Created', `New ${taskData.taskType} task created for room ${room.number}`);
    toast({ title: 'Task created successfully' });
    setIsNewTaskOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clean': return 'border-green-500 bg-green-50';
      case 'dirty': return 'border-yellow-500 bg-yellow-50';
      case 'occupied': return 'border-blue-500 bg-blue-50';
      case 'ooo': return 'border-red-500 bg-red-50';
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
                    className={`p-2 h-auto ${getStatusColor(room.status)}`}
                    onClick={() => {
                      setSelectedRoom(room);
                      setIsRoomStatusOpen(true);
                    }}
                  >
                    <div className="text-center">
                      <div className="font-medium">{room.number}</div>
                      <div className="text-xs text-muted-foreground">{room.roomType}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                          <span className="font-medium text-sm">Room {task.roomNumber}</span>
                          <Badge variant={getTaskPriorityColor(task.priority)} className="text-xs">
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignedTo}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(task.dueDate, 'MMM dd')}
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