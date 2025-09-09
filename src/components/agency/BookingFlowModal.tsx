import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import { createAgencyBooking } from "@/lib/services/booking-service";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar,
  Users,
  MapPin,
  DollarSign,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { format, addDays } from "date-fns";

interface BookingFlowModalProps {
  open: boolean;
  onClose: () => void;
  hotel: any;
  action: 'book' | 'quote' | 'view';
}

const BookingFlowModal = ({ open, onClose, hotel, action }: BookingFlowModalProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    checkIn: new Date(),
    checkOut: addDays(new Date(), 2),
    adults: 2,
    children: 0,
    selectedRoom: hotel?.rooms?.[0] || null,
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    specialRequests: '',
    agencyReference: ''
  });
  const { toast } = useToast();
  const { showConfirmation, ConfirmationComponent } = useConfirmation();

  const nights = Math.ceil((bookingData.checkOut.getTime() - bookingData.checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const totalAmount = nights * (bookingData.selectedRoom?.price || 0);

  const handleStepForward = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleStepBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleBookingSubmit = async () => {
    if (!bookingData.guestName || !bookingData.guestEmail) {
      toast({
        title: "Missing Information", 
        description: "Please fill in all required guest details.",
        variant: "destructive"
      });
      return;
    }

    const confirmed = await showConfirmation({
      title: "Confirm Booking",
      description: `Create HMS reservation for ${bookingData.guestName} at ${hotel.name}?`,
      confirmText: "Create Reservation",
      onConfirm: async () => {
        setLoading(true);
        try {
          // Use booking service to create actual HMS reservation
          const bookingResult = await createAgencyBooking({
            hotelId: hotel.id,
            roomTypeId: bookingData.selectedRoom?.id || hotel.rooms?.[0]?.id,
            guestName: bookingData.guestName,
            guestEmail: bookingData.guestEmail,
            guestPhone: bookingData.guestPhone,
            checkIn: format(bookingData.checkIn, 'yyyy-MM-dd'),
            checkOut: format(bookingData.checkOut, 'yyyy-MM-dd'),
            adults: bookingData.adults,
            children: bookingData.children,
            specialRequests: bookingData.specialRequests,
            agencyId: 'agency-sample-id', // TODO: Get from auth context
            rateQuoted: totalAmount
          });

          if (bookingResult.success) {
            toast({
              title: "Reservation Created Successfully!",
              description: `HMS Reservation: ${bookingResult.bookingReference}`,
              action: (
                <Button variant="outline" size="sm" onClick={() => {
                  console.log('View reservation:', bookingResult.reservationId);
                }}>
                  View in HMS
                </Button>
              )
            });
            onClose();
          } else {
            throw new Error(bookingResult.error || 'Booking failed');
          }
        } catch (error) {
          console.error('Booking error:', error);
          toast({
            title: "Reservation Failed",
            description: error instanceof Error ? error.message : "Unable to create HMS reservation. Please try again.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleQuoteRequest = async () => {
    setLoading(true);
    try {
      // Generate quote reference
      const quoteRef = `QUOTE-${Date.now().toString().slice(-8).toUpperCase()}`;
      
      toast({
        title: "Quote Generated",
        description: `Quote reference: ${quoteRef}. Valid for 48 hours.`,
        duration: 5000
      });

      // In production, this would save to quotes table and send email
      onClose();
    } catch (error) {
      toast({
        title: "Quote Failed",
        description: "Unable to generate quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold mb-4">Stay Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Check-in Date</Label>
                  <Input
                    type="date"
                    value={format(bookingData.checkIn, 'yyyy-MM-dd')}
                    onChange={(e) => setBookingData(prev => ({
                      ...prev,
                      checkIn: new Date(e.target.value)
                    }))}
                  />
                </div>
                <div>
                  <Label>Check-out Date</Label>
                  <Input
                    type="date"
                    value={format(bookingData.checkOut, 'yyyy-MM-dd')}
                    onChange={(e) => setBookingData(prev => ({
                      ...prev,
                      checkOut: new Date(e.target.value)
                    }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Adults</Label>
                  <Input
                    type="number"
                    min="1"
                    value={bookingData.adults}
                    onChange={(e) => setBookingData(prev => ({
                      ...prev,
                      adults: parseInt(e.target.value)
                    }))}
                  />
                </div>
                <div>
                  <Label>Children</Label>
                  <Input
                    type="number"
                    min="0"
                    value={bookingData.children}
                    onChange={(e) => setBookingData(prev => ({
                      ...prev,
                      children: parseInt(e.target.value)
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Room Selection */}
            <div>
              <h4 className="font-medium mb-3">Select Room Type</h4>
              <div className="space-y-3">
                {hotel.rooms?.map((room: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      bookingData.selectedRoom === room
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setBookingData(prev => ({ ...prev, selectedRoom: room }))}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-medium">{room.type}</h5>
                        <p className="text-sm text-muted-foreground">{room.available} rooms available</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${room.price}</p>
                        <p className="text-sm text-muted-foreground">per night</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span>Total ({nights} nights):</span>
                <span className="text-xl font-bold">${totalAmount}</span>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold mb-4">Guest Information</h3>
              <div className="space-y-4">
                <div>
                  <Label>Guest Name *</Label>
                  <Input
                    placeholder="Full name"
                    value={bookingData.guestName}
                    onChange={(e) => setBookingData(prev => ({
                      ...prev,
                      guestName: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="guest@example.com"
                    value={bookingData.guestEmail}
                    onChange={(e) => setBookingData(prev => ({
                      ...prev,
                      guestEmail: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="+1-555-0123"
                    value={bookingData.guestPhone}
                    onChange={(e) => setBookingData(prev => ({
                      ...prev,
                      guestPhone: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label>Special Requests</Label>
                  <Textarea
                    placeholder="Any special requirements..."
                    value={bookingData.specialRequests}
                    onChange={(e) => setBookingData(prev => ({
                      ...prev,
                      specialRequests: e.target.value
                    }))}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Agency Reference</Label>
                  <Input
                    placeholder="Internal reference number"
                    value={bookingData.agencyReference}
                    onChange={(e) => setBookingData(prev => ({
                      ...prev,
                      agencyReference: e.target.value
                    }))}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
              
              {/* Hotel Details */}
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">{hotel.name}</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {hotel.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(bookingData.checkIn, 'MMM dd')} - {format(bookingData.checkOut, 'MMM dd')} ({nights} nights)
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {bookingData.adults} adults{bookingData.children > 0 && `, ${bookingData.children} children`}
                  </div>
                </div>
              </div>

              {/* Guest Details */}
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Guest Details</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Name:</strong> {bookingData.guestName}</p>
                  <p><strong>Email:</strong> {bookingData.guestEmail}</p>
                  {bookingData.guestPhone && <p><strong>Phone:</strong> {bookingData.guestPhone}</p>}
                  {bookingData.specialRequests && <p><strong>Requests:</strong> {bookingData.specialRequests}</p>}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{bookingData.selectedRoom?.type}</span>
                    <span>${bookingData.selectedRoom?.price} × {nights} nights</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>${totalAmount}</span>
                  </div>
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
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {action === 'book' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {action === 'quote' && <DollarSign className="h-5 w-5 text-blue-600" />}
              {action === 'view' && <MapPin className="h-5 w-5 text-purple-600" />}
              {action === 'book' ? 'Create Booking' : action === 'quote' ? 'Request Quote' : 'Hotel Details'}
              {hotel && <Badge variant="outline">{hotel.name}</Badge>}
            </DialogTitle>
          </DialogHeader>

          {action !== 'view' && (
            <div className="flex items-center justify-center mb-6">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNum
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={`w-16 h-0.5 ${
                        step > stepNum ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {renderStepContent()}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={step > 1 ? handleStepBack : onClose}
            >
              {step > 1 ? 'Back' : 'Cancel'}
            </Button>

            <div className="flex gap-2">
              {action !== 'view' && (
                <>
                  {step < 3 ? (
                    <Button onClick={handleStepForward}>
                      Next
                    </Button>
                  ) : (
                    <>
                      {action === 'book' && (
                        <Button
                          onClick={handleBookingSubmit}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Confirm Booking
                        </Button>
                      )}
                      {action === 'quote' && (
                        <Button
                          onClick={handleQuoteRequest}
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Generate Quote
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmationComponent />
    </>
  );
};

export default BookingFlowModal;