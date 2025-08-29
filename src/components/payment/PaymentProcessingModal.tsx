import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign, Receipt, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface PaymentItem {
  id: string;
  description: string;
  amount: number;
  date: string;
}

interface PaymentProcessingModalProps {
  open: boolean;
  onClose: () => void;
  guestName?: string;
  outstandingAmount?: number;
  items?: PaymentItem[];
  onPaymentComplete?: (paymentData: any) => void;
}

const mockPaymentItems: PaymentItem[] = [
  { id: '1', description: 'Room Charges (3 nights)', amount: 450.00, date: '2024-01-15' },
  { id: '2', description: 'Restaurant Bill', amount: 85.50, date: '2024-01-16' },
  { id: '3', description: 'Minibar', amount: 25.00, date: '2024-01-17' },
  { id: '4', description: 'City Tax', amount: 15.00, date: '2024-01-17' },
];

export function PaymentProcessingModal({
  open,
  onClose,
  guestName = "John Doe",
  outstandingAmount = 575.50,
  items = mockPaymentItems,
  onPaymentComplete
}: PaymentProcessingModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(outstandingAmount.toString());
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!paymentMethod || !paymentAmount) {
      toast({
        title: "Missing Information",
        description: "Please select payment method and enter amount.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'card' && (!cardNumber || !expiryDate || !cvv)) {
      toast({
        title: "Missing Card Information",
        description: "Please complete all card details.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const paymentData = {
        method: paymentMethod,
        amount: parseFloat(paymentAmount),
        reference: `PAY-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...(paymentMethod === 'card' && { cardLast4: cardNumber.slice(-4) })
      };

      onPaymentComplete?.(paymentData);
      setPaymentSuccess(true);
      
      setTimeout(() => {
        onClose();
        setPaymentSuccess(false);
        // Reset form
        setPaymentMethod('');
        setPaymentAmount(outstandingAmount.toString());
        setCardNumber('');
        setExpiryDate('');
        setCvv('');
      }, 2000);
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an error processing the payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Check className="h-8 w-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground mb-4">
              Payment of ${paymentAmount} has been processed successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              Receipt will be sent to guest's email.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Process Payment - {guestName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Outstanding Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">{item.date}</p>
                    </div>
                    <span className="font-medium">${item.amount.toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Outstanding</span>
                  <span className="text-primary">${outstandingAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <div className="space-y-4">
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="digital-wallet">Digital Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Payment Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount((outstandingAmount / 2).toFixed(2))}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(outstandingAmount.toString())}
                >
                  Full Amount
                </Button>
              </div>
            </div>

            {/* Card Details */}
            {paymentMethod === 'card' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Card Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Card Number</Label>
                      <Input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Expiry Date</Label>
                        <Input
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label>CVV</Label>
                        <Input
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          placeholder="123"
                          maxLength={4}
                          type="password"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Payment Summary */}
            {paymentMethod && paymentAmount && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border rounded-lg bg-primary/5"
              >
                <div className="flex items-start gap-2">
                  <Receipt className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">Payment Summary</p>
                    <p className="text-sm text-muted-foreground">
                      Processing ${paymentAmount} via {paymentMethod.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    {parseFloat(paymentAmount) < outstandingAmount && (
                      <div className="flex items-center gap-1 text-sm text-orange-600">
                        <AlertCircle className="h-3 w-3" />
                        <span>Remaining balance: ${(outstandingAmount - parseFloat(paymentAmount)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={handlePayment} 
            disabled={!paymentMethod || !paymentAmount || processing}
          >
            {processing ? 'Processing...' : `Process Payment $${paymentAmount}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}