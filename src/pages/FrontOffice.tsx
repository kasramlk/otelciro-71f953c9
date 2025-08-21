import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  LogIn as CheckIn, 
  LogOut as CheckOut, 
  Users, 
  AlertTriangle, 
  Search,
  Phone,
  Mail,
  Calendar,
  User,
  Building,
  CreditCard,
  FileText,
  MoreHorizontal,
  ArrowRight,
  Clock,
  BedDouble
} from "lucide-react";
import FolioManager from "@/components/FolioManager";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data for demonstration
const mockArrivals = [
  {
    id: "1",
    guestName: "John Smith",
    email: "john.smith@email.com",
    phone: "+1-555-0123",
    roomType: "Deluxe King",
    roomNumber: null,
    checkIn: new Date(),
    nights: 3,
    adults: 2,
    children: 0,
    reservationCode: "RES001",
    status: "Expected",
    source: "Direct",
    specialRequests: ["Late arrival", "High floor"],
    totalAmount: 450.00,
    balance: 450.00
  },
  {
    id: "2", 
    guestName: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1-555-0124",
    roomType: "Standard Queen",
    roomNumber: "205",
    checkIn: new Date(),
    nights: 2,
    adults: 1,
    children: 1,
    reservationCode: "RES002",
    status: "Checked In",
    source: "Booking.com",
    specialRequests: ["Extra bed"],
    totalAmount: 320.00,
    balance: 0.00
  }
];

const mockDepartures = [
  {
    id: "3",
    guestName: "Michael Brown",
    email: "m.brown@email.com", 
    phone: "+1-555-0125",
    roomType: "Suite",
    roomNumber: "301",
    checkOut: new Date(),
    nights: 4,
    adults: 2,
    children: 0,
    reservationCode: "RES003",
    status: "In House",
    source: "Direct",
    totalAmount: 800.00,
    balance: 150.00,
    folioItems: 5
  }
];

const mockInHouse = [
  {
    id: "4",
    guestName: "Emma Wilson",
    email: "emma.w@email.com",
    phone: "+1-555-0126", 
    roomType: "Deluxe King",
    roomNumber: "102",
    checkIn: new Date(Date.now() - 86400000), // Yesterday
    checkOut: new Date(Date.now() + 86400000), // Tomorrow
    nights: 3,
    adults: 2,
    children: 1,
    reservationCode: "RES004",
    status: "In House",
    source: "Expedia",
    totalAmount: 675.00,
    balance: -25.00, // Credit balance
    folioItems: 8
  }
];

export default function FrontOffice() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("arrivals");
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null);

  const handleCheckIn = (reservationId: string) => {
    console.log("Check in:", reservationId);
    // TODO: Implement check-in workflow
  };

  const handleCheckOut = (reservationId: string) => {
    console.log("Check out:", reservationId);
    // TODO: Implement check-out workflow  
  };

  const handleRoomMove = (reservationId: string) => {
    console.log("Room move:", reservationId);
    // TODO: Implement room move workflow
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Expected":
        return <Badge variant="outline" className="text-blue-600">Expected</Badge>;
      case "Checked In":
        return <Badge variant="secondary" className="text-green-600">Checked In</Badge>;
      case "In House":
        return <Badge variant="secondary">In House</Badge>;
      case "Checked Out":
        return <Badge variant="outline" className="text-gray-600">Checked Out</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    const color = source === "Direct" ? "bg-green-100 text-green-700" : 
                 source.includes(".com") ? "bg-blue-100 text-blue-700" : 
                 "bg-purple-100 text-purple-700";
    return <Badge variant="outline" className={color}>{source}</Badge>;
  };

  if (selectedReservation) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={() => setSelectedReservation(null)}
              className="mb-2"
            >
              ← Back to Front Office
            </Button>
            <h1 className="text-3xl font-bold">Guest Folio</h1>
            <p className="text-muted-foreground">Manage charges and payments</p>
          </div>
        </div>
        <FolioManager 
          reservationId={selectedReservation} 
          reservationCode={mockArrivals[0]?.reservationCode || "RES001"} 
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="border-l-4 border-primary pl-4">
        <h1 className="text-3xl font-bold text-foreground">Front Office</h1>
        <p className="text-muted-foreground">Manage arrivals, departures, and in-house guests</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Arrivals</CardTitle>
            <CheckIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockArrivals.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Departures</CardTitle>
            <CheckOut className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDepartures.length}</div>
            <p className="text-xs text-muted-foreground">
              -1 from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In House</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockInHouse.length}</div>
            <p className="text-xs text-muted-foreground">
              85% occupancy
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overbooked</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">0</div>
            <p className="text-xs text-muted-foreground">
              No overbookings today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by guest name, room, or reservation code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="arrivals" className="flex items-center gap-2">
            <CheckIn className="h-4 w-4" />
            Arrivals ({mockArrivals.length})
          </TabsTrigger>
          <TabsTrigger value="departures" className="flex items-center gap-2">
            <CheckOut className="h-4 w-4" />
            Departures ({mockDepartures.length})
          </TabsTrigger>
          <TabsTrigger value="inhouse" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            In House ({mockInHouse.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="arrivals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Arrivals</CardTitle>
              <CardDescription>Guests expected to check in today</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room Type</TableHead>
                    <TableHead>Room #</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockArrivals.map((arrival) => (
                    <TableRow key={arrival.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{arrival.guestName}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {arrival.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {arrival.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BedDouble className="h-4 w-4 text-muted-foreground" />
                          {arrival.roomType}
                        </div>
                      </TableCell>
                      <TableCell>
                        {arrival.roomNumber ? (
                          <Badge variant="outline">{arrival.roomNumber}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {arrival.nights} nights
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {arrival.adults}A {arrival.children > 0 && `${arrival.children}C`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {arrival.reservationCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(arrival.status)}</TableCell>
                      <TableCell>{getSourceBadge(arrival.source)}</TableCell>
                      <TableCell>
                        <div className={`font-medium ${arrival.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${Math.abs(arrival.balance).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          of ${arrival.totalAmount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {arrival.status === "Expected" && (
                              <DropdownMenuItem onClick={() => handleCheckIn(arrival.id)}>
                                <CheckIn className="mr-2 h-4 w-4" />
                                Check In
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setSelectedReservation(arrival.id)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Folio
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoomMove(arrival.id)}>
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Room Move
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Departures</CardTitle>
              <CardDescription>Guests scheduled to check out today</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Stay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDepartures.map((departure) => (
                    <TableRow key={departure.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{departure.guestName}</div>
                          <div className="text-sm text-muted-foreground">{departure.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <BedDouble className="h-4 w-4" />
                            {departure.roomType}
                          </div>
                          <Badge variant="outline">{departure.roomNumber}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {departure.nights} nights
                          <div className="text-xs text-muted-foreground">
                            {departure.reservationCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(departure.status)}</TableCell>
                      <TableCell>{getSourceBadge(departure.source)}</TableCell>
                      <TableCell>
                        <div className={`font-medium ${departure.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${Math.abs(departure.balance).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {departure.folioItems} items
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleCheckOut(departure.id)}>
                              <CheckOut className="mr-2 h-4 w-4" />
                              Check Out
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedReservation(departure.id)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Folio
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Clock className="mr-2 h-4 w-4" />
                              Late Checkout
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inhouse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>In House Guests</CardTitle>
              <CardDescription>Currently staying guests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Stay Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInHouse.map((guest) => (
                    <TableRow key={guest.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{guest.guestName}</div>
                          <div className="text-sm text-muted-foreground">{guest.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <BedDouble className="h-4 w-4" />
                            {guest.roomType}
                          </div>
                          <Badge variant="outline">{guest.roomNumber}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(guest.checkIn, "MMM dd")} - {format(guest.checkOut, "MMM dd")}</div>
                          <div className="text-xs text-muted-foreground">
                            {guest.nights} nights • {guest.reservationCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(guest.status)}</TableCell>
                      <TableCell>{getSourceBadge(guest.source)}</TableCell>
                      <TableCell>
                        <div className={`font-medium ${guest.balance > 0 ? 'text-red-600' : guest.balance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {guest.balance < 0 ? 'Credit: ' : ''}${Math.abs(guest.balance).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {guest.folioItems} folio items
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setSelectedReservation(guest.id)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Folio
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoomMove(guest.id)}>
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Room Move
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Process Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Building className="mr-2 h-4 w-4" />
                              Split Folio
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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