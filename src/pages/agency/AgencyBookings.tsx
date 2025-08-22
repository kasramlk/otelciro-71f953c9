import { useState } from "react";
import { NewBookingModal } from "@/components/agency/NewBookingModal";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  MapPin, 
  Users, 
  CreditCard, 
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  X,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";

const AgencyBookings = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['agency-bookings', searchQuery, statusFilter, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          guests (first_name, last_name, email, phone),
          hotels (name, city, country),
          room_types (name),
          rooms (number)
        `)
        .not('agency_id', 'is', null)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    }
  });

  const stats = [
    { 
      title: "Total Bookings", 
      value: bookings?.length || 0, 
      change: "+12%", 
      icon: Calendar,
      color: "text-primary" 
    },
    { 
      title: "Active Reservations", 
      value: bookings?.filter(b => b.status === 'Confirmed').length || 0, 
      change: "+8%", 
      icon: CheckCircle,
      color: "text-green-600" 
    },
    { 
      title: "Pending", 
      value: bookings?.filter(b => b.status === 'Pending').length || 0, 
      change: "+5%", 
      icon: Clock,
      color: "text-yellow-600" 
    },
    { 
      title: "Total Revenue", 
      value: bookings?.reduce((acc, b) => acc + (b.total_price || 0), 0)?.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      }) || "$0", 
      change: "+15%", 
      icon: CreditCard,
      color: "text-accent" 
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Cancelled': return <X className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Booking Management</h1>
          <p className="text-muted-foreground">Manage all your hotel reservations and bookings</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 gap-2" onClick={() => setIsNewBookingOpen(true)}>
            <Calendar className="h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>

      <NewBookingModal 
        isOpen={isNewBookingOpen} 
        onOpenChange={setIsNewBookingOpen}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <Badge variant="outline" className="mt-1 text-green-600 border-green-600">
                      {stat.change}
                    </Badge>
                  </div>
                  <div className={`p-3 rounded-full bg-primary/10`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by guest name, booking reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Checked In">Checked In</SelectItem>
                  <SelectItem value="Checked Out">Checked Out</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Recent Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : bookings?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No bookings found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings?.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="font-medium">
                          {booking.guests?.first_name} {booking.guests?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">{booking.guests?.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{booking.hotels?.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.hotels?.city}, {booking.hotels?.country}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(booking.check_in).toLocaleDateString()} - 
                          {new Date(booking.check_out).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {booking.adults} adults{booking.children > 0 && `, ${booking.children} children`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{booking.room_types?.name}</div>
                        {booking.rooms?.number && (
                          <div className="text-sm text-muted-foreground">Room {booking.rooms.number}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(booking.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(booking.status)}
                            {booking.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {booking.total_price?.toLocaleString('en-US', {
                          style: 'currency',
                          currency: booking.currency || 'USD'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyBookings;