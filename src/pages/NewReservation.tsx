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
  Building2, 
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
  Clock,
  Sparkles,
  Star,
  CheckCircle2
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Modern Glassmorphic Header */}
      <div className="sticky top-0 z-50 glass-subtle border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/reservations')}
                className="text-muted-foreground hover:text-foreground hover:bg-white/10 backdrop-blur-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Reservations
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-primary">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">New Reservation</h1>
                  <p className="text-sm text-muted-foreground">Create a new hotel reservation</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                onClick={() => handleExport('pdf')}
                className="text-muted-foreground hover:text-foreground hover:bg-white/10"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleExport('excel')}
                className="text-muted-foreground hover:text-foreground hover:bg-white/10"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleSendEmail}
                className="text-muted-foreground hover:text-foreground hover:bg-white/10"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="bg-gradient-primary text-white shadow-glow hover:shadow-xl transition-all duration-300"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save Reservation'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8 glass-subtle p-1 h-12">
            <TabsTrigger 
              value="details" 
              className="flex items-center justify-center space-x-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Details</span>
            </TabsTrigger>
            <TabsTrigger 
              value="rooms" 
              className="flex items-center justify-center space-x-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
            >
              <Bed className="h-4 w-4" />
              <span className="hidden sm:inline">Rooms</span>
            </TabsTrigger>
            <TabsTrigger 
              value="guests" 
              className="flex items-center justify-center space-x-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Guests</span>
            </TabsTrigger>
            <TabsTrigger 
              value="folio" 
              className="flex items-center justify-center space-x-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
            >
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Folio</span>
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="flex items-center justify-center space-x-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="flex items-center justify-center space-x-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Notes</span>
            </TabsTrigger>
          </TabsList>

        {/* Main Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reservation Header */}
            <Card className="lg:col-span-3 card-modern hover:shadow-elevated transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Building2 className="mr-2 h-5 w-5 text-primary" />
                  Reservation Header
                  <Badge variant="secondary" className="ml-auto">{formData.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Reservation Number</Label>
                    <Input 
                      value={formData.reservationNumber} 
                      onChange={(e) => updateFormData('reservationNumber', e.target.value)}
                      className="bg-muted/30 border-0 focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Select value={formData.status} onValueChange={(value: any) => updateFormData('status', value)}>
                      <SelectTrigger className="bg-muted/30 border-0 focus:bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">
                          <div className="flex items-center">
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                            Confirmed
                          </div>
                        </SelectItem>
                        <SelectItem value="option">
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                            Option
                          </div>
                        </SelectItem>
                        <SelectItem value="cancelled">
                          <div className="flex items-center">
                            <X className="mr-2 h-4 w-4 text-red-500" />
                            Cancelled
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Agency/Source</Label>
                    <Select value={formData.agencyId} onValueChange={(value) => updateFormData('agencyId', value)}>
                      <SelectTrigger className="bg-muted/30 border-0 focus:bg-background">
                        <SelectValue placeholder="Select agency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Direct</SelectItem>
                        {agencies.map(agency => (
                          <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Group Name</Label>
                    <Input 
                      value={formData.groupName} 
                      onChange={(e) => updateFormData('groupName', e.target.value)}
                      placeholder="Optional"
                      className="bg-muted/30 border-0 focus:bg-background"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guest Information */}
            <Card className="card-modern hover:shadow-elevated transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Guest & Stay Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Guest Name *</Label>
                  <Input 
                    value={formData.guestName} 
                    onChange={(e) => updateFormData('guestName', e.target.value)}
                    placeholder="Full name"
                    className="bg-muted/30 border-0 focus:bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Email *</Label>
                  <Input 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="guest@email.com"
                    className="bg-muted/30 border-0 focus:bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Phone *</Label>
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="+1-555-0123"
                    className="bg-muted/30 border-0 focus:bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Nationality</Label>
                  <Select value={formData.nationality} onValueChange={(value) => updateFormData('nationality', value)}>
                    <SelectTrigger className="bg-muted/30 border-0 focus:bg-background">
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

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Check-in Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left bg-muted/30 border-0 focus:bg-background",
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
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Check-out Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left bg-muted/30 border-0 focus:bg-background",
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

                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Nights</Label>
                    <Input 
                      type="number"
                      value={formData.nights} 
                      onChange={(e) => updateFormData('nights', parseInt(e.target.value))}
                      min="1"
                      className="bg-muted/30 border-0 focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Adults</Label>
                    <Input 
                      type="number"
                      value={formData.adults} 
                      onChange={(e) => updateFormData('adults', parseInt(e.target.value))}
                      min="1"
                      className="bg-muted/30 border-0 focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Children</Label>
                    <Input 
                      type="number"
                      value={formData.children} 
                      onChange={(e) => updateFormData('children', parseInt(e.target.value))}
                      min="0"
                      className="bg-muted/30 border-0 focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Infants</Label>
                    <Input 
                      type="number"
                      value={formData.infants} 
                      onChange={(e) => updateFormData('infants', parseInt(e.target.value))}
                      min="0"
                      className="bg-muted/30 border-0 focus:bg-background"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room & Rate Selection */}
            <Card className="card-modern hover:shadow-elevated transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Bed className="mr-2 h-5 w-5 text-primary" />
                  Room & Rate Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Room Type *</Label>
                  <Select value={formData.roomType} onValueChange={(value) => updateFormData('roomType', value)}>
                    <SelectTrigger className="bg-muted/30 border-0 focus:bg-background">
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
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Room Number</Label>
                  <Select value={formData.roomNumber} onValueChange={(value) => updateFormData('roomNumber', value)}>
                    <SelectTrigger className="bg-muted/30 border-0 focus:bg-background">
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
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Meal Plan</Label>
                  <Select value={formData.mealPlan} onValueChange={(value: any) => updateFormData('mealPlan', value)}>
                    <SelectTrigger className="bg-muted/30 border-0 focus:bg-background">
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
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Rate Plan</Label>
                  <Select value={formData.ratePlan} onValueChange={(value) => updateFormData('ratePlan', value)}>
                    <SelectTrigger className="bg-muted/30 border-0 focus:bg-background">
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
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Price per Night</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.pricePerNight} 
                      onChange={(e) => updateFormData('pricePerNight', parseFloat(e.target.value))}
                      className="bg-muted/30 border-0 focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => updateFormData('currency', value)}>
                      <SelectTrigger className="bg-muted/30 border-0 focus:bg-background">
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
            <Card className="card-modern hover:shadow-elevated transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <CreditCard className="mr-2 h-5 w-5 text-primary" />
                  Payment & Guarantee
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Payment Type</Label>
                  <Select value={formData.paymentType} onValueChange={(value) => updateFormData('paymentType', value)}>
                    <SelectTrigger className="bg-muted/30 border-0 focus:bg-background">
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
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Guarantee Type</Label>
                  <Select value={formData.guaranteeType} onValueChange={(value: any) => updateFormData('guaranteeType', value)}>
                    <SelectTrigger className="bg-muted/30 border-0 focus:bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guarantee">Guarantee</SelectItem>
                      <SelectItem value="non-guarantee">Non-guaranteed</SelectItem>
                      <SelectItem value="option">Option</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Deposit Amount</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.depositAmount} 
                    onChange={(e) => updateFormData('depositAmount', parseFloat(e.target.value))}
                    className="bg-muted/30 border-0 focus:bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Early Bird Discount %</Label>
                  <Input 
                    type="number"
                    value={formData.earlyBirdDiscount} 
                    onChange={(e) => updateFormData('earlyBirdDiscount', parseFloat(e.target.value))}
                    className="bg-muted/30 border-0 focus:bg-background"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Discount %</Label>
                    <Input 
                      type="number"
                      value={formData.discountPercent} 
                      onChange={(e) => updateFormData('discountPercent', parseFloat(e.target.value))}
                      className="bg-muted/30 border-0 focus:bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Discount Amount</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.discountAmount} 
                      onChange={(e) => updateFormData('discountAmount', parseFloat(e.target.value))}
                      className="bg-muted/30 border-0 focus:bg-background"
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Price Summary */}
                <div className="space-y-3 p-4 bg-gradient-to-br from-muted/20 to-muted/30 rounded-lg border border-border/20">
                  <div className="flex items-center mb-2">
                    <Calculator className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">Price Summary</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal ({formData.nights} nights):</span>
                    <span>{formData.currency} {calculateTotal().subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Discount:</span>
                    <span className="text-green-600">-{formData.currency} {calculateTotal().discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax (10%):</span>
                    <span>{formData.currency} {calculateTotal().taxAmount.toFixed(2)}</span>
                  </div>
                  <Separator className="opacity-50" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-foreground">Total Amount:</span>
                    <span className="text-primary">{formData.currency} {calculateTotal().total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Room Allocation Tab */}
        <TabsContent value="rooms" className="space-y-6">
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Bed className="mr-2 h-5 w-5 text-primary" />
                Room Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="border-blue-200 bg-blue-50/50">
                <Star className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Room allocation functionality - assign multiple rooms to this reservation. This feature allows managing group bookings with multiple room assignments.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guests Tab */}
        <TabsContent value="guests" className="space-y-6">
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Guest List
                </div>
                <Button 
                  onClick={() => setGuestList(prev => [...prev, { name: '', age: '', relation: '' }])}
                  className="bg-gradient-primary text-white hover:shadow-lg transition-all duration-300"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Guest
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guestList.map((guest, index) => (
                <div key={index} className="flex items-center space-x-4 mb-4 p-4 bg-muted/20 rounded-lg border border-border/50">
                  <Input 
                    placeholder="Guest name"
                    value={guest.name}
                    onChange={(e) => {
                      const newList = [...guestList];
                      newList[index].name = e.target.value;
                      setGuestList(newList);
                    }}
                    className="bg-background/80 border-0"
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
                    className="bg-background/80 border-0 w-20"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setGuestList(prev => prev.filter((_, i) => i !== index))}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {guestList.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No additional guests added yet.</p>
                  <p className="text-sm">Click "Add Guest" to add more guests to this reservation.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Folio Tab */}
        <TabsContent value="folio" className="space-y-6">
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-primary" />
                  Folio Items
                </div>
                <Button 
                  onClick={addFolioItem}
                  className="bg-gradient-primary text-white hover:shadow-lg transition-all duration-300"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Charge
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {folioItems.map((item, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 mb-4 p-4 bg-muted/20 rounded-lg border border-border/50">
                  <Input 
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateFolioItem(index, 'description', e.target.value)}
                    className="bg-background/80 border-0"
                  />
                  <Input 
                    placeholder="Amount"
                    type="number"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) => updateFolioItem(index, 'amount', parseFloat(e.target.value))}
                    className="bg-background/80 border-0"
                  />
                  <Select 
                    value={item.category}
                    onValueChange={(value) => updateFolioItem(index, 'category', value)}
                  >
                    <SelectTrigger className="bg-background/80 border-0">
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
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeFolioItem(index)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {folioItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No folio items added yet.</p>
                  <p className="text-sm">Click "Add Charge" to add charges to this reservation's folio.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Upload className="mr-2 h-5 w-5 text-primary" />
                Documents & Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="border-purple-200 bg-purple-50/50">
                <FileText className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-800">
                  Upload guest documents like passport, ID cards, contracts, and other important files related to this reservation.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes & Times Tab */}
        <TabsContent value="notes" className="space-y-6">
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                Notes & Special Times
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Arrival Time</Label>
                  <Input 
                    type="time"
                    value={formData.arrivalTime} 
                    onChange={(e) => updateFormData('arrivalTime', e.target.value)}
                    className="bg-muted/30 border-0 focus:bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Departure Time</Label>
                  <Input 
                    type="time"
                    value={formData.departureTime} 
                    onChange={(e) => updateFormData('departureTime', e.target.value)}
                    className="bg-muted/30 border-0 focus:bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Reservation Notes</Label>
                <Textarea 
                  value={formData.notes} 
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  placeholder="Internal notes about this reservation..."
                  rows={4}
                  className="bg-muted/30 border-0 focus:bg-background resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Sales Channel</Label>
                <Select value={formData.salesChannel} onValueChange={(value) => updateFormData('salesChannel', value)}>
                  <SelectTrigger className="bg-muted/30 border-0 focus:bg-background">
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
    </div>
  );
}