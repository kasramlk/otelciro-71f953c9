import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Users, Save, X, Loader2, CreditCard, DollarSign, Calculator, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpdateReservation } from "@/hooks/use-advanced-reservations";
import { useProcessPayment, useBillingAdjustment, useRefundPayment } from "@/hooks/use-billing-operations";
import { format } from "date-fns";

const editReservationSchema = z.object({
  check_in: z.string().min(1, "Check-in date is required"),
  check_out: z.string().min(1, "Check-out date is required"),
  adults: z.coerce.number().min(1, "At least 1 adult is required"),
  children: z.coerce.number().min(0, "Children count cannot be negative"),
  notes: z.string().optional(),
  special_requests: z.string().optional(),
  status: z.enum(["Booked", "Confirmed", "CheckedIn", "CheckedOut", "Cancelled"]),
  // Billing fields
  total_amount: z.coerce.number().min(0, "Total amount cannot be negative"),
  deposit_amount: z.coerce.number().min(0, "Deposit amount cannot be negative"),
  balance_due: z.coerce.number().min(0, "Balance cannot be negative"),
  discount_percent: z.coerce.number().min(0).max(100, "Discount cannot exceed 100%"),
  discount_amount: z.coerce.number().min(0, "Discount amount cannot be negative"),
  payment_method: z.enum(["Cash", "Card", "Bank Transfer", "Online"]),
  payment_type: z.enum(["cash", "card", "transfer"]),
}).refine((data) => {
  const checkIn = new Date(data.check_in);
  const checkOut = new Date(data.check_out);
  return checkOut > checkIn;
}, {
  message: "Check-out date must be after check-in date",
  path: ["check_out"],
}).refine((data) => {
  return data.deposit_amount <= data.total_amount;
}, {
  message: "Deposit cannot exceed total amount",
  path: ["deposit_amount"],
});

type EditReservationFormData = z.infer<typeof editReservationSchema>;

interface EditReservationFormProps {
  reservation: any;
  hotelId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EditReservationForm = ({ 
  reservation, 
  hotelId, 
  onSuccess, 
  onCancel 
}: EditReservationFormProps) => {
  const { toast } = useToast();
  const updateReservationMutation = useUpdateReservation();
  const processPaymentMutation = useProcessPayment();
  const billingAdjustmentMutation = useBillingAdjustment();
  const refundPaymentMutation = useRefundPayment();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [refundAmount, setRefundAmount] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<EditReservationFormData>({
    resolver: zodResolver(editReservationSchema),
    defaultValues: {
      check_in: reservation?.check_in || '',
      check_out: reservation?.check_out || '',
      adults: reservation?.adults || 1,
      children: reservation?.children || 0,
      notes: reservation?.notes || '',
      special_requests: Array.isArray(reservation?.special_requests) 
        ? reservation.special_requests.join(', ') 
        : reservation?.special_requests || '',
      status: reservation?.status || 'Booked',
      // Billing defaults
      total_amount: reservation?.total_amount || 0,
      deposit_amount: reservation?.deposit_amount || 0,
      balance_due: reservation?.balance_due || 0,
      discount_percent: reservation?.discount_percent || 0,
      discount_amount: reservation?.discount_amount || 0,
      payment_method: reservation?.payment_method || 'Cash',
      payment_type: reservation?.payment_type || 'cash'
    }
  });

  // Reset form when reservation changes
  useEffect(() => {
    if (reservation) {
      reset({
        check_in: reservation.check_in,
        check_out: reservation.check_out,
        adults: reservation.adults || 1,
        children: reservation.children || 0,
        notes: reservation.notes || '',
        special_requests: Array.isArray(reservation.special_requests) 
          ? reservation.special_requests.join(', ') 
          : reservation.special_requests || '',
        status: reservation.status || 'Booked',
        // Billing fields
        total_amount: reservation.total_amount || 0,
        deposit_amount: reservation.deposit_amount || 0,
        balance_due: reservation.balance_due || 0,
        discount_percent: reservation.discount_percent || 0,
        discount_amount: reservation.discount_amount || 0,
        payment_method: reservation.payment_method || 'Cash',
        payment_type: reservation.payment_type || 'cash'
      });
    }
  }, [reservation, reset]);

  // Auto-calculate balance due
  const watchedData = watch();
  useEffect(() => {
    const totalAfterDiscount = watchedData.total_amount - watchedData.discount_amount;
    const newBalance = Math.max(0, totalAfterDiscount - watchedData.deposit_amount);
    setValue("balance_due", newBalance);
  }, [watchedData.total_amount, watchedData.deposit_amount, watchedData.discount_amount, setValue]);

  const onSubmit = async (data: EditReservationFormData) => {
    setIsSubmitting(true);
    
    try {
      const updates = {
        check_in: data.check_in,
        check_out: data.check_out,
        adults: data.adults,
        children: data.children,
        notes: data.notes,
        special_requests: data.special_requests 
          ? data.special_requests.split(',').map(req => req.trim()).filter(Boolean)
          : [],
        status: data.status,
        // Billing updates
        total_amount: data.total_amount,
        deposit_amount: data.deposit_amount,
        balance_due: data.balance_due,
        discount_percent: data.discount_percent,
        discount_amount: data.discount_amount,
        payment_method: data.payment_method,
        payment_type: data.payment_type,
        total_price: data.total_amount // Keep total_price in sync
      };

      await updateReservationMutation.mutateAsync({
        reservationId: reservation.id,
        hotelId,
        updates
      });

      toast({
        title: "Reservation Updated",
        description: "The reservation has been successfully updated."
      });

      onSuccess?.();
    } catch (error) {
      console.error('Failed to update reservation:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update the reservation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (paymentAmount <= 0) return;

    try {
      await processPaymentMutation.mutateAsync({
        reservationId: reservation.id,
        hotelId,
        amount: paymentAmount,
        paymentMethod: watchedData.payment_method,
        paymentType: 'partial',
        notes: `Payment processed via reservation edit`
      });
      setPaymentAmount(0);
      onSuccess?.();
    } catch (error) {
      console.error('Payment processing failed:', error);
    }
  };

  const handleRefund = async () => {
    if (refundAmount <= 0) return;

    try {
      await refundPaymentMutation.mutateAsync({
        reservationId: reservation.id,
        hotelId,
        amount: refundAmount,
        reason: `Refund processed via reservation edit`
      });
      setRefundAmount(0);
      onSuccess?.();
    } catch (error) {
      console.error('Refund processing failed:', error);
    }
  };

  const checkInDate = watchedData.check_in ? new Date(watchedData.check_in) : null;
  const checkOutDate = watchedData.check_out ? new Date(watchedData.check_out) : null;
  const nights = checkInDate && checkOutDate 
    ? Math.max(0, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Edit Reservation
            <Badge variant="outline">{reservation?.code}</Badge>
          </div>
          <Badge variant={
            reservation?.status === 'Confirmed' ? 'default' :
            reservation?.status === 'CheckedIn' ? 'secondary' :
            reservation?.status === 'CheckedOut' ? 'outline' :
            reservation?.status === 'Cancelled' ? 'destructive' : 'secondary'
          }>
            {reservation?.status}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Reservation Details</TabsTrigger>
            <TabsTrigger value="billing">Billing & Payments</TabsTrigger>
            <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Guest Information */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Guest Information</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Name:</strong> {reservation?.guestName || 'Unknown Guest'}</p>
                  <p><strong>Email:</strong> {reservation?.guests?.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {reservation?.guests?.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Stay Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Stay Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="check_in">Check-in Date</Label>
                    <Input
                      id="check_in"
                      type="date"
                      {...register("check_in")}
                      className={errors.check_in ? "border-destructive" : ""}
                    />
                    {errors.check_in && (
                      <p className="text-sm text-destructive mt-1">{errors.check_in.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="check_out">Check-out Date</Label>
                    <Input
                      id="check_out"
                      type="date"
                      {...register("check_out")}
                      className={errors.check_out ? "border-destructive" : ""}
                    />
                    {errors.check_out && (
                      <p className="text-sm text-destructive mt-1">{errors.check_out.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="adults">Adults</Label>
                    <Input
                      id="adults"
                      type="number"
                      min="1"
                      {...register("adults")}
                      className={errors.adults ? "border-destructive" : ""}
                    />
                    {errors.adults && (
                      <p className="text-sm text-destructive mt-1">{errors.adults.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="children">Children</Label>
                    <Input
                      id="children"
                      type="number"
                      min="0"
                      {...register("children")}
                      className={errors.children ? "border-destructive" : ""}
                    />
                    {errors.children && (
                      <p className="text-sm text-destructive mt-1">{errors.children.message}</p>
                    )}
                  </div>
                </div>

                {nights > 0 && (
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">
                        <strong>{nights} nights</strong> for {watchedData.adults} adult{watchedData.adults !== 1 ? 's' : ''}
                        {watchedData.children > 0 && ` and ${watchedData.children} child${watchedData.children !== 1 ? 'ren' : ''}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={watchedData.status} onValueChange={(value) => setValue("status", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Booked">Booked</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="CheckedIn">Checked In</SelectItem>
                    <SelectItem value="CheckedOut">Checked Out</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Special Requests */}
              <div>
                <Label htmlFor="special_requests">Special Requests</Label>
                <Textarea
                  id="special_requests"
                  {...register("special_requests")}
                  placeholder="Enter special requests (comma separated)"
                  rows={3}
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Internal notes about this reservation"
                  rows={3}
                />
              </div>

              <Separator />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-primary"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Billing Summary */}
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Billing Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="total_amount">Total Amount</Label>
                    <Input
                      id="total_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("total_amount")}
                      className={errors.total_amount ? "border-destructive" : ""}
                    />
                    {errors.total_amount && (
                      <p className="text-sm text-destructive mt-1">{errors.total_amount.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="deposit_amount">Deposit Paid</Label>
                    <Input
                      id="deposit_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("deposit_amount")}
                      className={errors.deposit_amount ? "border-destructive" : ""}
                    />
                    {errors.deposit_amount && (
                      <p className="text-sm text-destructive mt-1">{errors.deposit_amount.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="balance_due">Balance Due</Label>
                    <Input
                      id="balance_due"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("balance_due")}
                      className="bg-muted"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Discounts */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-4">Discounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discount_percent">Discount %</Label>
                    <Input
                      id="discount_percent"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register("discount_percent")}
                      className={errors.discount_percent ? "border-destructive" : ""}
                    />
                    {errors.discount_percent && (
                      <p className="text-sm text-destructive mt-1">{errors.discount_percent.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="discount_amount">Discount Amount</Label>
                    <Input
                      id="discount_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register("discount_amount")}
                      className={errors.discount_amount ? "border-destructive" : ""}
                    />
                    {errors.discount_amount && (
                      <p className="text-sm text-destructive mt-1">{errors.discount_amount.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-4">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select value={watchedData.payment_method} onValueChange={(value) => setValue("payment_method", value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Card">Credit/Debit Card</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Online">Online Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="payment_type">Payment Type</Label>
                    <Select value={watchedData.payment_type} onValueChange={(value) => setValue("payment_type", value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-primary"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Update Billing
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            {/* Quick Payment */}
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Process Payment
              </h3>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label htmlFor="payment_amount">Payment Amount</Label>
                  <Input
                    id="payment_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={watchedData.balance_due}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    placeholder="Enter amount"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handlePayment}
                  disabled={paymentAmount <= 0 || processPaymentMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processPaymentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Process Payment
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Outstanding balance: {watchedData.balance_due} {reservation?.currency || 'USD'}
              </p>
            </div>

            {/* Quick Refund */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-red-600" />
                Process Refund
              </h3>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label htmlFor="refund_amount">Refund Amount</Label>
                  <Input
                    id="refund_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={watchedData.deposit_amount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    placeholder="Enter refund amount"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleRefund}
                  disabled={refundAmount <= 0 || refundPaymentMutation.isPending}
                  variant="destructive"
                >
                  {refundPaymentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Process Refund
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Available for refund: {watchedData.deposit_amount} {reservation?.currency || 'USD'}
              </p>
            </div>

            {/* Billing Calculations */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                Billing Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-medium">{watchedData.total_amount} {reservation?.currency || 'USD'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="font-medium">-{watchedData.discount_amount} {reservation?.currency || 'USD'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount After Discount:</span>
                  <span className="font-medium">{watchedData.total_amount - watchedData.discount_amount} {reservation?.currency || 'USD'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deposit Paid:</span>
                  <span className="font-medium">{watchedData.deposit_amount} {reservation?.currency || 'USD'}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Balance Due:</span>
                  <span className={watchedData.balance_due > 0 ? "text-red-600" : "text-green-600"}>
                    {watchedData.balance_due} {reservation?.currency || 'USD'}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};