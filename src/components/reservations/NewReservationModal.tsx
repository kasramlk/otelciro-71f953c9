import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { 
  CalendarIcon,
  Users,
  Building,
  CreditCard,
  Star,
  ChevronRight,
  ChevronLeft,
  Save,
  X
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
  const { toast } = useToast();
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
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // First create or find guest
      const { data: existingGuest } = await supabase
        .from('guests')
        .select('id')
        .eq('email', formData.email)
        .single();
      
      let guestId;
      
      if (existingGuest) {
        guestId = existingGuest.id;
      } else {
        // Create new guest
        const { data: newGuest, error: guestError } = await supabase
          .from('guests')
          .insert({
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            nationality: formData.nationality,
            id_number: formData.idNumber,
            hotel_id: '550e8400-e29b-41d4-a716-446655440001' // Mock hotel ID
          })
          .select()
          .single();
          
        if (guestError) throw guestError;
        guestId = newGuest.id;
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
          room_type_id: '550e8400-e29b-41d4-a716-446655440010', // Mock room type ID
          rate_plan_id: '550e8400-e29b-41d4-a716-446655440020', // Mock rate plan ID
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
      
      toast({
        title: "Success",
        description: `Reservation ${reservationCode} created successfully!`,
      });
      
      onClose();
      
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create reservation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
                    <SelectItem value="standard">Standard Room - $150/night</SelectItem>
                    <SelectItem value="deluxe">Deluxe Room - $200/night</SelectItem>
                    <SelectItem value="suite">Suite - $300/night</SelectItem>
                    <SelectItem value="executive">Executive Suite - $450/night</SelectItem>
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
                    <SelectItem value="standard">Standard Rate</SelectItem>
                    <SelectItem value="advance">Advance Purchase (15% off)</SelectItem>
                    <SelectItem value="corporate">Corporate Rate</SelectItem>
                    <SelectItem value="weekend">Weekend Special</SelectItem>
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
    </Dialog>
  );
};