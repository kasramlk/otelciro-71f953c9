import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import { EditReservationForm } from "./EditReservationForm";
import { useHotelContext } from "@/hooks/use-hotel-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Edit3,
  Trash2,
  User,
  Mail,
  Phone,
  Calendar,
  Users,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";

interface ReservationDetailModalProps {
  open: boolean;
  onClose: () => void;
  reservation: any;
  onUpdate?: (reservationId: string, updates: any) => void;
  onCancel?: (reservationId: string) => void;
}

export const ReservationDetailModal = ({ 
  open, 
  onClose, 
  reservation, 
  onUpdate, 
  onCancel 
}: ReservationDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { selectedHotelId } = useHotelContext();
  const { toast } = useToast();
  const { showConfirmation, ConfirmationComponent } = useConfirmation();

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = async () => {
    if (!reservation) return;

    showConfirmation({
      title: "Cancel Reservation",
      description: `Are you sure you want to cancel reservation ${reservation.reservationNo}? This action cannot be undone.`,
      confirmText: "Cancel Reservation",
      variant: "destructive",
      onConfirm: async () => {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('reservations')
            .update({ status: 'Cancelled' })
            .eq('id', reservation.id);

          if (error) throw error;

          toast({
            title: "Reservation Cancelled",
            description: `Reservation ${reservation.reservationNo} has been cancelled.`,
          });

          onCancel?.(reservation.id);
          onClose();
        } catch (error) {
          console.error('Cancel error:', error);
          toast({
            title: "Cancellation Failed",
            description: "Unable to cancel reservation. Please try again.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  if (!reservation) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Reservation Details
              <Badge variant="outline">{reservation.reservationNo}</Badge>
              <Badge variant={
                reservation.status === 'Confirmed' ? 'default' :
                reservation.status === 'CheckedIn' ? 'secondary' :
                reservation.status === 'CheckedOut' ? 'outline' :
                reservation.status === 'Cancelled' ? 'destructive' : 'secondary'
              }>
                {reservation.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {isEditing ? (
            <EditReservationForm
              reservation={reservation}
              hotelId={selectedHotelId || ''}
              onSuccess={() => {
                setIsEditing(false);
                onClose();
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="guest">Guest</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Stay Details */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Stay Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Check-in:</span>
                        <span className="font-medium">{reservation?.checkIn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Check-out:</span>
                        <span className="font-medium">{reservation?.checkOut}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Adults:</span>
                        <span className="font-medium">{reservation?.adults}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Children:</span>
                        <span className="font-medium">{reservation?.children}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nights:</span>
                        <span className="font-medium">{reservation?.nights}</span>
                      </div>
                    </div>
                  </div>

                  {/* Room & Rate */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Room & Rate</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Room Type:</span>
                        <span className="font-medium">{reservation.roomType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Room Number:</span>
                        <span className="font-medium">{reservation.roomNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate per Night:</span>
                        <span className="font-medium">${reservation.rate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Special Requests</h4>
                    <p className="text-sm">{reservation.specialRequests?.join(', ') || 'None'}</p>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="guest" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Guest Information */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Guest Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{reservation.guest?.name}</span>
                        {reservation.isVIP && <Badge variant="secondary">VIP</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{reservation.guest?.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{reservation.guest?.phone}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Loyalty Tier: </span>
                        <Badge variant="outline">{reservation.guest?.loyaltyTier}</Badge>
                      </div>
                    </div>
                  </div>

                  {reservation.company && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3">Company</h4>
                      <p className="text-sm">{reservation.company}</p>
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="billing" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Billing Summary */}
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Billing Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Room Charges:</span>
                        <span>${reservation.totalAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paid Amount:</span>
                        <span>${reservation.paidAmount}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Balance:</span>
                        <span>${reservation.totalAmount - reservation.paidAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Source */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Booking Source</h4>
                    <Badge variant="outline">{reservation.source}</Badge>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <div className="flex gap-2">
              {reservation.status !== 'Cancelled' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  disabled={loading}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <ConfirmationComponent />
    </>
  );
};