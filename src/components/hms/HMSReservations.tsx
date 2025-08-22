import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useHMSStore } from '@/stores/hms-store';
import { format } from 'date-fns';
// import { HMSNewReservation } from './HMSNewReservation';

export const HMSReservations = () => {
  const { reservations } = useHMSStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);

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
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reservations</h1>
          <p className="text-muted-foreground">Manage your hotel reservations</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
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
              <div>New Reservation form will be implemented here</div>
            </DialogContent>
          </Dialog>
        </div>
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reservations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked-in">Checked In</SelectItem>
                <SelectItem value="checked-out">Checked Out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="booking.com">Booking.com</SelectItem>
                <SelectItem value="expedia">Expedia</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="walk-in">Walk-in</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
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
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MapPin className="h-4 w-4 mr-2" />
                            Move Room
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
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
    </motion.div>
  );
};