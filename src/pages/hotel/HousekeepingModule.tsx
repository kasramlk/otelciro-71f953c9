import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Plus, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  Settings,
  Bed,
  Home,
  Wrench,
  X,
  Eye,
  User,
  Calendar,
  Phone,
  Smartphone
} from "lucide-react";

const HousekeepingModule = () => {
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [newTaskData, setNewTaskData] = useState({
    room_id: "",
    task_type: "Cleaning",
    priority: "Medium",
    description: "",
    notes: "",
    assigned_to: "",
    due_date: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch rooms with their current status
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['housekeeping-rooms', selectedFloor, selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('rooms')
        .select(`
          *,
          room_types (name, capacity_adults),
          hotels (name),
          reservations!left (
            id,
            status,
            check_in,
            check_out,
            guests (first_name, last_name)
          )
        `)
        .order('number');

        if (selectedFloor !== 'all') {
          query = query.eq('floor', parseInt(selectedFloor));
        }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch housekeeping tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['housekeeping-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .select(`
          *,
          rooms (number, floor, status),
          assigned_user:users (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Update room status mutation
  const updateRoomStatusMutation = useMutation({
    mutationFn: async ({ roomId, status }: { roomId: string, status: string }) => {
      const { error } = await supabase
        .from('rooms')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', roomId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Room status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['housekeeping-rooms'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update room status",
        variant: "destructive",
      });
    }
  });

  // Create new task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const { error } = await supabase
        .from('housekeeping_tasks')
        .insert({
          ...taskData,
          hotel_id: 'current-hotel-id', // TODO: Get from context
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
      setNewTaskData({
        room_id: "",
        task_type: "Cleaning",
        priority: "Medium",
        description: "",
        notes: "",
        assigned_to: "",
        due_date: ""
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  });

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'Clean': return 'bg-green-100 text-green-800 border-green-200';
      case 'Dirty': return 'bg-red-100 text-red-800 border-red-200';
      case 'Inspected': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Out of Order': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoomStatusIcon = (status: string) => {
    switch (status) {
      case 'Clean': return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'Dirty': return <X className="h-4 w-4 text-red-600" />;
      case 'Inspected': return <Eye className="h-4 w-4 text-blue-600" />;
      case 'Out of Order': return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      case 'Maintenance': return <Wrench className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRoomStatusUpdate = (roomId: string, newStatus: string) => {
    updateRoomStatusMutation.mutate({ roomId, status: newStatus });
  };

  const handleCreateTask = () => {
    if (!newTaskData.room_id || !newTaskData.description) {
      toast({
        title: "Missing Information",
        description: "Please select a room and provide a description",
        variant: "destructive",
      });
      return;
    }
    createTaskMutation.mutate(newTaskData);
  };

  // Get unique floors for filter
  const floors = [...new Set(rooms?.map(room => room.floor).filter(Boolean))].sort();

  // Room status statistics
  const statusStats = {
    total: rooms?.length || 0,
    clean: rooms?.filter(r => r.status === 'Clean').length || 0,
    dirty: rooms?.filter(r => r.status === 'Dirty').length || 0,
    maintenance: rooms?.filter(r => r.status === 'Maintenance' || r.status === 'Out of Order').length || 0,
    occupied: rooms?.filter(r => r.reservations?.some((res: any) => 
      res.status === 'Checked In' || 
      (res.status === 'Confirmed' && new Date(res.check_in) <= new Date() && new Date(res.check_out) > new Date())
    )).length || 0
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Housekeeping Management</h1>
          <p className="text-muted-foreground">Track room status and manage cleaning tasks</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Smartphone className="h-4 w-4" />
            Mobile App
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 gap-2">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Housekeeping Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="room">Room</Label>
                    <Select value={newTaskData.room_id} onValueChange={(value) => 
                      setNewTaskData(prev => ({ ...prev, room_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms?.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Room {room.number} - {room.room_types?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="taskType">Task Type</Label>
                    <Select value={newTaskData.task_type} onValueChange={(value) => 
                      setNewTaskData(prev => ({ ...prev, task_type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cleaning">Cleaning</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Inspection">Inspection</SelectItem>
                        <SelectItem value="Repair">Repair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newTaskData.priority} onValueChange={(value) => 
                      setNewTaskData(prev => ({ ...prev, priority: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTaskData.due_date}
                      onChange={(e) => setNewTaskData(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the task..."
                    value={newTaskData.description}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    value={newTaskData.notes}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                
                <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending} className="w-full">
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { title: "Total Rooms", value: statusStats.total, icon: Home, color: "text-blue-600" },
          { title: "Clean", value: statusStats.clean, icon: CheckSquare, color: "text-green-600" },
          { title: "Dirty", value: statusStats.dirty, icon: X, color: "text-red-600" },
          { title: "Occupied", value: statusStats.occupied, icon: User, color: "text-purple-600" },
          { title: "Maintenance", value: statusStats.maintenance, icon: Wrench, color: "text-yellow-600" }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className="p-2 rounded-full bg-primary/10">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="floor">Floor</Label>
                <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Floor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Floors</SelectItem>
                    {floors.map((floor) => (
                      <SelectItem key={floor} value={floor.toString()}>
                        Floor {floor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Clean">Clean</SelectItem>
                    <SelectItem value="Dirty">Dirty</SelectItem>
                    <SelectItem value="Inspected">Inspected</SelectItem>
                    <SelectItem value="Out of Order">Out of Order</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="rooms" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rooms" className="gap-2">
            <Bed className="h-4 w-4" />
            Room Status
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-6">
          {/* Room Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Room Status Grid
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roomsLoading ? (
                <div className="text-center py-8">Loading rooms...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {rooms?.map((room) => {
                    const currentReservation = room.reservations?.find((res: any) => 
                      res.status === 'Checked In' || 
                      (res.status === 'Confirmed' && new Date(res.check_in) <= new Date() && new Date(res.check_out) > new Date())
                    );
                    
                    return (
                      <motion.div
                        key={room.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                      >
                        <Card className={`cursor-pointer transition-all hover:shadow-md ${
                          currentReservation ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}>
                          <CardContent className="p-4 text-center">
                            <div className="space-y-2">
                              <div className="font-bold text-lg">{room.number}</div>
                              <div className="text-xs text-muted-foreground">
                                {room.room_types?.name}
                              </div>
                              
                              {currentReservation && (
                                <div className="text-xs text-blue-600 font-medium">
                                  {currentReservation.guests?.first_name} {currentReservation.guests?.last_name}
                                </div>
                              )}
                              
                              <Select
                                value={room.status}
                                onValueChange={(status) => handleRoomStatusUpdate(room.id, status)}
                              >
                                <SelectTrigger className="w-full h-auto p-1 border-none bg-transparent">
                                  <Badge className={`${getRoomStatusColor(room.status)} border w-full justify-center`}>
                                    <div className="flex items-center gap-1">
                                      {getRoomStatusIcon(room.status)}
                                      <SelectValue />
                                    </div>
                                  </Badge>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Clean">Clean</SelectItem>
                                  <SelectItem value="Dirty">Dirty</SelectItem>
                                  <SelectItem value="Inspected">Inspected</SelectItem>
                                  <SelectItem value="Out of Order">Out of Order</SelectItem>
                                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {room.floor && (
                                <div className="text-xs text-muted-foreground">
                                  Floor {room.floor}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          {/* Tasks List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Active Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="text-center py-8">Loading tasks...</div>
              ) : (
                <div className="space-y-4">
                  {tasks?.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Medium
                            </Badge>
                            <span className="font-medium">Room {task.rooms?.number}</span>
                            <Badge variant="outline">{task.task_type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{task.notes || 'No description available'}</p>
                          {task.notes && (
                            <p className="text-xs text-muted-foreground mt-1">Notes: {task.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{task.status}</div>
                          {task.due_date && (
                            <div className="text-xs text-muted-foreground">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HousekeepingModule;
