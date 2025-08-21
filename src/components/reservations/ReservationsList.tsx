import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Users,
  MapPin,
  Building,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface ReservationsListProps {
  filterStatus: 'all' | 'arrivals' | 'departures';
}

// Mock data generator
const generateMockReservations = (count: number) => {
  const statuses = ['Booked', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'];
  const sources = ['Direct', 'Booking.com', 'Expedia', 'Airbnb', 'Corporate', 'Agency'];
  const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Executive'];
  const companies = ['', 'ACME Corp', 'Tech Solutions', 'Global Enterprises'];
  
  return Array.from({ length: count }, (_, i) => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 60) - 30);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 14) + 1);
    
    const nights = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const roomRate = 120 + Math.random() * 200;
    const totalAmount = nights * roomRate;
    
    return {
      id: `res_${i + 1}`,
      reservationNo: `RES${String(i + 1001).padStart(6, '0')}`,
      confirmationNo: `CNF${String(i + 5001).padStart(6, '0')}`,
      guest: {
        name: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'][Math.floor(Math.random() * 5)],
        email: `guest${i + 1}@example.com`,
        phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Guest${i + 1}`,
        loyaltyTier: ['Standard', 'Silver', 'Gold', 'Platinum'][Math.floor(Math.random() * 4)]
      },
      status: statuses[Math.floor(Math.random() * statuses.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      nights,
      adults: Math.floor(Math.random() * 3) + 1,
      children: Math.floor(Math.random() * 3),
      roomType: roomTypes[Math.floor(Math.random() * roomTypes.length)],
      roomNumber: Math.floor(Math.random() * 400) + 100,
      rate: Math.round(roomRate),
      totalAmount: Math.round(totalAmount),
      paidAmount: Math.round(totalAmount * (Math.random() * 0.5 + 0.5)),
      company: companies[Math.floor(Math.random() * companies.length)],
      specialRequests: Math.random() > 0.7 ? ['Late check-in', 'High floor', 'Quiet room'] : [],
      isVIP: Math.random() > 0.9,
      groupBooking: Math.random() > 0.85,
      createdAt: format(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd HH:mm'),
    };
  });
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    'Booked': { variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
    'Confirmed': { variant: 'default' as const, color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
    'CheckedIn': { variant: 'default' as const, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
    'CheckedOut': { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' },
    'Cancelled': { variant: 'destructive' as const, color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
  };
  
  return statusConfig[status as keyof typeof statusConfig] || statusConfig.Booked;
};

const getLoyaltyBadge = (tier: string) => {
  const tierConfig = {
    'Standard': { color: 'bg-gray-100 text-gray-800', icon: null },
    'Silver': { color: 'bg-slate-100 text-slate-800', icon: Star },
    'Gold': { color: 'bg-yellow-100 text-yellow-800', icon: Star },
    'Platinum': { color: 'bg-purple-100 text-purple-800', icon: Star },
  };
  
  return tierConfig[tier as keyof typeof tierConfig] || tierConfig.Standard;
};

export const ReservationsList = ({ filterStatus }: ReservationsListProps) => {
  const [selectedReservations, setSelectedReservations] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  
  const allReservations = useMemo(() => generateMockReservations(50), []);
  
  // Filter reservations based on filterStatus
  const filteredReservations = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    switch (filterStatus) {
      case 'arrivals':
        return allReservations.filter(res => res.checkIn === todayStr);
      case 'departures':
        return allReservations.filter(res => res.checkOut === todayStr);
      default:
        return allReservations;
    }
  }, [allReservations, filterStatus]);
  
  // Paginate data
  const paginatedReservations = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredReservations.slice(start, end);
  }, [filteredReservations, currentPage]);
  
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  
  const handleSelectReservation = (reservationId: string) => {
    setSelectedReservations(prev => 
      prev.includes(reservationId) 
        ? prev.filter(id => id !== reservationId)
        : [...prev, reservationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReservations.length === paginatedReservations.length) {
      setSelectedReservations([]);
    } else {
      setSelectedReservations(paginatedReservations.map(res => res.id));
    }
  };

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-primary" />
            {filterStatus === 'arrivals' ? "Today's Arrivals" : 
             filterStatus === 'departures' ? "Today's Departures" : 
             'All Reservations'}
            <Badge variant="secondary" className="ml-2">
              {filteredReservations.length}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="border-border"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="border-border"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedReservations.length === paginatedReservations.length && paginatedReservations.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-semibold">Guest</TableHead>
                <TableHead className="font-semibold">Reservation</TableHead>
                <TableHead className="font-semibold">Dates</TableHead>
                <TableHead className="font-semibold">Room</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Source</TableHead>
                <TableHead className="font-semibold text-right">Amount</TableHead>
                <TableHead className="font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReservations.map((reservation, index) => {
                const statusBadge = getStatusBadge(reservation.status);
                const loyaltyBadge = getLoyaltyBadge(reservation.guest.loyaltyTier);
                
                return (
                  <motion.tr
                    key={reservation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedReservations.includes(reservation.id)}
                        onCheckedChange={() => handleSelectReservation(reservation.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={reservation.guest.avatar} />
                          <AvatarFallback>{reservation.guest.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{reservation.guest.name}</span>
                            {reservation.isVIP && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                            {loyaltyBadge.icon && (
                              <loyaltyBadge.icon className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {reservation.adults} adults{reservation.children > 0 && `, ${reservation.children} children`}
                          </div>
                          {reservation.company && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Building className="mr-1 h-3 w-3" />
                              {reservation.company}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-xs">
                          {reservation.reservationNo}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {reservation.confirmationNo}
                        </div>
                        {reservation.groupBooking && (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="mr-1 h-3 w-3" />
                            Group
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {format(parseISO(reservation.checkIn), 'MMM dd')} - {format(parseISO(reservation.checkOut), 'MMM dd')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {reservation.nights} night{reservation.nights !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{reservation.roomType}</div>
                        <div className="text-xs text-muted-foreground">
                          Room {reservation.roomNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadge.color}>
                        {reservation.status}
                      </Badge>
                      {reservation.specialRequests.length > 0 && (
                        <div className="flex items-center text-xs text-amber-600 mt-1">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Special requests
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {reservation.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <div className="font-semibold">${reservation.totalAmount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          Paid: ${reservation.paidAmount.toLocaleString()}
                        </div>
                        {reservation.paidAmount < reservation.totalAmount && (
                          <div className="text-xs text-red-600">
                            Due: ${(reservation.totalAmount - reservation.paidAmount).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border border-border">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Reservation
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Manage Folio
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="mr-2 h-4 w-4" />
                            Send SMS
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Cancel Reservation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};