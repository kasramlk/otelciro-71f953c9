import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Calendar, 
  Users, 
  MapPin, 
  Star,
  CheckCircle,
  CreditCard,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const bookingSchema = z.object({
  // Step 1: Search
  destination: z.string().min(1, "Please enter a destination"),
  checkIn: z.string().min(1, "Check-in date is required"),
  checkOut: z.string().min(1, "Check-out date is required"),
  adults: z.number().min(1, "At least 1 adult required"),
  children: z.number().min(0),
  
  // Step 2: Guest info
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  
  // Step 3: Hotel selection
  selectedHotel: z.string().min(1, "Please select a hotel"),
  selectedRoomType: z.string().min(1, "Please select a room type"),
  
  // Step 4: Payment
  paymentMethod: z.enum(["Credit Card", "Bank Transfer", "Agency Credit"]),
  specialRequests: z.string().optional(),
});

type BookingData = z.infer<typeof bookingSchema>;

interface BookingFlowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
}

const steps = [
  { id: 1, title: 'Search', icon: Search },
  { id: 2, title: 'Guest Info', icon: Users },
  { id: 3, title: 'Select Hotel', icon: MapPin },
  { id: 4, title: 'Payment', icon: CreditCard },
  { id: 5, title: 'Confirmation', icon: CheckCircle }
];

// Mock hotel data
const mockHotels = [
  {
    id: '1',
    name: 'Grand Hyatt Istanbul',
    location: 'Istanbul, Turkey',
    rating: 5,
    image: '/hotel1.jpg',
    price: 250,
    amenities: ['Pool', 'Spa', 'WiFi', 'Parking'],
    roomTypes: [
      { id: 'deluxe', name: 'Deluxe Room', price: 250 },
      { id: 'suite', name: 'Executive Suite', price: 450 }
    ]
  },
  {
    id: '2',
    name: 'Swissotel Ankara',
    location: 'Ankara, Turkey',
    rating: 4,
    image: '/hotel2.jpg',
    price: 180,
    amenities: ['Gym', 'Restaurant', 'WiFi', 'Business Center'],
    roomTypes: [
      { id: 'standard', name: 'Standard Room', price: 180 },
      { id: 'deluxe', name: 'Deluxe Room', price: 280 }
    ]
  }
];

export default function BookingFlowModal({
  open,
  onOpenChange,
  agencyId
}: BookingFlowModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [searchResults, setSearchResults] = useState(mockHotels);

  const form = useForm<BookingData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      adults: 2,
      children: 0,
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      paymentMethod: "Credit Card",
    },
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingData) => {
      // Create booking hold first
      const selectedHotel = mockHotels.find(h => h.id === data.selectedHotel);
      const selectedRoom = selectedHotel?.roomTypes.find(r => r.id === data.selectedRoomType);
      
      const { data: bookingHold, error } = await supabase
        .from('booking_holds')
        .insert({
          hotel_id: data.selectedHotel,
          agency_id: agencyId,
          room_type_id: data.selectedRoomType,
          check_in: data.checkIn,
          check_out: data.checkOut,
          adults: data.adults,
          children: data.children,
          guest_name: `${data.firstName} ${data.lastName}`,
          rate_quoted: selectedRoom?.price || 0,
          special_requests: data.specialRequests,
          status: 'pending',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })
        .select()
        .single();

      if (error) throw error;
      return bookingHold;
    },
    onSuccess: (booking) => {
      toast({
        title: "Booking Hold Created",
        description: `Hold created for ${form.watch('firstName')} ${form.watch('lastName')}. Expires in 24 hours.`,
      });
      setCurrentStep(5); // Move to confirmation step
      queryClient.invalidateQueries({ queryKey: ['booking-holds'] });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: "Unable to create booking hold. Please try again.",
        variant: "destructive",
      });
      console.error('Booking error:', error);
    }
  });

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    const values = form.getValues();
    
    try {
      switch (currentStep) {
        case 1: // Search validation
          bookingSchema.pick({
            destination: true,
            checkIn: true,
            checkOut: true,
            adults: true,
            children: true
          }).parse(values);
          break;
        case 2: // Guest info validation
          bookingSchema.pick({
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }).parse(values);
          break;
        case 3: // Hotel selection validation
          bookingSchema.pick({
            selectedHotel: true,
            selectedRoomType: true
          }).parse(values);
          break;
        case 4: // Payment validation
          bookingSchema.pick({
            paymentMethod: true
          }).parse(values);
          break;
      }
      return true;
    } catch (error) {
      console.error('Validation failed:', error);
      return false;
    }
  };

  const handleSubmit = () => {
    createBookingMutation.mutate(form.getValues());
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Istanbul, Turkey" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="checkIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-in Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="checkOut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-out Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
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
                        onChange={e => field.onChange(Number(e.target.value))}
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
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
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
                      <Input placeholder="Enter last name" {...field} />
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
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="guest@example.com" {...field} />
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
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+1-555-0123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="space-y-4">
              {searchResults.map((hotel) => (
                <Card
                  key={hotel.id}
                  className={`cursor-pointer transition-all ${
                    form.watch('selectedHotel') === hotel.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => form.setValue('selectedHotel', hotel.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{hotel.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{hotel.location}</span>
                          <div className="flex ml-2">
                            {Array.from({ length: hotel.rating }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {hotel.amenities.map((amenity) => (
                            <Badge key={amenity} variant="secondary" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${hotel.price}</p>
                        <p className="text-sm text-muted-foreground">per night</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {form.watch('selectedHotel') && (
              <FormField
                control={form.control}
                name="selectedRoomType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Room Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose room type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockHotels
                          .find(h => h.id === form.watch('selectedHotel'))
                          ?.roomTypes.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              <div className="flex justify-between items-center w-full">
                                <span>{room.name}</span>
                                <span className="ml-4 font-semibold">${room.price}/night</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Agency Credit">Agency Credit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialRequests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requests</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requirements or requests..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Hotel:</span>
                  <span>{mockHotels.find(h => h.id === form.watch('selectedHotel'))?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guest:</span>
                  <span>{form.watch('firstName')} {form.watch('lastName')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dates:</span>
                  <span>{form.watch('checkIn')} - {form.watch('checkOut')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guests:</span>
                  <span>{form.watch('adults')} adults, {form.watch('children')} children</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>
                    ${mockHotels
                      .find(h => h.id === form.watch('selectedHotel'))
                      ?.roomTypes.find(r => r.id === form.watch('selectedRoomType'))
                      ?.price || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Booking Hold Created!</h3>
              <p className="text-muted-foreground">
                A 24-hour hold has been placed for {form.watch('firstName')} {form.watch('lastName')} 
                at {mockHotels.find(h => h.id === form.watch('selectedHotel'))?.name}.
              </p>
            </div>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Hold expires in 24 hours - Convert to confirmed reservation soon!</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agency Booking System</DialogTitle>
          <DialogDescription>
            Create hotel bookings for your clients with our integrated booking flow
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= step.id
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <step.icon className="h-5 w-5" />
              </div>
              <span className="ml-2 text-sm font-medium">{step.title}</span>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </div>

          {currentStep < 5 && (
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {currentStep === 4 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={createBookingMutation.isPending}
                >
                  {createBookingMutation.isPending ? "Creating Hold..." : "Create Booking Hold"}
                </Button>
              ) : (
                <Button onClick={nextStep}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="flex justify-center pt-6">
              <Button onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
}