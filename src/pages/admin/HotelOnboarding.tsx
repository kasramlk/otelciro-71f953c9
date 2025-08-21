import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building, Users, Bed, CreditCard, Settings, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HotelData {
  // Step 1: Hotel Details
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  starRating: string;
  amenities: string[];
  
  // Step 2: Room Types
  roomTypes: Array<{
    name: string;
    capacity: number;
    bedType: string;
    amenities: string[];
    description: string;
    basePrice: number;
  }>;
  
  // Step 3: Rooms Setup
  rooms: Array<{
    roomTypeId: string;
    roomNumber: string;
    floor: string;
  }>;
  
  // Step 4: Rate Plans
  ratePlans: Array<{
    name: string;
    code: string;
    description: string;
    cancellationPolicy: string;
    currency: string;
  }>;
  
  // Step 5: Policies & Settings
  checkInTime: string;
  checkOutTime: string;
  taxRate: number;
  serviceFee: number;
  currency: string;
  
  // Step 6: First User
  managerName: string;
  managerEmail: string;
  managerPhone: string;
}

const HotelOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [hotelData, setHotelData] = useState<HotelData>({
    name: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    starRating: '',
    amenities: [],
    roomTypes: [],
    rooms: [],
    ratePlans: [],
    checkInTime: '15:00',
    checkOutTime: '11:00',
    taxRate: 0,
    serviceFee: 0,
    currency: 'USD',
    managerName: '',
    managerEmail: '',
    managerPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const steps = [
    { number: 1, title: "Hotel Details", icon: Building },
    { number: 2, title: "Room Types", icon: Bed },
    { number: 3, title: "Rooms Setup", icon: Settings },
    { number: 4, title: "Rate Plans", icon: CreditCard },
    { number: 5, title: "Policies", icon: Settings },
    { number: 6, title: "Manager User", icon: Users }
  ];

  const hotelAmenities = [
    "WiFi", "Parking", "Pool", "Gym", "Spa", "Restaurant", "Bar", 
    "Room Service", "Laundry", "Business Center", "Pet Friendly", "Airport Shuttle"
  ];

  const roomAmenities = [
    "Air Conditioning", "TV", "Mini Bar", "Safe", "Balcony", "City View", 
    "Ocean View", "Kitchenette", "Sofa", "Desk", "Coffee Machine"
  ];

  const bedTypes = ["Single", "Double", "Queen", "King", "Twin", "Sofa Bed"];

  const currencies = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD"];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAmenityToggle = (amenity: string, type: 'hotel' | 'room', index?: number) => {
    if (type === 'hotel') {
      const newAmenities = hotelData.amenities.includes(amenity)
        ? hotelData.amenities.filter(a => a !== amenity)
        : [...hotelData.amenities, amenity];
      
      setHotelData(prev => ({ ...prev, amenities: newAmenities }));
    } else if (type === 'room' && typeof index === 'number') {
      const newRoomTypes = [...hotelData.roomTypes];
      const currentAmenities = newRoomTypes[index].amenities || [];
      newRoomTypes[index].amenities = currentAmenities.includes(amenity)
        ? currentAmenities.filter(a => a !== amenity)
        : [...currentAmenities, amenity];
      
      setHotelData(prev => ({ ...prev, roomTypes: newRoomTypes }));
    }
  };

  const addRoomType = () => {
    setHotelData(prev => ({
      ...prev,
      roomTypes: [
        ...prev.roomTypes,
        {
          name: '',
          capacity: 2,
          bedType: '',
          amenities: [],
          description: '',
          basePrice: 100
        }
      ]
    }));
  };

  const removeRoomType = (index: number) => {
    setHotelData(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.filter((_, i) => i !== index)
    }));
  };

  const addRatePlan = () => {
    setHotelData(prev => ({
      ...prev,
      ratePlans: [
        ...prev.ratePlans,
        {
          name: '',
          code: '',
          description: '',
          cancellationPolicy: '',
          currency: 'USD'
        }
      ]
    }));
  };

  const removeRatePlan = (index: number) => {
    setHotelData(prev => ({
      ...prev,
      ratePlans: prev.ratePlans.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (currentStep !== totalSteps) return;
    
    setLoading(true);
    try {
      // Create organization first
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: hotelData.name,
          billing_email: hotelData.managerEmail
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create hotel
      const { data: hotelDataResponse, error: hotelError } = await supabase
        .from('hotels')
        .insert({
          name: hotelData.name,
          address: hotelData.address,
          city: hotelData.city,
          country: hotelData.country,
          phone: hotelData.phone,
          code: hotelData.name.replace(/\s+/g, '').toUpperCase().slice(0, 6),
          org_id: orgData.id
        })
        .select()
        .single();

      if (hotelError) throw hotelError;

      // Create room types
      if (hotelData.roomTypes.length > 0) {
        const roomTypesData = hotelData.roomTypes.map(rt => ({
          hotel_id: hotelDataResponse.id,
          name: rt.name,
          code: rt.name.toUpperCase().replace(/\s+/g, '_').slice(0, 10),
          capacity_adults: rt.capacity,
          base_rate: rt.basePrice,
          amenities: rt.amenities,
          description: rt.description
        }));

        const { error: roomTypesError } = await supabase
          .from('room_types')
          .insert(roomTypesData);

        if (roomTypesError) throw roomTypesError;
      }

      // Create rate plans
      if (hotelData.ratePlans.length > 0) {
        const ratePlansData = hotelData.ratePlans.map(rp => ({
          hotel_id: hotelDataResponse.id,
          name: rp.name,
          code: rp.code,
          description: rp.description,
          currency: rp.currency
        }));

        const { error: ratePlansError } = await supabase
          .from('rate_plans')
          .insert(ratePlansData);

        if (ratePlansError) throw ratePlansError;
      }

      // Create manager user
      const { error: authError } = await supabase.auth.admin.createUser({
        email: hotelData.managerEmail,
        password: 'TempPass123!', // They'll need to reset this
        user_metadata: {
          name: hotelData.managerName,
          role: 'hotel_manager',
          org_id: orgData.id,
          hotel_id: hotelDataResponse.id
        }
      });

      if (authError) {
        console.error('Auth user creation error:', authError);
        // Continue anyway, user can be created later
      }

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          email: hotelData.managerEmail,
          name: hotelData.managerName,
          role: 'Manager',
          org_id: orgData.id,
          auth_user_id: null // Will be updated when they first login
        });

      if (userError) {
        console.error('User record creation error:', userError);
      }

      toast({
        title: "Success!",
        description: "Hotel onboarding completed successfully. The manager will receive login instructions via email."
      });

      navigate('/admin');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete hotel onboarding",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hotelName">Hotel Name *</Label>
                <Input
                  id="hotelName"
                  value={hotelData.name}
                  onChange={(e) => setHotelData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Grand Plaza Hotel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="starRating">Star Rating</Label>
                <Select 
                  value={hotelData.starRating} 
                  onValueChange={(value) => setHotelData(prev => ({ ...prev, starRating: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Star</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={hotelData.address}
                  onChange={(e) => setHotelData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={hotelData.city}
                  onChange={(e) => setHotelData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={hotelData.country}
                  onChange={(e) => setHotelData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="United States"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={hotelData.phone}
                  onChange={(e) => setHotelData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={hotelData.email}
                  onChange={(e) => setHotelData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="info@grandplaza.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Hotel Amenities</Label>
              <div className="flex flex-wrap gap-2">
                {hotelAmenities.map((amenity) => (
                  <Badge
                    key={amenity}
                    variant={hotelData.amenities.includes(amenity) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleAmenityToggle(amenity, 'hotel')}
                  >
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Room Types Configuration</h3>
                <p className="text-muted-foreground">Define the different types of rooms in your hotel</p>
              </div>
              <Button onClick={addRoomType}>Add Room Type</Button>
            </div>

            {hotelData.roomTypes.map((roomType, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Room Type {index + 1}</CardTitle>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => removeRoomType(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Room Type Name *</Label>
                      <Input
                        value={roomType.name}
                        onChange={(e) => {
                          const newRoomTypes = [...hotelData.roomTypes];
                          newRoomTypes[index].name = e.target.value;
                          setHotelData(prev => ({ ...prev, roomTypes: newRoomTypes }));
                        }}
                        placeholder="Standard Room"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Capacity *</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={roomType.capacity}
                        onChange={(e) => {
                          const newRoomTypes = [...hotelData.roomTypes];
                          newRoomTypes[index].capacity = parseInt(e.target.value) || 2;
                          setHotelData(prev => ({ ...prev, roomTypes: newRoomTypes }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bed Type</Label>
                      <Select
                        value={roomType.bedType}
                        onValueChange={(value) => {
                          const newRoomTypes = [...hotelData.roomTypes];
                          newRoomTypes[index].bedType = value;
                          setHotelData(prev => ({ ...prev, roomTypes: newRoomTypes }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bed type" />
                        </SelectTrigger>
                        <SelectContent>
                          {bedTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Base Price (per night) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={roomType.basePrice}
                        onChange={(e) => {
                          const newRoomTypes = [...hotelData.roomTypes];
                          newRoomTypes[index].basePrice = parseFloat(e.target.value) || 100;
                          setHotelData(prev => ({ ...prev, roomTypes: newRoomTypes }));
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={roomType.description}
                      onChange={(e) => {
                        const newRoomTypes = [...hotelData.roomTypes];
                        newRoomTypes[index].description = e.target.value;
                        setHotelData(prev => ({ ...prev, roomTypes: newRoomTypes }));
                      }}
                      placeholder="Comfortable room with modern amenities..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Room Amenities</Label>
                    <div className="flex flex-wrap gap-2">
                      {roomAmenities.map((amenity) => (
                        <Badge
                          key={amenity}
                          variant={roomType.amenities?.includes(amenity) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleAmenityToggle(amenity, 'room', index)}
                        >
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {hotelData.roomTypes.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bed className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No room types defined</h3>
                  <p className="text-muted-foreground mb-4">Add at least one room type to continue</p>
                  <Button onClick={addRoomType}>Add First Room Type</Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Rooms Setup</h3>
              <p className="text-muted-foreground">This step will be simplified for now. Room inventory can be configured later in the PMS.</p>
            </div>
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="font-semibold mb-2">Room Setup Ready</h3>
                <p className="text-muted-foreground">Individual rooms will be auto-generated based on your room types. You can customize room numbers and floors later in the PMS.</p>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Rate Plans Configuration</h3>
                <p className="text-muted-foreground">Create different pricing strategies for your rooms</p>
              </div>
              <Button onClick={addRatePlan}>Add Rate Plan</Button>
            </div>

            {hotelData.ratePlans.map((ratePlan, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Rate Plan {index + 1}</CardTitle>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => removeRatePlan(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plan Name *</Label>
                      <Input
                        value={ratePlan.name}
                        onChange={(e) => {
                          const newRatePlans = [...hotelData.ratePlans];
                          newRatePlans[index].name = e.target.value;
                          setHotelData(prev => ({ ...prev, ratePlans: newRatePlans }));
                        }}
                        placeholder="Standard Rate"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rate Code *</Label>
                      <Input
                        value={ratePlan.code}
                        onChange={(e) => {
                          const newRatePlans = [...hotelData.ratePlans];
                          newRatePlans[index].code = e.target.value.toUpperCase();
                          setHotelData(prev => ({ ...prev, ratePlans: newRatePlans }));
                        }}
                        placeholder="STD"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select
                        value={ratePlan.currency}
                        onValueChange={(value) => {
                          const newRatePlans = [...hotelData.ratePlans];
                          newRatePlans[index].currency = value;
                          setHotelData(prev => ({ ...prev, ratePlans: newRatePlans }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map(curr => (
                            <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={ratePlan.description}
                      onChange={(e) => {
                        const newRatePlans = [...hotelData.ratePlans];
                        newRatePlans[index].description = e.target.value;
                        setHotelData(prev => ({ ...prev, ratePlans: newRatePlans }));
                      }}
                      placeholder="Standard flexible rate with free cancellation..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cancellation Policy</Label>
                    <Textarea
                      value={ratePlan.cancellationPolicy}
                      onChange={(e) => {
                        const newRatePlans = [...hotelData.ratePlans];
                        newRatePlans[index].cancellationPolicy = e.target.value;
                        setHotelData(prev => ({ ...prev, ratePlans: newRatePlans }));
                      }}
                      placeholder="Free cancellation up to 24 hours before arrival..."
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {hotelData.ratePlans.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No rate plans defined</h3>
                  <p className="text-muted-foreground mb-4">Add at least one rate plan to continue</p>
                  <Button onClick={addRatePlan}>Add First Rate Plan</Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Hotel Policies & Settings</h3>
              <p className="text-muted-foreground">Configure default policies and operational settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Check-in/out Times</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Check-in Time</Label>
                    <Input
                      type="time"
                      value={hotelData.checkInTime}
                      onChange={(e) => setHotelData(prev => ({ ...prev, checkInTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Check-out Time</Label>
                    <Input
                      type="time"
                      value={hotelData.checkOutTime}
                      onChange={(e) => setHotelData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Taxes & Fees</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={hotelData.taxRate}
                      onChange={(e) => setHotelData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                      placeholder="10.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Service Fee (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={hotelData.serviceFee}
                      onChange={(e) => setHotelData(prev => ({ ...prev, serviceFee: parseFloat(e.target.value) || 0 }))}
                      placeholder="5.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Select
                      value={hotelData.currency}
                      onValueChange={(value) => setHotelData(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(curr => (
                          <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Create Hotel Manager Account</h3>
              <p className="text-muted-foreground">Set up the primary user who will manage this hotel</p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="managerName">Manager Name *</Label>
                    <Input
                      id="managerName"
                      value={hotelData.managerName}
                      onChange={(e) => setHotelData(prev => ({ ...prev, managerName: e.target.value }))}
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerPhone">Phone Number</Label>
                    <Input
                      id="managerPhone"
                      value={hotelData.managerPhone}
                      onChange={(e) => setHotelData(prev => ({ ...prev, managerPhone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="managerEmail">Email Address *</Label>
                    <Input
                      id="managerEmail"
                      type="email"
                      value={hotelData.managerEmail}
                      onChange={(e) => setHotelData(prev => ({ ...prev, managerEmail: e.target.value }))}
                      placeholder="manager@grandplaza.com"
                    />
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Login Instructions</h4>
                  <p className="text-sm text-muted-foreground">
                    After completing the onboarding, the manager will receive an email with login instructions and a temporary password. 
                    They will be prompted to change their password on first login.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Onboarding Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Hotel:</strong> {hotelData.name || "Not set"}
                  </div>
                  <div>
                    <strong>Location:</strong> {hotelData.city && hotelData.country ? `${hotelData.city}, ${hotelData.country}` : "Not set"}
                  </div>
                  <div>
                    <strong>Room Types:</strong> {hotelData.roomTypes.length} defined
                  </div>
                  <div>
                    <strong>Rate Plans:</strong> {hotelData.ratePlans.length} defined
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return hotelData.name && hotelData.address && hotelData.city && hotelData.country;
      case 2:
        return hotelData.roomTypes.length > 0 && hotelData.roomTypes.every(rt => rt.name && rt.capacity > 0 && rt.basePrice > 0);
      case 3:
        return true; // Simplified step
      case 4:
        return hotelData.ratePlans.length > 0 && hotelData.ratePlans.every(rp => rp.name && rp.code);
      case 5:
        return hotelData.checkInTime && hotelData.checkOutTime;
      case 6:
        return hotelData.managerName && hotelData.managerEmail;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hotel Onboarding</h1>
          <p className="text-muted-foreground">Complete setup for a new hotel on the platform</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
            
            <div className="flex justify-between">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                
                return (
                  <div key={step.number} className="flex flex-col items-center text-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center mb-2
                      ${isCompleted ? 'bg-primary text-primary-foreground' : 
                        isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}
                    `}>
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className="text-xs font-medium">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Enter basic information about the hotel"}
            {currentStep === 2 && "Define the types of rooms available"}
            {currentStep === 3 && "Configure individual room inventory"}
            {currentStep === 4 && "Create pricing strategies and rate plans"}
            {currentStep === 5 && "Set operational policies and default settings"}
            {currentStep === 6 && "Create the primary hotel manager account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        {currentStep === totalSteps ? (
          <Button 
            onClick={handleSubmit} 
            disabled={!canProceed() || loading}
          >
            {loading ? "Creating Hotel..." : "Complete Onboarding"}
          </Button>
        ) : (
          <Button 
            onClick={handleNext} 
            disabled={!canProceed()}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default HotelOnboarding;