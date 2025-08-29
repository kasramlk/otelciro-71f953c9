import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, MapPin, CreditCard, Receipt, Split, Download, User, Calendar, Clock, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHMSStore } from '@/stores/hms-store';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ReservationDetailModal } from '@/components/reservations/ReservationDetailModal';
import { RoomMoveModal as ExternalRoomMoveModal } from '@/components/reservations/RoomMoveModal';
import { PaymentProcessingModal } from '@/components/payment/PaymentProcessingModal';
import { RealtimeNotificationSystem } from '@/components/realtime/RealtimeNotificationSystem';
import { EnhancedExportSystem } from '@/components/export/EnhancedExportSystem';
import { OnlineUsers } from '@/components/realtime/OnlineUsers';

export const HMSFrontOffice = () => {
  const { reservations, rooms, updateReservation, addAuditEntry } = useHMSStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [modalType, setModalType] = useState<'detail' | 'roomMove' | 'payment' | null>(null);
  const { toast } = useToast();

  // Filter in-house reservations (checked-in guests)
  const inHouseReservations = useMemo(() => {
    return reservations.filter(res => {
      const matchesSearch = searchQuery === '' || 
        res.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (res.roomNumber && res.roomNumber.includes(searchQuery));
      
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'arrivals' && format(res.checkIn, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) ||
        (activeTab === 'departures' && format(res.checkOut, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) ||
        (activeTab === 'in-house' && res.status === 'checked-in');

      return matchesSearch && matchesTab && res.status !== 'cancelled';
    });
  }, [reservations, searchQuery, activeTab]);

  // Stats for the tabs
  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return {
      total: inHouseReservations.length,
      arrivals: reservations.filter(r => format(r.checkIn, 'yyyy-MM-dd') === today && r.status === 'confirmed').length,
      departures: reservations.filter(r => format(r.checkOut, 'yyyy-MM-dd') === today && r.status === 'checked-in').length,
      inHouse: reservations.filter(r => r.status === 'checked-in').length
    };
  }, [reservations]);

  // Handle folio export
  const handleFolioExport = (reservation: any) => {
    const folioData = `
FOLIO EXPORT
============
Reservation: ${reservation.code}
Guest: ${reservation.guestName}
Room: ${reservation.roomNumber || 'Not assigned'}
Check-in: ${format(reservation.checkIn, 'MMM dd, yyyy')}
Check-out: ${format(reservation.checkOut, 'MMM dd, yyyy')}

CHARGES:
Room Charge: €${reservation.rate * reservation.nights}
Taxes: €${(reservation.totalAmount - (reservation.rate * reservation.nights)).toFixed(2)}
Total: €${reservation.totalAmount}
Balance: €${reservation.balance}
    `.trim();

    const blob = new Blob([folioData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `folio_${reservation.code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'Folio exported successfully' });
  };

  // Handle room move
  const handleRoomMove = (reservationId: string, newRoomId: string, notes: string) => {
    const newRoom = rooms.find(r => r.id === newRoomId);
    if (!newRoom) return;

    updateReservation(reservationId, {
      roomId: newRoomId,
      roomNumber: newRoom.number
    });

    const reservation = reservations.find(r => r.id === reservationId);
    addAuditEntry('Room Move', `${reservation?.guestName} moved to room ${newRoom.number}${notes ? `: ${notes}` : ''}`);
    
    toast({ title: 'Room moved successfully', description: `Guest moved to room ${newRoom.number}` });
    setModalType(null);
    setSelectedReservation(null);
  };

  // Handle payment processing
  const handlePayment = (reservationId: string, amount: number, method: string, notes: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    const newBalance = Math.max(0, reservation.balance - amount);
    updateReservation(reservationId, { balance: newBalance });

    addAuditEntry('Payment Processed', `€${amount} payment received via ${method} for ${reservation.guestName}`);
    
    toast({ 
      title: 'Payment processed', 
      description: `€${amount} received. New balance: €${newBalance.toFixed(2)}` 
    });
    
    setModalType(null);
    setSelectedReservation(null);
  };

  // Handle folio split
  const handleFolioSplit = (reservationId: string, splitType: 'percentage' | 'selection', splitValue: number) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    const splitAmount = splitType === 'percentage' 
      ? reservation.totalAmount * (splitValue / 100)
      : splitValue;

    // Mock folio split - in real system this would create new folios
    addAuditEntry('Folio Split', `Folio for ${reservation.guestName} split - €${splitAmount.toFixed(2)} separated`);
    
    toast({ 
      title: 'Folio split successfully', 
      description: `€${splitAmount.toFixed(2)} separated to new folio` 
    });
    
    setModalType(null);
    setSelectedReservation(null);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'confirmed': 'default',
      'checked-in': 'secondary',
      'checked-out': 'outline',
      'cancelled': 'destructive'
    };
    return <Badge variant={(variants[status as keyof typeof variants] as any) || 'default'}>{status}</Badge>;
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'arrivals': return stats.arrivals;
      case 'departures': return stats.departures;
      case 'in-house': return stats.inHouse;
      default: return stats.total;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Front Office Operations
          </h1>
          <p className="text-muted-foreground">In-house guest operations and folio management</p>
        </div>
        
        <div className="flex items-center gap-4">
          <OnlineUsers compact maxVisible={3} />
          <RealtimeNotificationSystem />
        </div>
      </div>

      {/* Export System */}
      <div className="mb-6">
        <EnhancedExportSystem
          dataType="front-office"
          title="Front Office Data"
          onExport={async (format) => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast({ title: `Front office data exported as ${format.toUpperCase()}` });
          }}
        />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by guest name, reservation code, or room number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All Guests ({getTabCount('all')})
          </TabsTrigger>
          <TabsTrigger value="arrivals" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Arrivals ({getTabCount('arrivals')})
          </TabsTrigger>
          <TabsTrigger value="departures" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Departures ({getTabCount('departures')})
          </TabsTrigger>
          <TabsTrigger value="in-house" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            In-House ({getTabCount('in-house')})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'arrivals' ? 'Today\'s Arrivals' :
                 activeTab === 'departures' ? 'Today\'s Departures' :
                 activeTab === 'in-house' ? 'In-House Guests' :
                 'All Reservations'} ({inHouseReservations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inHouseReservations.map((reservation) => (
                      <TableRow key={reservation.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{reservation.guestName}</p>
                            <p className="text-sm text-muted-foreground">{reservation.code}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{reservation.roomType}</p>
                            {reservation.roomNumber && (
                              <p className="text-sm text-muted-foreground">Room {reservation.roomNumber}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{format(reservation.checkIn, 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{format(reservation.checkOut, 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                        <TableCell>
                          <span className={reservation.balance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                            €{reservation.balance.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReservation(reservation);
                                setModalType('detail');
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Folio
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReservation(reservation);
                                setModalType('roomMove');
                              }}
                            >
                              <MapPin className="h-4 w-4 mr-1" />
                              Move
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReservation(reservation);
                                setModalType('payment');
                              }}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Payment
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {inHouseReservations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No reservations found for current filter
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedReservation && (
        <>
          {/* Detail Modal */}
          <ReservationDetailModal
            open={modalType === 'detail'}
            onClose={() => setModalType(null)}
            reservation={selectedReservation}
            onUpdate={() => {}}
            onCancel={() => {}}
          />

          {/* Room Move Modal */}
          <ExternalRoomMoveModal
            open={modalType === 'roomMove'}
            onClose={() => setModalType(null)}
            reservation={selectedReservation}
            onMove={handleRoomMove}
          />

          {/* Payment Modal */}
          <PaymentProcessingModal
            open={modalType === 'payment'}
            onClose={() => setModalType(null)}
            guestName={selectedReservation?.guestName}
            outstandingAmount={selectedReservation?.balance}
            onPaymentComplete={(paymentData) => {
              handlePayment(selectedReservation.id, paymentData.amount, paymentData.method, '');
            }}
          />
        </>
      )}
    </motion.div>
  );
};

// Folio Modal Component
const FolioModal = ({ reservation, onExport, onSplit }: any) => {
  const [splitType, setSplitType] = useState<'percentage' | 'selection'>('percentage');
  const [splitValue, setSplitValue] = useState(50);

  const mockCharges = [
    { id: 1, date: reservation.checkIn, description: 'Room Charge', amount: reservation.rate },
    { id: 2, date: reservation.checkIn, description: 'City Tax', amount: 2.50 },
    { id: 3, date: new Date(), description: 'Mini Bar', amount: 15.00 }
  ];

  return (
    <div className="space-y-6">
      {/* Guest Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <label className="font-medium">Guest:</label>
          <p>{reservation.guestName}</p>
        </div>
        <div>
          <label className="font-medium">Room:</label>
          <p>{reservation.roomType} - {reservation.roomNumber}</p>
        </div>
        <div>
          <label className="font-medium">Check-in:</label>
          <p>{format(reservation.checkIn, 'MMM dd, yyyy')}</p>
        </div>
        <div>
          <label className="font-medium">Check-out:</label>
          <p>{format(reservation.checkOut, 'MMM dd, yyyy')}</p>
        </div>
      </div>

      {/* Charges */}
      <div>
        <h4 className="font-medium mb-3">Charges</h4>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCharges.map(charge => (
                <TableRow key={charge.id}>
                  <TableCell>{format(charge.date, 'MMM dd')}</TableCell>
                  <TableCell>{charge.description}</TableCell>
                  <TableCell className="text-right">€{charge.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-medium border-t-2">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right">€{reservation.totalAmount.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow className="font-medium">
                <TableCell colSpan={2}>Balance Due</TableCell>
                <TableCell className="text-right text-red-600">€{reservation.balance.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Split Folio */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Split Folio</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Split Type</Label>
              <Select value={splitType} onValueChange={(value: any) => setSplitType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">By Percentage</SelectItem>
                  <SelectItem value="selection">By Selection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{splitType === 'percentage' ? 'Percentage (%)' : 'Amount (€)'}</Label>
              <Input
                type="number"
                value={splitValue}
                onChange={(e) => setSplitValue(Number(e.target.value))}
                placeholder={splitType === 'percentage' ? '50' : '100.00'}
              />
            </div>
          </div>
          <Button 
            onClick={() => onSplit(splitType, splitValue)}
            variant="outline" 
            className="w-full"
          >
            <Split className="h-4 w-4 mr-2" />
            Split Folio
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button onClick={onExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
};

// Room Move Modal Component
const RoomMoveModal = ({ reservation, rooms, onMove, onCancel }: any) => {
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [notes, setNotes] = useState('');

  const availableRooms = rooms.filter(r => 
    r.roomTypeId === reservation.roomTypeId && 
    r.status === 'clean' && 
    r.id !== reservation.roomId
  );

  return (
    <div className="space-y-4">
      <div>
        <Label>Current Room</Label>
        <p className="text-sm text-muted-foreground">{reservation.roomType} - Room {reservation.roomNumber}</p>
      </div>

      <div>
        <Label htmlFor="newRoom">New Room</Label>
        <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
          <SelectTrigger>
            <SelectValue placeholder="Select new room" />
          </SelectTrigger>
          <SelectContent>
            {availableRooms.map(room => (
              <SelectItem key={room.id} value={room.id}>
                Room {room.number} - {room.roomType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          placeholder="Reason for room move..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          onClick={() => onMove(reservation.id, selectedRoomId, notes)}
          disabled={!selectedRoomId}
          className="bg-gradient-primary"
        >
          Move Room
        </Button>
      </div>
    </div>
  );
};

// Payment Modal Component
const PaymentModal = ({ reservation, onPayment, onCancel }: any) => {
  const [amount, setAmount] = useState(reservation.balance);
  const [method, setMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-4">
      <div className="bg-muted p-3 rounded-lg">
        <div className="flex justify-between">
          <span>Current Balance:</span>
          <span className="font-medium text-red-600">€{reservation.balance.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Payment Amount</Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="method">Payment Method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Credit Card</SelectItem>
              <SelectItem value="transfer">Bank Transfer</SelectItem>
              <SelectItem value="voucher">Voucher</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          placeholder="Payment notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="bg-muted p-3 rounded-lg">
        <div className="flex justify-between">
          <span>New Balance:</span>
          <span className="font-medium">€{Math.max(0, reservation.balance - amount).toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          onClick={() => onPayment(reservation.id, amount, method, notes)}
          disabled={amount <= 0 || amount > reservation.balance}
          className="bg-gradient-primary"
        >
          Process Payment
        </Button>
      </div>
    </div>
  );
};