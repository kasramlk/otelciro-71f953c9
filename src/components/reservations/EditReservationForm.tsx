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
import { CalendarIcon, Users, Save, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpdateReservation } from "@/hooks/use-advanced-reservations";
import { format } from "date-fns";

const editReservationSchema = z.object({
  check_in: z.string().min(1, "Check-in date is required"),
  check_out: z.string().min(1, "Check-out date is required"),
  adults: z.coerce.number().min(1, "At least 1 adult is required"),
  children: z.coerce.number().min(0, "Children count cannot be negative"),
  notes: z.string().optional(),
  special_requests: z.string().optional(),
  status: z.enum(["Booked", "Confirmed", "CheckedIn", "CheckedOut", "Cancelled"]),
}).refine((data) => {
  const checkIn = new Date(data.check_in);
  const checkOut = new Date(data.check_out);
  return checkOut > checkIn;
}, {
  message: "Check-out date must be after check-in date",
  path: ["check_out"],
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      status: reservation?.status || 'Booked'
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
        status: reservation.status || 'Booked'
      });
    }
  }, [reservation, reset]);

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
        status: data.status
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

  const watchedData = watch();
  const checkInDate = watchedData.check_in ? new Date(watchedData.check_in) : null;
  const checkOutDate = watchedData.check_out ? new Date(watchedData.check_out) : null;
  const nights = checkInDate && checkOutDate 
    ? Math.max(0, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
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

          {/* Actions */}
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
      </CardContent>
    </Card>
  );
};