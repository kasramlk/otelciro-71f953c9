import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Upload, 
  CreditCard, 
  CheckCircle2,
  Smartphone,
  Calendar,
  User,
  Mail,
  Phone,
  Camera,
  QrCode,
  Key
} from "lucide-react";
import { format } from "date-fns";

const mobileCheckInSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  idNumber: z.string().min(1, "ID/Passport number is required"),
  specialRequests: z.string().optional(),
  arrivalTime: z.string().optional(),
  marketingConsent: z.boolean().default(false),
});

type MobileCheckInData = z.infer<typeof mobileCheckInSchema>;

interface MobileCheckInProps {
  onBack: () => void;
}

// Mock reservation data
const mockReservation = {
  confirmationCode: "HTL123456",
  guestName: "John Smith",
  checkIn: new Date(),
  checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
  roomType: "Deluxe King Room",
  nights: 3,
  adults: 2,
  children: 0,
  totalAmount: 450.00,
  balance: 450.00
};

export default function MobileCheckIn({ onBack }: MobileCheckInProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [idUploaded, setIdUploaded] = useState(false);
  const [paymentAuthorized, setPaymentAuthorized] = useState(false);
  const { toast } = useToast();

  const form = useForm<MobileCheckInData>({
    resolver: zodResolver(mobileCheckInSchema),
    defaultValues: {
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@email.com",
      phone: "+1-555-0123",
      arrivalTime: "15:00",
    },
  });

  const onSubmit = (data: MobileCheckInData) => {
    console.log("Mobile check-in data:", data);
    toast({
      title: "Check-in completed!",
      description: "Your digital key has been generated. Welcome to our hotel!",
    });
    setCurrentStep(5); // Success step
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const handleIdUpload = () => {
    // Simulate OCR processing
    setTimeout(() => {
      setIdUploaded(true);
      toast({
        title: "ID scanned successfully",
        description: "Information has been extracted and verified.",
      });
    }, 2000);
  };

  const handlePaymentAuth = () => {
    // Simulate payment authorization
    setTimeout(() => {
      setPaymentAuthorized(true);
      toast({
        title: "Payment authorized",
        description: "Credit card has been authorized for incidental charges.",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Mobile-optimized header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="font-semibold">Mobile Check-in</h1>
            <p className="text-xs text-muted-foreground">Step {currentStep} of 5</p>
          </div>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="container max-w-md mx-auto p-4 space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step <= currentStep ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {step < currentStep ? <CheckCircle2 className="h-4 w-4" /> : step}
              </div>
              {step < 5 && (
                <Separator 
                  className={`w-8 mx-1 ${step < currentStep ? 'bg-primary' : 'bg-muted'}`} 
                />
              )}
            </div>
          ))}
        </div>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Reservation Lookup */}
          {currentStep === 1 && (
            <Card>
              <CardHeader className="text-center">
                <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Welcome Back!</CardTitle>
                <CardDescription>
                  We found your reservation. Please verify the details below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Confirmation:</span>
                    <span className="font-semibold">{mockReservation.confirmationCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Guest:</span>
                    <span className="font-semibold">{mockReservation.guestName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Room:</span>
                    <span className="font-semibold">{mockReservation.roomType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Dates:</span>
                    <span className="font-semibold">
                      {format(mockReservation.checkIn, "MMM dd")} - {format(mockReservation.checkOut, "MMM dd")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="font-semibold">${mockReservation.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <Button onClick={nextStep} className="w-full">
                  Confirm Details
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <Card>
              <CardHeader className="text-center">
                <User className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Please verify and update your contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                              <Input {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" {...field} />
                            </div>
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
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="arrivalTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Arrival Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialRequests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Requests (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="High floor, late checkout, etc."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" onClick={prevStep} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={nextStep} className="flex-1">
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: ID Upload & OCR */}
          {currentStep === 3 && (
            <Card>
              <CardHeader className="text-center">
                <Camera className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>ID Verification</CardTitle>
                <CardDescription>
                  Scan your ID or passport for quick verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID/Passport Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter manually or scan below" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  {!idUploaded ? (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="font-medium">Scan your ID or Passport</p>
                        <p className="text-sm text-muted-foreground">
                          Position your document in the camera viewfinder
                        </p>
                      </div>
                      <Button onClick={handleIdUpload} className="w-full">
                        <Camera className="mr-2 h-4 w-4" />
                        Start Camera Scan
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                      <div>
                        <p className="font-medium text-green-600">ID Verified Successfully</p>
                        <p className="text-sm text-muted-foreground">
                          Document information has been extracted
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={prevStep} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={nextStep} 
                    disabled={!idUploaded}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Payment Authorization */}
          {currentStep === 4 && (
            <Card>
              <CardHeader className="text-center">
                <CreditCard className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Payment Authorization</CardTitle>
                <CardDescription>
                  Authorize your card for incidental charges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Authorization Details</h4>
                  <div className="space-y-1 text-sm text-blue-700">
                    <div className="flex justify-between">
                      <span>Room Charges:</span>
                      <span>${mockReservation.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Incidental Hold:</span>
                      <span>$150.00</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total Authorization:</span>
                      <span>${(mockReservation.totalAmount + 150).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    This authorization will be used for your room charges and a temporary hold for incidentals. 
                    The incidental hold will be released upon checkout.
                  </p>
                </div>

                {!paymentAuthorized ? (
                  <Button onClick={handlePaymentAuth} className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Authorize Payment Method
                  </Button>
                ) : (
                  <div className="text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                    <p className="font-medium text-green-600">Payment Authorized</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={prevStep} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={!paymentAuthorized}
                    className="flex-1"
                  >
                    Complete Check-in
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Success & Digital Key */}
          {currentStep === 5 && (
            <Card>
              <CardHeader className="text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-green-600">Welcome to Our Hotel!</CardTitle>
                <CardDescription>
                  Your check-in is complete. Enjoy your stay!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <QrCode className="h-16 w-16 mx-auto mb-3" />
                  <p className="font-medium">Your Digital Key</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Room 301 - Expires {format(mockReservation.checkOut, "MMM dd, yyyy")}
                  </p>
                  <Button variant="outline" className="w-full">
                    <Key className="mr-2 h-4 w-4" />
                    Add to Wallet
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Room Number:</span>
                    <span className="font-semibold">301</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Check-out:</span>
                    <span className="font-semibold">11:00 AM, {format(mockReservation.checkOut, "MMM dd")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">WiFi Password:</span>
                    <span className="font-semibold">HotelGuest2024</span>
                  </div>
                </div>

                <Button onClick={onBack} className="w-full">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Return to Hotel App
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}