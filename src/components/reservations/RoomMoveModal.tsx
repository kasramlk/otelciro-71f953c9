import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Room {
  id: string;
  number: string;
  type: string;
  status: string;
  floor: number;
}

interface Reservation {
  id: string;
  guestName: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

interface RoomMoveModalProps {
  open: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onMove?: (reservationId: string, newRoomId: string, reason: string) => void;
}

const mockAvailableRooms: Room[] = [
  { id: '1', number: '205', type: 'Deluxe', status: 'Clean', floor: 2 },
  { id: '2', number: '301', type: 'Suite', status: 'Clean', floor: 3 },
  { id: '3', number: '408', type: 'Standard', status: 'Clean', floor: 4 },
  { id: '4', number: '510', type: 'Deluxe', status: 'Clean', floor: 5 },
];

export function RoomMoveModal({ open, onClose, reservation, onMove }: RoomMoveModalProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [notifyGuest, setNotifyGuest] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!reservation) return null;

  const handleMove = async () => {
    if (!selectedRoom || !reason) {
      toast({
        title: "Missing Information",
        description: "Please select a room and provide a reason for the move.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onMove?.(reservation.id, selectedRoom, reason);
      
      toast({
        title: "Room Move Successful",
        description: `Guest has been moved to room ${mockAvailableRooms.find(r => r.id === selectedRoom)?.number}`,
      });
      
      onClose();
      setSelectedRoom('');
      setReason('');
      setEffectiveDate('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move guest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedRoomDetails = mockAvailableRooms.find(r => r.id === selectedRoom);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Move Guest to Different Room
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Reservation Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Reservation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guest:</span>
                <span className="font-medium">{reservation.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Room:</span>
                <span className="font-medium">{reservation.roomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Room Type:</span>
                <span className="font-medium">{reservation.roomType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stay Period:</span>
                <span className="font-medium">{reservation.checkIn} - {reservation.checkOut}</span>
              </div>
            </CardContent>
          </Card>

          {/* Room Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="room-select">Select New Room</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose available room..." />
                </SelectTrigger>
                <SelectContent>
                  {mockAvailableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>Room {room.number}</span>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline" className="text-xs">
                            {room.type}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Floor {room.floor}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room Comparison */}
            {selectedRoomDetails && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg"
              >
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-semibold">Room {reservation.roomNumber}</p>
                  <p className="text-sm text-muted-foreground">{reservation.roomType}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="font-semibold">Room {selectedRoomDetails.number}</p>
                  <p className="text-sm text-muted-foreground">{selectedRoomDetails.type}</p>
                </div>
              </motion.div>
            )}

            <div>
              <Label htmlFor="reason">Reason for Move</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Room Maintenance Issue</SelectItem>
                  <SelectItem value="guest-request">Guest Request</SelectItem>
                  <SelectItem value="upgrade">Room Upgrade</SelectItem>
                  <SelectItem value="overbooking">Overbooking Resolution</SelectItem>
                  <SelectItem value="noise-complaint">Noise Complaint</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="effective-date">Effective Date</Label>
              <Input
                id="effective-date"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notify-guest"
                checked={notifyGuest}
                onChange={(e) => setNotifyGuest(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="notify-guest" className="text-sm">
                Send notification to guest about room change
              </Label>
            </div>
          </div>

          {/* Move Preview */}
          {selectedRoomDetails && reason && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border rounded-lg bg-primary/5"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Move Summary</p>
                  <p className="text-sm text-muted-foreground">
                    {reservation.guestName} will be moved from Room {reservation.roomNumber} to Room {selectedRoomDetails.number}
                    {effectiveDate && ` effective ${effectiveDate}`}.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Reason: {reason.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  {notifyGuest && (
                    <p className="text-sm text-muted-foreground">
                      ✓ Guest will be notified via email and SMS
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={!selectedRoom || !reason || loading}
          >
            {loading ? 'Moving Guest...' : 'Confirm Move'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}