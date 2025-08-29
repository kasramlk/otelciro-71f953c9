import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Filter, Eye, MapPin, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useHMSStore } from '@/stores/hms-store';
import { ROOM_TYPES } from '@/lib/mock-data';
import { format, addDays, startOfToday } from 'date-fns';
import { ReservationDetailModal } from '@/components/reservations/ReservationDetailModal';
import { RoomMoveModal } from '@/components/reservations/RoomMoveModal';

export const HMSRoomPlan = () => {
  const { rooms, reservations } = useHMSStore();
  const [viewDays, setViewDays] = useState(7);
  const [roomTypeFilter, setRoomTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);

  const today = startOfToday();
  const dates = Array.from({ length: viewDays }, (_, i) => addDays(today, i));

  // Filter rooms based on selected filters
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesRoomType = roomTypeFilter === 'all' || room.roomTypeId === roomTypeFilter;
      const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
      return matchesRoomType && matchesStatus;
    });
  }, [rooms, roomTypeFilter, statusFilter]);

  // Get reservations for specific room and date
  const getReservationForRoomDate = (roomId: string, date: Date) => {
    return reservations.find(res => 
      res.roomId === roomId &&
      date >= res.checkIn &&
      date < res.checkOut &&
      (res.status === 'confirmed' || res.status === 'checked-in')
    );
  };

  // Get room status for a date
  const getRoomStatus = (room: any, date: Date) => {
    const reservation = getReservationForRoomDate(room.id, date);
    if (reservation) {
      return {
        status: 'occupied',
        reservation,
        color: 'bg-blue-500',
        text: 'text-white'
      };
    }
    
    switch (room.status) {
      case 'clean':
        return { status: 'available', color: 'bg-green-100', text: 'text-green-800' };
      case 'dirty':
        return { status: 'dirty', color: 'bg-yellow-100', text: 'text-yellow-800' };
      case 'ooo':
        return { status: 'out-of-order', color: 'bg-red-100', text: 'text-red-800' };
      default:
        return { status: 'available', color: 'bg-gray-100', text: 'text-gray-800' };
    }
  };

  const handleCellClick = (room: any, date: Date) => {
    const reservation = getReservationForRoomDate(room.id, date);
    if (reservation) {
      setSelectedReservation(reservation.id);
      setDetailsModalOpen(true);
    } else {
      // Handle empty room click - could open room status modal
      console.log('Room available for booking:', room.number, format(date, 'MMM dd'));
    }
  };

  const selectedReservationDetails = selectedReservation 
    ? reservations.find(r => r.id === selectedReservation)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Room Plan</h1>
          <p className="text-muted-foreground">Visual overview of room occupancy</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant={viewDays === 1 ? "default" : "outline"} 
            onClick={() => setViewDays(1)}
            size="sm"
          >
            Today
          </Button>
          <Button 
            variant={viewDays === 7 ? "default" : "outline"} 
            onClick={() => setViewDays(7)}
            size="sm"
          >
            7 Days
          </Button>
          <Button 
            variant={viewDays === 14 ? "default" : "outline"} 
            onClick={() => setViewDays(14)}
            size="sm"
          >
            14 Days
          </Button>
          <Button 
            variant={viewDays === 30 ? "default" : "outline"} 
            onClick={() => setViewDays(30)}
            size="sm"
          >
            Month
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Room Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Room Types</SelectItem>
                {ROOM_TYPES.map(type => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Room Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="clean">Clean</SelectItem>
                <SelectItem value="dirty">Dirty</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="ooo">Out of Order</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span>Dirty</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span>OOO</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Plan Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Room Occupancy Grid - {filteredRooms.length} rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Date Header */}
              <div className="grid sticky top-0 bg-background border-b" style={{ 
                gridTemplateColumns: `120px repeat(${dates.length}, minmax(100px, 1fr))` 
              }}>
                <div className="p-3 font-medium border-r">Room</div>
                {dates.map(date => (
                  <div key={date.toISOString()} className="p-3 text-center font-medium border-r">
                    <div className="text-sm">{format(date, 'EEE')}</div>
                    <div className="text-xs text-muted-foreground">{format(date, 'MMM dd')}</div>
                  </div>
                ))}
              </div>

              {/* Room Rows */}
              <div className="space-y-1">
                {filteredRooms.map(room => (
                  <div 
                    key={room.id} 
                    className="grid border-b hover:bg-muted/50"
                    style={{ gridTemplateColumns: `120px repeat(${dates.length}, minmax(100px, 1fr))` }}
                  >
                    {/* Room Info */}
                    <div className="p-3 border-r">
                      <div className="font-medium">{room.number}</div>
                      <div className="text-xs text-muted-foreground">{room.roomType}</div>
                      <Badge 
                        variant={room.status === 'clean' ? 'default' : 
                                room.status === 'dirty' ? 'secondary' : 'destructive'} 
                        className="text-xs mt-1"
                      >
                        {room.status}
                      </Badge>
                    </div>

                    {/* Date Cells */}
                    {dates.map(date => {
                      const roomStatus = getRoomStatus(room, date);
                      const reservation = roomStatus.reservation;
                      
                      return (
                        <div 
                          key={`${room.id}-${date.toISOString()}`}
                          className={`p-2 border-r cursor-pointer hover:opacity-80 ${roomStatus.color} ${roomStatus.text}`}
                          onClick={() => handleCellClick(room, date)}
                        >
                          {reservation ? (
                            <div className="text-xs">
                              <div className="font-medium truncate">{reservation.guestName}</div>
                              <div>{reservation.code}</div>
                              {reservation.checkIn.toDateString() === date.toDateString() && 
                                <Badge variant="outline" className="text-xs">Arrival</Badge>
                              }
                              {new Date(reservation.checkOut.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString() && 
                                <Badge variant="outline" className="text-xs">Departure</Badge>
                              }
                            </div>
                          ) : (
                            <div className="text-center text-xs opacity-60">
                              {roomStatus.status === 'available' ? 'Available' : 
                               roomStatus.status === 'dirty' ? 'Dirty' : 
                               roomStatus.status === 'out-of-order' ? 'OOO' : ''}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservation Details Modal */}
      {selectedReservation && (
        <ReservationDetailModal
          reservation={reservations.find(r => r.id === selectedReservation)}
          open={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
        />
      )}

      {/* Room Move Modal */}
      {selectedReservation && (
        <RoomMoveModal
          reservation={(() => {
            const res = reservations.find(r => r.id === selectedReservation);
            if (!res) return null;
            return {
              id: res.id,
              guestName: res.guestName,
              roomNumber: res.roomNumber || '',
              roomType: res.roomType,
              checkIn: format(res.checkIn, 'yyyy-MM-dd'),
              checkOut: format(res.checkOut, 'yyyy-MM-dd'),
              guests: res.adults || 1
            };
          })()}
          open={showMoveModal}
          onClose={() => setShowMoveModal(false)}
        />
      )}
    </motion.div>
  );
};