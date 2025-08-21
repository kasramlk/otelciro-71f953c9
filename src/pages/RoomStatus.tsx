import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  Bed, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  Plus,
  Calendar,
  User
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const taskSchema = z.object({
  roomId: z.string().min(1, "Room is required"),
  taskType: z.string().min(1, "Task type is required"),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  dueDate: z.date().optional(),
});

type TaskData = z.infer<typeof taskSchema>;

// Mock data
const mockRooms = [
  { id: "1", number: "101", roomType: "Standard", floor: 1, housekeepingStatus: "Clean" },
  { id: "2", number: "102", roomType: "Standard", floor: 1, housekeepingStatus: "Dirty" },
  { id: "3", number: "103", roomType: "Deluxe", floor: 1, housekeepingStatus: "Dirty" },
  { id: "4", number: "201", roomType: "Suite", floor: 2, housekeepingStatus: "Inspected" },
  { id: "5", number: "202", roomType: "Suite", floor: 2, housekeepingStatus: "OutOfOrder" },
  { id: "6", number: "203", roomType: "Deluxe", floor: 2, housekeepingStatus: "Clean" },
];

const mockTasks = [
  {
    id: "1",
    roomNumber: "102",
    taskType: "Deep Cleaning",
    assignedTo: "Maria Garcia",
    status: "InProgress",
    dueDate: new Date(),
    notes: "Guest complained about bathroom cleanliness",
  },
  {
    id: "2",
    roomNumber: "103",
    taskType: "Maintenance",
    assignedTo: "John Smith",
    status: "Open",
    dueDate: new Date("2024-01-16"),
    notes: "Air conditioning not working properly",
  },
  {
    id: "3",
    roomNumber: "201",
    taskType: "Cleaning",
    assignedTo: "Sarah Johnson",
    status: "Done",
    dueDate: new Date("2024-01-14"),
    notes: "Regular checkout cleaning completed",
  },
];

const mockHousekeepers = [
  { id: "1", name: "Maria Garcia" },
  { id: "2", name: "John Smith" },
  { id: "3", name: "Sarah Johnson" },
  { id: "4", name: "Carlos Rodriguez" },
];

const statusConfig = {
  Clean: {
    title: "Clean",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
    borderColor: "border-green-200",
  },
  Dirty: {
    title: "Dirty",
    icon: Sparkles,
    color: "text-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-200",
  },
  Inspected: {
    title: "Inspected",
    icon: CheckCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200",
  },
  OutOfOrder: {
    title: "Out of Order",
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-200",
  },
};

const getTaskStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Open":
      return "destructive";
    case "InProgress":
      return "default";
    case "Done":
      return "secondary";
    default:
      return "outline";
  }
};

export default function RoomStatus() {
  const [rooms, setRooms] = useState(mockRooms);
  const [tasks, setTasks] = useState(mockTasks);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<TaskData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      taskType: "Cleaning",
    },
  });

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    const roomId = draggableId;
    const newStatus = destination.droppableId;

    // Update room status
    setRooms(prev =>
      prev.map(room =>
        room.id === roomId
          ? { ...room, housekeepingStatus: newStatus }
          : room
      )
    );

    const room = rooms.find(r => r.id === roomId);
    toast({
      title: "Room status updated",
      description: `Room ${room?.number} moved to ${statusConfig[newStatus as keyof typeof statusConfig]?.title}`,
    });
  };

  const onSubmitTask = (data: TaskData) => {
    const room = mockRooms.find(r => r.id === data.roomId);
    const housekeeper = mockHousekeepers.find(h => h.id === data.assignedTo);
    
    const newTask = {
      id: Date.now().toString(),
      roomNumber: room?.number || "",
      taskType: data.taskType,
      assignedTo: housekeeper?.name || "Unassigned",
      status: "Open" as const,
      dueDate: data.dueDate || new Date(),
      notes: data.notes || "",
    };

    setTasks(prev => [...prev, newTask]);
    
    toast({
      title: "Task created",
      description: `${data.taskType} task assigned to room ${room?.number}`,
    });
    
    setIsTaskDialogOpen(false);
    form.reset();
  };

  const groupedRooms = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = rooms.filter(room => room.housekeepingStatus === status);
    return acc;
  }, {} as Record<string, typeof rooms>);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight flex items-center">
          <Bed className="mr-2 h-8 w-8" />
          Room Status & Housekeeping
        </h2>
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Housekeeping Task</DialogTitle>
              <DialogDescription>
                Assign a new task to the housekeeping team.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitTask)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="roomId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockRooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              Room {room.number} ({room.roomType})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taskType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Cleaning">Cleaning</SelectItem>
                          <SelectItem value="Deep Cleaning">Deep Cleaning</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Inspection">Inspection</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select housekeeper" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockHousekeepers.map((housekeeper) => (
                            <SelectItem key={housekeeper.id} value={housekeeper.id}>
                              {housekeeper.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional task details..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Task</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            const roomsInStatus = groupedRooms[status] || [];

            return (
              <Droppable key={status} droppableId={status}>
                {(provided, snapshot) => (
                  <Card
                    className={`h-fit ${
                      snapshot.isDraggingOver ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <CardHeader className={`${config.bgColor} ${config.borderColor} border-b`}>
                      <CardTitle className={`flex items-center text-sm font-medium ${config.color}`}>
                        <Icon className="mr-2 h-4 w-4" />
                        {config.title}
                      </CardTitle>
                      <CardDescription>
                        {roomsInStatus.length} room{roomsInStatus.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="p-4 space-y-3 min-h-[200px]"
                    >
                      {roomsInStatus.map((room, index) => (
                        <Draggable key={room.id} draggableId={room.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                p-3 rounded-lg border bg-card cursor-grab transition-all
                                ${snapshot.isDragging ? "shadow-lg rotate-3" : "hover:shadow-md"}
                              `}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Room {room.number}</span>
                                <Badge variant="outline">{room.roomType}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Floor {room.floor}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </CardContent>
                  </Card>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Housekeeping Tasks
          </CardTitle>
          <CardDescription>
            Track and manage housekeeping assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Task Type</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">
                    Room {task.roomNumber}
                  </TableCell>
                  <TableCell>{task.taskType}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      {task.assignedTo}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTaskStatusBadgeVariant(task.status)}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {format(task.dueDate, "MMM dd")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-sm text-muted-foreground">
                      {task.notes || "No notes"}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}