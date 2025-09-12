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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  Users,
  MapPin,
  DollarSign,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Edit3,
  Trash2,
  FileText,
  Mail,
  Phone,
  User
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
  console.log('ReservationDetailModal render:', { open, reservation });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { selectedHotelId } = useHotelContext();
  const { toast } = useToast();
  const { showConfirmation, ConfirmationComponent } = useConfirmation();

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!reservation) return;

    showConfirmation({
      title: "Save Changes",
      description: "Save changes to this reservation?",
      confirmText: "Save Changes",
      onConfirm: async () => {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('reservations')
            .update({
              check_in: editData.checkIn,
              check_out: editData.checkOut,
              adults: editData.adults,
              children: editData.children,
              special_requests: editData.specialRequests ? [editData.specialRequests] : null,
              notes: editData.notes
            })
            .eq('id', reservation.id);

          if (error) throw error;

          toast({
            title: "Reservation Updated",
            description: "Changes saved successfully.",
          });

          onUpdate?.(reservation.id, editData);
          setIsEditing(false);
          onClose();
        } catch (error) {
          console.error('Update error:', error);
          toast({
            title: "Update Failed",
            description: "Unable to save changes. Please try again.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    });
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

  const handleCheckIn = async () => {
    if (!reservation) return;

    showConfirmation({
      title: "Check In Guest",
      description: `Check in ${reservation.guest.name}?`,
      confirmText: "Check In",
      onConfirm: async () => {
        setLoading(true);
        try {
          // Update reservation status
          const { error: reservationError } = await supabase
            .from('reservations')
            .update({ status: 'CheckedIn' })
            .eq('id', reservation.id);

          if (reservationError) throw reservationError;

          // Log check-in
          const { error: logError } = await supabase
            .from('checkin_logs')
            .insert({
              reservation_id: reservation.id,
              hotel_id: reservation.hotel_id,
              room_id: reservation.room_id,
              checked_in_at: new Date().toISOString(),
              notes: `Guest checked in via HMS`
            });

          if (logError) console.warn('Log error:', logError);

          toast({
            title: "Guest Checked In",
            description: `${reservation.guest.name} has been checked in.`,
          });

          onUpdate?.(reservation.id, { status: 'CheckedIn' });
          onClose();
        } catch (error) {
          console.error('Check-in error:', error);
          toast({
            title: "Check-in Failed",
            description: "Unable to check in guest. Please try again.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleCheckOut = async () => {
    if (!reservation) return;

    showConfirmation({
      title: "Check Out Guest",
      description: `Check out ${reservation.guest.name}?`,
      confirmText: "Check Out",
      onConfirm: async () => {
        setLoading(true);
        try {
          // Update reservation status
          const { error: reservationError } = await supabase
            .from('reservations')
            .update({ status: 'CheckedOut' })
            .eq('id', reservation.id);

          if (reservationError) throw reservationError;

          // Log check-out
          const { error: logError } = await supabase
            .from('checkout_logs')
            .insert({
              reservation_id: reservation.id,
              hotel_id: reservation.hotel_id,
              room_id: reservation.room_id,
              checked_out_at: new Date().toISOString(),
              final_balance: 0,
              notes: `Guest checked out via HMS`
            });

          if (logError) console.warn('Log error:', logError);

          toast({
            title: "Guest Checked Out",
            description: `${reservation.guest.name} has been checked out.`,
          });

          onUpdate?.(reservation.id, { status: 'CheckedOut' });
          onClose();
        } catch (error) {
          console.error('Check-out error:', error);
          toast({
            title: "Check-out Failed",
            description: "Unable to check out guest. Please try again.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  if (!reservation) {
    console.log('No reservation provided to modal');
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

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="guest">Guest</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
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
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
              
              <TabsContent value="guest">
                <p>Guest information would go here</p>
              </TabsContent>
              
              <TabsContent value="billing">
                <p>Billing information would go here</p>
              </TabsContent>
            </Tabs>
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
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                  >
                    Cancel Edit
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    disabled={loading}
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
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
                  <h4 className="font-semibold mb-3">Stay Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Check-in Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editData.checkIn}
                          onChange={(e) => setEditData(prev => ({ ...prev, checkIn: e.target.value }))}
                        />
                      ) : (
                        <p className="text-sm font-medium">{format(new Date(reservation.checkIn), 'PPP')}</p>
                      )}
                    </div>
                    <div>
                      <Label>Check-out Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editData.checkOut}
                          onChange={(e) => setEditData(prev => ({ ...prev, checkOut: e.target.value }))}
                        />
                      ) : (
                        <p className="text-sm font-medium">{format(new Date(reservation.checkOut), 'PPP')}</p>
                      )}
                    </div>
                    <div>
                      <Label>Adults</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="1"
                          value={editData.adults}
                          onChange={(e) => setEditData(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
                        />
                      ) : (
                        <p className="text-sm font-medium">{reservation.adults}</p>
                      )}
                    </div>
                    <div>
                      <Label>Children</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          value={editData.children}
                          onChange={(e) => setEditData(prev => ({ ...prev, children: parseInt(e.target.value) }))}
                        />
                      ) : (
                        <p className="text-sm font-medium">{reservation.children}</p>
                      )}
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
                      <span>Nights:</span>
                      <span className="font-medium">{reservation.nights}</span>
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
                  {isEditing ? (
                    <Textarea
                      value={editData.specialRequests}
                      onChange={(e) => setEditData(prev => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder="Special requests..."
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm">{reservation.specialRequests?.join(', ') || 'None'}</p>
                  )}
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
                      <span className="font-medium">{reservation.guest.name}</span>
                      {reservation.isVIP && <Badge variant="secondary">VIP</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{reservation.guest.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{reservation.guest.phone}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Loyalty Tier: </span>
                      <Badge variant="outline">{reservation.guest.loyaltyTier}</Badge>
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
                    <Separator />
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
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                  >
                    Cancel Edit
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  {reservation.status === 'Confirmed' && (
                    <Button
                      onClick={handleCheckIn}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Check In
                    </Button>
                  )}
                  {reservation.status === 'CheckedIn' && (
                    <Button
                      onClick={handleCheckOut}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Check Out
                    </Button>
                  )}
                  {['Confirmed', 'CheckedIn'].includes(reservation.status) && (
                    <Button
                      onClick={handleEdit}
                      disabled={loading}
                      variant="outline"
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
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