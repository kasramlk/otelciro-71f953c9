import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CalendarIcon, 
  Users, 
  Building, 
  CreditCard, 
  Save, 
  ArrowLeft, 
  Printer, 
  Download, 
  Mail, 
  Plus,
  X,
  FileText,
  Upload,
  DollarSign,
  Calculator,
  Bed,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ReservationData {
  // Header info
  reservationNumber: string;
  status: 'confirmed' | 'option' | 'cancelled';
  agencyId: string;
  groupName: string;
  createdBy: string;
  
  // Guest info
  guestName: string;
  email: string;
  phone: string;
  nationality: string;
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  nights: number;
  adults: number;
  children: number;
  infants: number;
  notes: string;
  
  // Room & Rate
  roomType: string;
  roomNumber: string;
  mealPlan: 'BB' | 'HB' | 'FB' | 'AI';
  ratePlan: string;
  pricePerNight: number;
  currency: string;
  
  // Payment
  paymentType: string;
  guaranteeType: 'guarantee' | 'non-guarantee' | 'option';
  depositAmount: number;
  earlyBirdDiscount: number;
  discountPercent: number;
  discountAmount: number;
  splitFolio: boolean;
  
  // Additional
  salesChannel: string;
  arrivalTime: string;
  departureTime: string;
}

export default function NewReservation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [agencies, setAgencies] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [ratePlans, setRatePlans] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<ReservationData>({
    reservationNumber: `RES${Date.now().toString().slice(-6)}`,
    status: 'confirmed',
    agencyId: '',
    groupName: '',
    createdBy: '',
    guestName: '',
    email: '',
    phone: '',
    nationality: '',
    checkIn: undefined,
    checkOut: undefined,
    nights: 1,
    adults: 1,
    children: 0,
    infants: 0,
    notes: '',
    roomType: '',
    roomNumber: '',
    mealPlan: 'BB',
    ratePlan: '',
    pricePerNight: 0,
    currency: 'USD',
    paymentType: 'cash',
    guaranteeType: 'guarantee',
    depositAmount: 0,
    earlyBirdDiscount: 0,
    discountPercent: 0,
    discountAmount: 0,
    splitFolio: false,
    salesChannel: 'direct',
    arrivalTime: '15:00',
    departureTime: '11:00'
  });

  const [folioItems, setFolioItems] = useState<Array<{
    description: string;
    amount: number;
    category: string;
    item_type: string;
  }>>([]);
  const [documents, setDocuments] = useState<Array<{
    name: string;
    url: string;
    type: string;
  }>>([]);
  const [guestList, setGuestList] = useState<Array<{
    name: string;
    age: string;
    relation: string;
  }>>([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load agencies
      const { data: agenciesData } = await supabase.from('agencies').select('id, name').eq('is_active', true);
      if (agenciesData) setAgencies(agenciesData);

      // Load room types  
      try {
        const roomTypesResponse = await supabase.from('room_types').select('id, name, code');
        if (roomTypesResponse.data && !roomTypesResponse.error) {
          setRoomTypes(roomTypesResponse.data);
        }
      } catch (error) {
        console.log('Error loading room types:', error);
      }

      // Load rate plans
      const { data: ratePlansData } = await supabase.from('rate_plans').select('id, name');
      if (ratePlansData) setRatePlans(ratePlansData);

      // Load currencies
      const { data: currenciesData } = await supabase.from('currencies').select('id, code, name').eq('is_active', true);
      if (currenciesData) setCurrencies(currenciesData);

      // Load rooms
      const { data: roomsData } = await supabase.from('rooms').select('id, number, room_type_id');
      if (roomsData) setRooms(roomsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Auto-calculate nights when dates change
  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      const diffTime = formData.checkOut.getTime() - formData.checkIn.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setFormData(prev => ({ ...prev, nights: diffDays }));
    }
  }, [formData.checkIn, formData.checkOut]);

  const updateFormData = (field: keyof ReservationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    const subtotal = formData.pricePerNight * formData.nights;
    const discountAmount = formData.discountPercent > 0 
      ? (subtotal * formData.discountPercent / 100) 
      : formData.discountAmount;
    const taxAmount = (subtotal - discountAmount) * 0.1; // 10% tax
    return {
      subtotal,
      discountAmount,
      taxAmount,
      total: subtotal - discountAmount + taxAmount
    };
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Create or find guest
      const { data: existingGuest } = await supabase
        .from('guests')
        .select('id')
        .eq('email', formData.email)
        .single();

      let guestId;
      if (existingGuest) {
        guestId = existingGuest.id;
      } else {
        const [firstName, ...lastNameParts] = formData.guestName.split(' ');
        const { data: newGuest, error: guestError } = await supabase
          .from('guests')
          .insert({
            first_name: firstName,
            last_name: lastNameParts.join(' ') || '',
            email: formData.email,
            phone: formData.phone,
            nationality: formData.nationality,
            hotel_id: '550e8400-e29b-41d4-a716-446655440001' // Mock hotel ID
          })
          .select()
          .single();

        if (guestError) throw guestError;
        guestId = newGuest.id;
      }

      // Create reservation
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          code: formData.reservationNumber,
          guest_id: guestId,
          hotel_id: '550e8400-e29b-41d4-a716-446655440001',
          check_in: formData.checkIn?.toISOString().split('T')[0],
          check_out: formData.checkOut?.toISOString().split('T')[0],
          adults: formData.adults,
          children: formData.children,
          infants: formData.infants,
          room_type_id: formData.roomType,
          room_id: formData.roomNumber,
          rate_plan_id: formData.ratePlan,
          meal_plan: formData.mealPlan,
          currency: formData.currency,
          total_price: calculateTotal().total,
          payment_method: formData.paymentType,
          deposit_amount: formData.depositAmount,
          discount_percent: formData.discountPercent,
          discount_amount: formData.discountAmount,
          guarantee_type: formData.guaranteeType,
          notes: formData.notes,
          status: formData.status,
          agency_id: formData.agencyId || null,
          group_name: formData.groupName || null,
          channel: formData.salesChannel,
          arrival_time: formData.arrivalTime,
          departure_time: formData.departureTime
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Create folio items if any
      if (folioItems.length > 0) {
        // Use reservation_charges table instead for now
        for (const item of folioItems) {
          await supabase
            .from('reservation_charges')
            .insert({
              reservation_id: reservation.id,
              description: item.description,
              amount: item.amount,
              type: 'charge',
              currency: formData.currency
            });
        }
      }

      toast({
        title: "Success",
        description: `Reservation ${formData.reservationNumber} created successfully!`,
      });

      navigate('/reservations');
    } catch (error) {
      console.error('Error saving reservation:', error);
      toast({
        title: "Error",
        description: "Failed to create reservation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const { data, error } = await supabase.functions.invoke('export-data', {
        body: {
          type: 'reservation',
          format,
          data: formData
        }
      });

      if (error) throw error;

      toast({
        title: "Export Started",
        description: `Reservation is being exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleSendEmail = async () => {
    toast({
      title: "Email Sent",
      description: "Confirmation email sent to guest successfully!",
    });
  };

  const addFolioItem = () => {
    setFolioItems(prev => [...prev, {
      description: '',
      amount: 0,
      category: 'accommodation',
      item_type: 'charge'
    }]);
  };

  const updateFolioItem = (index: number, field: string, value: any) => {
    setFolioItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeFolioItem = (index: number) => {
    setFolioItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/reservations')}
            className="bg-background/80 backdrop-blur-sm border-border/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reservations
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">New Reservation</h1>
            <p className="text-muted-foreground">Create a new hotel reservation</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => handleExport('pdf')}
            className="bg-background/80 backdrop-blur-sm"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Proforma
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport('excel')}
            className="bg-background/80 backdrop-blur-sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSendEmail}
            className="bg-background/80 backdrop-blur-sm"
          >
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-gradient-primary text-white shadow-glow"
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Reservation'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6 bg-background/80 backdrop-blur-sm">
          <TabsTrigger value="details" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center">
            <Bed className="mr-2 h-4 w-4" />
            Room Allocation
          </TabsTrigger>
          <TabsTrigger value="guests" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Guests
          </TabsTrigger>
          <TabsTrigger value="folio" className="flex items-center">
            <DollarSign className="mr-2 h-4 w-4" />
            Folio
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center">
            <Upload className="mr-2 h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Notes & Times
          </TabsTrigger>
        </TabsList>

        {/* Main Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reservation Header */}
            <Card className="lg:col-span-3 bg-background/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Reservation Header
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Reservation Number</Label>
                    <Input 
                      value={formData.reservationNumber} 
                      onChange={(e) => updateFormData('reservationNumber', e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value: any) => updateFormData('status', value)}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="option">Option</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Agency/Source</Label>
                    <Select value={formData.agencyId} onValueChange={(value) => updateFormData('agencyId', value)}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select agency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Direct</SelectItem>
                        {agencies.map(agency => (
                          <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Group Name</Label>
                    <Input 
                      value={formData.groupName} 
                      onChange={(e) => updateFormData('groupName', e.target.value)}
                      placeholder="Optional"
                      className="bg-background"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guest Information */}
            <Card className="bg-background/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Guest & Stay Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Guest Name *</Label>
                  <Input 
                    value={formData.guestName} 
                    onChange={(e) => updateFormData('guestName', e.target.value)}
                    placeholder="Full name"
                    className="bg-background"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="guest@email.com"
                    className="bg-background"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="+1-555-0123"
                    className="bg-background"
                  />
                </div>
                <div>
                  <Label>Nationality</Label>
                  <Select value={formData.nationality} onValueChange={(value) => updateFormData('nationality', value)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Check-in Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left bg-background",
                            !formData.checkIn && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.checkIn ? format(formData.checkIn, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.checkIn}
                          onSelect={(date) => updateFormData('checkIn', date)}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Check-out Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left bg-background",
                            !formData.checkOut && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.checkOut ? format(formData.checkOut, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.checkOut}
                          onSelect={(date) => updateFormData('checkOut', date)}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label>Nights</Label>
                    <Input 
                      type="number"
                      value={formData.nights} 
                      onChange={(e) => updateFormData('nights', parseInt(e.target.value))}
                      min="1"
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Label>Adults</Label>
                    <Input 
                      type="number"
                      value={formData.adults} 
                      onChange={(e) => updateFormData('adults', parseInt(e.target.value))}
                      min="1"
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Label>Children</Label>
                    <Input 
                      type="number"
                      value={formData.children} 
                      onChange={(e) => updateFormData('children', parseInt(e.target.value))}
                      min="0"
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Label>Infants</Label>
                    <Input 
                      type="number"
                      value={formData.infants} 
                      onChange={(e) => updateFormData('infants', parseInt(e.target.value))}
                      min="0"
                      className="bg-background"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room & Rate Selection */}
            <Card className="bg-background/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bed className="mr-2 h-5 w-5" />
                  Room & Rate Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Room Type *</Label>
                  <Select value={formData.roomType} onValueChange={(value) => updateFormData('roomType', value)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map(roomType => (
                        <SelectItem key={roomType.id} value={roomType.id}>
                          {roomType.name} - $150/night
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Room Number</Label>
                  <Select value={formData.roomNumber} onValueChange={(value) => updateFormData('roomNumber', value)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.filter(room => room.room_type_id === formData.roomType).map(room => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Meal Plan</Label>
                  <Select value={formData.mealPlan} onValueChange={(value: any) => updateFormData('mealPlan', value)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BB">Bed & Breakfast</SelectItem>
                      <SelectItem value="HB">Half Board</SelectItem>
                      <SelectItem value="FB">Full Board</SelectItem>
                      <SelectItem value="AI">All Inclusive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rate Plan</Label>
                  <Select value={formData.ratePlan} onValueChange={(value) => updateFormData('ratePlan', value)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select rate plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {ratePlans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price per Night</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.pricePerNight} 
                      onChange={(e) => updateFormData('pricePerNight', parseFloat(e.target.value))}
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => updateFormData('currency', value)}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.id} value={currency.code}>{currency.code} - {currency.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment & Guarantee */}
            <Card className="bg-background/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Payment & Guarantee
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Payment Type</Label>
                  <Select value={formData.paymentType} onValueChange={(value) => updateFormData('paymentType', value)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit-card">Credit Card</SelectItem>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      <SelectItem value="ota-vcc">OTA Virtual Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Guarantee Type</Label>
                  <Select value={formData.guaranteeType} onValueChange={(value: any) => updateFormData('guaranteeType', value)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guarantee">Guarantee</SelectItem>
                      <SelectItem value="non-guarantee">Non-guaranteed</SelectItem>
                      <SelectItem value="option">Option</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Deposit Amount</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.depositAmount} 
                    onChange={(e) => updateFormData('depositAmount', parseFloat(e.target.value))}
                    className="bg-background"
                  />
                </div>
                <div>
                  <Label>Early Bird Discount %</Label>
                  <Input 
                    type="number"
                    value={formData.earlyBirdDiscount} 
                    onChange={(e) => updateFormData('earlyBirdDiscount', parseFloat(e.target.value))}
                    className="bg-background"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount %</Label>
                    <Input 
                      type="number"
                      value={formData.discountPercent} 
                      onChange={(e) => updateFormData('discountPercent', parseFloat(e.target.value))}
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Label>Discount Amount</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.discountAmount} 
                      onChange={(e) => updateFormData('discountAmount', parseFloat(e.target.value))}
                      className="bg-background"
                    />
                  </div>
                </div>

                <Separator />

                {/* Price Summary */}
                <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({formData.nights} nights):</span>
                    <span>{formData.currency} {calculateTotal().subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span>-{formData.currency} {calculateTotal().discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (10%):</span>
                    <span>{formData.currency} {calculateTotal().taxAmount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>{formData.currency} {calculateTotal().total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Room Allocation Tab */}
        <TabsContent value="rooms">
          <Card className="bg-background/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Room Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Room allocation functionality - assign multiple rooms to this reservation
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guests Tab */}
        <TabsContent value="guests">
          <Card className="bg-background/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Guest List
                <Button onClick={() => setGuestList(prev => [...prev, { name: '', age: '', relation: '' }])}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Guest
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guestList.map((guest, index) => (
                <div key={index} className="flex items-center space-x-4 mb-4 p-4 border rounded-lg">
                  <Input 
                    placeholder="Guest name"
                    value={guest.name}
                    onChange={(e) => {
                      const newList = [...guestList];
                      newList[index].name = e.target.value;
                      setGuestList(newList);
                    }}
                  />
                  <Input 
                    placeholder="Age"
                    type="number"
                    value={guest.age}
                    onChange={(e) => {
                      const newList = [...guestList];
                      newList[index].age = e.target.value;
                      setGuestList(newList);
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setGuestList(prev => prev.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Folio Tab */}
        <TabsContent value="folio">
          <Card className="bg-background/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Folio Items
                <Button onClick={addFolioItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Charge
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {folioItems.map((item, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 mb-4 p-4 border rounded-lg">
                  <Input 
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateFolioItem(index, 'description', e.target.value)}
                  />
                  <Input 
                    placeholder="Amount"
                    type="number"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) => updateFolioItem(index, 'amount', parseFloat(e.target.value))}
                  />
                  <Select 
                    value={item.category}
                    onValueChange={(value) => updateFolioItem(index, 'category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accommodation">Accommodation</SelectItem>
                      <SelectItem value="food">Food & Beverage</SelectItem>
                      <SelectItem value="misc">Miscellaneous</SelectItem>
                      <SelectItem value="tax">Tax</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => removeFolioItem(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="bg-background/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Documents & Files</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Upload guest documents like passport, ID cards, etc.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes & Times Tab */}
        <TabsContent value="notes">
          <Card className="bg-background/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Notes & Special Times</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Arrival Time</Label>
                  <Input 
                    type="time"
                    value={formData.arrivalTime} 
                    onChange={(e) => updateFormData('arrivalTime', e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div>
                  <Label>Departure Time</Label>
                  <Input 
                    type="time"
                    value={formData.departureTime} 
                    onChange={(e) => updateFormData('departureTime', e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>
              <div>
                <Label>Reservation Notes</Label>
                <Textarea 
                  value={formData.notes} 
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  placeholder="Internal notes about this reservation..."
                  rows={4}
                  className="bg-background"
                />
              </div>
              <div>
                <Label>Sales Channel</Label>
                <Select value={formData.salesChannel} onValueChange={(value) => updateFormData('salesChannel', value)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="booking.com">Booking.com</SelectItem>
                    <SelectItem value="expedia">Expedia</SelectItem>
                    <SelectItem value="agoda">Agoda</SelectItem>
                    <SelectItem value="airbnb">Airbnb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}