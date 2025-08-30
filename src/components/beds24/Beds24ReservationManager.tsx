import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Upload, Download, Calendar, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReservationManagerProps {
  connectionId: string;
  hotelId: string;
}

export function Beds24ReservationManager({ connectionId, hotelId }: ReservationManagerProps) {
  const [beds24Bookings, setBeds24Bookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('new');
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const { toast } = useToast();

  useEffect(() => {
    loadBeds24Bookings();
  }, [connectionId]);

  const loadBeds24Bookings = async () => {
    try {
      const { data: bookingsData } = await supabase
        .from('beds24_bookings')
        .select(`
          *,
          beds24_properties(property_name),
          hotels(name)
        `)
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false })
        .limit(50);

      setBeds24Bookings(bookingsData || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings from Beds24",
        variant: "destructive",
      });
    }
  };

  const handlePullReservations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('beds24-reservations-pull', {
        body: {
          connectionId,
          filter,
          arrivalFrom: dateRange.from,
          arrivalTo: dateRange.to,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Pulled ${data.data?.new_reservations || 0} new reservations and updated ${data.data?.updated_reservations || 0} existing ones`,
      });

      loadBeds24Bookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to pull reservations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePushReservation = async (sampleReservation: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('beds24-reservations-push', {
        body: {
          connectionId,
          reservations: [sampleReservation],
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully pushed ${data.data?.successful_pushes || 0} reservations`,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to push reservation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'request':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Beds24 Reservation Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{beds24Bookings.length}</div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {beds24Bookings.filter(b => b.status === 'confirmed').length}
                </div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {beds24Bookings.filter(b => b.status === 'request').length}
                </div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pull" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pull">Pull Reservations</TabsTrigger>
          <TabsTrigger value="bookings">Beds24 Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="pull" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pull Reservations from Beds24</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Filter Type</Label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="new">New Bookings</option>
                    <option value="arrivals">Today's Arrivals</option>
                    <option value="departures">Today's Departures</option>
                    <option value="current">Currently Staying</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handlePullReservations}
                disabled={loading}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {loading ? 'Pulling Reservations...' : 'Pull Reservations'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Beds24 Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {beds24Bookings.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No bookings found. Pull reservations from Beds24 to populate this list.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-2 max-h-96 overflow-y-auto">
                    {beds24Bookings.map((booking) => (
                      <div key={booking.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {booking.guest_info?.firstName} {booking.guest_info?.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {booking.beds24_properties?.property_name}
                            </div>
                            <div className="text-sm">
                              {booking.arrival} → {booking.departure} | {booking.num_adult} adults
                              {booking.num_child > 0 && `, ${booking.num_child} children`}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={getStatusBadgeVariant(booking.status)}>
                              {booking.status}
                            </Badge>
                            <div className="text-sm text-muted-foreground mt-1">
                              Beds24 ID: {booking.beds24_booking_id}
                            </div>
                          </div>
                        </div>
                        
                        {booking.guest_info?.email && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Email: {booking.guest_info.email}
                          </div>
                        )}
                        
                        {booking.amounts?.balance && (
                          <div className="mt-2 text-sm">
                            Balance: ${booking.amounts.balance}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}