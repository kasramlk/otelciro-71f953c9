import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  Calendar, 
  Users, 
  Bed, 
  DollarSign,
  CreditCard,
  Building2,
  MapPin,
  Star
} from "lucide-react";
import { z } from "zod";

const bookingSchema = z.object({
  hotel_id: z.string().min(1, "Hotel is required"),
  room_type_id: z.string().min(1, "Room type is required"),
  check_in: z.string().min(1, "Check-in date is required"),
  check_out: z.string().min(1, "Check-out date is required"),
  adults: z.number().min(1, "At least 1 adult required"),
  children: z.number().min(0),
  guest_first_name: z.string().min(1, "Guest first name is required"),
  guest_last_name: z.string().min(1, "Guest last name is required"),
  guest_email: z.string().email("Valid email is required"),
  guest_phone: z.string().optional(),
  special_requests: z.string().optional(),
  rate_plan: z.string().min(1, "Rate plan is required"),
  total_price: z.number().min(0, "Total price must be positive"),
  currency: z.string().default("USD"),
  payment_method: z.enum(["Credit Card", "Bank Transfer", "Agency Credit", "Pay at Hotel"]),
  payment_terms: z.enum(["Net 30", "Net 15", "Immediate", "On Arrival"])
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface NewBookingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedHotel?: {
    id: string;
    name: string;
    city: string;
    stars: number;
    room_types: Array<{
      id: string;
      name: string;
      price: number;
      available: number;
    }>;
  };
}

export const NewBookingModal = ({ isOpen, onOpenChange, selectedHotel }: NewBookingModalProps) => {
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    hotel_id: selectedHotel?.id || "",
    adults: 2,
    children: 0,
    currency: "USD",
    payment_method: "Credit Card",
    payment_terms: "Net 30"
  });
  const [nights, setNights] = useState(1);
  const [selectedRoomType, setSelectedRoomType] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock hotel data if no hotel selected
  const mockHotels = [
    {
      id: "1",
      name: "Grand Hyatt Istanbul",
      city: "Istanbul",
      stars: 5,
      room_types: [
        { id: "1", name: "Deluxe Room", price: 285, available: 5 },
        { id: "2", name: "Executive Suite", price: 450, available: 2 }
      ]
    },
    {
      id: "2", 
      name: "Four Seasons Bosphorus",
      city: "Istanbul",
      stars: 5,
      room_types: [
        { id: "3", name: "Bosphorus View Room", price: 520, available: 3 },
        { id: "4", name: "Premium Suite", price: 890, available: 1 }
      ]
    }
  ];

  const hotels = selectedHotel ? [selectedHotel] : mockHotels;
  const currentHotel = hotels.find(h => h.id === formData.hotel_id);

  const calculateTotal = () => {
    if (!selectedRoomType || !nights) return 0;
    return selectedRoomType.price * nights;
  };

  const calculateNights = () => {
    if (!formData.check_in || !formData.check_out) return 1;
    const checkIn = new Date(formData.check_in);
    const checkOut = new Date(formData.check_out);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setNights(Math.max(1, diffDays));
    return Math.max(1, diffDays);
  };

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: BookingFormData) => {
      // Create guest first
      const { data: guestData, error: guestError } = await supabase
        .from('guests')
        .insert({
          hotel_id: '550e8400-e29b-41d4-a716-446655440000', // Mock hotel ID
          first_name: bookingData.guest_first_name,
          last_name: bookingData.guest_last_name,
          email: bookingData.guest_email,
          phone: bookingData.guest_phone,
        })
        .select()
        .single();

      if (guestError) throw guestError;

      // Create reservation using mock data for demo
      console.log('Creating booking with data:', bookingData);
      // Mock successful creation
      const reservationData = { id: Date.now().toString() };
      
      return reservationData;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking created successfully"
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['agency-bookings'] });
      // Reset form
      setFormData({
        hotel_id: selectedHotel?.id || "",
        adults: 2,
        children: 0,
        currency: "USD",
        payment_method: "Credit Card",
        payment_terms: "Net 30"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = () => {
    try {
      const validatedData = bookingSchema.parse({
        ...formData,
        total_price: calculateTotal(),
        check_in: formData.check_in,
        check_out: formData.check_out,
      });
      
      createBookingMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Create New Booking
          </DialogTitle>
        </DialogHeader>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Selection */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Hotel & Dates
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hotel</Label>
                    <Select 
                      value={formData.hotel_id} 
                      onValueChange={(value) => {
                        setFormData({...formData, hotel_id: value, room_type_id: ""});
                        setSelectedRoomType(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select hotel" />
                      </SelectTrigger>
                      <SelectContent>
                        {hotels.map((hotel) => (
                          <SelectItem key={hotel.id} value={hotel.id}>
                            <div className="flex items-center gap-2">
                              {hotel.name}
                              <div className="flex">
                                {[...Array(hotel.stars)].map((_, i) => (
                                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                              <Badge variant="outline">{hotel.city}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Check-in Date</Label>
                      <Input
                        type="date"
                        value={formData.check_in}
                        onChange={(e) => {
                          setFormData({...formData, check_in: e.target.value});
                          setTimeout(calculateNights, 100);
                        }}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Check-out Date</Label>
                      <Input
                        type="date"
                        value={formData.check_out}
                        onChange={(e) => {
                          setFormData({...formData, check_out: e.target.value});
                          setTimeout(calculateNights, 100);
                        }}
                        min={formData.check_in}
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Adults</Label>
                      <Select 
                        value={formData.adults?.toString()} 
                        onValueChange={(value) => setFormData({...formData, adults: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6].map(num => (
                            <SelectItem key={num} value={num.toString()}>{num} Adult{num > 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Children</Label>
                      <Select 
                        value={formData.children?.toString()} 
                        onValueChange={(value) => setFormData({...formData, children: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0,1,2,3,4].map(num => (
                            <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? 'Child' : 'Children'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room Selection */}
            {currentHotel && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    Room Selection
                  </h3>
                  
                  <div className="space-y-3">
                    {currentHotel.room_types.map((room) => (
                      <div 
                        key={room.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedRoomType?.id === room.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          setSelectedRoomType(room);
                          setFormData({...formData, room_type_id: room.id});
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{room.name}</div>
                            <div className="text-sm text-muted-foreground">{room.available} rooms available</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">${room.price}</div>
                            <div className="text-sm text-muted-foreground">per night</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guest Information */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Guest Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={formData.guest_first_name}
                      onChange={(e) => setFormData({...formData, guest_first_name: e.target.value})}
                      placeholder="Guest first name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={formData.guest_last_name}
                      onChange={(e) => setFormData({...formData, guest_last_name: e.target.value})}
                      placeholder="Guest last name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.guest_email}
                      onChange={(e) => setFormData({...formData, guest_email: e.target.value})}
                      placeholder="guest@email.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Phone (Optional)</Label>
                    <Input
                      value={formData.guest_phone}
                      onChange={(e) => setFormData({...formData, guest_phone: e.target.value})}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Special Requests (Optional)</Label>
                  <Textarea
                    value={formData.special_requests}
                    onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
                    placeholder="Any special requirements or requests"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment & Terms
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select 
                      value={formData.payment_method} 
                      onValueChange={(value: any) => setFormData({...formData, payment_method: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Agency Credit">Agency Credit</SelectItem>
                        <SelectItem value="Pay at Hotel">Pay at Hotel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Select 
                      value={formData.payment_terms} 
                      onValueChange={(value: any) => setFormData({...formData, payment_terms: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Immediate">Immediate</SelectItem>
                        <SelectItem value="Net 15">Net 15 Days</SelectItem>
                        <SelectItem value="Net 30">Net 30 Days</SelectItem>
                        <SelectItem value="On Arrival">On Arrival</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Booking Summary
                </h3>
                
                {currentHotel && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{currentHotel.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {currentHotel.city}
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {formData.check_in && formData.check_out && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Check-in:</span>
                          <span>{new Date(formData.check_in).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Check-out:</span>
                          <span>{new Date(formData.check_out).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Nights:</span>
                          <span>{nights}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Guests:</span>
                          <span>{formData.adults} adults{formData.children ? `, ${formData.children} children` : ''}</span>
                        </div>
                      </div>
                    )}
                    
                    {selectedRoomType && (
                      <>
                        <Separator />
                        <div className="space-y-2 text-sm">
                          <div className="font-medium">{selectedRoomType.name}</div>
                          <div className="flex justify-between">
                            <span>${selectedRoomType.price} × {nights} nights</span>
                            <span>${calculateTotal()}</span>
                          </div>
                        </div>
                      </>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${calculateTotal()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createBookingMutation.isPending || !selectedRoomType}
                className="flex-1"
              >
                {createBookingMutation.isPending ? "Creating..." : "Create Booking"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};