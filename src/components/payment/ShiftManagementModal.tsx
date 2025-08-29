import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Clock, DollarSign, AlertCircle } from "lucide-react";

const shiftSchema = z.object({
  openingBalance: z.number().min(0, "Opening balance must be positive"),
  closingBalance: z.number().min(0, "Closing balance must be positive").optional(),
  notes: z.string().optional(),
});

type ShiftData = z.infer<typeof shiftSchema>;

interface ShiftManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "open" | "close";
  sessionData?: {
    openingBalance: number;
    expectedBalance: number;
    totalCollected: number;
  };
}

export function ShiftManagementModal({ 
  open, 
  onOpenChange, 
  mode,
  sessionData 
}: ShiftManagementModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ShiftData>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      openingBalance: mode === "open" ? 500 : sessionData?.openingBalance || 0,
      notes: "",
    },
  });

  const onSubmit = async (data: ShiftData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`${mode} shift data:`, data);
      
      toast({
        title: `Shift ${mode === "open" ? "opened" : "closed"}`,
        description: `Cashier shift has been ${mode === "open" ? "opened" : "closed"} successfully.`,
      });
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${mode} shift. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const variance = sessionData && mode === "close" 
    ? (form.watch("closingBalance") || 0) - sessionData.expectedBalance 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            {mode === "open" ? "Open Cashier Shift" : "Close Cashier Shift"}
          </DialogTitle>
          <DialogDescription>
            {mode === "open" 
              ? "Start a new cashier shift by setting the opening balance." 
              : "Close the current shift by confirming the final balance."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {mode === "open" && (
              <FormField
                control={form.control}
                name="openingBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Balance ($)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="500.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="pl-9"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {mode === "close" && sessionData && (
              <>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Opening Balance</Label>
                    <p className="text-lg font-semibold">${sessionData.openingBalance.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Collected</Label>
                    <p className="text-lg font-semibold">${sessionData.totalCollected.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Expected Balance</Label>
                    <p className="text-lg font-semibold text-blue-600">${sessionData.expectedBalance.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Variance</Label>
                    <p className={`text-lg font-semibold ${variance === 0 ? 'text-green-600' : Math.abs(variance) > 10 ? 'text-red-600' : 'text-yellow-600'}`}>
                      ${Math.abs(variance).toFixed(2)} {variance < 0 ? '(Short)' : variance > 0 ? '(Over)' : ''}
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="closingBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Closing Balance ($)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={sessionData.expectedBalance.toFixed(2)}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="pl-9"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      {Math.abs(variance) > 10 && (
                        <div className="flex items-center text-sm text-red-600 mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Large variance detected. Please verify the count.
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={mode === "open" 
                        ? "Any notes about the shift opening..." 
                        : "Any discrepancies or notes about the shift..."}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                variant={mode === "close" ? "destructive" : "default"}
              >
                {isSubmitting ? "Processing..." : mode === "open" ? "Open Shift" : "Close Shift"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}