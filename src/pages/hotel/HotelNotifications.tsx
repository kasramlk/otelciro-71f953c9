import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings, 
  Search,
  Filter,
  Check,
  X
} from "lucide-react";

export default function HotelNotifications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      type: "maintenance",
      priority: "high",
      title: "Room 204 - Air Conditioning Issue",
      message: "Guest reported AC not working. Maintenance team dispatched.",
      time: "10 minutes ago",
      read: false,
      icon: AlertTriangle,
      color: "text-red-500"
    },
    {
      id: 2,
      type: "reservation",
      priority: "medium",
      title: "New Reservation - Premium Suite",
      message: "John Smith booked Premium Suite for Dec 15-18. Total: $1,240",
      time: "25 minutes ago",
      read: false,
      icon: Bell,
      color: "text-blue-500"
    },
    {
      id: 3,
      type: "housekeeping",
      priority: "low",
      title: "Housekeeping Complete - Floor 3",
      message: "All rooms on floor 3 have been cleaned and inspected.",
      time: "1 hour ago",
      read: true,
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      id: 4,
      type: "guest",
      priority: "medium",
      title: "Guest Request - Room 312",
      message: "Extra towels and late checkout request approved.",
      time: "2 hours ago",
      read: false,
      icon: Clock,
      color: "text-yellow-500"
    },
    {
      id: 5,
      type: "system",
      priority: "low",
      title: "System Backup Complete",
      message: "Daily system backup completed successfully at 3:00 AM.",
      time: "6 hours ago",
      read: true,
      icon: CheckCircle,
      color: "text-green-500"
    }
  ];

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || 
                         (selectedFilter === "unread" && !notification.read) ||
                         (selectedFilter === "high" && notification.priority === "high") ||
                         notification.type === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with hotel operations and guest requests
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button className="gap-2">
            <Check className="h-4 w-4" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Bell className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.priority === "high").length}
                </p>
                <p className="text-sm text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.type === "maintenance").length}
                </p>
                <p className="text-sm text-muted-foreground">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.read).length}
                </p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="high">High Priority</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                <TabsTrigger value="guest">Guest</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications ({filteredNotifications.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-start gap-4 p-6 border-b last:border-b-0 hover:bg-muted/50 transition-colors ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className={`p-2 rounded-full bg-muted/50`}>
                  <notification.icon className={`h-5 w-5 ${notification.color}`} />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Badge 
                        variant={
                          notification.priority === 'high' ? 'destructive' :
                          notification.priority === 'medium' ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {notification.priority}
                      </Badge>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {notification.time}
                    </p>
                    
                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button variant="ghost" size="sm" className="text-xs">
                          Mark as Read
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}