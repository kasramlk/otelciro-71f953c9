import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  User,
  DollarSign,
  Clock,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChannelReservation {
  id: string;
  channel_name: string;
  channel_reservation_id: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  room_type: string;
  total_amount?: number;
  currency: string;
  commission_rate?: number;
  commission_amount?: number;
  status: string;
  special_requests?: string;
  imported_at: string;
  sync_status: string;
  pms_reservation_id?: string;
}

interface Channel {
  id: string;
  channel_name: string;
  is_active: boolean;
}

export const ChannelReservations: React.FC = () => {
  const [reservations, setReservations] = useState<ChannelReservation[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<ChannelReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchChannels();
    fetchReservations();
  }, [selectedChannel, selectedStatus]);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('id, channel_name, is_active')
        .eq('is_active', true);

      if (error) throw error;
      setChannels(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch channels",
        variant: "destructive"
      });
    }
  };

  const fetchReservations = async () => {
    try {
      let query = supabase
        .from('channel_reservations')
        .select(`
          *,
          channels (channel_name)
        `)
        .order('imported_at', { ascending: false });

      if (selectedChannel !== 'all') {
        query = query.eq('channel_id', selectedChannel);
      }

      if (selectedStatus !== 'all') {
        query = query.eq('sync_status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedReservations = data?.map(reservation => ({
        ...reservation,
        channel_name: reservation.channels?.channel_name || 'Unknown'
      })) || [];

      setReservations(formattedReservations);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch reservations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pullReservations = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('channel-reservations-pull', {
        body: {
          channel_id: selectedChannel === 'all' ? null : selectedChannel
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reservation sync initiated"
      });

      // Refresh data after a short delay
      setTimeout(fetchReservations, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to pull reservations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const syncToIMS = async (reservationId: string) => {
    try {
      // This would create a reservation in the main PMS system
      const { error } = await supabase
        .from('channel_reservations')
        .update({ sync_status: 'syncing' })
        .eq('id', reservationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reservation sync to PMS initiated"
      });

      fetchReservations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sync reservation",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge variant="default">Synced</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'conflict':
        return <Badge variant="destructive">Conflict</Badge>;
      case 'syncing':
        return <Badge variant="outline">Syncing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReservationStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'modified':
        return <Badge variant="secondary">Modified</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Channel Reservations</h2>
          <p className="text-muted-foreground">
            View and manage reservations from all connected channels
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchReservations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={pullReservations} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Pull Reservations
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Channel</label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.channel_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Sync Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="synced">Synced</SelectItem>
                  <SelectItem value="conflict">Conflict</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reservations</p>
                <p className="text-2xl font-bold">{reservations.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Synced</p>
                <p className="text-2xl font-bold text-green-600">
                  {reservations.filter(r => r.sync_status === 'synced').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {reservations.filter(r => r.sync_status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conflicts</p>
                <p className="text-2xl font-bold text-red-600">
                  {reservations.filter(r => r.sync_status === 'conflict').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reservations List */}
      <Card>
        <CardHeader>
          <CardTitle>Reservations</CardTitle>
          <CardDescription>
            Channel reservations and their synchronization status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading reservations...</div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Reservations Found</h3>
              <p className="text-muted-foreground">
                No reservations found for the selected filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <Card key={reservation.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium">{reservation.guest_name}</h3>
                          <Badge variant="outline">{reservation.channel_name}</Badge>
                          {getReservationStatusBadge(reservation.status)}
                          {getStatusBadge(reservation.sync_status)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedReservation(reservation)}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>Reservation Details</DialogTitle>
                                <DialogDescription>
                                  {reservation.channel_reservation_id}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedReservation && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Guest</label>
                                      <p>{selectedReservation.guest_name}</p>
                                      {selectedReservation.guest_email && (
                                        <p className="text-sm text-muted-foreground">
                                          {selectedReservation.guest_email}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Contact</label>
                                      <p>{selectedReservation.guest_phone || 'N/A'}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Check-in</label>
                                      <p>{format(new Date(selectedReservation.check_in), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Check-out</label>
                                      <p>{format(new Date(selectedReservation.check_out), 'MMM dd, yyyy')}</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Adults</label>
                                      <p>{selectedReservation.adults}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Children</label>
                                      <p>{selectedReservation.children}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Room Type</label>
                                      <p>{selectedReservation.room_type}</p>
                                    </div>
                                  </div>

                                  {selectedReservation.total_amount && (
                                    <div>
                                      <label className="text-sm font-medium">Total Amount</label>
                                      <p>
                                        {selectedReservation.currency} {selectedReservation.total_amount.toFixed(2)}
                                        {selectedReservation.commission_amount && (
                                          <span className="text-sm text-muted-foreground ml-2">
                                            (Commission: {selectedReservation.currency} {selectedReservation.commission_amount.toFixed(2)})
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  )}

                                  {selectedReservation.special_requests && (
                                    <div>
                                      <label className="text-sm font-medium">Special Requests</label>
                                      <p className="text-sm">{selectedReservation.special_requests}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          {reservation.sync_status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => syncToIMS(reservation.id)}
                            >
                              Sync to PMS
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Check-in</p>
                          <p>{format(new Date(reservation.check_in), 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Check-out</p>
                          <p>{format(new Date(reservation.check_out), 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Nights</p>
                          <p>{calculateNights(reservation.check_in, reservation.check_out)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Guests</p>
                          <p>{reservation.adults + reservation.children} guests</p>
                        </div>
                      </div>

                      {/* Room and Amount */}
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Room Type</p>
                          <p>{reservation.room_type}</p>
                        </div>
                        {reservation.total_amount && (
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="font-medium">
                              {reservation.currency} {reservation.total_amount.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};