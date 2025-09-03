import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Users, Building, DollarSign, Clock, Bell, Settings, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHMSStore } from '@/stores/hms-store';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { NotificationsModal } from './NotificationsModal';
import { ReservationDetailModal } from '@/components/reservations/ReservationDetailModal';
import { useHotel, useProductionData } from '@/hooks/use-production-data';

export const HMSDashboard = () => {
  const { selectedHotelId, selectedMonth, setSelectedMonth, applyAISuggestion } = useHMSStore();
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Fetch hotel and production data
  const { data: hotel } = useHotel(selectedHotelId || '');
  const { 
    reservations = [], 
    rooms = [], 
    hotels = [],
    loading,
    refreshData 
  } = useProductionData(selectedHotelId || undefined);

  // Generate mock occupancy data for display (can be replaced with real data later)
  const occupancyData = useMemo(() => {
    const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
    const data = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseOccupancy = isWeekend ? 0.75 : 0.6;
      const occupancyRate = Math.min(0.95, baseOccupancy + Math.random() * 0.3);
      const totalRooms = rooms.length || 50;
      const occupiedRooms = Math.floor(totalRooms * occupancyRate);
      const availableRooms = totalRooms - occupiedRooms;
      const baseADR = isWeekend ? 120 : 100;
      const adr = baseADR + (Math.random() * 40 - 20);
      
      data.push({
        date,
        day,
        specialDay: isWeekend ? "Weekend" : "",
        capacity: totalRooms,
        availableRooms,
        occupiedRooms,
        occupancyRate,
        adr: Math.round(adr * 100) / 100,
        totalRevenue: Math.round(occupiedRooms * adr * 100) / 100,
        arrivals: Math.floor(occupiedRooms * 0.3),
        departures: Math.floor(occupiedRooms * 0.25)
      });
    }
    
    return data;
  }, [selectedMonth, rooms]);

  // Calculate KPIs based on real hotel and reservation data
  const kpis = useMemo(() => {
    if (!hotel && reservations.length === 0) {
      return {
        totalRooms: rooms.length || 0,
        avgOccupancy: 0,
        avgADR: 0,
        revPAR: 0,
        totalRevenue: 0,
        totalArrivals: 0,
        totalDepartures: 0,
        availableRooms: rooms.length || 0,
        maintenanceIssues: 0,
        trends: {
          occupancy: 'up' as const,
          adr: 'up' as const,
          revenue: 'up' as const,
          revpar: 'up' as const
        }
      };
    }

    // Calculate metrics from real reservation data
    const totalRooms = rooms.length || 50;
    const currentDate = new Date();
    const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

    // Filter reservations for selected month
    const monthReservations = reservations.filter(res => {
      const checkIn = new Date(res.check_in);
      const checkOut = new Date(res.check_out);
      return (checkIn >= monthStart && checkIn <= monthEnd) || 
             (checkOut >= monthStart && checkOut <= monthEnd) ||
             (checkIn <= monthStart && checkOut >= monthEnd);
    });

    const totalRevenue = monthReservations.reduce((sum, res) => sum + (res.total_amount || 0), 0);
    const totalArrivals = monthReservations.filter(res => {
      const checkIn = new Date(res.check_in);
      return checkIn >= monthStart && checkIn <= monthEnd;
    }).length;
    
    const totalDepartures = monthReservations.filter(res => {
      const checkOut = new Date(res.check_out);
      return checkOut >= monthStart && checkOut <= monthEnd;
    }).length;

    // Simple occupancy calculation (can be improved)
    const occupancyRate = totalRooms > 0 ? Math.min(monthReservations.length / totalRooms, 1) : 0;
    const avgADR = monthReservations.length > 0 ? totalRevenue / monthReservations.length : 0;
    const revPAR = occupancyRate * avgADR;

    return {
      totalRooms,
      avgOccupancy: occupancyRate * 100,
      avgADR,
      revPAR,
      totalRevenue,
      totalArrivals,
      totalDepartures,
      availableRooms: Math.floor(totalRooms * (1 - occupancyRate)),
      maintenanceIssues: Math.floor(Math.random() * 5), // Mock for now
      trends: {
        occupancy: 'up' as const,
        adr: 'up' as const, 
        revenue: 'up' as const,
        revpar: 'up' as const
      }
    };
  }, [hotel, reservations, rooms, selectedMonth]);

  const handleMonthChange = (monthOffset: number) => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + monthOffset);
    setSelectedMonth(newMonth);
  };

  const getOccupancyColor = (rate: number) => {
    if (rate < 0.6) return 'bg-green-500';
    if (rate < 0.85) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // AI Suggestion: Apply suggested ADR for a day
  const handleAISuggestion = (date: Date) => {
    // Mock AI suggestion - increase ADR by 5-15% based on occupancy
    const suggestionFactor = kpis.avgOccupancy > 80 ? 1.15 : 1.08;
    const suggestedADR = Math.round(kpis.avgADR * suggestionFactor * 100) / 100;
    
    applyAISuggestion(date, suggestedADR);
    toast({ 
      title: 'AI Suggestion Applied', 
      description: `ADR updated to €${suggestedADR} for ${format(date, 'MMM dd')}` 
    });
  };

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' }) => 
    trend === 'up' ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;

  if (loading) return <div>Loading...</div>;
  if (!selectedHotelId) return <div className="flex items-center justify-center h-64 text-muted-foreground">Please select a hotel to view dashboard</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hotel Dashboard</h1>
          <p className="text-muted-foreground">{hotel?.name || 'Hotel'} - {format(selectedMonth, 'MMMM yyyy')}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/channel/ari')}>
            <Settings className="h-4 w-4 mr-2" />
            ARI Calendar
          </Button>
          <Button variant="outline" onClick={() => setShowNotifications(true)}>
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
        </div>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => handleMonthChange(-1)}>
              Previous Month
            </Button>
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5" />
              <span className="font-semibold">{format(selectedMonth, 'MMMM yyyy')}</span>
            </div>
            <Button variant="outline" onClick={() => handleMonthChange(1)}>
              Next Month
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-modern">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{kpis.totalRooms}</span>
              <Building className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold">{kpis.avgOccupancy.toFixed(1)}%</span>
                <TrendIcon trend={kpis.trends.occupancy} />
              </div>
              <Users className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg ADR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold">€{kpis.avgADR.toFixed(0)}</span>
                <TrendIcon trend={kpis.trends.adr} />
              </div>
              <DollarSign className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">RevPAR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold">€{kpis.revPAR.toFixed(0)}</span>
                <TrendIcon trend={kpis.trends.revpar} />
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue (MTD)</p>
                <p className="text-xl font-bold">€{kpis.totalRevenue.toLocaleString()}</p>
              </div>
              <TrendIcon trend={kpis.trends.revenue} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Arrivals (Next 3 Days)</p>
                <p className="text-xl font-bold">{kpis.totalArrivals}</p>
              </div>
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Departures (Next 3 Days)</p>
                <p className="text-xl font-bold">{kpis.totalDepartures}</p>
              </div>
              <Clock className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance Issues</p>
                <p className="text-xl font-bold">{kpis.maintenanceIssues}</p>
              </div>
              <Badge variant={kpis.maintenanceIssues > 3 ? "destructive" : "secondary"}>
                {kpis.maintenanceIssues > 3 ? "High" : "Normal"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Room Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Room Types</SelectItem>
                <SelectItem value="1">Standard Room</SelectItem>
                <SelectItem value="2">Deluxe Room</SelectItem>
                <SelectItem value="3">Suite</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="booking.com">Booking.com</SelectItem>
                <SelectItem value="expedia">Expedia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Daily Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Performance - {format(selectedMonth, 'MMMM yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Special Day</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Occupied</TableHead>
                  <TableHead>Occupancy %</TableHead>
                  <TableHead>ADR (€)</TableHead>
                  <TableHead>Revenue (€)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {occupancyData.map((day) => (
                  <TableRow key={day.date.toISOString()} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {format(day.date, 'MMM dd')}
                    </TableCell>
                    <TableCell>
                      {day.specialDay && (
                        <Badge variant="secondary">{day.specialDay}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{day.capacity}</TableCell>
                    <TableCell>{day.availableRooms}</TableCell>
                    <TableCell>{day.occupiedRooms}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getOccupancyColor(day.occupancyRate)}`} />
                        {(day.occupancyRate * 100).toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">€{day.adr.toFixed(0)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">€{day.totalRevenue.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            // Find a reservation for this date to show details
                            const reservation = reservations.find(res => 
                              day.date >= new Date(res.check_in) && day.date < new Date(res.check_out)
                            );
                            if (reservation) {
                              setSelectedReservationId(reservation.id);
                            } else {
                              toast({ 
                                title: "No reservations found",
                                description: `No active reservations for ${format(day.date, 'MMM dd')}`
                              });
                            }
                          }}
                        >
                          View Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAISuggestion(day.date)}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          AI Suggest
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Modal */}
      <NotificationsModal 
        open={showNotifications} 
        onOpenChange={setShowNotifications} 
      />

      {/* Reservation Details Modal */}
      {selectedReservationId && (
        <ReservationDetailModal
          reservation={reservations.find(r => r.id === selectedReservationId)}
          open={!!selectedReservationId}
          onClose={() => setSelectedReservationId(null)}
        />
      )}
    </motion.div>
  );
};