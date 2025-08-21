import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  XCircle,
  DollarSign,
  CreditCard,
  Receipt,
  Mail,
  Printer,
  Download,
  AlertCircle,
  CheckCircle2,
  Calculator
} from "lucide-react";
import { format } from "date-fns";

interface CheckOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: any;
  onCheckOut: (data: any) => void;
}

export function CheckOutDialog({ open, onOpenChange, reservation, onCheckOut }: CheckOutDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    finalBalance: 0,
    paymentMethod: 'cash',
    notes: '',
    sendInvoice: true,
    printReceipt: false
  });

  // Fetch folio items and payments for the reservation
  const { data: folioData } = useQuery({
    queryKey: ['folio-data', reservation?.id],
    queryFn: async () => {
      if (!reservation?.id) return { charges: [], payments: [] };
      
      // Get reservation charges (folio items)
      const { data: charges, error: chargesError } = await supabase
        .from('reservation_charges')
        .select('*')
        .eq('reservation_id', reservation.id)
        .order('posted_at', { ascending: false });

      if (chargesError) throw chargesError;

      // Get payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('reservation_id', reservation.id)
        .order('processed_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      return {
        charges: charges || [],
        payments: payments || []
      };
    },
    enabled: !!reservation?.id && open
  });

  // Calculate totals
  const totalCharges = folioData?.charges?.reduce((sum, charge) => {
    return charge.type === 'charge' ? sum + (charge.amount || 0) : sum - (charge.amount || 0);
  }, 0) || 0;
  
  const totalPayments = folioData?.payments?.reduce((sum, payment) => {
    return sum + (payment.amount || 0);
  }, 0) || 0;
  
  const balance = totalCharges - totalPayments;

  // Reset form when dialog opens
  useEffect(() => {
    if (open && reservation) {
      setFormData({
        finalBalance: balance,
        paymentMethod: 'cash',
        notes: '',
        sendInvoice: true,
        printReceipt: false
      });
    }
  }, [open, reservation, balance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // If there's an outstanding balance, record final payment
      if (balance > 0) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            reservation_id: reservation.id,
            hotel_id: reservation.hotel_id,
            payment_type: 'checkout_settlement',
            payment_method: formData.paymentMethod,
            amount: balance,
            amount_in_base_currency: balance,
            currency: reservation.currency_id || 'USD',
            processed_at: new Date().toISOString()
          });

        if (paymentError) throw paymentError;
      }

      // Call the parent handler
      await onCheckOut({
        ...formData,
        finalBalance: 0 // Balance should be 0 after checkout
      });

      if (formData.sendInvoice) {
        toast({
          title: "Invoice Sent",
          description: "Final invoice has been emailed to the guest",
        });
      }

    } catch (error: any) {
      toast({
        title: "Check-out Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) return null;

  const guest = reservation.guests;
  const hasOutstandingBalance = balance > 0.01; // Small tolerance for floating point

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <XCircle className="mr-2 h-6 w-6 text-green-600" />
            Guest Check-out
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guest & Stay Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest Info */}
            <Card className="card-modern">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Stay Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Guest</p>
                      <p className="font-semibold text-lg">
                        {guest?.first_name} {guest?.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Room</p>
                      <p className="font-medium">{reservation.rooms?.number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reservation</p>
                      <Badge variant="outline">{reservation.code}</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
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
                    <div>
                      <p className="text-sm text-muted-foreground">Nights</p>
                      <p className="font-medium">{reservation.nights}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Folio Summary */}
            <Card className="card-modern">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Receipt className="mr-2 h-5 w-5 text-primary" />
                  Folio Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Charges */}
                  <div>
                    <p className="font-medium mb-3">Charges</p>
                    <div className="space-y-2">
                      {folioData?.charges?.filter(charge => charge.type === 'charge').map((charge, index) => (
                        <div key={charge.id || index} className="flex items-center justify-between text-sm py-2 border-b border-border/50">
                          <div>
                            <p className="font-medium">{charge.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(charge.posted_at), 'MMM dd, HH:mm')}
                            </p>
                          </div>
                          <span className="font-medium">
                            {charge.currency || 'USD'} {charge.amount?.toFixed(2)}
                          </span>
                        </div>
                      )) || []}
                      {(!folioData?.charges?.filter(c => c.type === 'charge').length) && (
                        <p className="text-sm text-muted-foreground py-2">No charges posted</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Payments */}
                  <div>
                    <p className="font-medium mb-3">Payments</p>
                    <div className="space-y-2">
                      {folioData?.payments?.map((payment, index) => (
                        <div key={payment.id || index} className="flex items-center justify-between text-sm py-2 border-b border-border/50">
                          <div>
                            <p className="font-medium">{payment.payment_method}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(payment.processed_at), 'MMM dd, HH:mm')}
                            </p>
                          </div>
                          <span className="font-medium text-green-600">
                            -{payment.currency || 'USD'} {payment.amount?.toFixed(2)}
                          </span>
                        </div>
                      )) || []}
                      {(!folioData?.payments?.length) && (
                        <p className="text-sm text-muted-foreground py-2">No payments recorded</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Balance */}
                  <div className="flex items-center justify-between py-3 bg-muted/20 rounded-lg px-4">
                    <div className="flex items-center space-x-2">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Outstanding Balance</span>
                    </div>
                    <span className={`font-bold text-lg ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {reservation.currency_id || 'USD'} {balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Check-out Actions */}
          <div className="space-y-6">
            {/* Balance Settlement */}
            {hasOutstandingBalance && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg text-orange-800">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    Balance Due
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="border-orange-300 bg-orange-100 mb-4">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      Outstanding balance of <strong>{reservation.currency_id || 'USD'} {balance.toFixed(2)}</strong> must be settled before check-out.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-orange-800">Payment Method</Label>
                    <select 
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full p-2 border border-orange-300 rounded-md bg-white text-orange-800"
                    >
                      <option value="cash">Cash</option>
                      <option value="credit-card">Credit Card</option>
                      <option value="debit-card">Debit Card</option>
                      <option value="bank-transfer">Bank Transfer</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Check-out Options */}
            <Card className="card-modern">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <CheckCircle2 className="mr-2 h-5 w-5 text-primary" />
                  Check-out Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sendInvoice}
                        onChange={(e) => setFormData(prev => ({ ...prev, sendInvoice: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Email Final Invoice</span>
                    </label>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.printReceipt}
                        onChange={(e) => setFormData(prev => ({ ...prev, printReceipt: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Print Receipt</span>
                    </label>
                    <Printer className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Check-out Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any feedback or special notes..."
                    rows={3}
                    className="bg-muted/30 border-0 resize-none"
                  />
                </div>

                {/* Quick Actions */}
                <div className="space-y-2 pt-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Export Folio (PDF)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="mr-2 h-4 w-4" />
                    View Payment History
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Final Check-out */}
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col space-y-3">
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
                  disabled={loading || hasOutstandingBalance}
                  className="bg-gradient-primary text-white hover:shadow-lg transition-all duration-300"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {loading ? 'Processing...' : 'Complete Check-out'}
                </Button>
              </div>
              
              {hasOutstandingBalance && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Balance must be settled to complete check-out
                </p>
              )}
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}