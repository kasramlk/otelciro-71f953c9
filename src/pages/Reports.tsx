import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Download, 
  Filter,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Bed,
  Activity,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { useProductionData } from "@/hooks/use-production-data";
import { Skeleton } from "@/components/ui/skeleton";
import { PerformanceMonitor } from "@/components/performance/PerformanceMonitor";
import { CacheManager } from "@/components/performance/CacheManager";
import { VirtualizedTable, ReservationsVirtualTable } from "@/components/performance/VirtualizedTable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// Mock data
const mockOccupancyData = [
  { date: "Jan 01", occupancy: 75, revenue: 12500 },
  { date: "Jan 02", occupancy: 80, revenue: 13200 },
  { date: "Jan 03", occupancy: 85, revenue: 14100 },
  { date: "Jan 04", occupancy: 90, revenue: 15000 },
  { date: "Jan 05", occupancy: 95, revenue: 15800 },
  { date: "Jan 06", occupancy: 88, revenue: 14600 },
  { date: "Jan 07", occupancy: 78, revenue: 13000 },
];

const mockSourceData = [
  { name: "Direct", value: 35, count: 42 },
  { name: "Booking.com", value: 25, count: 30 },
  { name: "Expedia", value: 20, count: 24 },
  { name: "Corporate", value: 15, count: 18 },
  { name: "Walk-in", value: 5, count: 6 },
];

const mockArrivals = [
  {
    id: "1",
    code: "RES001",
    guest: "John Doe",
    room: "101",
    source: "Direct",
    checkIn: new Date(),
    adults: 2,
    children: 0,
  },
  {
    id: "2",
    code: "RES002",
    guest: "Jane Smith",
    room: "102",
    source: "Booking.com",
    checkIn: new Date(),
    adults: 1,
    children: 1,
  },
  {
    id: "3",
    code: "RES003",
    guest: "Bob Johnson",
    room: "201",
    source: "Expedia",
    checkIn: new Date(),
    adults: 2,
    children: 0,
  },
];

const mockDepartures = [
  {
    id: "1",
    code: "RES010",
    guest: "Alice Wilson",
    room: "103",
    source: "Corporate",
    checkOut: new Date(),
    total: 450.00,
  },
  {
    id: "2",
    code: "RES011",
    guest: "Mike Brown",
    room: "202",
    source: "Direct",
    checkOut: new Date(),
    total: 380.00,
  },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Reports() {
  const [dateRange, setDateRange] = useState("last7days");
  const [hotelFilter, setHotelFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const { toast } = useToast();
  
  const { 
    hotels, 
    reservations, 
    analytics, 
    rooms,
    loading,
    error,
    refreshData 
  } = useProductionData();

  // Real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        refreshData();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loading, refreshData]);

  // Calculate real metrics from production data
  const currentMetrics = {
    occupancy: analytics?.avgOccupancyRate || 0,
    adr: analytics?.adr || 0,
    revpar: analytics?.revPAR || 0,
    totalRooms: rooms?.length || 0,
    occupiedRooms: Math.round((analytics?.avgOccupancyRate || 0) * (rooms?.length || 0) / 100),
    availableRooms: (rooms?.length || 0) - Math.round((analytics?.avgOccupancyRate || 0) * (rooms?.length || 0) / 100),
    revenue: analytics?.totalRevenue || 0,
  };

  // Transform real reservation data for charts
  const occupancyData = analytics?.occupancyData?.slice(-7).map((day, index) => ({
    date: format(new Date(day.date), 'MMM dd'),
    occupancy: Math.round(day.occupancyRate),
    revenue: day.totalRevenue
  })) || mockOccupancyData;

  // Calculate source distribution from real reservations
  const sourceDistribution = reservations?.reduce((acc: any, reservation: any) => {
    const source = reservation.source || 'Direct';
    if (!acc[source]) {
      acc[source] = { name: source, count: 0, value: 0 };
    }
    acc[source].count++;
    return acc;
  }, {});

  const sourceData = sourceDistribution ? Object.values(sourceDistribution).map((source: any) => ({
    ...source,
    value: Math.round((source.count / reservations.length) * 100)
  })) : mockSourceData;

  // Get today's arrivals and departures from real data
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayArrivals = reservations?.filter((res: any) => 
    res.check_in === today && res.status === 'confirmed'
  ).map((res: any) => ({
    id: res.id,
    code: res.code,
    guest: res.guest_name || `${res.first_name} ${res.last_name}`,
    room: res.room_number || 'TBD',
    source: res.source || 'Direct',
    checkIn: new Date(res.check_in + 'T' + (res.arrival_time || '15:00')),
    adults: res.adults,
    children: res.children
  })) || mockArrivals;

  const todayDepartures = reservations?.filter((res: any) => 
    res.check_out === today && res.status === 'confirmed'
  ).map((res: any) => ({
    id: res.id,
    code: res.code,
    guest: res.guest_name || `${res.first_name} ${res.last_name}`,
    room: res.room_number || 'TBD',
    source: res.source || 'Direct',
    checkOut: new Date(res.check_out + 'T12:00'),
    total: res.total_amount || 0
  })) || mockDepartures;

  const handleExport = (format: 'csv' | 'pdf') => {
    toast({
      title: "Export started",
      description: `Reports are being exported as ${format.toUpperCase()}. Download will start shortly.`,
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight flex items-center">
          <BarChart3 className="mr-2 h-8 w-8" />
          Reports & Analytics
        </h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => refreshData()}
              disabled={loading}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
              </SelectContent>
            </Select>

            <Select value={hotelFilter} onValueChange={setHotelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Hotel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hotels</SelectItem>
                {hotels?.map((hotel: any) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Room Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Room Types</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="deluxe">Deluxe</SelectItem>
                <SelectItem value="suite">Suite</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="booking">Booking.com</SelectItem>
                <SelectItem value="expedia">Expedia</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Bed className="mr-2 h-4 w-4" />
              Occupancy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{currentMetrics.occupancy.toFixed(1)}%</div>
            )}
            <div className="text-xs text-muted-foreground">
              {currentMetrics.occupiedRooms} of {currentMetrics.totalRooms} rooms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              ADR
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">${currentMetrics.adr.toFixed(0)}</div>
            )}
            <div className="text-xs text-muted-foreground">Average Daily Rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              RevPAR
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">${currentMetrics.revpar.toFixed(0)}</div>
            )}
            <div className="text-xs text-muted-foreground">Revenue per Available Room</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">${currentMetrics.revenue.toLocaleString()}</div>
            )}
            <div className="text-xs text-muted-foreground">Today's Revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Data */}
      <Tabs defaultValue="occupancy" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="arrivals">Arrivals</TabsTrigger>
          <TabsTrigger value="departures">Departures</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="occupancy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Occupancy & Revenue Trend</CardTitle>
              <CardDescription>Daily occupancy percentage and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="right" dataKey="revenue" fill="#8884d8" />
                    <Line yAxisId="left" type="monotone" dataKey="occupancy" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Source Distribution</CardTitle>
                <CardDescription>Reservations by booking source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Source Performance</CardTitle>
                <CardDescription>Detailed breakdown by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sourceData.map((source, index) => (
                    <div key={source.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{source.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{source.count} bookings</div>
                        <div className="text-sm text-muted-foreground">{source.value}% share</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="arrivals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Today's Arrivals
              </CardTitle>
              <CardDescription>
                {todayArrivals.length} guests checking in today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reservation</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Check-in Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayArrivals.map((arrival) => (
                    <TableRow key={arrival.id}>
                      <TableCell>
                        <Badge variant="outline">{arrival.code}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{arrival.guest}</TableCell>
                      <TableCell>Room {arrival.room}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{arrival.source}</Badge>
                      </TableCell>
                      <TableCell>
                        {arrival.adults} adults{arrival.children > 0 && `, ${arrival.children} children`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {format(arrival.checkIn, "HH:mm")}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="departures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Today's Departures
              </CardTitle>
              <CardDescription>
                {todayDepartures.length} guests checking out today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reservation</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Check-out Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayDepartures.map((departure) => (
                    <TableRow key={departure.id}>
                      <TableCell>
                        <Badge variant="outline">{departure.code}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{departure.guest}</TableCell>
                      <TableCell>Room {departure.room}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{departure.source}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">${departure.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {format(departure.checkOut, "HH:mm")}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Performance</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.5%</div>
                <p className="text-xs text-muted-foreground">Uptime this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">245ms</div>
                <p className="text-xs text-muted-foreground">Average response time</p>
              </CardContent>
            </Card>
          </div>

          <PerformanceMonitor />
          
          <Card>
            <CardHeader>
              <CardTitle>Virtualized Reservations Table</CardTitle>
              <CardDescription>
                High-performance table for large datasets with real-time search and sorting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReservationsVirtualTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <CacheManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}