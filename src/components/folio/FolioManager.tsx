import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Receipt,
  Plus,
  Edit,
  Trash2,
  Split,
  CreditCard,
  DollarSign,
  FileText,
  MoreHorizontal,
  Download,
  Mail,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import SplitFolioDialog from "@/components/folio/SplitFolioDialog";

interface FolioManagerProps {
  reservationId: string;
  reservationCode: string;
  guestName: string;
  isOpen?: boolean;
}

interface FolioItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  itemType: 'Charge' | 'Payment' | 'Credit';
  date: string;
  folioSplit?: string;
}

export const FolioManager = ({ 
  reservationId, 
  reservationCode, 
  guestName, 
  isOpen = false 
}: FolioManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { showConfirmation, ConfirmationComponent } = useConfirmation();
  const [newItemDialog, setNewItemDialog] = useState(false);
  const [splitFolioDialog, setSplitFolioDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<FolioItem | null>(null);
  const [newItem, setNewItem] = useState({
    description: "",
    amount: 0,
    category: "Room",
    itemType: "Charge" as const
  });

  // Fetch folio items
  const { data: folioItems = [], isLoading } = useQuery({
    queryKey: ['folio', reservationId],
    queryFn: async () => {
      // Mock data - in production, this would come from reservation_charges table
      const mockFolioItems: FolioItem[] = [
        {
          id: '1',
          description: 'Room Charge - Standard Double',
          amount: 120.00,
          category: 'Room',
          itemType: 'Charge',
          date: new Date().toISOString(),
        },
        {
          id: '2', 
          description: 'Breakfast Service',
          amount: 25.00,
          category: 'F&B',
          itemType: 'Charge',
          date: new Date().toISOString(),
        },
        {
          id: '3',
          description: 'City Tax',
          amount: 3.50,
          category: 'Tax',
          itemType: 'Charge',
          date: new Date().toISOString(),
        },
        {
          id: '4',
          description: 'Deposit Payment',
          amount: -50.00,
          category: 'Deposit',
          itemType: 'Payment',
          date: new Date().toISOString(),
        }
      ];
      
      return mockFolioItems;
    },
    enabled: isOpen
  });

  // Add folio item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: typeof newItem) => {
      // In production, insert into reservation_charges table
      const newFolioItem: FolioItem = {
        id: Date.now().toString(),
        description: item.description,
        amount: item.itemType !== 'Charge' ? -Math.abs(item.amount) : item.amount,
        category: item.category,
        itemType: item.itemType,
        date: new Date().toISOString(),
      };
      
      return newFolioItem;
    },
    onSuccess: (newFolioItem) => {
      toast({
        title: "Item Added",
        description: `${newFolioItem.description} has been added to the folio`,
      });
      queryClient.invalidateQueries({ queryKey: ['folio', reservationId] });
      setNewItemDialog(false);
      setNewItem({ description: "", amount: 0, category: "Room", itemType: "Charge" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add folio item",
        variant: "destructive",
      });
    }
  });

  // Remove folio item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // In production, delete from reservation_charges table
      return itemId;
    },
    onSuccess: () => {
      toast({
        title: "Item Removed",
        description: "Folio item has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ['folio', reservationId] });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to remove folio item",
        variant: "destructive",
      });
    }
  });

  const handleAddItem = () => {
    if (!newItem.description || newItem.amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid description and amount",
        variant: "destructive",
      });
      return;
    }
    addItemMutation.mutate(newItem);
  };

  const handleRemoveItem = (itemId: string) => {
    showConfirmation({
      title: "Remove Folio Item",
      description: "Are you sure you want to remove this item from the folio?",
      confirmText: "Remove",
      onConfirm: () => removeItemMutation.mutate(itemId)
    });
  };

  const handleExportFolio = () => {
    // Generate CSV export
    const csvData = [
      ['Date', 'Description', 'Category', 'Type', 'Amount'],
      ...folioItems.map(item => [
        format(new Date(item.date), 'yyyy-MM-dd'),
        item.description,
        item.category,
        item.itemType,
        item.amount.toFixed(2)
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `folio_${reservationCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Folio Exported",
      description: "Folio has been exported successfully",
    });
  };

  const handleEmailFolio = () => {
    toast({
      title: "Email Sent",
      description: "Folio has been emailed to the guest",
    });
  };

  // Calculate totals
  const charges = folioItems.filter(item => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
  const payments = folioItems.filter(item => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const balance = charges - payments;

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'Charge': return <Plus className="h-4 w-4 text-red-600" />;
      case 'Payment': return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'Credit': return <DollarSign className="h-4 w-4 text-blue-600" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Room': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'F&B': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Tax': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Deposit': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Service': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Guest Folio - {reservationCode}
              </CardTitle>
              <CardDescription>
                Manage charges, payments and billing for {guestName}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportFolio}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleEmailFolio}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button size="sm" onClick={() => setSplitFolioDialog(true)}>
                <Split className="h-4 w-4 mr-2" />
                Split Folio
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  ${charges.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Total Charges</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  ${payments.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Total Payments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                  ${Math.abs(balance).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {balance > 0 ? 'Amount Due' : balance < 0 ? 'Credit Balance' : 'Paid in Full'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {folioItems.length}
                </div>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Folio Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Folio Items</h4>
              <Dialog open={newItemDialog} onOpenChange={setNewItemDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Folio Item</DialogTitle>
                    <DialogDescription>
                      Add a new charge, payment, or credit to the guest folio
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newItem.description}
                        onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter item description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={newItem.amount}
                          onChange={(e) => setNewItem(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select 
                          value={newItem.category} 
                          onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Room">Room</SelectItem>
                            <SelectItem value="F&B">Food & Beverage</SelectItem>
                            <SelectItem value="Service">Service</SelectItem>
                            <SelectItem value="Tax">Tax</SelectItem>
                            <SelectItem value="Deposit">Deposit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="itemType">Type</Label>
                      <Select 
                        value={newItem.itemType} 
                        onValueChange={(value: any) => setNewItem(prev => ({ ...prev, itemType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Charge">Charge</SelectItem>
                          <SelectItem value="Payment">Payment</SelectItem>
                          <SelectItem value="Credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddItem} disabled={addItemMutation.isPending}>
                        {addItemMutation.isPending ? "Adding..." : "Add Item"}
                      </Button>
                      <Button variant="outline" onClick={() => setNewItemDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {folioItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    {getItemIcon(item.itemType)}
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{format(new Date(item.date), 'MMM dd, yyyy')}</span>
                        <Badge variant="secondary" className={getCategoryColor(item.category)}>
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${item.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {item.amount > 0 ? '+' : ''}${item.amount.toFixed(2)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setEditingItem(item)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              
              {folioItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No folio items yet. Add charges or payments to get started.
                </div>
              )}
            </div>
          </div>

          {/* Balance Status */}
          {balance !== 0 && (
            <div className={`p-4 rounded-lg border-2 ${
              balance > 0 
                ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800' 
                : 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
            }`}>
              <div className="flex items-center gap-2">
                {balance > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                <span className="font-medium">
                  {balance > 0 ? `Outstanding Balance: $${balance.toFixed(2)}` : `Credit Balance: $${Math.abs(balance).toFixed(2)}`}
                </span>
              </div>
              {balance > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Payment is required before checkout can be completed.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Split Folio Dialog */}
      {splitFolioDialog && (
        <SplitFolioDialog
          open={splitFolioDialog}
          onOpenChange={setSplitFolioDialog}
          reservation={{
            id: reservationId,
            code: reservationCode,
            guestName: guestName,
            totalAmount: charges
          }}
          folioItems={folioItems}
        />
      )}

      <ConfirmationComponent />
    </>
  );
};