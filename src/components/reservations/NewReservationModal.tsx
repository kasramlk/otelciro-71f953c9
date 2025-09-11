import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  getDateValidationError, 
  sanitizeObject, 
  completeReservationSchema,
  validateRoomAvailability 
} from "@/lib/validations";
import { useAuditLogger } from "@/lib/audit-logger";
import { useErrorHandler } from "@/lib/error-handler";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CalendarIcon,
  Users,
  Building,
  CreditCard,
  Star,
  ChevronRight,
  ChevronLeft,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface NewReservationModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  { id: 1, title: 'Guest Information', description: 'Basic guest details' },
  { id: 2, title: 'Stay Details', description: 'Dates, rooms & preferences' },
  { id: 3, title: 'Billing & Confirmation', description: 'Payment and final review' }
];

export const NewReservationModal = ({ open, onClose }: NewReservationModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [ratePlans, setRatePlans] = useState<any[]>([]);
  const { toast } = useToast();
  const { logReservationCreated, logGuestCreated } = useAuditLogger();
  const { handleAsyncOperation } = useErrorHandler();
  const { showConfirmation, ConfirmationComponent, setLoading: setConfirmationLoading } = useConfirmation();
  const [formData, setFormData] = useState({
    // Step 1: Guest Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    idNumber: '',
    company: '',
    isVIP: false,
    loyaltyNumber: '',
    
    // Step 2: Stay Details
    checkIn: undefined as Date | undefined,
    checkOut: undefined as Date | undefined,
    adults: 1,
    children: 0,
    roomType: '',
    ratePlan: '',
    specialRequests: '',
    isGroup: false,
    groupCode: '',
    arrivalTime: '',
    departureTime: '',
    
    // Step 3: Billing
    source: 'Direct',
    channel: '',
    paymentMethod: 'Cash',
    depositAmount: 0,
    notes: '',
    sendConfirmation: true,
    marketingConsent: false
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Reset availability check if dates change
    if (field === 'checkIn' || field === 'checkOut' || field === 'roomType') {
      setAvailabilityChecked(false);
    }
  };

  // Load room types and rate plans
  const loadData = async () => {
    try {
      const hotelId = '6163aacb-81d7-4eb2-ab68-4d3e172bef3e'; // Current hotel ID
      
      const [roomTypesRes, ratePlansRes] = await Promise.all([
        supabase.from('room_types').select('id, name, code').eq('hotel_id', hotelId),
        supabase.from('rate_plans').select('id, name, code').eq('hotel_id', hotelId)
      ]);
      
      if (roomTypesRes.data) setRoomTypes(roomTypesRes.data);
      if (ratePlansRes.data) setRatePlans(ratePlansRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const validateCurrentStep = async (): Promise<boolean> => {
    const errors: Record<string, string> = {};
    
    try {
      switch (currentStep) {
        case 1: // Guest Information
          if (!formData.firstName.trim()) errors.firstName = 'First name is required';
          if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
          if (!formData.email.trim()) errors.email = 'Email is required';
          if (!formData.phone.trim()) errors.phone = 'Phone number is required';
          
          // Email format validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (formData.email && !emailRegex.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
          }
          
          break;
          
        case 2: // Stay Details
          if (!formData.checkIn) errors.checkIn = 'Check-in date is required';
          if (!formData.checkOut) errors.checkOut = 'Check-out date is required';
          if (!formData.roomType) errors.roomType = 'Room type is required';
          
          // Date validation
          if (formData.checkIn && formData.checkOut) {
            const dateError = getDateValidationError(formData.checkIn, formData.checkOut);
            if (dateError) {
              errors.checkOut = dateError;
            }
          }
          
          // Room availability check - only run if all required fields are filled
          if (formData.checkIn && formData.checkOut && formData.roomType && 
              !availabilityChecked && 
              !errors.checkIn && !errors.checkOut) {
            try {
              const availability = await validateRoomAvailability(
                formData.roomType,
                formData.checkIn,
                formData.checkOut
              );
              
              if (!availability.available) {
                errors.roomType = availability.message || 'Room not available';
                // Offer waitlist option
                showConfirmation({
                  title: 'Room Not Available',
                  description: availability.message + ' Would you like to add this guest to the waitlist instead?',
                  confirmText: 'Add to Waitlist',
                  onConfirm: () => {
                    // Handle waitlist addition
                    toast({
                      title: "Added to Waitlist",
                      description: "Guest has been added to the waitlist for these dates.",
                    });
                    onClose();
                  }
                });
              } else {
                setAvailabilityChecked(true);
              }
            } catch (error) {
              console.error('Availability check failed:', error);
              // Don't block the user if availability check fails
            }
          }
          
          break;
          
        case 3: // Billing
          if (!formData.paymentMethod) errors.paymentMethod = 'Payment method is required';
          if (formData.depositAmount < 0) errors.depositAmount = 'Deposit cannot be negative';
          break;
      }
      
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Error",
        description: "An error occurred during validation. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const nextStep = async () => {
    if (currentStep < 3) {
      const isValid = await validateCurrentStep();
      if (isValid) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    const result = await handleAsyncOperation(
      async () => {
        setLoading(true);
        
        // Sanitize input data
        const sanitizedData = sanitizeObject(formData);
        
        // First create or find guest
        const { data: existingGuest } = await supabase
          .from('guests')
          .select('id')
          .eq('email', sanitizedData.email)
          .single();
        
        let guestId;
        
        if (existingGuest) {
          guestId = existingGuest.id;
        } else {
          // Create new guest
          const { data: newGuest, error: guestError } = await supabase
            .from('guests')
            .insert({
              first_name: sanitizedData.firstName,
              last_name: sanitizedData.lastName,
              email: sanitizedData.email,
              phone: sanitizedData.phone,
              nationality: sanitizedData.nationality,
              id_number: sanitizedData.idNumber,
              hotel_id: '550e8400-e29b-41d4-a716-446655440001' // Mock hotel ID
            })
            .select()
            .single();
            
          if (guestError) throw guestError;
          guestId = newGuest.id;
          
          // Log guest creation
          await logGuestCreated(guestId, {
            first_name: sanitizedData.firstName,
            last_name: sanitizedData.lastName,
            email: sanitizedData.email,
          });
        }
        
        // Create reservation
        const reservationCode = `RES${Date.now().toString().slice(-6)}`;
        const { data: reservation, error: reservationError } = await supabase
          .from('reservations')
          .insert({
            code: reservationCode,
            guest_id: guestId,
            hotel_id: '550e8400-e29b-41d4-a716-446655440001',
            check_in: formData.checkIn?.toISOString().split('T')[0],
            check_out: formData.checkOut?.toISOString().split('T')[0],
            adults: formData.adults,
            children: formData.children,
            room_type_id: formData.roomType || '550e8400-e29b-41d4-a716-446655440010',
            rate_plan_id: formData.ratePlan || '550e8400-e29b-41d4-a716-446655440020',
            total_price: 199.99, // Calculate based on room type and dates
            payment_method: formData.paymentMethod,
            deposit_amount: formData.depositAmount,
            source: formData.source,
            notes: formData.notes,
            special_requests: formData.specialRequests ? [formData.specialRequests] : null,
            status: 'Booked'
          })
          .select()
          .single();
          
        if (reservationError) throw reservationError;
        
        // Log reservation creation
        await logReservationCreated(reservation.id, {
          code: reservationCode,
          guest_id: guestId,
          total_price: reservation.total_price,
          status: 'Booked'
        });
        
        return { reservationCode, reservation };
      },
      { component: 'NewReservationModal', action: 'create_reservation' }
    );

    if (result) {
      toast({
        title: "Success",
        description: `Reservation ${result.reservationCode} created successfully!`,
        action: (
          <Button variant="outline" size="sm" onClick={() => {
            // Navigate to reservation details or folio
            console.log('View reservation:', result.reservation.id);
          }}>
            View Details
          </Button>
        ),
      });
      
      onClose();
    }
    
    setLoading(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="guest@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+1-555-0123"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Select value={formData.nationality} onValueChange={(value) => updateFormData('nationality', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                    <SelectItem value="fr">France</SelectItem>
                    <SelectItem value="jp">Japan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID/Passport Number</Label>
                <Input
                  id="idNumber"
                  value={formData.idNumber}
                  onChange={(e) => updateFormData('idNumber', e.target.value)}
                  placeholder="Enter ID number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company (Optional)</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => updateFormData('company', e.target.value)}
                placeholder="Company name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isVIP"
                  checked={formData.isVIP}
                  onCheckedChange={(checked) => updateFormData('isVIP', checked)}
                />
                <Label htmlFor="isVIP" className="flex items-center">
                  <Star className="mr-1 h-4 w-4" />
                  VIP Guest
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="loyaltyNumber">Loyalty Number</Label>
                <Input
                  id="loyaltyNumber"
                  value={formData.loyaltyNumber}
                  onChange={(e) => updateFormData('loyaltyNumber', e.target.value)}
                  placeholder="Loyalty program number"
                />
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check-in Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
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
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Check-out Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
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
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adults">Adults *</Label>
                <Select value={String(formData.adults)} onValueChange={(value) => updateFormData('adults', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={String(num)}>{num} Adult{num > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="children">Children</Label>
                <Select value={String(formData.children)} onValueChange={(value) => updateFormData('children', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4].map(num => (
                      <SelectItem key={num} value={String(num)}>{num} {num === 1 ? 'Child' : 'Children'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomType">Room Type *</Label>
                <Select value={formData.roomType} onValueChange={(value) => updateFormData('roomType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map(roomType => (
                      <SelectItem key={roomType.id} value={roomType.id}>
                        {roomType.name} ({roomType.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ratePlan">Rate Plan</Label>
                <Select value={formData.ratePlan} onValueChange={(value) => updateFormData('ratePlan', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rate plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {ratePlans.map(ratePlan => (
                      <SelectItem key={ratePlan.id} value={ratePlan.id}>
                        {ratePlan.name} ({ratePlan.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arrivalTime">Estimated Arrival Time</Label>
                <Select value={formData.arrivalTime} onValueChange={(value) => updateFormData('arrivalTime', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (6AM - 12PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12PM - 6PM)</SelectItem>
                    <SelectItem value="evening">Evening (6PM - 10PM)</SelectItem>
                    <SelectItem value="late">Late (After 10PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="departureTime">Estimated Departure Time</Label>
                <Select value={formData.departureTime} onValueChange={(value) => updateFormData('departureTime', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (6AM - 12PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12PM - 6PM)</SelectItem>
                    <SelectItem value="evening">Evening (6PM - 10PM)</SelectItem>
                    <SelectItem value="late">Late (After 10PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => updateFormData('specialRequests', e.target.value)}
                placeholder="High floor, quiet room, late check-in, etc."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isGroup"
                checked={formData.isGroup}
                onCheckedChange={(checked) => updateFormData('isGroup', checked)}
              />
              <Label htmlFor="isGroup" className="flex items-center">
                <Users className="mr-1 h-4 w-4" />
                Part of Group Reservation
              </Label>
            </div>

            {formData.isGroup && (
              <div className="space-y-2">
                <Label htmlFor="groupCode">Group Code</Label>
                <Input
                  id="groupCode"
                  value={formData.groupCode}
                  onChange={(e) => updateFormData('groupCode', e.target.value)}
                  placeholder="Enter group code"
                />
              </div>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Booking Source</Label>
                <Select value={formData.source} onValueChange={(value) => updateFormData('source', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Direct">Direct Booking</SelectItem>
                    <SelectItem value="Booking.com">Booking.com</SelectItem>
                    <SelectItem value="Expedia">Expedia</SelectItem>
                    <SelectItem value="Corporate">Corporate</SelectItem>
                    <SelectItem value="Agency">Travel Agency</SelectItem>
                    <SelectItem value="Phone">Phone Booking</SelectItem>
                    <SelectItem value="Walk-in">Walk-in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => updateFormData('paymentMethod', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Company Account">Company Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="depositAmount">Deposit Amount</Label>
              <Input
                id="depositAmount"
                type="number"
                value={formData.depositAmount}
                onChange={(e) => updateFormData('depositAmount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="Internal notes (not visible to guest)"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendConfirmation"
                  checked={formData.sendConfirmation}
                  onCheckedChange={(checked) => updateFormData('sendConfirmation', checked)}
                />
                <Label htmlFor="sendConfirmation">Send confirmation email to guest</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketingConsent"
                  checked={formData.marketingConsent}
                  onCheckedChange={(checked) => updateFormData('marketingConsent', checked)}
                />
                <Label htmlFor="marketingConsent">Guest consents to marketing communications</Label>
              </div>
            </div>

            {/* Reservation Summary */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3">Reservation Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Guest:</span>
                  <span>{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dates:</span>
                  <span>
                    {formData.checkIn && formData.checkOut
                      ? `${format(formData.checkIn, 'MMM dd')} - ${format(formData.checkOut, 'MMM dd')}`
                      : 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Room:</span>
                  <span>{formData.roomType || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guests:</span>
                  <span>{formData.adults} adults{formData.children > 0 && `, ${formData.children} children`}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Est. Total:</span>
                  <span>$850.00</span>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5 text-primary" />
            Create New Reservation
          </DialogTitle>
        </DialogHeader>

        {/* Validation Errors Display */}
        {Object.keys(validationErrors).length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please correct the following errors:
              <ul className="mt-2 list-disc list-inside">
                {Object.entries(validationErrors).map(([field, error]) => (
                  <li key={field} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${currentStep >= step.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {step.id}
              </div>
              <div className="ml-2 hidden sm:block">
                <div className={`text-sm font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            
            {currentStep === 3 ? (
              <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-primary text-white">
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Creating...' : 'Create Reservation'}
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
      <ConfirmationComponent />
    </Dialog>
  );
};