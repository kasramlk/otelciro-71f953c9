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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Timer,
  CalendarIcon,
  DollarSign,
  Clock,
  Plus,
  AlertCircle,
  CheckCircle2,
  Calculator
} from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface ExtensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: any;
  onExtension: () => void;
}

export function ExtensionDialog({ open, onOpenChange, reservation, onExtension }: ExtensionDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [extensionType, setExtensionType] = useState<'early_checkin' | 'late_checkout' | 'extend_stay'>('extend_stay');
  const [formData, setFormData] = useState({
    newCheckoutDate: null as Date | null,
    earlyCheckinTime: '12:00',
    lateCheckoutTime: '15:00',
    chargeAmount: 0,
    reason: '',
    notes: '',
    approvalRequired: false
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open && reservation) {
      const currentCheckout = new Date(reservation.check_out);
      
      setFormData({
        newCheckoutDate: addDays(currentCheckout, 1),
        earlyCheckinTime: '12:00',
        lateCheckoutTime: '15:00',
        chargeAmount: 0,
        reason: '',
        notes: '',
        approvalRequired: false
      });
    }
  }, [open, reservation]);

  // Calculate charges based on extension type
  useEffect(() => {
    if (!reservation) return;

    let charge = 0;
    const baseRate = reservation.total_price / reservation.nights; // Rate per night

    switch (extensionType) {
      case 'early_checkin':
        charge = baseRate * 0.5; // 50% of daily rate
        break;
      case 'late_checkout':
        charge = baseRate * 0.5; // 50% of daily rate
        break;
      case 'extend_stay':
        if (formData.newCheckoutDate) {
          const originalCheckout = new Date(reservation.check_out);
          const additionalNights = differenceInDays(formData.newCheckoutDate, originalCheckout);
          charge = baseRate * Math.max(0, additionalNights);
        }
        break;
    }

    setFormData(prev => ({ 
      ...prev, 
      chargeAmount: charge,
      approvalRequired: charge > baseRate // Require approval for charges over 1 night rate
    }));
  }, [extensionType, formData.newCheckoutDate, reservation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let originalDate, newDate;

      switch (extensionType) {
        case 'early_checkin':
          originalDate = reservation.check_in;
          newDate = reservation.check_in; // Same date, different time
          break;
        case 'late_checkout':
          originalDate = reservation.check_out;
          newDate = reservation.check_out; // Same date, different time
          break;
        case 'extend_stay':
          originalDate = reservation.check_out;
          newDate = formData.newCheckoutDate?.toISOString().split('T')[0];
          break;
      }

      // Create stay extension record
      const { error: extensionError } = await supabase
        .from('stay_extensions')
        .insert({
          reservation_id: reservation.id,
          hotel_id: reservation.hotel_id,
          extension_type: extensionType,
          original_date: originalDate,
          new_date: newDate,
          charge_amount: formData.chargeAmount,
          currency_id: reservation.currency_id,
          reason: formData.reason,
          approved_by: null // Would be set by manager if approval required
        });

      if (extensionError) throw extensionError;

      // Post charge to folio if there's an amount
      if (formData.chargeAmount > 0) {
        const { error: chargeError } = await supabase
          .from('reservation_charges')
          .insert({
            reservation_id: reservation.id,
            description: `${extensionType.replace('_', ' ').toUpperCase()} - ${formData.reason}`,
            amount: formData.chargeAmount,
            currency: reservation.currency_id || 'USD',
            type: 'charge',
            folio_split: 'Guest',
            posted_at: new Date().toISOString()
          });

        if (chargeError) throw chargeError;
      }

      // Update reservation if extending stay
      if (extensionType === 'extend_stay' && formData.newCheckoutDate) {
        const originalCheckout = new Date(reservation.check_out);
        const additionalNights = differenceInDays(formData.newCheckoutDate, originalCheckout);
        
        const { error: reservationError } = await supabase
          .from('reservations')
          .update({
            check_out: formData.newCheckoutDate.toISOString().split('T')[0],
            nights: reservation.nights + additionalNights,
            total_price: reservation.total_price + formData.chargeAmount
          })
          .eq('id', reservation.id);

        if (reservationError) throw reservationError;
      }

      toast({
        title: "Extension Processed",
        description: `${extensionType.replace('_', ' ').toUpperCase()} has been processed successfully`,
      });

      onExtension();
      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Extension Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Timer className="mr-2 h-6 w-6 text-blue-600" />
            Stay Extension & Adjustments
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Stay Info */}
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Current Stay</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Guest</p>
                  <p className="font-semibold">
                    {reservation.guests?.first_name} {reservation.guests?.last_name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Check-in</p>
                    <p className="font-medium">
                      {format(new Date(reservation.check_in), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check-out</p>
                    <p className="font-medium">
                      {format(new Date(reservation.check_out), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Room</p>
                    <p className="font-medium">{reservation.rooms?.number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nights</p>
                    <p className="font-medium">{reservation.nights}</p>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600 font-medium">Current Total</span>
                    <span className="font-semibold text-blue-800">
                      {reservation.currency_id || 'USD'} {reservation.total_price?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extension Options */}
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Extension Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div 
                  className={cn(
                    "p-3 border-2 rounded-lg cursor-pointer transition-all",
                    extensionType === 'early_checkin' 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setExtensionType('early_checkin')}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={extensionType === 'early_checkin'}
                      onChange={() => setExtensionType('early_checkin')}
                      className="text-primary"
                    />
                    <div>
                      <p className="font-medium">Early Check-in</p>
                      <p className="text-sm text-muted-foreground">Allow check-in before standard time</p>
                    </div>
                  </div>
                </div>

                <div 
                  className={cn(
                    "p-3 border-2 rounded-lg cursor-pointer transition-all",
                    extensionType === 'late_checkout' 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setExtensionType('late_checkout')}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={extensionType === 'late_checkout'}
                      onChange={() => setExtensionType('late_checkout')}
                      className="text-primary"
                    />
                    <div>
                      <p className="font-medium">Late Check-out</p>
                      <p className="text-sm text-muted-foreground">Extend check-out time</p>
                    </div>
                  </div>
                </div>

                <div 
                  className={cn(
                    "p-3 border-2 rounded-lg cursor-pointer transition-all",
                    extensionType === 'extend_stay' 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setExtensionType('extend_stay')}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={extensionType === 'extend_stay'}
                      onChange={() => setExtensionType('extend_stay')}
                      className="text-primary"
                    />
                    <div>
                      <p className="font-medium">Extend Stay</p>
                      <p className="text-sm text-muted-foreground">Add additional nights</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Extension Details Form */}
        <Card className="card-modern">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Plus className="mr-2 h-5 w-5 text-primary" />
              Extension Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Extension-specific inputs */}
              {extensionType === 'early_checkin' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Early Check-in Time</Label>
                    <Input
                      type="time"
                      value={formData.earlyCheckinTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, earlyCheckinTime: e.target.value }))}
                      className="bg-muted/30 border-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Input
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g., Guest request, flight arrival"
                      className="bg-muted/30 border-0"
                    />
                  </div>
                </div>
              )}

              {extensionType === 'late_checkout' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Late Check-out Time</Label>
                    <Input
                      type="time"
                      value={formData.lateCheckoutTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, lateCheckoutTime: e.target.value }))}
                      className="bg-muted/30 border-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Input
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g., Guest request, late flight"
                      className="bg-muted/30 border-0"
                    />
                  </div>
                </div>
              )}

              {extensionType === 'extend_stay' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>New Check-out Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left bg-muted/30 border-0",
                              !formData.newCheckoutDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.newCheckoutDate ? format(formData.newCheckoutDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.newCheckoutDate}
                            onSelect={(date) => setFormData(prev => ({ ...prev, newCheckoutDate: date }))}
                            disabled={(date) => date < new Date(reservation.check_out)}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Additional Nights</Label>
                      <Input
                        readOnly
                        value={
                          formData.newCheckoutDate 
                            ? differenceInDays(formData.newCheckoutDate, new Date(reservation.check_out))
                            : 0
                        }
                        className="bg-muted/30 border-0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason for Extension</Label>
                    <Input
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g., Guest request, conference extension"
                      className="bg-muted/30 border-0"
                    />
                  </div>
                </div>
              )}

              {/* Charge Information */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center mb-3">
                  <Calculator className="mr-2 h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Charge Summary</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700">Extension Charge:</span>
                    <span className="font-semibold text-green-800">
                      {reservation.currency_id || 'USD'} {formData.chargeAmount.toFixed(2)}
                    </span>
                  </div>
                  {formData.chargeAmount === 0 && (
                    <p className="text-xs text-green-600">No additional charge for this extension</p>
                  )}
                </div>
              </div>

              {/* Approval Required Alert */}
              {formData.approvalRequired && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Manager Approval Required:</strong> This extension exceeds the standard rate threshold and requires management approval.
                  </AlertDescription>
                </Alert>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes about this extension..."
                  rows={3}
                  className="bg-muted/30 border-0 resize-none"
                />
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
                  className="bg-gradient-primary text-white hover:shadow-lg transition-all duration-300"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {loading ? 'Processing...' : 'Process Extension'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}