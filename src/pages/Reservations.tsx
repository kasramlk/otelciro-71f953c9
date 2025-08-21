import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, MoreHorizontal, Plus, Search, Filter, Receipt } from "lucide-react";
import FolioManager from "@/components/FolioManager";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const newReservationSchema = z.object({
  guestId: z.string().min(1, "Guest is required"),
  checkIn: z.date({ required_error: "Check-in date is required" }),
  checkOut: z.date({ required_error: "Check-out date is required" }),
  adults: z.number().min(1, "At least 1 adult required"),
  children: z.number().min(0),
  roomTypeId: z.string().min(1, "Room type is required"),
  roomId: z.string().optional(),
  ratePlanId: z.string().min(1, "Rate plan is required"),
  source: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  currency: z.string().default("USD"),
  notes: z.string().optional(),
});

type NewReservationData = z.infer<typeof newReservationSchema>;

// Mock data for demonstration
const mockReservations = [
  {
    id: "1",
    code: "RES001",
    guest: "John Doe",
    checkIn: "2024-01-15",
    checkOut: "2024-01-18",
    roomType: "Deluxe Room",
    room: "101",
    ratePlan: "Standard Rate",
    status: "Booked",
    source: "Direct",
    price: 299.99,
    currency: "USD",
  },
  {
    id: "2",
    code: "RES002",
    guest: "Jane Smith",
    checkIn: "2024-01-20",
    checkOut: "2024-01-22",
    roomType: "Suite",
    room: "201",
    ratePlan: "Premium Rate",
    status: "CheckedIn",
    source: "Booking.com",
    price: 499.99,
    currency: "USD",
  },
];

const mockGuests = [
  { id: "1", name: "John Doe" },
  { id: "2", name: "Jane Smith" },
  { id: "3", name: "Bob Johnson" },
];

const mockRoomTypes = [
  { id: "1", name: "Standard Room", dailyRate: 199.99 },
  { id: "2", name: "Deluxe Room", dailyRate: 299.99 },
  { id: "3", name: "Suite", dailyRate: 499.99 },
];

const mockRooms = [
  { id: "1", number: "101", roomTypeId: "1" },
  { id: "2", number: "102", roomTypeId: "2" },
  { id: "3", number: "201", roomTypeId: "3" },
];

const mockRatePlans = [
  { id: "1", name: "Standard Rate" },
  { id: "2", name: "Premium Rate" },
  { id: "3", name: "Corporate Rate" },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Booked":
      return "default";
    case "CheckedIn":
      return "secondary";
    case "CheckedOut":
      return "outline";
    case "Cancelled":
      return "destructive";
    case "NoShow":
      return "destructive";
    default:
      return "default";
  }
};

export default function Reservations() {
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [isReservationDetailOpen, setIsReservationDetailOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const { toast } = useToast();

  const form = useForm<NewReservationData>({
    resolver: zodResolver(newReservationSchema),
    defaultValues: {
      adults: 1,
      children: 0,
      currency: "USD",
    },
  });

  const watchedCheckIn = form.watch("checkIn");
  const watchedCheckOut = form.watch("checkOut");
  const watchedRoomTypeId = form.watch("roomTypeId");

  // Calculate price based on dates and room type
  const calculateTotalPrice = () => {
    if (watchedCheckIn && watchedCheckOut && watchedRoomTypeId) {
      const nights = Math.ceil(
        (watchedCheckOut.getTime() - watchedCheckIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      const roomType = mockRoomTypes.find((rt) => rt.id === watchedRoomTypeId);
      if (roomType && nights > 0) {
        return nights * roomType.dailyRate;
      }
    }
    return 0;
  };

  const onSubmit = (data: NewReservationData) => {
    console.log("New reservation data:", data);
    toast({
      title: "Reservation created",
      description: "The reservation has been successfully created.",
    });
    setIsNewReservationOpen(false);
    form.reset();
  };

  const handleViewReservation = (reservation) => {
    setSelectedReservation(reservation);
    setIsReservationDetailOpen(true);
  };

  const filteredReservations = mockReservations.filter((reservation) => {
    const matchesSearch = 
      reservation.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.guest.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.room.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter;
    const matchesSource = sourceFilter === "all" || reservation.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Reservations</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={isNewReservationOpen} onOpenChange={setIsNewReservationOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                <Plus className="mr-2 h-4 w-4" />
                New Reservation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Reservation</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new reservation.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guestId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guest</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a guest" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockGuests.map((guest) => (
                                <SelectItem key={guest.id} value={guest.id}>
                                  {guest.name}
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
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Direct">Direct</SelectItem>
                              <SelectItem value="Booking.com">Booking.com</SelectItem>
                              <SelectItem value="Expedia">Expedia</SelectItem>
                              <SelectItem value="Phone">Phone</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="checkIn"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Check-in Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="checkOut"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Check-out Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date <= (watchedCheckIn || new Date())}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="adults"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adults</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="children"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Children</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="roomTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select room type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockRoomTypes.map((roomType) => (
                                <SelectItem key={roomType.id} value={roomType.id}>
                                  {roomType.name} (${roomType.dailyRate}/night)
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
                      name="roomId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specific Room (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select room" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockRooms
                                .filter((room) => room.roomTypeId === watchedRoomTypeId)
                                .map((room) => (
                                  <SelectItem key={room.id} value={room.id}>
                                    Room {room.number}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="ratePlanId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate Plan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rate plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockRatePlans.map((ratePlan) => (
                              <SelectItem key={ratePlan.id} value={ratePlan.id}>
                                {ratePlan.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              value={calculateTotalPrice()}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any special requests or notes..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsNewReservationOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                      Create Reservation
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reservations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Booked">Booked</SelectItem>
            <SelectItem value="CheckedIn">Checked In</SelectItem>
            <SelectItem value="CheckedOut">Checked Out</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="NoShow">No Show</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="Direct">Direct</SelectItem>
            <SelectItem value="Booking.com">Booking.com</SelectItem>
            <SelectItem value="Expedia">Expedia</SelectItem>
            <SelectItem value="Phone">Phone</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Room Type</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Rate Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReservations.map((reservation) => (
              <TableRow key={reservation.id}>
                <TableCell className="font-medium">{reservation.code}</TableCell>
                <TableCell>{reservation.guest}</TableCell>
                <TableCell>{reservation.checkIn}</TableCell>
                <TableCell>{reservation.checkOut}</TableCell>
                <TableCell>{reservation.roomType}</TableCell>
                <TableCell>{reservation.room}</TableCell>
                <TableCell>{reservation.ratePlan}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(reservation.status)}>
                    {reservation.status}
                  </Badge>
                </TableCell>
                <TableCell>{reservation.source}</TableCell>
                <TableCell>${reservation.price.toFixed(2)}</TableCell>
                <TableCell>{reservation.currency}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleViewReservation(reservation)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Reservation</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {reservation.status === "Booked" && (
                        <DropdownMenuItem>Check In</DropdownMenuItem>
                      )}
                      {reservation.status === "CheckedIn" && (
                        <DropdownMenuItem>Check Out</DropdownMenuItem>
                      )}
                      {reservation.status === "Booked" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Cancel Reservation
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Reservation Detail Dialog */}
      <Dialog open={isReservationDetailOpen} onOpenChange={setIsReservationDetailOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedReservation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Receipt className="mr-2 h-5 w-5" />
                  Reservation Details: {selectedReservation.code}
                </DialogTitle>
                <DialogDescription>
                  Manage reservation details and folio
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Reservation Details</TabsTrigger>
                  <TabsTrigger value="folio">Folio Management</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Guest Information</h4>
                        <p className="text-lg font-medium">{selectedReservation.guest}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground">Check-in</h4>
                          <p>{selectedReservation.checkIn}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground">Check-out</h4>
                          <p>{selectedReservation.checkOut}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground">Room Type</h4>
                          <p>{selectedReservation.roomType}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground">Room Number</h4>
                          <p>{selectedReservation.room}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Rate Plan</h4>
                        <p>{selectedReservation.ratePlan}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground">Status</h4>
                          <Badge variant={getStatusBadgeVariant(selectedReservation.status)}>
                            {selectedReservation.status}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground">Source</h4>
                          <p>{selectedReservation.source}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground">Total Price</h4>
                          <p className="text-lg font-semibold">${selectedReservation.price.toFixed(2)}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground">Currency</h4>
                          <p>{selectedReservation.currency}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="folio" className="space-y-4">
                  <FolioManager 
                    reservationId={selectedReservation.id} 
                    reservationCode={selectedReservation.code}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}