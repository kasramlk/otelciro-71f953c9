import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CheckSquare, 
  Mail, 
  MessageSquare, 
  Users, 
  Calendar,
  Settings,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkOperationItem {
  id: string;
  type: 'reservation' | 'guest' | 'room';
  name: string;
  status: string;
  details?: string;
}

interface BulkOperationsProps {
  items: BulkOperationItem[];
  onSelectionChange?: (selectedIds: string[]) => void;
  className?: string;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  items = [],
  onSelectionChange,
  className = ""
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [smsContent, setSmsContent] = useState('');
  const { toast } = useToast();

  const handleSelectAll = () => {
    const newSelection = selectedItems.length === items.length ? [] : items.map(item => item.id);
    setSelectedItems(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleSelectItem = (itemId: string) => {
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    setSelectedItems(newSelection);
    onSelectionChange?.(newSelection);
  };

  const getBulkActions = () => {
    if (selectedItems.length === 0) return [];
    
    const selectedItemTypes = new Set(
      items.filter(item => selectedItems.includes(item.id)).map(item => item.type)
    );

    const actions = [];
    
    if (selectedItemTypes.has('reservation')) {
      actions.push(
        { value: 'confirm', label: 'Confirm Reservations', icon: CheckSquare },
        { value: 'cancel', label: 'Cancel Reservations', icon: AlertTriangle },
        { value: 'modify', label: 'Modify Reservations', icon: Calendar }
      );
    }
    
    if (selectedItemTypes.has('guest')) {
      actions.push(
        { value: 'email', label: 'Send Email', icon: Mail },
        { value: 'sms', label: 'Send SMS', icon: MessageSquare },
        { value: 'segment', label: 'Add to Segment', icon: Users }
      );
    }
    
    if (selectedItemTypes.has('room')) {
      actions.push(
        { value: 'status_update', label: 'Update Room Status', icon: Settings },
        { value: 'maintenance', label: 'Schedule Maintenance', icon: Settings }
      );
    }

    return actions;
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedItems.length === 0) return;

    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Bulk Operation Completed',
        description: `Successfully processed ${selectedItems.length} items`
      });
      
      // Reset selections
      setSelectedItems([]);
      setBulkAction('');
      setEmailContent('');
      setSmsContent('');
      
    } catch (error) {
      toast({
        title: 'Bulk Operation Failed',
        description: 'Please try again or contact support',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderActionForm = () => {
    switch (bulkAction) {
      case 'email':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email Content</label>
              <Textarea
                placeholder="Enter your email message..."
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
        );
      
      case 'sms':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">SMS Content</label>
              <Textarea
                placeholder="Enter your SMS message (160 char limit)..."
                value={smsContent}
                onChange={(e) => setSmsContent(e.target.value.slice(0, 160))}
                className="mt-2"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {smsContent.length}/160 characters
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Bulk Operations
            {selectedItems.length > 0 && (
              <Badge variant="secondary">
                {selectedItems.length} selected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Selection Controls */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedItems.length === items.length && items.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Select All ({items.length})
              </label>
            </div>
            
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Choose action..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getBulkActions().map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        <div className="flex items-center gap-2">
                          <action.icon className="h-4 w-4" />
                          {action.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {bulkAction && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        Execute Action
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Confirm Bulk Action
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          You are about to perform this action on {selectedItems.length} items.
                        </p>
                        
                        {renderActionForm()}
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={handleBulkAction}
                            disabled={isProcessing}
                            className="w-full"
                          >
                            {isProcessing ? 'Processing...' : 'Confirm Action'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={() => handleSelectItem(item.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="outline">
                      {item.type}
                    </Badge>
                    <Badge 
                      variant={item.status === 'active' ? 'default' : 'secondary'}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  {item.details && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.details}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
            
            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No items available for bulk operations
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};