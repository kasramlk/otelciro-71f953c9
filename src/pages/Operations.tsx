import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { MaintenanceRequestModal } from "@/components/maintenance/MaintenanceRequestModal";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Clock, 
  Wrench, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Smartphone,
  MapPin,
  Shield,
  Zap,
  Settings,
  PlusCircle,
  Filter
} from "lucide-react";

const Operations = () => {
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const { toast } = useToast();

  const handleCreateMaintenanceRequest = (requestData: any) => {
    toast({
      title: "Maintenance Request Created",
      description: `Request ${requestData.id} has been submitted successfully.`,
    });
  };
  // Mock operations data - in real app from Supabase
  const housekeepingStats = {
    totalRooms: 120,
    cleanedRooms: 87,
    pendingRooms: 25,
    outOfOrder: 8,
    staff: 12,
    avgCleanTime: 28 // minutes
  };

  const maintenanceStats = {
    openRequests: 14,
    inProgress: 8,
    completedToday: 6,
    urgentIssues: 3,
    avgResolutionTime: 4.2 // hours
  };

  const staffSchedule = [
    {
      id: 1,
      name: "Maria Santos",
      department: "Housekeeping",
      shift: "06:00 - 14:00",
      status: "active",
      tasksCompleted: 8,
      totalTasks: 12,
      location: "Floor 3"
    },
    {
      id: 2,
      name: "Ahmed Hassan",
      department: "Maintenance",
      shift: "08:00 - 16:00",
      status: "active",
      tasksCompleted: 3,
      totalTasks: 5,
      location: "Floor 1"
    },
    {
      id: 3,
      name: "Elena Rodriguez",
      department: "Housekeeping",
      shift: "14:00 - 22:00",
      status: "scheduled",
      tasksCompleted: 0,
      totalTasks: 10,
      location: "Floor 2"
    }
  ];

  const maintenanceRequests = [
    {
      id: 1,
      title: "AC not cooling - Room 305",
      priority: "urgent",
      category: "HVAC",
      assignedTo: "Ahmed Hassan",
      status: "in_progress",
      reportedTime: "2 hours ago",
      estimatedCost: 150
    },
    {
      id: 2,
      title: "Bathroom leak - Room 412",
      priority: "high",
      category: "Plumbing",
      assignedTo: "John Smith",
      status: "open",
      reportedTime: "4 hours ago",
      estimatedCost: 80
    },
    {
      id: 3,
      title: "TV remote not working - Room 218",
      priority: "low",
      category: "Electronics",
      assignedTo: null,
      status: "open",
      reportedTime: "1 day ago",
      estimatedCost: 25
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Operations Management</h2>
          <p className="text-muted-foreground">Manage housekeeping, maintenance, staff schedules, and operations workflow</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Smartphone className="mr-1 h-3 w-3" />
            Mobile App Active
          </Badge>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{housekeepingStats.cleanedRooms}</div>
                  <div className="text-xs text-muted-foreground">Cleaned Rooms</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{housekeepingStats.pendingRooms}</div>
                  <div className="text-xs text-muted-foreground">Pending Rooms</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{housekeepingStats.outOfOrder}</div>
                  <div className="text-xs text-muted-foreground">Out of Order</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{maintenanceStats.openRequests}</div>
                  <div className="text-xs text-muted-foreground">Open Requests</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{housekeepingStats.staff}</div>
                  <div className="text-xs text-muted-foreground">Active Staff</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{maintenanceStats.urgentIssues}</div>
                  <div className="text-xs text-muted-foreground">Urgent Issues</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="housekeeping" className="space-y-6">
        <TabsList>
          <TabsTrigger value="housekeeping">Housekeeping</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
          <TabsTrigger value="mobile">Mobile App</TabsTrigger>
        </TabsList>

        <TabsContent value="housekeeping" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Housekeeping Status
                  </CardTitle>
                  <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-green-800">Room Cleaning Progress</h3>
                      <p className="text-sm text-green-700">
                        {housekeepingStats.cleanedRooms} of {housekeepingStats.totalRooms} rooms completed
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round((housekeepingStats.cleanedRooms / housekeepingStats.totalRooms) * 100)}%
                      </div>
                      <Progress 
                        value={(housekeepingStats.cleanedRooms / housekeepingStats.totalRooms) * 100} 
                        className="w-24 mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {housekeepingStats.avgCleanTime} min
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Clean Time</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {housekeepingStats.staff}
                      </div>
                      <div className="text-xs text-muted-foreground">Staff On Duty</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">
                        {housekeepingStats.pendingRooms}
                      </div>
                      <div className="text-xs text-muted-foreground">Pending Tasks</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Room Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Clean & Ready</span>
                    </div>
                    <span className="font-semibold">{housekeepingStats.cleanedRooms}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Dirty</span>
                    </div>
                    <span className="font-semibold">{housekeepingStats.pendingRooms}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Out of Order</span>
                    </div>
                    <span className="font-semibold">{housekeepingStats.outOfOrder}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Inspected</span>
                    </div>
                    <span className="font-semibold">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Maintenance Requests</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button onClick={() => setShowMaintenanceModal(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {maintenanceRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-4 gap-4 items-center">
                      <div>
                        <h3 className="font-semibold mb-2">{request.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(request.priority)}>
                            {request.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{request.category}</Badge>
                        </div>
                      </div>

                      <div className="text-center">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          Reported {request.reportedTime}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="font-semibold">
                          {request.assignedTo || 'Unassigned'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Est. Cost: ${request.estimatedCost}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Edit
                        </Button>
                        <Button size="sm" className="flex-1">
                          Assign
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Staff Schedule & Performance</h3>
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Manage Schedules
            </Button>
          </div>

          <div className="grid gap-4">
            {staffSchedule.map((staff, index) => (
              <motion.div
                key={staff.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-5 gap-4 items-center">
                      <div>
                        <h3 className="font-semibold">{staff.name}</h3>
                        <div className="text-sm text-muted-foreground">{staff.department}</div>
                        <Badge className={getStatusColor(staff.status)}>
                          {staff.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="text-center">
                        <div className="font-semibold">{staff.shift}</div>
                        <div className="text-xs text-muted-foreground">Shift Time</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{staff.location}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Current Location</div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Task Progress</span>
                          <span className="text-sm font-medium">
                            {staff.tasksCompleted}/{staff.totalTasks}
                          </span>
                        </div>
                        <Progress 
                          value={(staff.tasksCompleted / staff.totalTasks) * 100} 
                          className="h-2"
                        />
                      </div>

                      <div className="text-right">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mobile">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Mobile Operations App</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Staff mobile application for real-time task management, room status updates, 
                  maintenance reporting, and communication. Download the OtelCiro Staff App for 
                  iOS and Android.
                </p>
                <div className="flex justify-center gap-4 mt-6">
                  <Button>Download iOS App</Button>
                  <Button variant="outline">Download Android App</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Maintenance Request Modal */}
      <MaintenanceRequestModal
        open={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        onSubmit={handleCreateMaintenanceRequest}
      />
    </div>
  );
};

export default Operations;