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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Building,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  FileText,
  Calendar
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const agencySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  contactEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  contactPerson: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  creditLimit: z.number().min(0, "Credit limit must be positive"),
  paymentTerms: z.number().min(1, "Payment terms must be at least 1 day"),
});

type AgencyData = z.infer<typeof agencySchema>;

// Mock data
const mockAgencies = [
  {
    id: "1",
    name: "Booking.com",
    type: "OTA",
    contactEmail: "partner@booking.com",
    contactPhone: "+31 20 717 9337",
    contactPerson: "John Partner",
    address: "Herengracht 597",
    city: "Amsterdam",
    country: "Netherlands",
    creditLimit: 50000.00,
    currentBalance: 12500.75,
    paymentTerms: 15,
    isActive: true,
  },
  {
    id: "2",
    name: "Expedia Group",
    type: "OTA",
    contactEmail: "hotels@expedia.com",
    contactPhone: "+1 425 679 7200",
    contactPerson: "Sarah Manager",
    address: "1111 Expedia Group Way W",
    city: "Seattle",
    country: "United States",
    creditLimit: 75000.00,
    currentBalance: 8750.25,
    paymentTerms: 30,
    isActive: true,
  },
  {
    id: "3",
    name: "Corporate Travel Solutions",
    type: "Corporate",
    contactEmail: "bookings@corptravel.com",
    contactPhone: "+1 555 123 4567",
    contactPerson: "Mike Business",
    address: "123 Business Ave",
    city: "New York",
    country: "United States",
    creditLimit: 25000.00,
    currentBalance: 5500.00,
    paymentTerms: 45,
    isActive: true,
  },
];

const mockPricingAgreements = [
  {
    id: "1",
    name: "Standard Rate Agreement",
    agencyId: "1",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    currency: "USD",
    discountPercent: 15,
    allotment: 10,
    isActive: true,
  },
  {
    id: "2", 
    name: "Corporate Fixed Rate",
    agencyId: "3",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-06-30"),
    currency: "USD",
    fixedRate: 180.00,
    allotment: 5,
    isActive: true,
  },
];

const mockReservations = [
  {
    id: "1",
    code: "RES001",
    guest: "John Doe",
    agencyId: "1",
    checkIn: "2024-01-15",
    checkOut: "2024-01-18",
    totalPrice: 899.99,
    status: "CheckedOut",
  },
  {
    id: "2",
    code: "RES002", 
    guest: "Jane Smith",
    agencyId: "1",
    checkIn: "2024-01-20",
    checkOut: "2024-01-22",
    totalPrice: 499.99,
    status: "CheckedIn",
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case "OTA":
      return "bg-blue-100 text-blue-800";
    case "Corporate":
      return "bg-green-100 text-green-800";
    case "TravelAgent":
      return "bg-purple-100 text-purple-800";
    case "Wholesaler":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [isAgencyCardOpen, setIsAgencyCardOpen] = useState(false);
  const [isNewAgencyOpen, setIsNewAgencyOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);
  const { toast } = useToast();

  const form = useForm<AgencyData>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      type: "OTA",
      creditLimit: 0,
      paymentTerms: 30,
    },
  });

  const filteredAgencies = mockAgencies.filter((agency) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      agency.name.toLowerCase().includes(searchLower) ||
      agency.type.toLowerCase().includes(searchLower) ||
      agency.contactPerson.toLowerCase().includes(searchLower)
    );
  });

  const onSubmit = (data: AgencyData) => {
    console.log("Agency data:", data);
    toast({
      title: editingAgency ? "Agency updated" : "Agency created",
      description: `${data.name} has been successfully ${editingAgency ? "updated" : "created"}.`,
    });
    setIsNewAgencyOpen(false);
    setEditingAgency(null);
    form.reset();
  };

  const handleViewAgency = (agency) => {
    setSelectedAgency(agency);
    setIsAgencyCardOpen(true);
  };

  const handleEditAgency = (agency) => {
    setEditingAgency(agency);
    form.reset(agency);
    setIsNewAgencyOpen(true);
  };

  const handleDeleteAgency = (agency) => {
    console.log("Delete agency:", agency);
    toast({
      title: "Agency deleted",
      description: `${agency.name} has been successfully deleted.`,
      variant: "destructive",
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center">
          <TrendingUp className="mr-2 h-8 w-8" />
          Sales & Agencies
        </h2>
        <div className="flex items-center space-x-2">
          <Dialog open={isNewAgencyOpen} onOpenChange={setIsNewAgencyOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingAgency(null);
                form.reset();
              }}>
                <Plus className="mr-2 h-4 w-4" />
                New Agency
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAgency ? "Edit Agency" : "Create New Agency"}</DialogTitle>
                <DialogDescription>
                  {editingAgency ? "Update agency information." : "Fill in the details to create a new agency."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agency Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Booking.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="OTA">OTA</SelectItem>
                              <SelectItem value="Corporate">Corporate</SelectItem>
                              <SelectItem value="TravelAgent">Travel Agent</SelectItem>
                              <SelectItem value="Wholesaler">Wholesaler</SelectItem>
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
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contact@agency.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 555 123 4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Business Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="United States" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="creditLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Limit ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="50000.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Terms (days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="30"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsNewAgencyOpen(false);
                      setEditingAgency(null);
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingAgency ? "Update Agency" : "Create Agency"}
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
            placeholder="Search agencies by name, type, or contact person..."
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
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Credit Limit</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Payment Terms</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAgencies.map((agency) => (
              <TableRow key={agency.id}>
                <TableCell className="font-medium">{agency.name}</TableCell>
                <TableCell>
                  <Badge className={getTypeColor(agency.type)}>
                    {agency.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{agency.contactPerson}</div>
                    <div className="text-sm text-muted-foreground">{agency.contactEmail}</div>
                  </div>
                </TableCell>
                <TableCell>${agency.creditLimit.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={agency.currentBalance > 0 ? "text-red-600" : "text-green-600"}>
                    ${Math.abs(agency.currentBalance).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>{agency.paymentTerms} days</TableCell>
                <TableCell>
                  <Badge variant={agency.isActive ? "default" : "secondary"}>
                    {agency.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
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
                      <DropdownMenuItem onClick={() => handleViewAgency(agency)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Agency Card
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditAgency(agency)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Agency
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteAgency(agency)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Agency
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Agency Card Dialog */}
      <Dialog open={isAgencyCardOpen} onOpenChange={setIsAgencyCardOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedAgency && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Agency Profile: {selectedAgency.name}
                </DialogTitle>
                <DialogDescription>
                  Complete agency information, agreements, and reservation history
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="agreements">Pricing Agreements</TabsTrigger>
                  <TabsTrigger value="reservations">Reservations</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Building className="mr-2 h-4 w-4" />
                          Agency Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Agency Name</p>
                          <p className="text-lg font-semibold">{selectedAgency.name}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Type</p>
                          <Badge className={getTypeColor(selectedAgency.type)}>
                            {selectedAgency.type}
                          </Badge>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground flex items-center">
                            <MapPin className="mr-1 h-3 w-3" />
                            Address
                          </p>
                          <p className="text-sm">
                            {selectedAgency.address}<br />
                            {selectedAgency.city}, {selectedAgency.country}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Contact & Financial</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                          <p className="text-sm">{selectedAgency.contactPerson}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground flex items-center">
                            <Mail className="mr-1 h-3 w-3" />
                            Email
                          </p>
                          <p className="text-sm">{selectedAgency.contactEmail}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground flex items-center">
                            <Phone className="mr-1 h-3 w-3" />
                            Phone
                          </p>
                          <p className="text-sm">{selectedAgency.contactPhone}</p>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-primary">${selectedAgency.creditLimit.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Credit Limit</p>
                          </div>
                          <div>
                            <p className={`text-2xl font-bold ${selectedAgency.currentBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                              ${Math.abs(selectedAgency.currentBalance).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {selectedAgency.currentBalance > 0 ? "Outstanding Balance" : "Credit Balance"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="agreements" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Pricing Agreements
                      </CardTitle>
                      <CardDescription>
                        {mockPricingAgreements.filter(a => a.agencyId === selectedAgency.id).length} active agreements
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockPricingAgreements
                          .filter(agreement => agreement.agencyId === selectedAgency.id)
                          .map((agreement) => (
                            <div key={agreement.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{agreement.name}</h4>
                                <Badge variant={agreement.isActive ? "default" : "secondary"}>
                                  {agreement.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="font-medium">Start Date</p>
                                  <p className="text-muted-foreground">{format(agreement.startDate, "MMM dd, yyyy")}</p>
                                </div>
                                <div>
                                  <p className="font-medium">End Date</p>
                                  <p className="text-muted-foreground">{format(agreement.endDate, "MMM dd, yyyy")}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Discount</p>
                                  <p className="text-muted-foreground">
                                    {agreement.discountPercent ? `${agreement.discountPercent}%` : 
                                     agreement.fixedRate ? `$${agreement.fixedRate}` : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium">Allotment</p>
                                  <p className="text-muted-foreground">{agreement.allotment} rooms</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="reservations" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Reservation History
                      </CardTitle>
                      <CardDescription>
                        {mockReservations.filter(r => r.agencyId === selectedAgency.id).length} reservations found
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockReservations
                          .filter(reservation => reservation.agencyId === selectedAgency.id)
                          .map((reservation) => (
                            <div key={reservation.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline">{reservation.code}</Badge>
                                  <Badge variant="secondary">{reservation.status}</Badge>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <DollarSign className="mr-1 h-3 w-3" />
                                  ${reservation.totalPrice.toLocaleString()}
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="font-medium">Guest</p>
                                  <p className="text-muted-foreground">{reservation.guest}</p>
                                </div>
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
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}