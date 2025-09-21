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
  Building,
  Plug
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  useHotelSettings,
  useUpdateHotel,
  useRoomTypes,
  useCreateRoomType,
  useUpdateRoomType,
  useDeleteRoomType,
  useRatePlans,
  useCreateRatePlan,
  useUpdateRatePlan,
  useDeleteRatePlan,
  useRooms,
  useHotelUsers
} from "@/hooks/use-settings-data";

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
  capacity_adults: z.number().min(1, "At least 1 adult capacity required"),
  capacity_children: z.number().min(0),
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

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin':
      return 'destructive';
    case 'manager':
      return 'default';
    case 'staff':
      return 'secondary';
    default:
      return 'outline';
  }
};

export default function Settings() {
  // Fixed hotel ID for now - in a real app this would come from context
  const hotelId = "6163aacb-81d7-4eb2-ab68-4d3e172bef3e";
  
  const [activeTab, setActiveTab] = useState("hotel");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentEntity, setCurrentEntity] = useState<"hotel" | "roomType" | "room" | "ratePlan">("hotel");

  const { toast } = useToast();

  // Data hooks
  const { data: hotel, isLoading: hotelLoading } = useHotelSettings(hotelId);
  const { data: roomTypes, isLoading: roomTypesLoading } = useRoomTypes(hotelId);
  const { data: ratePlans, isLoading: ratePlansLoading } = useRatePlans(hotelId);
  const { data: rooms, isLoading: roomsLoading } = useRooms(hotelId);
  const { data: users, isLoading: usersLoading } = useHotelUsers(hotelId);

  // Mutation hooks
  const updateHotel = useUpdateHotel();
  const createRoomType = useCreateRoomType(hotelId);
  const updateRoomType = useUpdateRoomType(hotelId);
  const deleteRoomType = useDeleteRoomType(hotelId);
  const createRatePlan = useCreateRatePlan(hotelId);
  const updateRatePlan = useUpdateRatePlan(hotelId);
  const deleteRatePlan = useDeleteRatePlan(hotelId);

  // Form initialization
  const hotelForm = useForm<HotelData>({
    resolver: zodResolver(hotelSchema),
    defaultValues: hotel || {
      name: "",
      code: "",
      address: "",
      city: "",
      country: "",
      timezone: "UTC",
      phone: "",
    },
  });

  const roomTypeForm = useForm<RoomTypeData>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      capacity_adults: 2,
      capacity_children: 0,
    },
  });

  const ratePlanForm = useForm<RatePlanData>({
    resolver: zodResolver(ratePlanSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      currency: "USD",
    },
  });

  // Update form when hotel data loads
  useState(() => {
    if (hotel) {
      hotelForm.reset(hotel);
    }
  });

  const openDialog = (type: "create" | "edit", entity: "hotel" | "roomType" | "room" | "ratePlan", item?: any) => {
    setDialogType(type);
    setCurrentEntity(entity);
    setEditingItem(item);
    
    if (type === "edit" && item) {
      if (entity === "roomType") {
        roomTypeForm.reset(item);
      } else if (entity === "ratePlan") {
        ratePlanForm.reset(item);
      }
    } else {
      if (entity === "roomType") {
        roomTypeForm.reset({
          name: "",
          code: "",
          description: "",
          capacity_adults: 2,
          capacity_children: 0,
        });
      } else if (entity === "ratePlan") {
        ratePlanForm.reset({
          name: "",
          code: "",
          description: "",
          currency: "USD",
        });
      }
    }
    
    setDialogOpen(true);
  };

  const onSubmitHotel = async (data: HotelData) => {
    try {
      await updateHotel.mutateAsync({ id: hotelId, updates: data });
    } catch (error) {
      console.error('Error updating hotel:', error);
    }
  };

  const onSubmitRoomType = async (data: RoomTypeData) => {
    // Ensure required fields are present
    if (!data.name || !data.code) return;
    
    try {
      if (dialogType === "edit" && editingItem) {
        await updateRoomType.mutateAsync({ 
          id: editingItem.id, 
          name: data.name,
          code: data.code,
          description: data.description,
          capacity_adults: data.capacity_adults,
          capacity_children: data.capacity_children
        });
      } else {
        await createRoomType.mutateAsync({
          name: data.name,
          code: data.code,
          description: data.description,
          capacity_adults: data.capacity_adults,
          capacity_children: data.capacity_children || 0
        });
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Error with room type:', error);
    }
  };

  const onSubmitRatePlan = async (data: RatePlanData) => {
    // Ensure required fields are present
    if (!data.name || !data.code) return;
    
    try {
      if (dialogType === "edit" && editingItem) {
        await updateRatePlan.mutateAsync({ 
          id: editingItem.id,
          name: data.name,
          code: data.code,
          description: data.description,
          currency: data.currency
        });
      } else {
        await createRatePlan.mutateAsync({
          name: data.name,
          code: data.code,
          description: data.description,
          currency: data.currency
        });
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Error with rate plan:', error);
    }
  };

  const handleDelete = async (type: "roomType" | "ratePlan", item: any) => {
    try {
      if (type === "roomType") {
        await deleteRoomType.mutateAsync(item.id);
      } else if (type === "ratePlan") {
        await deleteRatePlan.mutateAsync(item.id);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  if (hotelLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings2 className="h-8 w-8" />
            Settings
          </h2>
          <p className="text-muted-foreground">
            Manage your hotel configuration, room types, rate plans, and users.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="hotel">
            <Hotel className="h-4 w-4 mr-2" />
            Hotel Profile
          </TabsTrigger>
          <TabsTrigger value="roomTypes">
            <Bed className="h-4 w-4 mr-2" />
            Room Types
          </TabsTrigger>
          <TabsTrigger value="rooms">
            <Building className="h-4 w-4 mr-2" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="ratePlans">
            <DollarSign className="h-4 w-4 mr-2" />
            Rate Plans
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hotel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hotel Information</CardTitle>
              <CardDescription>
                Update your hotel's basic information and settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...hotelForm}>
                <form onSubmit={hotelForm.handleSubmit(onSubmitHotel)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={hotelForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hotel Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter hotel name" {...field} />
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
                            <Input placeholder="e.g., HTL001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={hotelForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={hotelForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter city" {...field} />
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
                            <Input placeholder="Enter country" {...field} />
                          </FormControl>
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
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={updateHotel.isPending}>
                    {updateHotel.isPending ? "Updating..." : "Update Hotel Information"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roomTypes" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Room Types</h3>
              <p className="text-sm text-muted-foreground">
                Manage different room types and their configurations.
              </p>
            </div>
            <Button onClick={() => openDialog("create", "roomType")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Room Type
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Rooms</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomTypesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading room types...</TableCell>
                    </TableRow>
                  ) : roomTypes?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No room types found. Create your first room type to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    roomTypes?.map((roomType) => (
                      <TableRow key={roomType.id}>
                        <TableCell className="font-medium">{roomType.name}</TableCell>
                        <TableCell>{roomType.code}</TableCell>
                        <TableCell>
                          {roomType.capacity_adults} Adults
                          {roomType.capacity_children > 0 && `, ${roomType.capacity_children} Children`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {roomType.rooms?.length || 0} rooms
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDialog("edit", "roomType", roomType)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete("roomType", roomType)}
                            disabled={roomType.rooms?.length > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Physical Rooms</h3>
              <p className="text-sm text-muted-foreground">
                View and manage individual room inventory.
              </p>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Housekeeping</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading rooms...</TableCell>
                    </TableRow>
                  ) : rooms?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No rooms found. Rooms are automatically created when you add room types.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rooms?.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.number}</TableCell>
                        <TableCell>{room.room_types?.name || 'Unknown'}</TableCell>
                        <TableCell>{room.floor || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={room.status === 'Available' ? 'default' : 'secondary'}>
                            {room.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={room.housekeeping_status === 'Clean' ? 'default' : 'outline'}>
                            {room.housekeeping_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratePlans" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Rate Plans</h3>
              <p className="text-sm text-muted-foreground">
                Configure different pricing strategies and packages.
              </p>
            </div>
            <Button onClick={() => openDialog("create", "ratePlan")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rate Plan
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratePlansLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading rate plans...</TableCell>
                    </TableRow>
                  ) : ratePlans?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No rate plans found. Create your first rate plan to start pricing rooms.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ratePlans?.map((ratePlan) => (
                      <TableRow key={ratePlan.id}>
                        <TableCell className="font-medium">{ratePlan.name}</TableCell>
                        <TableCell>{ratePlan.code}</TableCell>
                        <TableCell>{ratePlan.currency}</TableCell>
                        <TableCell>
                          <Badge variant={ratePlan.is_active ? 'default' : 'secondary'}>
                            {ratePlan.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDialog("edit", "ratePlan", ratePlan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete("ratePlan", ratePlan)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Hotel Staff</h3>
              <p className="text-sm text-muted-foreground">
                Manage user access and permissions for your hotel.
              </p>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">Loading users...</TableCell>
                    </TableRow>
                  ) : users?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant('staff')}>
                            staff
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dynamic Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "create" ? "Create" : "Edit"} {
                currentEntity === "roomType" ? "Room Type" :
                currentEntity === "ratePlan" ? "Rate Plan" : "Item"
              }
            </DialogTitle>
            <DialogDescription>
              {dialogType === "create" ? "Add a new" : "Update the"} {
                currentEntity === "roomType" ? "room type" :
                currentEntity === "ratePlan" ? "rate plan" : "item"
              }.
            </DialogDescription>
          </DialogHeader>

          {currentEntity === "roomType" && (
            <Form {...roomTypeForm}>
              <form onSubmit={roomTypeForm.handleSubmit(onSubmitRoomType)} className="space-y-4">
                <FormField
                  control={roomTypeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Deluxe Suite" {...field} />
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
                        <Input placeholder="e.g., DLX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={roomTypeForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Room type description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={roomTypeForm.control}
                    name="capacity_adults"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adult Capacity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={roomTypeForm.control}
                    name="capacity_children"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Child Capacity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createRoomType.isPending || updateRoomType.isPending}>
                    {(createRoomType.isPending || updateRoomType.isPending) ? "Processing..." : 
                     (dialogType === "create" ? "Create Room Type" : "Update Room Type")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {currentEntity === "ratePlan" && (
            <Form {...ratePlanForm}>
              <form onSubmit={ratePlanForm.handleSubmit(onSubmitRatePlan)} className="space-y-4">
                <FormField
                  control={ratePlanForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Best Available Rate" {...field} />
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
                        <Input placeholder="e.g., BAR" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ratePlanForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Rate plan description..." {...field} />
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
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createRatePlan.isPending || updateRatePlan.isPending}>
                    {(createRatePlan.isPending || updateRatePlan.isPending) ? "Processing..." : 
                     (dialogType === "create" ? "Create Rate Plan" : "Update Rate Plan")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Integrations Tab Content */}
      <TabsContent value="integrations" className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Integrations</h3>
            <p className="text-sm text-muted-foreground">
              Connect your hotel to external services and platforms.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/settings/integrations/beds24'}>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Plug className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Beds24</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Channel management and booking sync
                  </p>
                  <Badge variant="outline" className="mt-2">
                    Setup Required
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </div>
  );
}