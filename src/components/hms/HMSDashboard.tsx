import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Users, Building, DollarSign, Clock, Bell, Settings, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHMSStore } from '@/stores/hms-store';
import { HOTEL_CONFIG, ROOM_TYPES } from '@/lib/mock-data';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { NotificationsModal } from './NotificationsModal';

export const HMSDashboard = () => {
  const { occupancyData, selectedMonth, setSelectedMonth, refreshOccupancyData, applyAISuggestion } = useHMSStore();
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Calculate KPIs for selected month
  const kpis = useMemo(() => {
    const monthData = occupancyData.filter(data => 
      data.date.getMonth() === selectedMonth.getMonth() &&
      data.date.getFullYear() === selectedMonth.getFullYear()
    );

    if (monthData.length === 0) return null;

    const totalRevenue = monthData.reduce((sum, day) => sum + day.totalRevenue, 0);
    const avgOccupancy = monthData.reduce((sum, day) => sum + day.occupancyRate, 0) / monthData.length;
    const avgADR = monthData.reduce((sum, day) => sum + day.adr, 0) / monthData.length;
    const revPAR = avgOccupancy * avgADR;
    const totalArrivals = monthData.reduce((sum, day) => sum + day.arrivals, 0);
    const totalDepartures = monthData.reduce((sum, day) => sum + day.departures, 0);

    // Calculate trends (mock - compare with previous month)
    const trends = {
      occupancy: Math.random() > 0.5 ? 'up' as const : 'down' as const,
      adr: Math.random() > 0.5 ? 'up' as const : 'down' as const,
      revenue: Math.random() > 0.5 ? 'up' as const : 'down' as const,
      revpar: Math.random() > 0.5 ? 'up' as const : 'down' as const
    };

    return {
      totalRooms: HOTEL_CONFIG.totalRooms,
      avgOccupancy: avgOccupancy * 100,
      avgADR: avgADR,
      revPAR: revPAR,
      totalRevenue,
      totalArrivals,
      totalDepartures,
      availableRooms: Math.floor(HOTEL_CONFIG.totalRooms * (1 - avgOccupancy)),
      maintenanceIssues: Math.floor(Math.random() * 5),
      trends
    };
  }, [occupancyData, selectedMonth]);

  const handleMonthChange = (monthOffset: number) => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + monthOffset);
    setSelectedMonth(newMonth);
    refreshOccupancyData(newMonth.getMonth() + 1, newMonth.getFullYear());
  };

  const getOccupancyColor = (rate: number) => {
    if (rate < 0.6) return 'bg-green-500';
    if (rate < 0.85) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // AI Suggestion: Apply suggested ADR for a day
  const handleAISuggestion = (date: Date) => {
    const currentDayData = occupancyData.find(d => d.date.toDateString() === date.toDateString());
    if (!currentDayData) return;

    // Mock AI suggestion - increase ADR by 5-15% based on occupancy
    const suggestionFactor = currentDayData.occupancyRate > 0.8 ? 1.15 : 1.08;
    const suggestedADR = Math.round(currentDayData.adr * suggestionFactor * 100) / 100;
    
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

  if (!kpis) return <div>Loading...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">HMS Dashboard</h1>
          <p className="text-muted-foreground">
            {HOTEL_CONFIG.name} - {format(selectedMonth, 'MMMM yyyy')}
          </p>
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
                {ROOM_TYPES.map(type => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
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
                {occupancyData
                  .filter(data => 
                    data.date.getMonth() === selectedMonth.getMonth() &&
                    data.date.getFullYear() === selectedMonth.getFullYear()
                  )
                  .map((day) => (
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
                          <Button variant="ghost" size="sm">
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
    </motion.div>
  );
};