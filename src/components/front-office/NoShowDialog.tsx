import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  DollarSign,
  Clock,
  User,
  CreditCard,
  FileX,
  CheckCircle2,
  Calendar,
  Phone,
  Mail
} from "lucide-react";
import { format } from "date-fns";

interface NoShowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: any;
  onNoShow: () => void;
}

export function NoShowDialog({ open, onOpenChange, reservation, onNoShow }: NoShowDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    penaltyAmount: 0,
    penaltyType: 'first_night',
    reason: 'no_show_cutoff',
    notes: '',
    releaseRoom: true,
    notifyRevenue: true,
    refundDeposit: false
  });

  // Calculate penalty amount based on type
  useEffect(() => {
    if (!reservation) return;

    let penalty = 0;
    const nightlyRate = reservation.total_price / reservation.nights;

    switch (formData.penaltyType) {
      case 'first_night':
        penalty = nightlyRate;
        break;
      case 'full_stay':
        penalty = reservation.total_price;
        break;
      case 'percentage':
        penalty = reservation.total_price * 0.5; // 50%
        break;
      case 'custom':
        // Keep current penalty amount
        break;
      case 'none':
        penalty = 0;
        break;
    }

    if (formData.penaltyType !== 'custom') {
      setFormData(prev => ({ ...prev, penaltyAmount: penalty }));
    }
  }, [formData.penaltyType, reservation]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && reservation) {
      const nightlyRate = reservation.total_price / reservation.nights;
      
      setFormData({
        penaltyAmount: nightlyRate, // Default to first night penalty
        penaltyType: 'first_night',
        reason: 'no_show_cutoff',
        notes: '',
        releaseRoom: true,
        notifyRevenue: true,
        refundDeposit: false
      });
    }
  }, [open, reservation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update reservation status to no-show
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({ status: 'no_show' })
        .eq('id', reservation.id);

      if (reservationError) throw reservationError;

      // Create no-show log
      const { error: logError } = await supabase
        .from('no_show_logs')
        .insert({
          reservation_id: reservation.id,
          hotel_id: reservation.hotel_id,
          penalty_amount: formData.penaltyAmount,
          currency_id: reservation.currency_id,
          policy_applied: `${formData.penaltyType} penalty`,
          reason: `${formData.reason} - ${formData.notes}`.trim(),
          marked_at: new Date().toISOString()
        });

      if (logError) throw logError;

      // Post penalty charge to folio if amount > 0
      if (formData.penaltyAmount > 0) {
        const { error: chargeError } = await supabase
          .from('reservation_charges')
          .insert({
            reservation_id: reservation.id,
            description: `No-show penalty - ${formData.penaltyType.replace('_', ' ')}`,
            amount: formData.penaltyAmount,
            currency: reservation.currency_id || 'USD',
            type: 'charge',
            folio_split: 'Guest',
            posted_at: new Date().toISOString()
          });

        if (chargeError) throw chargeError;
      }

      // Release room if selected
      if (formData.releaseRoom && reservation.room_id) {
        const { error: roomError } = await supabase
          .from('rooms')
          .update({ status: 'available' })
          .eq('id', reservation.room_id);

        if (roomError) throw roomError;
      }

      toast({
        title: "No-Show Processed",
        description: `Reservation marked as no-show with ${formData.penaltyAmount > 0 ? `penalty of ${reservation.currency_id || 'USD'} ${formData.penaltyAmount.toFixed(2)}` : 'no penalty'}`,
      });

      onNoShow();
      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "No-Show Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) return null;

  const guest = reservation.guests;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <AlertTriangle className="mr-2 h-6 w-6 text-red-600" />
            Mark as No-Show
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reservation Details */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg text-red-800">
                <User className="mr-2 h-5 w-5" />
                Reservation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg border border-red-200">
                <div className="p-2 rounded-full bg-red-100">
                  <User className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-red-900">
                    {guest?.first_name} {guest?.last_name}
                  </p>
                  <p className="text-sm text-red-700">Primary Guest</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-red-700">
                  <Mail className="h-4 w-4" />
                  <span>{guest?.email || 'Not provided'}</span>
                </div>
                <div className="flex items-center space-x-2 text-red-700">
                  <Phone className="h-4 w-4" />
                  <span>{guest?.phone || 'Not provided'}</span>
                </div>
              </div>

              <Separator className="bg-red-200" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600">Reservation Code</span>
                  <Badge variant="outline" className="border-red-300 text-red-800">
                    {reservation.code}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600">Expected Check-in</span>
                  <span className="font-medium text-red-900">
                    {format(new Date(reservation.check_in), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600">Nights</span>
                  <span className="font-medium text-red-900">{reservation.nights}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600">Room</span>
                  <span className="font-medium text-red-900">
                    {reservation.rooms?.number || 'TBA'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600">Total Value</span>
                  <span className="font-semibold text-red-900">
                    {reservation.currency_id || 'USD'} {reservation.total_price?.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* No-Show Policy */}
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <FileX className="mr-2 h-5 w-5 text-primary" />
                No-Show Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-yellow-200 bg-yellow-50">
                <Clock className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Cut-off Time Passed:</strong> This reservation has passed the hotel's no-show cut-off time and can be marked as a no-show.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="p-3 bg-muted/20 rounded-lg">
                  <h4 className="font-medium mb-2">Hotel No-Show Policy</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Cut-off time: 6:00 PM on arrival date</li>
                    <li>• First night penalty applies</li>
                    <li>• Room will be released for resale</li>
                    <li>• Guest may be charged cancellation fee</li>
                  </ul>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Recommended Actions</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Mark reservation as no-show</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Apply first night penalty</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Release room for resale</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Notify revenue management</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* No-Show Processing Form */}
        <Card className="card-modern">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <AlertTriangle className="mr-2 h-5 w-5 text-primary" />
              No-Show Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Penalty Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Penalty Type</Label>
                    <Select 
                      value={formData.penaltyType} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, penaltyType: value }))}
                    >
                      <SelectTrigger className="bg-muted/30 border-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first_night">First Night Rate</SelectItem>
                        <SelectItem value="percentage">50% of Total</SelectItem>
                        <SelectItem value="full_stay">Full Stay Amount</SelectItem>
                        <SelectItem value="custom">Custom Amount</SelectItem>
                        <SelectItem value="none">No Penalty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Penalty Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.penaltyAmount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        penaltyAmount: parseFloat(e.target.value) || 0,
                        penaltyType: 'custom'
                      }))}
                      className="bg-muted/30 border-0"
                      disabled={formData.penaltyType !== 'custom'}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Reason</Label>
                    <Select 
                      value={formData.reason} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                    >
                      <SelectTrigger className="bg-muted/30 border-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_show_cutoff">Passed Cut-off Time</SelectItem>
                        <SelectItem value="guest_no_response">Guest Not Responding</SelectItem>
                        <SelectItem value="credit_card_declined">Credit Card Declined</SelectItem>
                        <SelectItem value="cancelled_by_guest">Cancelled by Guest</SelectItem>
                        <SelectItem value="other">Other Reason</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Additional Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional details about the no-show..."
                      rows={3}
                      className="bg-muted/30 border-0 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Processing Options */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium text-gray-800">Processing Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.releaseRoom}
                        onChange={(e) => setFormData(prev => ({ ...prev, releaseRoom: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Release Room</span>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notifyRevenue}
                        onChange={(e) => setFormData(prev => ({ ...prev, notifyRevenue: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Notify Revenue</span>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.refundDeposit}
                        onChange={(e) => setFormData(prev => ({ ...prev, refundDeposit: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Refund Deposit</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-200">
                <div className="flex items-center mb-3">
                  <DollarSign className="mr-2 h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Financial Impact</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-red-700">Original Reservation Value:</span>
                    <span className="font-medium text-red-900">
                      {reservation.currency_id || 'USD'} {reservation.total_price?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-700">No-Show Penalty:</span>
                    <span className="font-medium text-red-900">
                      {reservation.currency_id || 'USD'} {formData.penaltyAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-red-200 pt-2">
                    <span className="font-medium text-red-800">Net Revenue Loss:</span>
                    <span className="font-bold text-red-900">
                      {reservation.currency_id || 'USD'} {(reservation.total_price - formData.penaltyAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white hover:shadow-lg transition-all duration-300"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {loading ? 'Processing...' : 'Mark as No-Show'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
