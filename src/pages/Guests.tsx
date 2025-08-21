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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MoreHorizontal, Plus, Search, User, Eye, Edit, Trash2, Phone, Mail, MapPin, FileText, Calendar, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const newGuestSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  idNumber: z.string().optional(),
});

type NewGuestData = z.infer<typeof newGuestSchema>;

// Mock data for demonstration
const mockGuests = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@email.com",
    phone: "+1 (555) 123-4567",
    nationality: "United States",
    idNumber: "A123456789",
    totalReservations: 5,
    totalSpent: 2450.99,
    lastVisit: "2024-01-15",
    reservations: [
      { code: "RES001", checkIn: "2024-01-15", checkOut: "2024-01-18", status: "CheckedOut", total: 899.97 },
      { code: "RES015", checkIn: "2023-12-10", checkOut: "2023-12-12", status: "CheckedOut", total: 599.98 },
      { code: "RES032", checkIn: "2023-10-05", checkOut: "2023-10-08", status: "CheckedOut", total: 951.04 },
    ]
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@email.com",
    phone: "+1 (555) 987-6543",
    nationality: "Canada",
    idNumber: "C987654321",
    totalReservations: 3,
    totalSpent: 1299.97,
    lastVisit: "2024-01-20",
    reservations: [
      { code: "RES002", checkIn: "2024-01-20", checkOut: "2024-01-22", status: "CheckedIn", total: 499.99 },
      { code: "RES018", checkIn: "2023-11-15", checkOut: "2023-11-17", status: "CheckedOut", total: 399.99 },
      { code: "RES025", checkIn: "2023-09-20", checkOut: "2023-09-23", status: "CheckedOut", total: 399.99 },
    ]
  },
  {
    id: "3",
    firstName: "Bob",
    lastName: "Johnson",
    email: "bob.johnson@email.com",
    phone: "+44 20 7123 4567",
    nationality: "United Kingdom",
    idNumber: "UK123456789",
    totalReservations: 2,
    totalSpent: 799.98,
    lastVisit: "2024-01-10",
    reservations: [
      { code: "RES012", checkIn: "2024-01-10", checkOut: "2024-01-12", status: "CheckedOut", total: 399.99 },
      { code: "RES008", checkIn: "2023-08-15", checkOut: "2023-08-18", status: "CheckedOut", total: 399.99 },
    ]
  },
  {
    id: "4",
    firstName: "Alice",
    lastName: "Wilson",
    email: "",
    phone: "+1 (555) 456-7890",
    nationality: "United States",
    idNumber: "A987123456",
    totalReservations: 1,
    totalSpent: 299.99,
    lastVisit: "2024-01-08",
    reservations: [
      { code: "RES005", checkIn: "2024-01-08", checkOut: "2024-01-10", status: "CheckedOut", total: 299.99 },
    ]
  },
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
    default:
      return "default";
  }
};

export default function Guests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isGuestCardOpen, setIsGuestCardOpen] = useState(false);
  const [isNewGuestOpen, setIsNewGuestOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const { toast } = useToast();

  const form = useForm<NewGuestData>({
    resolver: zodResolver(newGuestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      nationality: "",
      idNumber: "",
    },
  });

  const filteredGuests = mockGuests.filter((guest) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      guest.firstName.toLowerCase().includes(searchLower) ||
      guest.lastName.toLowerCase().includes(searchLower) ||
      guest.email.toLowerCase().includes(searchLower) ||
      guest.idNumber.toLowerCase().includes(searchLower) ||
      guest.phone.toLowerCase().includes(searchLower)
    );
  });

  const onSubmit = (data: NewGuestData) => {
    console.log("Guest data:", data);
    toast({
      title: editingGuest ? "Guest updated" : "Guest created",
      description: `The guest has been successfully ${editingGuest ? "updated" : "created"}.`,
    });
    setIsNewGuestOpen(false);
    setEditingGuest(null);
    form.reset();
  };

  const handleViewGuest = (guest) => {
    setSelectedGuest(guest);
    setIsGuestCardOpen(true);
  };

  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
    form.setValue("firstName", guest.firstName);
    form.setValue("lastName", guest.lastName);
    form.setValue("email", guest.email);
    form.setValue("phone", guest.phone);
    form.setValue("nationality", guest.nationality);
    form.setValue("idNumber", guest.idNumber);
    setIsNewGuestOpen(true);
  };

  const handleDeleteGuest = (guest) => {
    console.log("Delete guest:", guest);
    toast({
      title: "Guest deleted",
      description: "The guest has been successfully deleted.",
      variant: "destructive",
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Guests</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={isNewGuestOpen} onOpenChange={setIsNewGuestOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingGuest(null);
                form.reset();
              }}>
                <Plus className="mr-2 h-4 w-4" />
                New Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingGuest ? "Edit Guest" : "Create New Guest"}</DialogTitle>
                <DialogDescription>
                  {editingGuest ? "Update guest information." : "Fill in the details to create a new guest."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="john.doe@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="United States" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="idNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="A123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsNewGuestOpen(false);
                      setEditingGuest(null);
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingGuest ? "Update Guest" : "Create Guest"}
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
            placeholder="Search guests by name, email, or document number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Nationality</TableHead>
              <TableHead>Document No.</TableHead>
              <TableHead>Total Reservations</TableHead>
              <TableHead>Last Visit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell className="font-medium">
                  {guest.firstName} {guest.lastName}
                </TableCell>
                <TableCell>{guest.email || "N/A"}</TableCell>
                <TableCell>{guest.phone || "N/A"}</TableCell>
                <TableCell>{guest.nationality || "N/A"}</TableCell>
                <TableCell>{guest.idNumber || "N/A"}</TableCell>
                <TableCell>{guest.totalReservations}</TableCell>
                <TableCell>{guest.lastVisit}</TableCell>
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
                      <DropdownMenuItem onClick={() => handleViewGuest(guest)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Guest Card
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditGuest(guest)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Guest
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteGuest(guest)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Guest
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Guest Card Dialog */}
      <Dialog open={isGuestCardOpen} onOpenChange={setIsGuestCardOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedGuest && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Guest Profile: {selectedGuest.firstName} {selectedGuest.lastName}
                </DialogTitle>
                <DialogDescription>
                  Complete guest information and reservation history
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Information */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                        <p className="text-sm">{selectedGuest.firstName} {selectedGuest.lastName}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center">
                          <Mail className="mr-1 h-3 w-3" />
                          Email
                        </p>
                        <p className="text-sm">{selectedGuest.email || "Not provided"}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center">
                          <Phone className="mr-1 h-3 w-3" />
                          Phone
                        </p>
                        <p className="text-sm">{selectedGuest.phone || "Not provided"}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center">
                          <MapPin className="mr-1 h-3 w-3" />
                          Nationality
                        </p>
                        <p className="text-sm">{selectedGuest.nationality || "Not provided"}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center">
                          <FileText className="mr-1 h-3 w-3" />
                          Document No.
                        </p>
                        <p className="text-sm">{selectedGuest.idNumber || "Not provided"}</p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-primary">{selectedGuest.totalReservations}</p>
                          <p className="text-xs text-muted-foreground">Total Reservations</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">${selectedGuest.totalSpent}</p>
                          <p className="text-xs text-muted-foreground">Total Spent</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Reservation History */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Reservation History
                      </CardTitle>
                      <CardDescription>
                        {selectedGuest.reservations.length} reservations found
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedGuest.reservations.map((reservation, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{reservation.code}</Badge>
                                <Badge variant={getStatusBadgeVariant(reservation.status)}>
                                  {reservation.status}
                                </Badge>
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <DollarSign className="mr-1 h-3 w-3" />
                                ${reservation.total}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium">Check-in</p>
                                <p className="text-muted-foreground">{reservation.checkIn}</p>
                              </div>
                              <div>
                                <p className="font-medium">Check-out</p>
                                <p className="text-muted-foreground">{reservation.checkOut}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}