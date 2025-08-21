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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings2, 
  Plus, 
  Edit, 
  Trash2,
  Hotel,
  Bed,
  DollarSign,
  Users,
  Building
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const hotelSchema = z.object({
  name: z.string().min(1, "Hotel name is required"),
  code: z.string().min(1, "Hotel code is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().default("UTC"),
  phone: z.string().optional(),
});

const roomTypeSchema = z.object({
  name: z.string().min(1, "Room type name is required"),
  code: z.string().min(1, "Room type code is required"),
  description: z.string().optional(),
  capacityAdults: z.number().min(1, "At least 1 adult capacity required"),
  capacityChildren: z.number().min(0),
});

const roomSchema = z.object({
  number: z.string().min(1, "Room number is required"),
  roomTypeId: z.string().min(1, "Room type is required"),
  floor: z.number().optional(),
});

const ratePlanSchema = z.object({
  name: z.string().min(1, "Rate plan name is required"),
  code: z.string().min(1, "Rate plan code is required"),
  description: z.string().optional(),
  currency: z.string().default("USD"),
});

type HotelData = z.infer<typeof hotelSchema>;
type RoomTypeData = z.infer<typeof roomTypeSchema>;
type RoomData = z.infer<typeof roomSchema>;
type RatePlanData = z.infer<typeof ratePlanSchema>;

// Mock data
const mockHotel = {
  id: "1",
  name: "Grand Plaza Hotel",
  code: "GPH001",
  address: "123 Main Street",
  city: "New York",
  country: "United States",
  timezone: "America/New_York",
  phone: "+1 (555) 123-4567",
};

const mockRoomTypes = [
  {
    id: "1",
    name: "Standard Room",
    code: "STD",
    description: "Comfortable standard accommodation",
    capacityAdults: 2,
    capacityChildren: 1,
  },
  {
    id: "2",
    name: "Deluxe Room",
    code: "DLX",
    description: "Spacious room with city view",
    capacityAdults: 2,
    capacityChildren: 2,
  },
  {
    id: "3",
    name: "Executive Suite",
    code: "EXE",
    description: "Luxury suite with separate living area",
    capacityAdults: 4,
    capacityChildren: 2,
  },
];

const mockRooms = [
  {
    id: "1",
    number: "101",
    roomTypeId: "1",
    roomTypeName: "Standard Room",
    floor: 1,
    status: "Available",
  },
  {
    id: "2",
    number: "102",
    roomTypeId: "1",
    roomTypeName: "Standard Room",
    floor: 1,
    status: "Occupied",
  },
  {
    id: "3",
    number: "201",
    roomTypeId: "2",
    roomTypeName: "Deluxe Room",
    floor: 2,
    status: "Available",
  },
];

const mockRatePlans = [
  {
    id: "1",
    name: "Best Available Rate",
    code: "BAR",
    description: "Flexible rate with free cancellation",
    currency: "USD",
  },
  {
    id: "2",
    name: "Advance Purchase",
    code: "ADV",
    description: "Non-refundable discounted rate",
    currency: "USD",
  },
];

const mockUsers = [
  {
    id: "1",
    name: "John Manager",
    email: "john@hotel.com",
    role: "Manager",
    isActive: true,
  },
  {
    id: "2",
    name: "Sarah Desk",
    email: "sarah@hotel.com", 
    role: "FrontDesk",
    isActive: true,
  },
  {
    id: "3",
    name: "Mike House",
    email: "mike@hotel.com",
    role: "Housekeeping",
    isActive: true,
  },
];

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "Owner":
      return "default";
    case "Manager":
      return "secondary";
    case "FrontDesk":
      return "outline";
    default:
      return "secondary";
  }
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState("hotel");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"hotel" | "roomType" | "room" | "ratePlan" | "user">("hotel");
  const [editingItem, setEditingItem] = useState(null);
  const { toast } = useToast();

  const hotelForm = useForm<HotelData>({
    resolver: zodResolver(hotelSchema),
    defaultValues: mockHotel,
  });

  const roomTypeForm = useForm<RoomTypeData>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: {
      capacityAdults: 2,
      capacityChildren: 0,
    },
  });

  const roomForm = useForm<RoomData>({
    resolver: zodResolver(roomSchema),
  });

  const ratePlanForm = useForm<RatePlanData>({
    resolver: zodResolver(ratePlanSchema),
    defaultValues: {
      currency: "USD",
    },
  });

  const openDialog = (type: typeof dialogType, item = null) => {
    setDialogType(type);
    setEditingItem(item);
    setIsDialogOpen(true);
    
    if (item) {
      switch (type) {
        case "roomType":
          roomTypeForm.reset(item);
          break;
        case "room":
          roomForm.reset(item);
          break;
        case "ratePlan":
          ratePlanForm.reset(item);
          break;
      }
    } else {
      switch (type) {
        case "roomType":
          roomTypeForm.reset();
          break;
        case "room":
          roomForm.reset();
          break;
        case "ratePlan":
          ratePlanForm.reset();
          break;
      }
    }
  };

  const onSubmitHotel = (data: HotelData) => {
    console.log("Hotel data:", data);
    toast({
      title: "Hotel profile updated",
      description: "Hotel information has been successfully updated.",
    });
  };

  const onSubmitRoomType = (data: RoomTypeData) => {
    console.log("Room type data:", data);
    toast({
      title: editingItem ? "Room type updated" : "Room type created",
      description: `${data.name} has been successfully ${editingItem ? "updated" : "created"}.`,
    });
    setIsDialogOpen(false);
    roomTypeForm.reset();
  };

  const onSubmitRoom = (data: RoomData) => {
    console.log("Room data:", data);
    toast({
      title: editingItem ? "Room updated" : "Room created", 
      description: `Room ${data.number} has been successfully ${editingItem ? "updated" : "created"}.`,
    });
    setIsDialogOpen(false);
    roomForm.reset();
  };

  const onSubmitRatePlan = (data: RatePlanData) => {
    console.log("Rate plan data:", data);
    toast({
      title: editingItem ? "Rate plan updated" : "Rate plan created",
      description: `${data.name} has been successfully ${editingItem ? "updated" : "created"}.`,
    });
    setIsDialogOpen(false);
    ratePlanForm.reset();
  };

  const handleDelete = (type: string, item: any) => {
    console.log(`Delete ${type}:`, item);
    toast({
      title: `${type} deleted`,
      description: `The ${type} has been successfully deleted.`,
      variant: "destructive",
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight flex items-center">
          <Settings2 className="mr-2 h-8 w-8" />
          Settings
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="hotel">Hotel Profile</TabsTrigger>
          <TabsTrigger value="roomTypes">Room Types</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="ratePlans">Rate Plans</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
        </TabsList>
        
        {/* Hotel Profile Tab */}
        <TabsContent value="hotel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Hotel className="mr-2 h-5 w-5" />
                Hotel Profile
              </CardTitle>
              <CardDescription>
                Manage your hotel's basic information and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...hotelForm}>
                <form onSubmit={hotelForm.handleSubmit(onSubmitHotel)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={hotelForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hotel Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={hotelForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hotel Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={hotelForm.control}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={hotelForm.control}
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
                      control={hotelForm.control}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={hotelForm.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="America/New_York">Eastern Time</SelectItem>
                              <SelectItem value="America/Chicago">Central Time</SelectItem>
                              <SelectItem value="America/Denver">Mountain Time</SelectItem>
                              <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                              <SelectItem value="Europe/London">London</SelectItem>
                              <SelectItem value="Europe/Paris">Paris</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={hotelForm.control}
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

                  <Button type="submit">Update Hotel Profile</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Room Types Tab */}
        <TabsContent value="roomTypes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Bed className="mr-2 h-5 w-5" />
                  Room Types
                </span>
                <Button onClick={() => openDialog("roomType")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Room Type
                </Button>
              </CardTitle>
              <CardDescription>
                Manage room categories and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Adult Capacity</TableHead>
                    <TableHead>Child Capacity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRoomTypes.map((roomType) => (
                    <TableRow key={roomType.id}>
                      <TableCell className="font-medium">{roomType.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{roomType.code}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{roomType.description}</TableCell>
                      <TableCell>{roomType.capacityAdults}</TableCell>
                      <TableCell>{roomType.capacityChildren}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDialog("roomType", roomType)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete("room type", roomType)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Rooms
                </span>
                <Button onClick={() => openDialog("room")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Room
                </Button>
              </CardTitle>
              <CardDescription>
                Manage individual room inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room Number</TableHead>
                    <TableHead>Room Type</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.number}</TableCell>
                      <TableCell>{room.roomTypeName}</TableCell>
                      <TableCell>{room.floor}</TableCell>
                      <TableCell>
                        <Badge variant={room.status === "Available" ? "secondary" : "default"}>
                          {room.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDialog("room", room)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete("room", room)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Plans Tab */}
        <TabsContent value="ratePlans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Rate Plans
                </span>
                <Button onClick={() => openDialog("ratePlan")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rate Plan
                </Button>
              </CardTitle>
              <CardDescription>
                Manage pricing strategies and rate configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRatePlans.map((ratePlan) => (
                    <TableRow key={ratePlan.id}>
                      <TableCell className="font-medium">{ratePlan.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ratePlan.code}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{ratePlan.description}</TableCell>
                      <TableCell>{ratePlan.currency}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDialog("ratePlan", ratePlan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete("rate plan", ratePlan)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Users & Roles
              </CardTitle>
              <CardDescription>
                Manage user access and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDialog("user", user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generic Dialog for all forms */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit" : "Create"} {dialogType === "roomType" ? "Room Type" : 
               dialogType === "ratePlan" ? "Rate Plan" : dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}
            </DialogTitle>
          </DialogHeader>
          
          {dialogType === "roomType" && (
            <Form {...roomTypeForm}>
              <form onSubmit={roomTypeForm.handleSubmit(onSubmitRoomType)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={roomTypeForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Standard Room" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={roomTypeForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <Input placeholder="STD" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={roomTypeForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={roomTypeForm.control}
                    name="capacityAdults"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adult Capacity</FormLabel>
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
                    control={roomTypeForm.control}
                    name="capacityChildren"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Child Capacity</FormLabel>
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
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingItem ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {dialogType === "room" && (
            <Form {...roomForm}>
              <form onSubmit={roomForm.handleSubmit(onSubmitRoom)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={roomForm.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Number</FormLabel>
                        <FormControl>
                          <Input placeholder="101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={roomForm.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Floor</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={roomForm.control}
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
                              {roomType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingItem ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {dialogType === "ratePlan" && (
            <Form {...ratePlanForm}>
              <form onSubmit={ratePlanForm.handleSubmit(onSubmitRatePlan)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={ratePlanForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Best Available Rate" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={ratePlanForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <Input placeholder="BAR" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={ratePlanForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={ratePlanForm.control}
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
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingItem ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}