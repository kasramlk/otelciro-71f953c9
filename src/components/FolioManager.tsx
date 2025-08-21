import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  MoreHorizontal, 
  DollarSign, 
  CreditCard, 
  Download, 
  Trash2,
  AlertTriangle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const chargePaymentSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().default("USD"),
  type: z.enum(["Charge", "Payment"]),
});

type ChargePaymentData = z.infer<typeof chargePaymentSchema>;

const voidSchema = z.object({
  reason: z.string().min(1, "Void reason is required"),
});

type VoidData = z.infer<typeof voidSchema>;

interface FolioManagerProps {
  reservationId: string;
  reservationCode: string;
}

// Mock folio data
const mockFolioItems = [
  {
    id: "1",
    description: "Room Charge - Deluxe Room",
    amount: 299.99,
    currency: "USD",
    type: "Charge" as const,
    postedAt: new Date("2024-01-15T14:30:00"),
    voidedAt: null,
    voidReason: null,
  },
  {
    id: "2",
    description: "Breakfast",
    amount: 25.00,
    currency: "USD",
    type: "Charge" as const,
    postedAt: new Date("2024-01-16T08:15:00"),
    voidedAt: null,
    voidReason: null,
  },
  {
    id: "3",
    description: "Credit Card Payment",
    amount: 324.99,
    currency: "USD",
    type: "Payment" as const,
    postedAt: new Date("2024-01-18T10:00:00"),
    voidedAt: null,
    voidReason: null,
  },
  {
    id: "4",
    description: "Mini Bar",
    amount: 15.50,
    currency: "USD",
    type: "Charge" as const,
    postedAt: new Date("2024-01-17T19:30:00"),
    voidedAt: new Date("2024-01-17T20:00:00"),
    voidReason: "Customer complaint - items not consumed",
  },
];

export default function FolioManager({ reservationId, reservationCode }: FolioManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { toast } = useToast();

  const form = useForm<ChargePaymentData>({
    resolver: zodResolver(chargePaymentSchema),
    defaultValues: {
      currency: "USD",
      type: "Charge",
    },
  });

  const voidForm = useForm<VoidData>({
    resolver: zodResolver(voidSchema),
  });

  // Calculate balance
  const calculateBalance = () => {
    const activeItems = mockFolioItems.filter(item => !item.voidedAt);
    const charges = activeItems
      .filter(item => item.type === "Charge")
      .reduce((sum, item) => sum + item.amount, 0);
    const payments = activeItems
      .filter(item => item.type === "Payment")
      .reduce((sum, item) => sum + item.amount, 0);
    return charges - payments;
  };

  const onSubmit = (data: ChargePaymentData) => {
    console.log("Add folio item:", data);
    toast({
      title: `${data.type} added`,
      description: `${data.type} of $${data.amount.toFixed(2)} has been added to the folio.`,
    });
    setIsAddDialogOpen(false);
    form.reset();
  };

  const onVoidSubmit = (data: VoidData) => {
    console.log("Void item:", selectedItem, "Reason:", data.reason);
    toast({
      title: "Item voided",
      description: "The folio item has been successfully voided.",
      variant: "destructive",
    });
    setIsVoidDialogOpen(false);
    setSelectedItem(null);
    voidForm.reset();
  };

  const handleVoidItem = (item) => {
    setSelectedItem(item);
    setIsVoidDialogOpen(true);
  };

  const exportFolio = (format: 'csv' | 'pdf') => {
    console.log(`Exporting folio ${reservationCode} as ${format.toUpperCase()}`);
    toast({
      title: "Export started",
      description: `Folio is being exported as ${format.toUpperCase()}. Download will start shortly.`,
    });
  };

  const getTypeIcon = (type: string) => {
    return type === "Charge" ? (
      <DollarSign className="h-4 w-4 text-red-500" />
    ) : (
      <CreditCard className="h-4 w-4 text-green-500" />
    );
  };

  const getTypeBadgeVariant = (type: string) => {
    return type === "Charge" ? "destructive" : "secondary";
  };

  return (
    <div className="space-y-6">
      {/* Header with Balance and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Folio - {reservationCode}</h3>
          <p className="text-sm text-muted-foreground">Manage charges and payments</p>
        </div>
        <div className="flex items-center space-x-2">
          <Card className="px-4 py-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">${Math.abs(calculateBalance()).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {calculateBalance() >= 0 ? "Balance Due" : "Credit Balance"}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => form.setValue("type", "Charge")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Charge
            </Button>
          </DialogTrigger>
        </Dialog>

        <Button 
          variant="secondary" 
          onClick={() => {
            form.setValue("type", "Payment");
            setIsAddDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Payment
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Folio
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => exportFolio('csv')}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportFolio('pdf')}>
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Folio Items Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Posted At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockFolioItems
              .sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime())
              .map((item) => (
                <TableRow key={item.id} className={item.voidedAt ? "opacity-50" : ""}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(item.type)}
                      <Badge variant={getTypeBadgeVariant(item.type)}>
                        {item.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell>
                    <span className={item.type === "Charge" ? "text-red-600" : "text-green-600"}>
                      {item.type === "Charge" ? "+" : "-"}${item.amount.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>{item.currency}</TableCell>
                  <TableCell>{format(item.postedAt, "MMM dd, yyyy HH:mm")}</TableCell>
                  <TableCell>
                    {item.voidedAt ? (
                      <Badge variant="outline" className="text-red-600">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Voided
                      </Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!item.voidedAt && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleVoidItem(item)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Void Item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {item.voidedAt && (
                      <p className="text-xs text-muted-foreground">
                        Void: {item.voidReason}
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Charge/Payment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add {form.watch("type") === "Charge" ? "Charge" : "Payment"}
            </DialogTitle>
            <DialogDescription>
              Add a new {form.watch("type")?.toLowerCase()} to the folio.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Charge">Charge</SelectItem>
                        <SelectItem value="Payment">Payment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Room service, minibar, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add {form.watch("type")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Void Item Dialog */}
      <Dialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Void Folio Item
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please provide a reason for voiding this item.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">{selectedItem.description}</p>
              <p className="text-sm text-muted-foreground">
                {selectedItem.type}: ${selectedItem.amount.toFixed(2)} {selectedItem.currency}
              </p>
            </div>
          )}
          <Form {...voidForm}>
            <form onSubmit={voidForm.handleSubmit(onVoidSubmit)} className="space-y-4">
              <FormField
                control={voidForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Void Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why this item is being voided..."
                        className="resize-none"
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
                  onClick={() => {
                    setIsVoidDialogOpen(false);
                    setSelectedItem(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive">
                  Void Item
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}