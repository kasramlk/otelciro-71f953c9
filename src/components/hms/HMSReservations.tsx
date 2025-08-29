import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, MapPin, MoreHorizontal, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useHMSStore } from '@/stores/hms-store';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { HMSNewReservation } from './HMSNewReservation';
import { ReservationDetailModal } from '@/components/reservations/ReservationDetailModal';
import { RoomMoveModal } from '@/components/reservations/RoomMoveModal';
import { RealtimeNotificationSystem } from '@/components/realtime/RealtimeNotificationSystem';
import { AdvancedFilters } from '@/components/advanced/AdvancedFilters';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { EnhancedExportSystem } from '@/components/export/EnhancedExportSystem';
import { OnlineUsers } from '@/components/realtime/OnlineUsers';

export const HMSReservations = () => {
  const { reservations } = useHMSStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRoomMoveModalOpen, setIsRoomMoveModalOpen] = useState(false);

  // Filter reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      const matchesSearch = 
        reservation.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || reservation.source === sourceFilter;
      
      // Date range filter logic would go here
      
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [reservations, searchQuery, statusFilter, sourceFilter, dateRange]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredReservations.length;
    const confirmed = filteredReservations.filter(r => r.status === 'confirmed').length;
    const checkedIn = filteredReservations.filter(r => r.status === 'checked-in').length;
    const cancelled = filteredReservations.filter(r => r.status === 'cancelled').length;
    const totalRevenue = filteredReservations.reduce((sum, r) => sum + r.totalAmount, 0);

    return { total, confirmed, checkedIn, cancelled, totalRevenue };
  }, [filteredReservations]);

  const getStatusBadge = (status: string) => {
    const variants = {
      'confirmed': 'default',
      'checked-in': 'secondary',
      'checked-out': 'outline',
      'cancelled': 'destructive',
      'no-show': 'destructive'
    };
    return <Badge variant={(variants[status as keyof typeof variants] as any) || 'default'}>{status}</Badge>;
  };

  const getSourceBadge = (source: string) => {
    const colors = {
      'direct': 'bg-green-100 text-green-800',
      'booking.com': 'bg-blue-100 text-blue-800',
      'expedia': 'bg-yellow-100 text-yellow-800',
      'phone': 'bg-purple-100 text-purple-800',
      'walk-in': 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {source}
      </Badge>
    );
  };

  const handleViewDetails = (reservation: any) => {
    setSelectedReservation(reservation);
    setIsDetailModalOpen(true);
  };

  const handleRoomMove = (reservation: any) => {
    setSelectedReservation(reservation);
    setIsRoomMoveModalOpen(true);
  };

  const handleEditReservation = (reservation: any) => {
    console.log("Edit reservation:", reservation);
    toast({
      title: "Edit Reservation",
      description: "Edit functionality will be implemented soon.",
    });
  };

  const handleCancelReservation = (reservation: any) => {
    console.log("Cancel reservation:", reservation);
    toast({
      title: "Reservation cancelled",
      description: `Reservation ${reservation.code} has been cancelled.`,
      variant: "destructive",
    });
  };

  const handleExport = () => {
    // Mock export functionality
    const csvContent = [
      ['Code', 'Guest', 'Check In', 'Check Out', 'Status', 'Source', 'Total Amount'].join(','),
      ...filteredReservations.map(r => [
        r.code,
        r.guestName,
        format(r.checkIn, 'yyyy-MM-dd'),
        format(r.checkOut, 'yyyy-MM-dd'),
        r.status,
        r.source,
        r.totalAmount.toString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reservations.csv';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export completed",
      description: "Reservations have been exported successfully.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="mb-4">
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
              Reservations Management
            </h1>
            <p className="text-muted-foreground">Manage your hotel reservations with real-time updates</p>
          </div>
          
          {/* Global Search */}
          <GlobalSearch
            onNavigate={(type, id) => {
              if (type === 'reservation') {
                const reservation = reservations.find(r => r.id === id);
                if (reservation) handleViewDetails(reservation);
              }
            }}
            className="max-w-2xl"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <OnlineUsers compact maxVisible={3} />
          <RealtimeNotificationSystem />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <EnhancedExportSystem
          dataType="reservations"
          title="Reservation Data"
          onExport={async (format) => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            handleExport();
          }}
        />
        
        <Dialog open={isNewReservationOpen} onOpenChange={setIsNewReservationOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Reservation</DialogTitle>
            </DialogHeader>
            <HMSNewReservation 
              onClose={() => setIsNewReservationOpen(false)}
              onSave={() => {
                // Refresh reservations list - already handled by store
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Checked In</p>
              <p className="text-2xl font-bold text-blue-600">{stats.checkedIn}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold">€{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={[
          {
            key: 'dateRange',
            label: 'Date Range',
            type: 'dateRange' as const,
            placeholder: 'Select date range'
          },
          {
            key: 'status',
            label: 'Status',
            type: 'multiSelect' as const,
            options: [
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'checked-in', label: 'Checked In' },
              { value: 'checked-out', label: 'Checked Out' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'no-show', label: 'No Show' }
            ]
          },
          {
            key: 'source',
            label: 'Booking Source',
            type: 'multiSelect' as const,
            options: [
              { value: 'direct', label: 'Direct' },
              { value: 'booking.com', label: 'Booking.com' },
              { value: 'expedia', label: 'Expedia' },
              { value: 'phone', label: 'Phone' },
              { value: 'walk-in', label: 'Walk-in' }
            ]
          },
          {
            key: 'minAmount',
            label: 'Minimum Amount',
            type: 'number' as const,
            placeholder: 'Enter minimum amount'
          },
          {
            key: 'hasBalance',
            label: 'Has Outstanding Balance',
            type: 'checkbox' as const
          }
        ]}
        onFiltersChange={(filters) => {
          // Apply filters to reservation list
          console.log('Applied filters:', filters);
        }}
        onReset={() => {
          setSearchQuery('');
          setStatusFilter('all');
          setSourceFilter('all');
          setDateRange('all');
        }}
        title="Reservation Filters"
      />

      {/* Quick Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Quick search reservations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="ml-auto">
              {filteredReservations.length} results
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reservations ({filteredReservations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Nights</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{reservation.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reservation.guestName}</p>
                        <p className="text-sm text-muted-foreground">{reservation.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{format(reservation.checkIn, 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(reservation.checkOut, 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{reservation.nights}</TableCell>
                    <TableCell>
                      <div>
                        <p>{reservation.roomType}</p>
                        {reservation.roomNumber && (
                          <p className="text-sm text-muted-foreground">Room {reservation.roomNumber}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                    <TableCell>{getSourceBadge(reservation.source)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">€{reservation.totalAmount.toFixed(2)}</p>
                        {reservation.balance > 0 && (
                          <p className="text-sm text-red-600">Balance: €{reservation.balance.toFixed(2)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(reservation)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditReservation(reservation)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRoomMove(reservation)}>
                            <MapPin className="mr-2 h-4 w-4" />
                            Move Room
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleCancelReservation(reservation)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedReservation && (
        <>
          <ReservationDetailModal
            open={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            reservation={selectedReservation}
          />
          
          <RoomMoveModal
            open={isRoomMoveModalOpen}
            onClose={() => setIsRoomMoveModalOpen(false)}
            reservation={selectedReservation}
          />
        </>
      )}
    </motion.div>
  );
};