import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  ShoppingBag, 
  Utensils, 
  Car, 
  Sparkles, 
  Wrench,
  Clock,
  Plus,
  Minus,
  DollarSign,
  CheckCircle,
  Timer
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

const serviceRequestSchema = z.object({
  serviceType: z.string().min(1, "Service type is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requestedTime: z.string().optional(),
  priority: z.string().default("Medium"),
  roomNumber: z.string().default("301"),
});

type ServiceRequestData = z.infer<typeof serviceRequestSchema>;

interface ServiceOrderingProps {
  onBack: () => void;
}

// Mock data for services and menu items
const roomServiceMenu = [
  {
    id: "1",
    category: "Breakfast",
    name: "Continental Breakfast",
    description: "Fresh croissants, jam, butter, orange juice, coffee",
    price: 24.00,
    available: true
  },
  {
    id: "2", 
    category: "Main Dishes",
    name: "Grilled Salmon",
    description: "Atlantic salmon with lemon butter, vegetables, rice",
    price: 32.00,
    available: true
  },
  {
    id: "3",
    category: "Beverages", 
    name: "Fresh Orange Juice",
    description: "Freshly squeezed orange juice",
    price: 8.00,
    available: true
  },
  {
    id: "4",
    category: "Desserts",
    name: "Chocolate Cake",
    description: "Rich chocolate cake with vanilla ice cream",
    price: 12.00,
    available: false
  }
];

const serviceCategories = [
  {
    id: "room_service",
    name: "Room Service",
    icon: Utensils,
    description: "Food and beverage delivery",
    estimatedTime: "30-45 mins"
  },
  {
    id: "housekeeping",
    name: "Housekeeping",
    icon: Sparkles,
    description: "Cleaning and room amenities",
    estimatedTime: "15-30 mins"
  },
  {
    id: "transport",
    name: "Transportation",
    icon: Car,
    description: "Taxi and shuttle services",
    estimatedTime: "10-20 mins"
  },
  {
    id: "maintenance",
    name: "Maintenance",
    icon: Wrench,
    description: "Room repairs and technical issues",
    estimatedTime: "20-60 mins"
  }
];

const mockActiveRequests = [
  {
    id: "1",
    title: "Extra Towels",
    serviceType: "Housekeeping",
    status: "In Progress",
    requestedTime: new Date(Date.now() - 1800000), // 30 min ago
    estimatedCost: 0,
    priority: "Low"
  },
  {
    id: "2",
    title: "Airport Transfer",
    serviceType: "Transport", 
    status: "Pending",
    requestedTime: new Date(Date.now() - 900000), // 15 min ago
    estimatedCost: 45.00,
    priority: "High"
  }
];

export default function ServiceOrdering({ onBack }: ServiceOrderingProps) {
  const [selectedTab, setSelectedTab] = useState("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const { toast } = useToast();

  const form = useForm<ServiceRequestData>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      priority: "Medium",
      roomNumber: "301",
    },
  });

  const addToCart = (item: any) => {
    setCartItems(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    
    toast({
      title: "Added to order",
      description: `${item.name} added to your cart`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const onSubmit = (data: ServiceRequestData) => {
    console.log("Service request:", data);
    
    toast({
      title: "Service request submitted",
      description: "Our team has been notified and will assist you shortly.",
    });
    
    form.reset();
    setShowOrderForm(false);
    setSelectedTab("requests");
  };

  const placeRoomServiceOrder = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to your order first.",
        variant: "destructive",
      });
      return;
    }

    console.log("Room service order:", { items: cartItems, total: getTotalAmount() });
    
    toast({
      title: "Order placed successfully",
      description: `Your order of $${getTotalAmount().toFixed(2)} will be delivered in 30-45 minutes.`,
    });
    
    setCartItems([]);
    setSelectedTab("requests");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline" className="text-yellow-600">Pending</Badge>;
      case "In Progress":
        return <Badge variant="secondary" className="text-blue-600">In Progress</Badge>;
      case "Completed":
        return <Badge variant="secondary" className="text-green-600">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (showOrderForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowOrderForm(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Button>
          <h2 className="text-2xl font-bold">Request Service</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Service Request Form</CardTitle>
            <CardDescription>Describe what you need and we'll take care of it</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select service type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                            <SelectItem value="Room Service">Room Service</SelectItem>
                            <SelectItem value="Concierge">Concierge</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="Spa">Spa</SelectItem>
                            <SelectItem value="Transport">Transport</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of what you need" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please provide detailed information about your request..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requestedTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Time (Optional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowOrderForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Submit Request
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedCategory === "room_service") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedCategory(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Services
            </Button>
            <div>
              <h2 className="text-2xl font-bold">Room Service Menu</h2>
              <p className="text-muted-foreground">Order food and beverages to your room</p>
            </div>
          </div>
          {cartItems.length > 0 && (
            <Card className="p-4 min-w-[200px]">
              <div className="text-center">
                <p className="font-semibold">Order Total</p>
                <p className="text-2xl font-bold text-primary">${getTotalAmount().toFixed(2)}</p>
                <Button onClick={placeRoomServiceOrder} className="w-full mt-2">
                  Place Order
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roomServiceMenu.map((item) => (
            <Card key={item.id} className={!item.available ? "opacity-50" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {item.name}
                  <Badge variant="outline">{item.category}</Badge>
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-lg font-semibold">${item.price.toFixed(2)}</span>
                  </div>
                  
                  {item.available ? (
                    <div className="flex items-center gap-2">
                      {cartItems.find(cartItem => cartItem.id === item.id) ? (
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateQuantity(item.id, cartItems.find(cartItem => cartItem.id === item.id)!.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">
                            {cartItems.find(cartItem => cartItem.id === item.id)?.quantity}
                          </span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateQuantity(item.id, cartItems.find(cartItem => cartItem.id === item.id)!.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={() => addToCart(item)} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Order
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-red-600">Unavailable</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Service Ordering</h1>
          <p className="text-muted-foreground">Request services and order amenities</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Service Categories</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
          <TabsTrigger value="history">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {serviceCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card 
                  key={category.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    if (category.id === "room_service") {
                      setSelectedCategory("room_service");
                    } else {
                      setShowOrderForm(true);
                      form.setValue("serviceType", category.name);
                    }
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      {category.name}
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Timer className="h-4 w-4" />
                        <span>ETA: {category.estimatedTime}</span>
                      </div>
                      <Button variant="outline" size="sm">
                        {category.id === "room_service" ? "View Menu" : "Request Service"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common service requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" onClick={() => setShowOrderForm(true)}>
                  Extra Towels
                </Button>
                <Button variant="outline" onClick={() => setShowOrderForm(true)}>
                  Late Checkout
                </Button>
                <Button variant="outline" onClick={() => setShowOrderForm(true)}>
                  Wake-up Call
                </Button>
                <Button variant="outline" onClick={() => setShowOrderForm(true)}>
                  Taxi Service
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Active Requests</h2>
            <Button onClick={() => setShowOrderForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockActiveRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Badge variant="outline">{request.serviceType}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{request.title}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{format(request.requestedTime, "MMM dd, HH:mm")}</TableCell>
                      <TableCell>
                        {request.estimatedCost > 0 ? (
                          `$${request.estimatedCost.toFixed(2)}`
                        ) : (
                          <span className="text-muted-foreground">Complimentary</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>Your previous service requests and orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4" />
                <p>No order history available</p>
                <p className="text-sm">Your completed orders will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}