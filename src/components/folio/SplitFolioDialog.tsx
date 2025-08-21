import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Split, 
  User, 
  Building2, 
  CreditCard,
  DollarSign
} from "lucide-react";

const splitSchema = z.object({
  splitType: z.enum(["percentage", "amount", "item"]),
  guestPercentage: z.number().min(0).max(100).optional(),
  companyPercentage: z.number().min(0).max(100).optional(),
  guestAmount: z.number().min(0).optional(),
  companyAmount: z.number().min(0).optional(),
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().optional(),
  companyTaxId: z.string().optional(),
  selectedItems: z.array(z.string()).optional(),
});

type SplitData = z.infer<typeof splitSchema>;

interface SplitFolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: {
    id: string;
    code: string;
    guestName: string;
    totalAmount: number;
  };
  folioItems: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    itemType: string;
  }>;
}

export default function SplitFolioDialog({
  open,
  onOpenChange,
  reservation,
  folioItems
}: SplitFolioDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const form = useForm<SplitData>({
    resolver: zodResolver(splitSchema),
    defaultValues: {
      splitType: "percentage",
      guestPercentage: 50,
      companyPercentage: 50,
    },
  });

  const watchedSplitType = form.watch('splitType');
  const watchedGuestPercentage = form.watch('guestPercentage') || 0;
  const watchedCompanyPercentage = form.watch('companyPercentage') || 0;
  const watchedGuestAmount = form.watch('guestAmount') || 0;
  const watchedCompanyAmount = form.watch('companyAmount') || 0;

  // Calculate totals based on split type
  const calculateSplit = () => {
    const totalAmount = reservation.totalAmount;
    
    switch (watchedSplitType) {
      case "percentage":
        return {
          guestAmount: (totalAmount * watchedGuestPercentage) / 100,
          companyAmount: (totalAmount * watchedCompanyPercentage) / 100,
        };
      case "amount":
        return {
          guestAmount: watchedGuestAmount,
          companyAmount: watchedCompanyAmount,
        };
      case "item":
        const selectedTotal = folioItems
          .filter(item => selectedItems.includes(item.id))
          .reduce((sum, item) => sum + item.amount, 0);
        return {
          guestAmount: totalAmount - selectedTotal,
          companyAmount: selectedTotal,
        };
      default:
        return { guestAmount: 0, companyAmount: 0 };
    }
  };

  const { guestAmount, companyAmount } = calculateSplit();

  // Split folio mutation
  const splitMutation = useMutation({
    mutationFn: async (data: SplitData) => {
      // Update existing folio items with split information
      const updates = folioItems.map(item => {
        let splitFolio = 'Guest';
        
        if (data.splitType === 'item' && selectedItems.includes(item.id)) {
          splitFolio = 'Company';
        } else if (data.splitType === 'percentage') {
          // Split each item proportionally
          splitFolio = 'Split';
        } else if (data.splitType === 'amount') {
          // Complex logic for amount split - simplified here
          splitFolio = 'Split';
        }

        return supabase
          .from('reservation_charges')
          .update({ folio_split: splitFolio })
          .eq('id', item.id);
      });

      await Promise.all(updates);

      // Create company billing record
      await supabase.from('companies').upsert({
        name: data.companyName,
        address: data.companyAddress,
        tax_id: data.companyTaxId,
        current_balance: companyAmount,
        org_id: '550e8400-e29b-41d4-a716-446655440000' // Mock org ID
      });

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Folio Split Successfully",
        description: `Charges split between guest and ${form.watch('companyName')}`,
      });
      queryClient.invalidateQueries({ queryKey: ['folio'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Split Failed",
        description: "Unable to split folio. Please try again.",
        variant: "destructive",
      });
      console.error('Split error:', error);
    }
  });

  const onSubmit = (data: SplitData) => {
    splitMutation.mutate({ ...data, selectedItems });
  };

  const handleItemSelection = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => 
      checked 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Split Folio - {reservation.code}
          </DialogTitle>
          <DialogDescription>
            Split charges between guest and company billing
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="splitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Split Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose split method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage Split</SelectItem>
                          <SelectItem value="amount">Fixed Amount Split</SelectItem>
                          <SelectItem value="item">Item-by-Item Selection</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Percentage Split */}
                {watchedSplitType === 'percentage' && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guestPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guest %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              onChange={e => {
                                const value = Number(e.target.value);
                                field.onChange(value);
                                form.setValue('companyPercentage', 100 - value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              onChange={e => {
                                const value = Number(e.target.value);
                                field.onChange(value);
                                form.setValue('guestPercentage', 100 - value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Amount Split */}
                {watchedSplitType === 'amount' && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guestAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guest Amount ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={e => {
                                const value = Number(e.target.value);
                                field.onChange(value);
                                form.setValue('companyAmount', reservation.totalAmount - value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Amount ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={e => {
                                const value = Number(e.target.value);
                                field.onChange(value);
                                form.setValue('guestAmount', reservation.totalAmount - value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <Separator />

                {/* Company Information */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Billing Information
                  </h4>
                  
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyTaxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID / VAT Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter tax ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={splitMutation.isPending}>
                    {splitMutation.isPending ? "Processing..." : "Split Folio"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Right Column - Preview & Items */}
          <div className="space-y-6">
            {/* Split Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Split Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg dark:bg-blue-950">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Guest</span>
                  </div>
                  <span className="font-bold">${guestAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg dark:bg-green-950">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Company</span>
                  </div>
                  <span className="font-bold">${companyAmount.toFixed(2)}</span>
                </div>

                <Separator />
                
                <div className="flex items-center justify-between font-bold">
                  <span>Total</span>
                  <span>${(guestAmount + companyAmount).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Item Selection (for item split) */}
            {watchedSplitType === 'item' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Company Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                  {folioItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={(checked) => 
                            handleItemSelection(item.id, checked as boolean)
                          }
                        />
                        <div>
                          <p className="font-medium text-sm">{item.description}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.amount.toFixed(2)}</p>
                        <Badge variant={item.itemType === 'Charge' ? 'destructive' : 'secondary'} className="text-xs">
                          {item.itemType}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}