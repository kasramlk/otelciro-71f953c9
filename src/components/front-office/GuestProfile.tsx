import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Star,
  CreditCard,
  FileText,
  Gift,
  AlertCircle,
  Edit,
  Save,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const guestProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  nationality: z.string().optional(),
  idNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  dateOfBirth: z.string().optional(),
  preferences: z.string().optional(),
  notes: z.string().optional(),
});

type GuestProfileData = z.infer<typeof guestProfileSchema>;

interface GuestProfileProps {
  guestId: string;
}

// Mock guest data
const mockGuest = {
  id: "guest-123",
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@email.com",
  phone: "+1-555-0123",
  nationality: "American",
  idNumber: "P123456789",
  address: "123 Main Street",
  city: "New York",
  country: "United States",
  dateOfBirth: "1985-06-15",
  vipStatus: "Gold",
  loyaltyPoints: 2500,
  totalStays: 8,
  totalSpent: 5420.00,
  preferences: ["High floor", "Non-smoking", "Late checkout"],
  notes: "Prefers room with city view. Anniversary guest.",
  createdAt: new Date("2022-01-15"),
  lastStay: new Date("2024-01-10"),
};

const mockStayHistory = [
  {
    id: "stay-1",
    reservationCode: "RES001",
    checkIn: new Date("2024-01-10"),
    checkOut: new Date("2024-01-13"),
    roomType: "Deluxe King",
    roomNumber: "301",
    nights: 3,
    totalAmount: 450.00,
    status: "Completed",
    rating: 5,
    feedback: "Excellent service and clean rooms!"
  },
  {
    id: "stay-2",
    reservationCode: "RES002",
    checkIn: new Date("2023-09-15"),
    checkOut: new Date("2023-09-18"),
    roomType: "Suite",
    roomNumber: "501",
    nights: 3,
    totalAmount: 720.00,
    status: "Completed",
    rating: 4,
    feedback: "Great location, room was spacious."
  }
];

export default function GuestProfile({ guestId }: GuestProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("profile");
  const { toast } = useToast();

  const form = useForm<GuestProfileData>({
    resolver: zodResolver(guestProfileSchema),
    defaultValues: {
      firstName: mockGuest.firstName,
      lastName: mockGuest.lastName,
      email: mockGuest.email,
      phone: mockGuest.phone,
      nationality: mockGuest.nationality,
      idNumber: mockGuest.idNumber,
      address: mockGuest.address,
      city: mockGuest.city,
      country: mockGuest.country,
      dateOfBirth: mockGuest.dateOfBirth,
      preferences: mockGuest.preferences.join(", "),
      notes: mockGuest.notes,
    },
  });

  const onSubmit = (data: GuestProfileData) => {
    console.log("Update guest profile:", data);
    toast({
      title: "Profile updated",
      description: "Guest profile has been successfully updated.",
    });
    setIsEditing(false);
  };

  const getVipBadge = (status: string) => {
    const colors = {
      "Gold": "bg-yellow-100 text-yellow-800",
      "Silver": "bg-gray-100 text-gray-800", 
      "Platinum": "bg-purple-100 text-purple-800",
      "Standard": "bg-blue-100 text-blue-800"
    };
    return <Badge className={colors[status] || colors["Standard"]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {mockGuest.firstName} {mockGuest.lastName}
            </h2>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Guest since {format(mockGuest.createdAt, "MMM yyyy")}</span>
              <span>•</span>
              {getVipBadge(mockGuest.vipStatus)}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stays</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockGuest.totalStays}</div>
            <p className="text-xs text-muted-foreground">
              Last: {format(mockGuest.lastStay, "MMM dd, yyyy")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockGuest.totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ${(mockGuest.totalSpent / mockGuest.totalStays).toFixed(0)} per stay
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockGuest.loyaltyPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {mockGuest.vipStatus} tier member
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              4.5 <Star className="ml-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              From {mockStayHistory.length} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Personal Info</TabsTrigger>
          <TabsTrigger value="history">Stay History</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                {isEditing ? "Update guest personal details" : "View guest personal details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
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
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nationality</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                            <FormLabel>ID/Passport Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                              <Input {...field} />
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
                              <Input {...field} />
                            </FormControl>
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
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{mockGuest.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{mockGuest.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{mockGuest.address}, {mockGuest.city}, {mockGuest.country}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Nationality</Label>
                        <p>{mockGuest.nationality}</p>
                      </div>
                      <div>
                        <Label>ID Number</Label>
                        <p>{mockGuest.idNumber}</p>
                      </div>
                      <div>
                        <Label>Date of Birth</Label>
                        <p>{format(new Date(mockGuest.dateOfBirth), "MMM dd, yyyy")}</p>
                      </div>
                    </div>
                  </div>
                  
                  {mockGuest.notes && (
                    <div>
                      <Label>Notes</Label>
                      <p className="mt-1 text-sm">{mockGuest.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stay History</CardTitle>
              <CardDescription>Complete history of guest stays</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dates</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Nights</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockStayHistory.map((stay) => (
                    <TableRow key={stay.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {format(stay.checkIn, "MMM dd")} - {format(stay.checkOut, "MMM dd, yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stay.reservationCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{stay.roomType}</div>
                          <div className="text-sm text-muted-foreground">Room {stay.roomNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>{stay.nights}</TableCell>
                      <TableCell>${stay.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          {stay.rating}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{stay.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guest Preferences</CardTitle>
              <CardDescription>Preferences and special requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Room Preferences</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {mockGuest.preferences.map((pref, index) => (
                      <Badge key={index} variant="outline">{pref}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Special Notes</Label>
                  <p className="mt-1 text-sm">{mockGuest.notes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>Payment methods and billing history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No billing information available</p>
                <Button variant="outline" className="mt-4">
                  Add Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}