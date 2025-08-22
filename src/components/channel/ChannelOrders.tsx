import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Download, 
  Check, 
  X, 
  Clock, 
  AlertTriangle,
  Eye,
  Filter,
  Calendar,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useChannelStore } from '@/stores/channel-store';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const ChannelOrders: React.FC = () => {
  const {
    inboundOrders,
    roomTypes,
    ratePlans,
    channelMappings,
    processInboundOrder,
    addAuditEntry,
  } = useChannelStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = inboundOrders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (agencyFilter !== 'all') {
      filtered = filtered.filter(order => order.agencyCode === agencyFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.payload?.guest?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.payload?.guest?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.payload?.reservation_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.agencyCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => 
      new Date(b.timestampReceived).getTime() - new Date(a.timestampReceived).getTime()
    );
  }, [inboundOrders, statusFilter, agencyFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = inboundOrders.length;
    const pending = inboundOrders.filter(o => o.status === 'pending').length;
    const applied = inboundOrders.filter(o => o.status === 'applied').length;
    const rejected = inboundOrders.filter(o => o.status === 'rejected').length;
    
    return { total, pending, applied, rejected };
  }, [inboundOrders]);

  // Get unique agencies
  const agencies = useMemo(() => {
    const uniqueAgencies = [...new Set(inboundOrders.map(o => o.agencyCode))];
    return uniqueAgencies.sort();
  }, [inboundOrders]);

  // Process order
  const handleProcessOrder = async (orderId: string, action: 'apply' | 'reject', reason?: string) => {
    setProcessingOrderId(orderId);
    
    try {
      // Check for mapping issues if applying
      if (action === 'apply') {
        const order = inboundOrders.find(o => o.id === orderId);
        if (order?.payload) {
          const roomTypeMapping = channelMappings.find(m => 
            m.gdsProductCode === order.payload.room_type_code
          );
          const ratePlanMapping = channelMappings.find(m => 
            m.gdsProductCode === order.payload.rate_plan_code
          );
          
          if (!roomTypeMapping || !ratePlanMapping) {
            toast({
              title: 'Mapping Error',
              description: 'Room type or rate plan mapping not found. Please configure mappings first.',
              variant: 'destructive'
            });
            return;
          }
        }
      }
      
      processInboundOrder(orderId, action, reason);
      
      addAuditEntry({
        actor: 'User',
        action: action === 'apply' ? 'Apply Inbound Order' : 'Reject Inbound Order',
        entityType: 'InboundOrder',
        entityId: orderId,
        summary: `${action === 'apply' ? 'Applied' : 'Rejected'} inbound order ${orderId}${reason ? ` - ${reason}` : ''}`,
        payload: { orderId, action, reason },
      });
      
      toast({ 
        title: `Order ${action === 'apply' ? 'applied' : 'rejected'} successfully`,
        description: action === 'apply' ? 'Reservation created and inventory updated' : 'Order marked as rejected'
      });
      
      setSelectedOrder(null);
      setRejectReason('');
    } catch (error) {
      toast({
        title: 'Error processing order',
        description: (error as Error).message,
        variant: 'destructive'
      });
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Export orders as CSV
  const handleExportCSV = () => {
    const csvData = [
      ['Order ID', 'Received', 'Agency', 'Guest Name', 'Email', 'Check-in', 'Check-out', 'Room Type', 'Rate Plan', 'Total', 'Status'],
      ...filteredOrders.map(order => [
        order.id,
        format(parseISO(order.timestampReceived), 'yyyy-MM-dd HH:mm'),
        order.agencyCode,
        order.payload?.guest?.name || '',
        order.payload?.guest?.email || '',
        order.payload?.stay?.check_in || '',
        order.payload?.stay?.check_out || '',
        order.payload?.room_type_code || '',
        order.payload?.rate_plan_code || '',
        order.payload?.total_cents ? (order.payload.total_cents / 100).toFixed(2) : '',
        order.status
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inbound_orders.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'Orders exported successfully' });
  };

  // Get status badge properties
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { variant: 'secondary' as const, icon: Clock, text: 'Pending' };
      case 'applied':
        return { variant: 'default' as const, icon: Check, text: 'Applied' };
      case 'rejected':
        return { variant: 'destructive' as const, icon: X, text: 'Rejected' };
      default:
        return { variant: 'secondary' as const, icon: AlertTriangle, text: 'Unknown' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inbound Orders</h1>
          <p className="text-muted-foreground">
            Process reservations received from agencies via mini-GDS
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.applied}</div>
            <p className="text-xs text-muted-foreground">Applied</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by guest name, email, reservation ID, or agency..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="col-span-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-3">
              <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Agency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agencies</SelectItem>
                  {agencies.map(agency => (
                    <SelectItem key={agency} value={agency}>{agency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Order Queue ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredOrders.map((order, index) => {
              const statusBadge = getStatusBadge(order.status);
              const StatusIcon = statusBadge.icon;
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "grid grid-cols-12 gap-4 p-4 rounded-lg border transition-colors cursor-pointer",
                    order.status === 'pending' && "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800",
                    order.status === 'applied' && "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800",
                    order.status === 'rejected' && "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800",
                    "hover:bg-accent"
                  )}
                  onClick={() => setSelectedOrder(order)}
                >
                  {/* Order Info */}
                  <div className="col-span-3">
                    <div className="font-medium">{order.payload?.reservation_id || order.id}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(order.timestampReceived), 'MMM dd, HH:mm')}
                    </div>
                  </div>

                  {/* Agency */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{order.agencyCode}</span>
                    </div>
                    {!order.signatureOk && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        Invalid Signature
                      </Badge>
                    )}
                  </div>

                  {/* Guest */}
                  <div className="col-span-2">
                    <div className="font-medium">{order.payload?.guest?.name || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">{order.payload?.guest?.email}</div>
                  </div>

                  {/* Stay */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {order.payload?.stay?.check_in && format(parseISO(order.payload.stay.check_in), 'MMM dd')}
                        {order.payload?.stay?.check_out && ` - ${format(parseISO(order.payload.stay.check_out), 'MMM dd')}`}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.payload?.stay?.nights} nights
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="col-span-1">
                    <div className="font-medium">
                      {order.payload?.total_cents ? `€${(order.payload.total_cents / 100).toFixed(0)}` : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">{order.payload?.currency}</div>
                  </div>

                  {/* Status & Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <Badge variant={statusBadge.variant} className="text-xs">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusBadge.text}
                    </Badge>
                    
                    {order.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProcessOrder(order.id, 'apply');
                          }}
                          disabled={processingOrderId === order.id}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          disabled={processingOrderId === order.id}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {inboundOrders.length === 0 
                ? "No orders received yet."
                : "No orders match your filter criteria."
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          {selectedOrder && (
            <OrderDetail 
              order={selectedOrder}
              onProcess={handleProcessOrder}
              processingId={processingOrderId}
              rejectReason={rejectReason}
              setRejectReason={setRejectReason}
              onClose={() => {
                setSelectedOrder(null);
                setRejectReason('');
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Order Detail Component
const OrderDetail: React.FC<{
  order: any;
  onProcess: (orderId: string, action: 'apply' | 'reject', reason?: string) => void;
  processingId: string | null;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  onClose: () => void;
}> = ({ order, onProcess, processingId, rejectReason, setRejectReason, onClose }) => {
  const statusBadge = getStatusBadge(order.status);
  const StatusIcon = statusBadge.icon;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          Order Details
          <Badge variant={statusBadge.variant} className="text-xs">
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusBadge.text}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          Received {format(parseISO(order.timestampReceived), 'PPP p')}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Order ID</Label>
            <div className="font-medium">{order.payload?.reservation_id || order.id}</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Agency</Label>
            <div className="font-medium">{order.agencyCode}</div>
          </div>
        </div>

        <Separator />

        {/* Guest Information */}
        <div>
          <Label className="text-sm font-medium">Guest Information</Label>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <div className="font-medium">{order.payload?.guest?.name}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="font-medium">{order.payload?.guest?.email}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <div className="font-medium">{order.payload?.guest?.phone}</div>
            </div>
          </div>
        </div>

        {/* Stay Information */}
        <div>
          <Label className="text-sm font-medium">Stay Information</Label>
          <div className="mt-2 grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Check-in</Label>
              <div className="font-medium">
                {order.payload?.stay?.check_in && format(parseISO(order.payload.stay.check_in), 'PPP')}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Check-out</Label>
              <div className="font-medium">
                {order.payload?.stay?.check_out && format(parseISO(order.payload.stay.check_out), 'PPP')}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nights</Label>
              <div className="font-medium">{order.payload?.stay?.nights}</div>
            </div>
          </div>
        </div>

        {/* Room and Rate */}
        <div>
          <Label className="text-sm font-medium">Room and Rate</Label>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Room Type Code</Label>
              <div className="font-medium">{order.payload?.room_type_code}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Rate Plan Code</Label>
              <div className="font-medium">{order.payload?.rate_plan_code}</div>
            </div>
          </div>
        </div>

        {/* Financial */}
        <div>
          <Label className="text-sm font-medium">Financial</Label>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Total Amount</Label>
              <div className="text-2xl font-bold">
                {order.payload?.total_cents ? `€${(order.payload.total_cents / 100).toFixed(2)}` : 'N/A'}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Currency</Label>
              <div className="font-medium">{order.payload?.currency}</div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div>
          <Label className="text-sm font-medium">Security</Label>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                order.signatureOk ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm">
                Signature {order.signatureOk ? 'Valid' : 'Invalid'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {order.status === 'pending' && (
          <>
            <Separator />
            <div className="space-y-4">
              <div>
                <Label htmlFor="reject-reason">Rejection Reason (optional)</Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Enter reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => onProcess(order.id, 'reject', rejectReason)}
                  disabled={processingId === order.id}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Order
                </Button>
                <Button
                  onClick={() => onProcess(order.id, 'apply')}
                  disabled={processingId === order.id}
                  className="bg-gradient-primary"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Apply Order
                </Button>
              </div>
            </div>
          </>
        )}

        {order.status !== 'pending' && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>Close</Button>
          </div>
        )}
      </div>
    </>
  );
};

// Helper function to get status badge properties
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return { variant: 'secondary' as const, icon: Clock, text: 'Pending' };
    case 'applied':
      return { variant: 'default' as const, icon: Check, text: 'Applied' };
    case 'rejected':
      return { variant: 'destructive' as const, icon: X, text: 'Rejected' };
    default:
      return { variant: 'secondary' as const, icon: AlertTriangle, text: 'Unknown' };
  }
};

export default ChannelOrders;