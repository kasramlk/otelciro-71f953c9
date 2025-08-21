import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  CreditCard,
  Eye,
  Edit,
  Move,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  FileText,
  Phone,
  Mail,
  Building2,
  Bed
} from "lucide-react";

export default function HotelReservations() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reservations
  const { data: reservations, isLoading } = useQuery({
    queryKey: ['hotel-reservations', searchQuery, statusFilter, dateFilter, sourceFilter],
    queryFn: async () => {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          guests (first_name, last_name, email, phone, nationality),
          room_types (name, capacity_adults),
          rooms (number, floor),
          hotels (name),
          agencies (name),
          companies (name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (sourceFilter !== 'all') {
        if (sourceFilter === 'direct') {
          query = query.is('agency_id', null).is('company_id', null);
        } else if (sourceFilter === 'agency') {
          query = query.not('agency_id', 'is', null);
        } else if (sourceFilter === 'company') {
          query = query.not('company_id', 'is', null);
        }
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    }
  });

  // Update reservation status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Reservation status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['hotel-reservations'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update reservation status",
        variant: "destructive",
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Checked In': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'Checked Out': return <CheckCircle className="h-4 w-4 text-gray-600" />;
      case 'Pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Cancelled': return <X className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Checked In': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Checked Out': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getSourceBadge = (reservation: any) => {
    if (reservation.agencies?.name) {
      return <Badge variant="outline" className="text-purple-600 border-purple-600">Agency: {reservation.agencies.name}</Badge>;
    }
    if (reservation.companies?.name) {
      return <Badge variant="outline" className="text-blue-600 border-blue-600">Company: {reservation.companies.name}</Badge>;
    }
    return <Badge variant="outline" className="text-green-600 border-green-600">Direct</Badge>;
  };

  const handleStatusChange = (reservationId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: reservationId, status: newStatus });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reservations Management</h1>
          <p className="text-muted-foreground">Manage all guest reservations and bookings</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="gap-2">
            <Move className="h-4 w-4" />
            Room Move
          </Button>
          <Button 
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 gap-2"
            onClick={() => navigate('/reservations/new')}
          >
            <Plus className="h-4 w-4" />
            New Reservation
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Total Reservations", value: reservations?.length || 0, icon: Calendar, color: "text-blue-600" },
          { title: "Confirmed", value: reservations?.filter(r => r.status === 'Confirmed').length || 0, icon: CheckCircle, color: "text-green-600" },
          { title: "Checked In", value: reservations?.filter(r => r.status === 'Checked In').length || 0, icon: Users, color: "text-purple-600" },
          { title: "Pending", value: reservations?.filter(r => r.status === 'Pending').length || 0, icon: Clock, color: "text-yellow-600" }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className="p-2 rounded-full bg-primary/10">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by guest name, confirmation number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Checked In">Checked In</SelectItem>
                <SelectItem value="Checked Out">Checked Out</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="agency">Agencies</SelectItem>
                <SelectItem value="company">Companies</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
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
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Reservations List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Source</TableHead>
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
                ) : reservations?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No reservations found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reservations?.map((reservation) => (
                    <TableRow key={reservation.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {reservation.guests?.first_name} {reservation.guests?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            {reservation.guests?.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{reservation.guests.email}</span>
                              </div>
                            )}
                            {reservation.guests?.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{reservation.guests.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {new Date(reservation.check_in).toLocaleDateString()} - 
                            {new Date(reservation.check_out).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {reservation.adults} adults
                            {reservation.children > 0 && `, ${reservation.children} children`}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            {reservation.room_types?.name}
                          </div>
                          {reservation.rooms?.number && (
                            <div className="text-sm text-muted-foreground">
                              Room {reservation.rooms.number}
                              {reservation.rooms.floor && ` (Floor ${reservation.rooms.floor})`}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getSourceBadge(reservation)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={reservation.status}
                            onValueChange={(status) => handleStatusChange(reservation.id, status)}
                          >
                            <SelectTrigger className="w-auto h-auto p-0 border-none bg-transparent">
                              <Badge className={getStatusColor(reservation.status)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(reservation.status)}
                                  <SelectValue />
                                </div>
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Confirmed">Confirmed</SelectItem>
                              <SelectItem value="Checked In">Checked In</SelectItem>
                              <SelectItem value="Checked Out">Checked Out</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      
                      <TableCell className="font-medium">
                        {reservation.total_price?.toLocaleString('en-US', {
                          style: 'currency',
                          currency: reservation.currency || 'USD'
                        })}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedReservation(reservation)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Reservation Details</DialogTitle>
                              </DialogHeader>
                              {selectedReservation && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold">Guest Information</h4>
                                      <p>{selectedReservation.guests?.first_name} {selectedReservation.guests?.last_name}</p>
                                      <p className="text-sm text-muted-foreground">{selectedReservation.guests?.email}</p>
                                      <p className="text-sm text-muted-foreground">{selectedReservation.guests?.phone}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">Stay Details</h4>
                                      <p>Check-in: {new Date(selectedReservation.check_in).toLocaleDateString()}</p>
                                      <p>Check-out: {new Date(selectedReservation.check_out).toLocaleDateString()}</p>
                                      <p>Guests: {selectedReservation.adults} adults, {selectedReservation.children} children</p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">Special Requests</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedReservation.special_requests?.join(', ') || 'None'}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button variant="outline" size="sm">
                            <Move className="h-4 w-4" />
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