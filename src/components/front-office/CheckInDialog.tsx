import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  CreditCard, 
  Key, 
  Clock, 
  DollarSign,
  BedDouble,
  CheckCircle2 as CheckCircle
} from "lucide-react";

const checkInSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  arrivalTime: z.string().optional(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  depositAmount: z.number().min(0, "Deposit amount must be positive"),
  specialRequests: z.string().optional(),
  idVerified: z.boolean().default(false),
});

type CheckInFormData = z.infer<typeof checkInSchema>;

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: {
    id: string;
    guestName: string;
    email: string;
    phone: string;
    roomType: string;
    nights: number;
    adults: number;
    children: number;
    totalAmount: number;
    balance: number;
    reservationCode: string;
    specialRequests?: string[];
  };
}

const availableRooms = [
  { number: "101", type: "Standard Queen", status: "Clean" },
  { number: "102", type: "Deluxe King", status: "Clean" },
  { number: "201", type: "Deluxe King", status: "Inspected" },
  { number: "301", type: "Suite", status: "Clean" },
];

export default function CheckInDialog({ open, onOpenChange, guest }: CheckInDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  const form = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      depositAmount: guest.balance,
      paymentMethod: "Credit Card",
      arrivalTime: new Date().toTimeString().slice(0, 5),
    },
  });

  const onSubmit = async (data: CheckInFormData) => {
    try {
      // Update reservation status and room assignment
      const { error } = await supabase
        .from('reservations')
        .update({
          status: 'Checked In',
          room_id: data.roomNumber, // This should be UUID but using room number for now
          payment_type: data.paymentMethod
        })
        .eq('code', guest.reservationCode);

      if (error) throw error;

      // Record check-in log
      const { error: logError } = await supabase
        .from('checkin_logs')
        .insert({
          reservation_id: guest.id,
          room_id: data.roomNumber,
          checked_in_at: new Date().toISOString(),
          notes: data.specialRequests || null,
          hotel_id: '550e8400-e29b-41d4-a716-446655440000' // This should be dynamic
        });

      if (logError) throw logError;

      // Record deposit payment if amount > 0
      if (data.depositAmount > 0) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            reservation_id: guest.id,
            hotel_id: '550e8400-e29b-41d4-a716-446655440000',
            payment_type: 'deposit',
            payment_method: data.paymentMethod,
            amount: data.depositAmount,
            amount_in_base_currency: data.depositAmount,
            currency: 'USD',
            processed_at: new Date().toISOString()
          });

        if (paymentError) throw paymentError;
      }

      toast({
        title: "Check-in successful",
        description: `${guest.guestName} has been checked into room ${data.roomNumber}`,
      });
      
      onOpenChange(false);
      setCurrentStep(1);
      form.reset();
    } catch (error) {
      toast({
        title: "Check-in failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
      console.error('Check-in error:', error);
    }
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Check-in Process - {guest.guestName}
          </DialogTitle>
          <DialogDescription>
            Complete the check-in process for reservation {guest.reservationCode}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>
              1
            </div>
            <span className="text-sm">Guest Info</span>
          </div>
          <Separator className="flex-1 mx-2" />
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-muted'}`}>
              2
            </div>
            <span className="text-sm">Room Assignment</span>
          </div>
          <Separator className="flex-1 mx-2" />
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-muted'}`}>
              3
            </div>
            <span className="text-sm">Payment & Keys</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Guest Information Review */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Guest Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Guest Name</label>
                        <p className="text-lg font-semibold">{guest.guestName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Reservation Code</label>
                        <p className="text-lg font-semibold">{guest.reservationCode}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p>{guest.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <p>{guest.phone}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Room Type</label>
                        <p>{guest.roomType}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Nights</label>
                        <p>{guest.nights}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Guests</label>
                        <p>{guest.adults} Adults {guest.children > 0 && `, ${guest.children} Children`}</p>
                      </div>
                    </div>

                    {guest.specialRequests && guest.specialRequests.length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Special Requests</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {guest.specialRequests.map((request, index) => (
                            <Badge key={index} variant="outline">{request}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between items-center">
                      <div>
                        <label className="text-sm font-medium">Total Amount</label>
                        <p className="text-xl font-bold">${guest.totalAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Balance Due</label>
                        <p className="text-xl font-bold text-red-600">${guest.balance.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button type="button" onClick={nextStep}>
                    Continue to Room Assignment
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Room Assignment */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BedDouble className="h-5 w-5" />
                      Room Assignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="roomNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Room</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose available room" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableRooms
                                .filter(room => room.type === guest.roomType)
                                .map(room => (
                                  <SelectItem key={room.number} value={room.number}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>Room {room.number}</span>
                                      <Badge variant="outline" className="ml-2">
                                        {room.status}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="arrivalTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Arrival Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div>
                        <label className="text-sm font-medium">Check-out Time</label>
                        <p className="text-sm text-muted-foreground mt-1">Standard: 11:00 AM</p>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="specialRequests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any additional requests or notes..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button type="button" onClick={nextStep}>
                    Continue to Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment & Keys */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment & Authorization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                                <SelectItem value="Debit Card">Debit Card</SelectItem>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                <SelectItem value="Company Account">Company Account</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="depositAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deposit/Payment Amount</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="pl-10"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span>Room Charges:</span>
                        <span>${guest.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span>Payment:</span>
                        <span className="text-green-600">-${form.watch("depositAmount")?.toFixed(2) || "0.00"}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between font-semibold">
                        <span>Remaining Balance:</span>
                        <span className={guest.totalAmount - (form.watch("depositAmount") || 0) > 0 ? "text-red-600" : "text-green-600"}>
                          ${Math.max(0, guest.totalAmount - (form.watch("depositAmount") || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-green-700">
                          <Key className="h-4 w-4" />
                          <span className="font-medium">Key Cards Ready</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          Digital keys will be activated upon check-in completion
                        </p>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button type="submit" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Complete Check-in
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}