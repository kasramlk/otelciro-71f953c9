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
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useInHouseGuests, useTodaysArrivals, useTodaysDepartures, useCheckInGuest, useCheckOutGuest, useRoomMove, useStayExtension } from '@/hooks/use-advanced-front-office';
import { useHotelContext } from '@/hooks/use-hotel-context';
import { ReservationDetailModal } from '@/components/reservations/ReservationDetailModal';
import { RoomMoveModal as ExternalRoomMoveModal } from '@/components/reservations/RoomMoveModal';
import { PaymentProcessingModal } from '@/components/payment/PaymentProcessingModal';
import { RealtimeNotificationSystem } from '@/components/realtime/RealtimeNotificationSystem';
import { EnhancedExportSystem } from '@/components/export/EnhancedExportSystem';
import { OnlineUsers } from '@/components/realtime/OnlineUsers';

export const HMSFrontOffice = () => {
  const { selectedHotelId } = useHotelContext();
  const { data: inHouseGuests = [] } = useInHouseGuests(selectedHotelId || '');
  const { data: todaysArrivals = [] } = useTodaysArrivals(selectedHotelId || '');
  const { data: todaysDepartures = [] } = useTodaysDepartures(selectedHotelId || '');
  const checkInMutation = useCheckInGuest();
  const checkOutMutation = useCheckOutGuest();
  const roomMoveMutation = useRoomMove();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [modalType, setModalType] = useState<'detail' | 'roomMove' | 'payment' | null>(null);
  const { toast } = useToast();

  // Get current data based on active tab
  const currentReservations = useMemo(() => {
    let data = [];
    
    switch (activeTab) {
      case 'arrivals':
        data = todaysArrivals;
        break;
      case 'departures':
        data = todaysDepartures;
        break;
      case 'in-house':
        data = inHouseGuests;
        break;
      default:
        data = [...inHouseGuests, ...todaysArrivals, ...todaysDepartures];
    }
    
    // Apply search filter
    return data.filter(res => {
      const guestName = res.guests ? `${res.guests.first_name || ''} ${res.guests.last_name || ''}`.trim() : '';
      const matchesSearch = searchQuery === '' || 
        guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (res.rooms?.number && res.rooms.number.includes(searchQuery));
      
      return matchesSearch;
    });
  }, [inHouseGuests, todaysArrivals, todaysDepartures, searchQuery, activeTab]);

  // Stats for the tabs
  const stats = useMemo(() => {
    return {
      total: [...inHouseGuests, ...todaysArrivals, ...todaysDepartures].length,
      arrivals: todaysArrivals.length,
      departures: todaysDepartures.length,
      inHouse: inHouseGuests.length
    };
  }, [inHouseGuests, todaysArrivals, todaysDepartures]);

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
  const handleRoomMove = async (reservationId: string, newRoomId: string, reason: string) => {
    try {
      await roomMoveMutation.mutateAsync({
        reservationId,
        newRoomId,
        reason
      });
      
      toast({ title: 'Room moved successfully' });
      setModalType(null);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Failed to move room:', error);
      toast({ title: 'Failed to move room', variant: 'destructive' });
    }
  };

  // Handle payment processing
  const handlePayment = (reservationId: string, amount: number, method: string, notes: string) => {
    // This will be implemented with folio management hooks
    toast({ 
      title: 'Payment processing not yet implemented', 
      description: 'Payment functionality will be available in the folio manager.' 
    });
    
    setModalType(null);
    setSelectedReservation(null);
  };

  // Handle folio split
  const handleFolioSplit = (reservationId: string, splitType: 'percentage' | 'selection', splitValue: number) => {
    // This will be implemented with folio management hooks
    toast({ 
      title: 'Folio split functionality not yet implemented', 
      description: 'Folio splitting will be available in the folio manager.' 
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
                 'All Reservations'} ({currentReservations.length})
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
                    {currentReservations.map((reservation) => (
                      <TableRow key={reservation.id} className="hover:bg-muted/50">
                         <TableCell>
                           <div>
                             <p className="font-medium">
                               {reservation.guests 
                                 ? `${reservation.guests.first_name || ''} ${reservation.guests.last_name || ''}`.trim()
                                 : 'Unknown Guest'
                               }
                             </p>
                             <p className="text-sm text-muted-foreground">{reservation.code}</p>
                           </div>
                         </TableCell>
                         <TableCell>
                           <div>
                             <p>{reservation.room_types?.name || 'Room'}</p>
                             {reservation.rooms?.number && (
                               <p className="text-sm text-muted-foreground">Room {reservation.rooms.number}</p>
                             )}
                           </div>
                         </TableCell>
                         <TableCell>{format(new Date(reservation.check_in), 'MMM dd, yyyy')}</TableCell>
                         <TableCell>{format(new Date(reservation.check_out), 'MMM dd, yyyy')}</TableCell>
                         <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                         <TableCell>
                           <span className={(reservation.balance_due || 0) > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                             €{(reservation.balance_due || 0).toFixed(2)}
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
                
                {currentReservations.length === 0 && (
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