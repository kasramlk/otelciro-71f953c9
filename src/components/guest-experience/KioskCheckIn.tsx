import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Scan,
  QrCode,
  CreditCard,
  Key,
  CheckCircle2,
  User,
  Calendar,
  MapPin,
  Clock,
  Printer,
  Smartphone
} from "lucide-react";
import { format } from "date-fns";

interface KioskCheckInProps {
  onBack: () => void;
}

// Mock reservation lookup
const mockReservations = {
  "HTL123456": {
    confirmationCode: "HTL123456",
    guestName: "John Smith",
    email: "john.smith@email.com",
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    roomType: "Deluxe King Room",
    roomNumber: "301",
    nights: 3,
    adults: 2,
    children: 0,
    totalAmount: 450.00,
    balance: 450.00,
    status: "Confirmed"
  }
};

export default function KioskCheckIn({ onBack }: KioskCheckInProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [reservation, setReservation] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const { toast } = useToast();

  const lookupReservation = (code: string) => {
    const found = mockReservations[code.toUpperCase()];
    if (found) {
      setReservation(found);
      setCurrentStep(2);
      toast({
        title: "Reservation found",
        description: `Welcome ${found.guestName}!`,
      });
    } else {
      toast({
        title: "Reservation not found",
        description: "Please check your confirmation code and try again.",
        variant: "destructive",
      });
    }
  };

  const handleScan = () => {
    setIsScanning(true);
    // Simulate QR code scan
    setTimeout(() => {
      setIsScanning(false);
      lookupReservation("HTL123456");
    }, 2000);
  };

  const processPayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      setPaymentProcessed(true);
      toast({
        title: "Payment authorized",
        description: "Credit card has been authorized successfully.",
      });
      setCurrentStep(4);
    }, 2000);
  };

  const completeCheckIn = () => {
    toast({
      title: "Check-in complete!",
      description: "Welcome to our hotel. Enjoy your stay!",
    });
    setCurrentStep(5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      {/* Kiosk Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Staff View
          </Button>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleString()}
          </div>
        </div>
        
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-2">Welcome</h1>
          <p className="text-xl text-muted-foreground">Self Check-in Terminal</p>
          <div className="w-24 h-1 bg-primary mx-auto mt-4 rounded" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Reservation Lookup */}
          {currentStep === 1 && (
            <Card className="text-center shadow-lg">
              <CardHeader className="pb-8">
                <QrCode className="h-20 w-20 text-primary mx-auto mb-6" />
                <CardTitle className="text-3xl">Find Your Reservation</CardTitle>
                <CardDescription className="text-lg">
                  Scan your QR code or enter your confirmation number
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <Button
                    onClick={handleScan}
                    disabled={isScanning}
                    className="w-full h-16 text-lg"
                    size="lg"
                  >
                    {isScanning ? (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        Scanning...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Scan className="h-6 w-6" />
                        Scan QR Code
                      </div>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-muted" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-4 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Input
                      value={confirmationCode}
                      onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                      placeholder="Enter confirmation code"
                      className="text-center text-xl h-14 tracking-wider"
                      maxLength={12}
                    />
                    <Button
                      onClick={() => lookupReservation(confirmationCode)}
                      disabled={confirmationCode.length < 6}
                      className="w-full h-14 text-lg"
                      size="lg"
                    >
                      Find Reservation
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Need help? Contact front desk</p>
                  <p>Phone: (555) 123-4567 • Extension: 0</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Reservation Details */}
          {currentStep === 2 && reservation && (
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <User className="h-16 w-16 text-primary mx-auto mb-4" />
                <CardTitle className="text-3xl">Welcome, {reservation.guestName}!</CardTitle>
                <CardDescription className="text-lg">
                  Please review your reservation details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6 p-6 bg-muted rounded-lg">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Check-in</p>
                        <p className="font-semibold">{format(reservation.checkIn, "MMM dd, yyyy")}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Room Type</p>
                        <p className="font-semibold">{reservation.roomType}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Guests</p>
                        <p className="font-semibold">
                          {reservation.adults} Adult{reservation.adults > 1 ? 's' : ''}
                          {reservation.children > 0 && `, ${reservation.children} Child${reservation.children > 1 ? 'ren' : ''}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Check-out</p>
                        <p className="font-semibold">{format(reservation.checkOut, "MMM dd, yyyy")}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Room Number</p>
                        <p className="font-semibold text-2xl text-primary">{reservation.roomNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-semibold">{reservation.nights} Night{reservation.nights > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">${reservation.totalAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Balance due: ${reservation.balance.toFixed(2)}
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1 h-12">
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep(3)} className="flex-1 h-12">
                    Confirm & Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment Processing */}
          {currentStep === 3 && (
            <Card className="text-center shadow-lg">
              <CardHeader>
                <CreditCard className="h-20 w-20 text-primary mx-auto mb-6" />
                <CardTitle className="text-3xl">Payment Authorization</CardTitle>
                <CardDescription className="text-lg">
                  Insert or tap your credit card to authorize payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="bg-yellow-50 p-6 rounded-lg border-2 border-dashed border-yellow-200">
                  <div className="animate-pulse flex items-center justify-center space-x-4">
                    <CreditCard className="h-12 w-12 text-yellow-600" />
                    <div className="text-lg font-medium text-yellow-700">
                      Insert your card or tap to pay
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    We accept Visa, MasterCard, American Express
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your card will be authorized for room charges plus $150 incidental hold
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1 h-12">
                    Back
                  </Button>
                  <Button 
                    onClick={processPayment}
                    disabled={paymentProcessed}
                    className="flex-1 h-12"
                  >
                    {paymentProcessed ? "Processing..." : "Simulate Payment"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Generate Keys */}
          {currentStep === 4 && (
            <Card className="text-center shadow-lg">
              <CardHeader>
                <Key className="h-20 w-20 text-primary mx-auto mb-6" />
                <CardTitle className="text-3xl">Digital Keys Ready</CardTitle>
                <CardDescription className="text-lg">
                  Your room keys are being generated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-6">
                  <div className="bg-green-50 p-6 rounded-lg">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="font-semibold text-green-700 mb-2">Payment Authorized</p>
                    <p className="text-sm text-green-600">
                      Your credit card has been successfully authorized
                    </p>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg">
                    <QrCode className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <p className="font-semibold text-blue-700 mb-2">Digital Key Generated</p>
                    <p className="text-sm text-blue-600">
                      Your mobile key for Room {reservation?.roomNumber} is ready
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-12">
                    <Printer className="mr-2 h-5 w-5" />
                    Print Receipt
                  </Button>
                  <Button variant="outline" className="h-12">
                    <Smartphone className="mr-2 h-5 w-5" />
                    Send to Phone
                  </Button>
                </div>

                <Button onClick={completeCheckIn} className="w-full h-14 text-lg">
                  Complete Check-in
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Check-in Complete */}
          {currentStep === 5 && (
            <Card className="text-center shadow-lg">
              <CardHeader>
                <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto mb-6" />
                <CardTitle className="text-4xl text-green-600">Welcome!</CardTitle>
                <CardDescription className="text-xl">
                  Your check-in is complete. Enjoy your stay!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-2 gap-6 p-6 bg-green-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Your Room</p>
                    <p className="text-3xl font-bold text-primary">{reservation?.roomNumber}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Check-out</p>
                    <p className="text-lg font-semibold">11:00 AM</p>
                    <p className="text-sm">{format(reservation?.checkOut || new Date(), "MMM dd")}</p>
                  </div>
                </div>

                <div className="space-y-3 text-left bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold">Important Information:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• WiFi: HotelGuest2024</li>
                    <li>• Pool hours: 6:00 AM - 10:00 PM</li>
                    <li>• Breakfast: 7:00 AM - 10:30 AM</li>
                    <li>• Front desk: Extension 0</li>
                    <li>• Housekeeping: Extension 100</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Button variant="outline" className="w-full h-12">
                    <Printer className="mr-2 h-5 w-5" />
                    Print Welcome Packet
                  </Button>
                  
                  <Button onClick={() => {
                    setCurrentStep(1);
                    setReservation(null);
                    setConfirmationCode("");
                    setPaymentProcessed(false);
                  }} className="w-full h-12">
                    Check-in Another Guest
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}