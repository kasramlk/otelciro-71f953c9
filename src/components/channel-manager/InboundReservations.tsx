import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Play,
  Eye,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InboundReservation {
  id: string;
  channel_reservation_id: string;
  reservation_id: string | null;
  guest_data: any;
  booking_data: any;
  processing_status: string;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
  raw_data: any;
  channel_connections: {
    channel_name: string;
    channel_type: string;
  };
  reservations?: {
    code: string;
    status: string;
  };
}

interface InboundReservationsProps {
  hotelId: string | null;
}

export function InboundReservations({ hotelId }: InboundReservationsProps) {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<InboundReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<InboundReservation | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (hotelId) {
      fetchReservations();
      // Set up real-time subscription
      const subscription = supabase
        .channel('inbound_reservations_changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'inbound_reservations',
            filter: `hotel_id=eq.${hotelId}`
          },
          () => {
            fetchReservations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [hotelId]);

  const fetchReservations = async () => {
    if (!hotelId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inbound_reservations')
        .select(`
          *,
          channel_connections!inner(channel_name, channel_type),
          reservations(code, status)
        `)
        .eq('hotel_id', hotelId)
        .order('received_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setReservations(data || []);

    } catch (error) {
      console.error('Error fetching inbound reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    return statusFilter === 'all' || reservation.processing_status === statusFilter;
  });

  const handleProcessReservation = async (reservationId: string) => {
    setProcessing(reservationId);
    try {
      const { error } = await supabase.functions.invoke('reservation-processor', {
        body: {
          channelId: reservations.find(r => r.id === reservationId)?.channel_connections,
          reservationId: reservations.find(r => r.id === reservationId)?.channel_reservation_id,
          action: 'create',
          data: reservations.find(r => r.id === reservationId)?.raw_data
        }
      });

      if (error) throw error;

      toast({
        title: "Processing Started",
        description: "Reservation processing has been initiated"
      });

    } catch (error) {
      console.error('Error processing reservation:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process reservation",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge variant="default" className="bg-success/10 text-success border-success/20">Processed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const showReservationDetails = (reservation: InboundReservation) => {
    setSelectedReservation(reservation);
    setShowDetails(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Inbound Reservations</CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchReservations}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Inbound Reservations</h3>
              <p className="text-muted-foreground">
                {reservations.length === 0 
                  ? "No reservations have been received from channels yet."
                  : "No reservations match your current filter."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(reservation.processing_status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-foreground">
                          {reservation.guest_data?.firstName || reservation.guest_data?.first_name} {' '}
                          {reservation.guest_data?.lastName || reservation.guest_data?.last_name}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {reservation.channel_connections.channel_name}
                        </Badge>
                        {reservation.reservations && (
                          <Badge variant="outline" className="text-xs">
                            HMS: {reservation.reservations.code}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Channel ID: {reservation.channel_reservation_id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {reservation.booking_data?.checkIn && reservation.booking_data?.checkOut && (
                          <>
                            {reservation.booking_data.checkIn} to {reservation.booking_data.checkOut}
                            {reservation.booking_data?.totalAmount && (
                              <span className="ml-2">• ${reservation.booking_data.totalAmount}</span>
                            )}
                          </>
                        )}
                      </p>
                      {reservation.error_message && (
                        <p className="text-sm text-destructive mt-1">
                          {reservation.error_message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-muted-foreground text-right">
                      <p>Received: {new Date(reservation.received_at).toLocaleDateString()}</p>
                      <p>{new Date(reservation.received_at).toLocaleTimeString()}</p>
                      {reservation.processed_at && (
                        <p className="text-xs">
                          Processed: {new Date(reservation.processed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(reservation.processing_status)}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => showReservationDetails(reservation)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {reservation.processing_status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProcessReservation(reservation.id)}
                          disabled={processing === reservation.id}
                        >
                          {processing === reservation.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reservation Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
          </DialogHeader>
          
          {selectedReservation && (
            <div className="space-y-6">
              {/* Guest Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Guest Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedReservation.guest_data?.firstName || selectedReservation.guest_data?.first_name} {' '}
                        {selectedReservation.guest_data?.lastName || selectedReservation.guest_data?.last_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedReservation.guest_data?.email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedReservation.guest_data?.phone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Nationality</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedReservation.guest_data?.nationality || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Check-in</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedReservation.booking_data?.checkIn || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Check-out</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedReservation.booking_data?.checkOut || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Adults</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedReservation.booking_data?.adults || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Children</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedReservation.booking_data?.children || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total Amount</Label>
                      <p className="text-sm text-muted-foreground">
                        ${selectedReservation.booking_data?.totalAmount || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Room Type</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedReservation.booking_data?.roomType || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Processing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Processing Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-4">
                    {getStatusIcon(selectedReservation.processing_status)}
                    {getStatusBadge(selectedReservation.processing_status)}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Channel</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedReservation.channel_connections.channel_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Channel Reservation ID</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedReservation.channel_reservation_id}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Received At</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedReservation.received_at).toLocaleString()}
                      </p>
                    </div>
                    {selectedReservation.processed_at && (
                      <div>
                        <Label className="text-sm font-medium">Processed At</Label>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedReservation.processed_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedReservation.error_message && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-destructive">Error Message</Label>
                      <p className="text-sm text-destructive">
                        {selectedReservation.error_message}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Label component for the details dialog
function Label({ className, children, ...props }: { className?: string; children: React.ReactNode }) {
  return (
    <label className={`text-sm font-medium text-foreground ${className || ''}`} {...props}>
      {children}
    </label>
  );
}