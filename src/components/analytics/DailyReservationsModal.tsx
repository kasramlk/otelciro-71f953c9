import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, MapPin, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Reservation {
  id: string;
  code?: string;
  guests: { first_name: string; last_name: string };
  check_in: string;
  check_out: string;
  source: string;
  status: string;
  balance_due: number;
  total_amount?: number;
  room_types?: { name: string };
}

interface DailyReservationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  reservations: Reservation[];
}

export const DailyReservationsModal = ({ 
  isOpen, 
  onClose, 
  date, 
  reservations 
}: DailyReservationsModalProps) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'checked in': return 'bg-purple-100 text-purple-800';
      case 'checked out': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalRevenue = reservations.reduce((sum, res) => {
    const checkIn = new Date(res.check_in);
    const checkOut = new Date(res.check_out);
    const totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return sum + ((res.total_amount || 0) / Math.max(totalNights, 1));
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reservations for {format(date, 'EEEE, MMMM dd, yyyy')}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {reservations.length} reservations
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              ${totalRevenue.toFixed(2)} daily revenue
            </span>
          </div>
        </DialogHeader>

        {reservations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No reservations found for this date</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Check-ins</div>
                <div className="text-2xl font-bold text-blue-900">
                  {reservations.filter(r => r.check_in === format(date, 'yyyy-MM-dd')).length}
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">Check-outs</div>
                <div className="text-2xl font-bold text-orange-900">
                  {reservations.filter(r => r.check_out === format(date, 'yyyy-MM-dd')).length}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Staying</div>
                <div className="text-2xl font-bold text-green-900">
                  {reservations.filter(r => {
                    const checkIn = new Date(r.check_in);
                    const checkOut = new Date(r.check_out);
                    return checkIn <= date && checkOut > date;
                  }).length}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Avg Rate</div>
                <div className="text-2xl font-bold text-purple-900">
                  ${reservations.length > 0 ? (totalRevenue / reservations.length).toFixed(0) : 0}
                </div>
              </div>
            </div>

            {/* Reservations Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reservation</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Room Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm">{reservation.code || reservation.id.slice(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{reservation.guests?.first_name} {reservation.guests?.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(reservation.check_in), 'MMM dd')} - {format(new Date(reservation.check_out), 'MMM dd')}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {Math.ceil((new Date(reservation.check_out).getTime() - new Date(reservation.check_in).getTime()) / (1000 * 60 * 60 * 24))} nights
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{reservation.room_types?.name || 'Standard'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(reservation.status)}
                      >
                        {reservation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {reservation.source || 'Direct'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <div className="flex flex-col items-end">
                        <span>${(reservation.total_amount || 0).toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">
                          Balance: ${(reservation.balance_due || 0).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};