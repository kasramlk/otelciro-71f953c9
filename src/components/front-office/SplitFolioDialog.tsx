import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Building, 
  User, 
  DollarSign,
  Percent,
  Split
} from "lucide-react";

const splitFolioSchema = z.object({
  splitType: z.enum(["percentage", "amount", "items"]),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
  percentage: z.number().min(0).max(100).optional(),
  amount: z.number().min(0).optional(),
  selectedItems: z.array(z.string()).optional(),
});

type SplitFolioData = z.infer<typeof splitFolioSchema>;

interface SplitFolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationCode: string;
  folioItems: Array<{
    id: string;
    description: string;
    amount: number;
    type: "Charge" | "Payment";
  }>;
}

const mockCompanies = [
  { id: "1", name: "Acme Corporation", code: "ACME" },
  { id: "2", name: "Global Industries", code: "GLOB" },
  { id: "3", name: "TechStart Inc", code: "TECH" },
];

export default function SplitFolioDialog({ 
  open, 
  onOpenChange, 
  reservationCode, 
  folioItems 
}: SplitFolioDialogProps) {
  const { toast } = useToast();

  const form = useForm<SplitFolioData>({
    resolver: zodResolver(splitFolioSchema),
    defaultValues: {
      splitType: "percentage",
      percentage: 50,
      selectedItems: [],
    },
  });

  const watchedSplitType = form.watch("splitType");
  const watchedPercentage = form.watch("percentage");
  const watchedAmount = form.watch("amount");
  const watchedItems = form.watch("selectedItems");

  const totalCharges = folioItems
    .filter(item => item.type === "Charge")
    .reduce((sum, item) => sum + item.amount, 0);

  const getCompanySplitAmount = () => {
    switch (watchedSplitType) {
      case "percentage":
        return (totalCharges * (watchedPercentage || 0)) / 100;
      case "amount":
        return watchedAmount || 0;
      case "items":
        return folioItems
          .filter(item => watchedItems?.includes(item.id) && item.type === "Charge")
          .reduce((sum, item) => sum + item.amount, 0);
      default:
        return 0;
    }
  };

  const getGuestAmount = () => {
    return totalCharges - getCompanySplitAmount();
  };

  const onSubmit = (data: SplitFolioData) => {
    console.log("Split folio data:", data);
    console.log("Company amount:", getCompanySplitAmount());
    console.log("Guest amount:", getGuestAmount());
    
    toast({
      title: "Folio split successful",
      description: `Folio has been split between guest and ${data.companyName || "company"}`,
    });
    onOpenChange(false);
    form.reset();
  };

  const toggleItem = (itemId: string) => {
    const currentItems = watchedItems || [];
    const newItems = currentItems.includes(itemId)
      ? currentItems.filter(id => id !== itemId)
      : [...currentItems, itemId];
    form.setValue("selectedItems", newItems);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Split Folio - {reservationCode}
          </DialogTitle>
          <DialogDescription>
            Split folio charges between guest and company/travel agent
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Company Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Company</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            const company = mockCompanies.find(c => c.id === value);
                            if (company) {
                              form.setValue("companyName", company.name);
                            }
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose company" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockCompanies.map(company => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name} ({company.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name (if not listed)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter company name" 
                            {...field}
                            disabled={!!form.watch("companyId")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Split Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Split Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="splitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How would you like to split the folio?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">By Percentage</SelectItem>
                          <SelectItem value="amount">By Fixed Amount</SelectItem>
                          <SelectItem value="items">By Specific Items</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Percentage Split */}
                {watchedSplitType === "percentage" && (
                  <FormField
                    control={form.control}
                    name="percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Percentage</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Percent className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              className="pr-10"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Fixed Amount Split */}
                {watchedSplitType === "amount" && (
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max={totalCharges}
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
                )}

                {/* Item-based Split */}
                {watchedSplitType === "items" && (
                  <div className="space-y-3">
                    <FormLabel>Select items for company billing:</FormLabel>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {folioItems
                        .filter(item => item.type === "Charge")
                        .map((item) => (
                          <div key={item.id} className="flex items-center space-x-2 p-2 border rounded">
                            <Checkbox
                              checked={watchedItems?.includes(item.id) || false}
                              onCheckedChange={() => toggleItem(item.id)}
                            />
                            <div className="flex-1">
                              <span className="font-medium">{item.description}</span>
                              <span className="ml-2 text-green-600">${item.amount.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle className="text-lg">Split Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Total Folio Charges:</span>
                    <span className="font-semibold">${totalCharges.toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span>Company Amount:</span>
                    </div>
                    <span className="font-semibold text-blue-600">
                      ${getCompanySplitAmount().toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Guest Amount:</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      ${getGuestAmount().toFixed(2)}
                    </span>
                  </div>
                  
                  {watchedSplitType === "percentage" && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Company: {watchedPercentage}% • Guest: {100 - (watchedPercentage || 0)}%
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!form.watch("companyId") && !form.watch("companyName")}
              >
                Split Folio
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}