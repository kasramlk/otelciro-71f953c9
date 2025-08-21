import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Smartphone, 
  MessageSquare, 
  Key, 
  Calendar, 
  Star,
  FileText,
  Mic,
  QrCode,
  Bot,
  ShoppingBag,
  UserCheck,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import MobileCheckIn from "@/components/guest-experience/MobileCheckIn";
import KioskCheckIn from "@/components/guest-experience/KioskCheckIn";
import GuestChatbot from "@/components/guest-experience/GuestChatbot";
import ServiceOrdering from "@/components/guest-experience/ServiceOrdering";
import DigitalInvoicing from "@/components/guest-experience/DigitalInvoicing";
import { format } from "date-fns";

// Mock data
const mockServiceRequests = [
  {
    id: "1",
    guestName: "John Smith",
    roomNumber: "301",
    serviceType: "Room Service",
    title: "Breakfast Order",
    description: "Continental breakfast for 2, orange juice, extra towels",
    status: "In Progress",
    priority: "Medium",
    requestedTime: new Date(Date.now() - 3600000), // 1 hour ago
    estimatedCost: 45.00
  },
  {
    id: "2", 
    guestName: "Sarah Johnson",
    roomNumber: "205",
    serviceType: "Housekeeping",
    title: "Extra Pillows",
    description: "Need 2 extra pillows and blanket",
    status: "Completed",
    priority: "Low",
    requestedTime: new Date(Date.now() - 7200000), // 2 hours ago
    estimatedCost: 0.00
  },
  {
    id: "3",
    guestName: "Michael Brown", 
    roomNumber: "102",
    serviceType: "Concierge",
    title: "Restaurant Reservation",
    description: "Dinner reservation for 4 at Italian restaurant nearby",
    status: "Pending",
    priority: "High",
    requestedTime: new Date(Date.now() - 1800000), // 30 minutes ago
    estimatedCost: 0.00
  }
];

const mockGuestInteractions = [
  {
    id: "1",
    guestName: "John Smith",
    interactionType: "Chat",
    content: "What time is breakfast served?",
    aiResponse: "Breakfast is served daily from 7:00 AM to 10:30 AM in our main restaurant.",
    resolved: true,
    createdAt: new Date(Date.now() - 1800000)
  },
  {
    id: "2",
    guestName: "Emma Wilson", 
    interactionType: "WhatsApp",
    content: "Can I get late checkout?",
    aiResponse: "I've arranged late checkout until 2 PM for your room at no additional charge.",
    resolved: true,
    createdAt: new Date(Date.now() - 3600000)
  },
  {
    id: "3",
    guestName: "David Lee",
    interactionType: "Kiosk",
    content: "Digital key not working",
    aiResponse: "I've refreshed your digital key. Please try again. If issues persist, contact front desk.",
    resolved: false,
    createdAt: new Date(Date.now() - 900000)
  }
];

const mockDigitalKeys = [
  {
    id: "1",
    guestName: "John Smith",
    roomNumber: "301", 
    keyType: "QR",
    issuedAt: new Date(Date.now() - 86400000),
    expiresAt: new Date(Date.now() + 86400000),
    isActive: true,
    accessCount: 8
  },
  {
    id: "2",
    guestName: "Sarah Johnson",
    roomNumber: "205",
    keyType: "NFC", 
    issuedAt: new Date(Date.now() - 43200000),
    expiresAt: new Date(Date.now() + 43200000),
    isActive: true,
    accessCount: 12
  }
];

export default function GuestExperience() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline" className="text-yellow-600">Pending</Badge>;
      case "In Progress": 
        return <Badge variant="secondary" className="text-blue-600">In Progress</Badge>;
      case "Completed":
        return <Badge variant="secondary" className="text-green-600">Completed</Badge>;
      case "Cancelled":
        return <Badge variant="outline" className="text-red-600">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      Low: "bg-blue-100 text-blue-700",
      Medium: "bg-yellow-100 text-yellow-700", 
      High: "bg-red-100 text-red-700",
      Urgent: "bg-red-200 text-red-800"
    };
    return <Badge className={colors[priority] || "bg-gray-100 text-gray-700"}>{priority}</Badge>;
  };

  // Render selected module
  if (selectedModule === "mobile-checkin") {
    return <MobileCheckIn onBack={() => setSelectedModule(null)} />;
  }
  if (selectedModule === "kiosk-checkin") {
    return <KioskCheckIn onBack={() => setSelectedModule(null)} />;
  }
  if (selectedModule === "chatbot") {
    return <GuestChatbot onBack={() => setSelectedModule(null)} />;
  }
  if (selectedModule === "service-ordering") {
    return <ServiceOrdering onBack={() => setSelectedModule(null)} />;
  }
  if (selectedModule === "digital-invoicing") {
    return <DigitalInvoicing onBack={() => setSelectedModule(null)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="border-l-4 border-primary pl-4">
        <h1 className="text-3xl font-bold text-foreground">Guest Experience & Automation</h1>
        <p className="text-muted-foreground">Digital services and AI-powered guest interactions</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Digital Check-ins Today</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              85% of arrivals
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Digital Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDigitalKeys.length}</div>
            <p className="text-xs text-muted-foreground">
              QR & NFC active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Requests</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockServiceRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              1 pending response
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Interactions</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockGuestInteractions.length}</div>
            <p className="text-xs text-muted-foreground">
              95% resolution rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Module Launchers */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedModule("mobile-checkin")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Mobile Check-in
            </CardTitle>
            <CardDescription>
              Guest pre-arrival and mobile check-in flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Launch Mobile Interface
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedModule("kiosk-checkin")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Kiosk Check-in
            </CardTitle>
            <CardDescription>
              Self-service kiosk terminal interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Launch Kiosk Mode
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedModule("chatbot")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              AI Chatbot
            </CardTitle>
            <CardDescription>
              Guest support and automated responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Open Chat Interface
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedModule("service-ordering")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Service Ordering
            </CardTitle>
            <CardDescription>
              In-stay service requests and ordering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Manage Services
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedModule("digital-invoicing")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Digital Invoicing
            </CardTitle>
            <CardDescription>
              E-invoicing and digital receipts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Generate Invoices
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Service Requests</TabsTrigger>
          <TabsTrigger value="interactions">AI Interactions</TabsTrigger>
          <TabsTrigger value="keys">Digital Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Today's Activity</CardTitle>
                <CardDescription>Real-time guest interaction summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Mobile Check-ins</span>
                  </div>
                  <Badge variant="secondary">12 completed</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Pending Services</span>
                  </div>
                  <Badge variant="outline">1 pending</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">AI Resolutions</span>
                  </div>
                  <Badge variant="secondary">24 automated</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guest Satisfaction</CardTitle>
                <CardDescription>Recent feedback and ratings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Digital Experience</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">4.8</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Support Quality</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">4.6</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Service Speed</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">4.9</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Requests</CardTitle>
              <CardDescription>Guest service requests and orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Requested</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockServiceRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.guestName}</div>
                          <div className="text-sm text-muted-foreground">{request.title}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.roomNumber}</Badge>
                      </TableCell>
                      <TableCell>{request.serviceType}</TableCell>
                      <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>${request.estimatedCost.toFixed(2)}</TableCell>
                      <TableCell>{format(request.requestedTime, "MMM dd, HH:mm")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Guest Interactions</CardTitle>
              <CardDescription>Chatbot conversations and automated responses</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Query</TableHead>
                    <TableHead>AI Response</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockGuestInteractions.map((interaction) => (
                    <TableRow key={interaction.id}>
                      <TableCell className="font-medium">{interaction.guestName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{interaction.interactionType}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{interaction.content}</TableCell>
                      <TableCell className="max-w-xs truncate">{interaction.aiResponse}</TableCell>
                      <TableCell>
                        {interaction.resolved ? (
                          <Badge variant="secondary" className="text-green-600">Resolved</Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>{format(interaction.createdAt, "MMM dd, HH:mm")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Digital Keys</CardTitle>
              <CardDescription>Active mobile and digital key access</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Key Type</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Access Count</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDigitalKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.guestName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{key.roomNumber}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4" />
                          {key.keyType}
                        </div>
                      </TableCell>
                      <TableCell>{format(key.issuedAt, "MMM dd, HH:mm")}</TableCell>
                      <TableCell>{format(key.expiresAt, "MMM dd, HH:mm")}</TableCell>
                      <TableCell>{key.accessCount} times</TableCell>
                      <TableCell>
                        {key.isActive ? (
                          <Badge variant="secondary" className="text-green-600">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">Expired</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}