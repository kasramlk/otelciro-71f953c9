import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Building2,
  Users,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

const AgencyReports = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date()
  });
  const [reportType, setReportType] = useState("booking-trends");

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['agency-reports', dateRange, reportType],
    queryFn: async () => {
      // Fetch comprehensive booking data for reports
      const { data: bookings, error } = await supabase
        .from('reservations')
        .select(`
          *,
          hotels (name, city, country),
          room_types (name),
          guests (first_name, last_name)
        `)
        .not('agency_id', 'is', null)
        .gte('created_at', dateRange?.from?.toISOString())
        .lte('created_at', dateRange?.to?.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return bookings;
    },
    enabled: !!dateRange?.from && !!dateRange?.to
  });

  // Process data for different chart types
  const processBookingTrends = () => {
    if (!reportData) return [];
    
    const dailyBookings = reportData.reduce((acc: any, booking) => {
      const date = new Date(booking.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(dailyBookings).map(([date, count]) => ({
      date,
      bookings: count,
      revenue: reportData
        .filter(b => new Date(b.created_at).toLocaleDateString() === date)
        .reduce((sum, b) => sum + (b.total_price || 0), 0)
    }));
  };

  const processTopDestinations = () => {
    if (!reportData) return [];
    
    const destinations = reportData.reduce((acc: any, booking) => {
      const city = `${booking.hotels?.city}, ${booking.hotels?.country}`;
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(destinations)
      .map(([city, count]) => ({ city, bookings: count }))
      .sort((a: any, b: any) => b.bookings - a.bookings)
      .slice(0, 8);
  };

  const processRevenueBreakdown = () => {
    if (!reportData) return [];
    
    const revenue = reportData.reduce((acc: any, booking) => {
      const hotel = booking.hotels?.name || 'Unknown';
      acc[hotel] = (acc[hotel] || 0) + (booking.total_price || 0);
      return acc;
    }, {});

    return Object.entries(revenue)
      .map(([hotel, amount]) => ({ hotel, revenue: amount }))
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 6);
  };

  const processBookingStatus = () => {
    if (!reportData) return [];
    
    const status = reportData.reduce((acc: any, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(status).map(([status, count]) => ({ 
      status, 
      count,
      percentage: Math.round((count as number) / reportData.length * 100)
    }));
  };

  const bookingTrends = processBookingTrends();
  const topDestinations = processTopDestinations();
  const revenueBreakdown = processRevenueBreakdown();
  const bookingStatus = processBookingStatus();

  const COLORS = ['#003580', '#009fe3', '#feba02', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];

  const stats = [
    { 
      title: "Total Bookings", 
      value: reportData?.length || 0, 
      change: "+12%", 
      icon: Calendar,
      color: "text-primary" 
    },
    { 
      title: "Total Revenue", 
      value: reportData?.reduce((acc, b) => acc + (b.total_price || 0), 0)?.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      }) || "$0", 
      change: "+15%", 
      icon: DollarSign,
      color: "text-green-600" 
    },
    { 
      title: "Unique Hotels", 
      value: new Set(reportData?.map(b => b.hotels?.name)).size || 0, 
      change: "+8%", 
      icon: Building2,
      color: "text-secondary" 
    },
    { 
      title: "Avg. Booking Value", 
      value: reportData?.length ? 
        (reportData.reduce((acc, b) => acc + (b.total_price || 0), 0) / reportData.length).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD'
        }) : "$0", 
      change: "+3%", 
      icon: TrendingUp,
      color: "text-accent" 
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your booking performance</p>
        </div>
        
        <div className="flex gap-3">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
            className="w-[260px]"
          />
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
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
                    <span className="text-sm text-green-600">{stat.change}</span>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends" className="gap-2">
            <LineChartIcon className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="destinations" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Destinations
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="status" className="gap-2">
            <Filter className="h-4 w-4" />
            Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Booking Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={bookingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="bookings" 
                    stackId="1"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stackId="2"
                    stroke="hsl(var(--secondary))" 
                    fill="hsl(var(--secondary))"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="destinations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Top Destinations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topDestinations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Revenue by Hotel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                      label={({ hotel, percent }) => `${hotel} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {revenueBreakdown.map((item, index) => (
                  <div key={item.hotel} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{item.hotel}</span>
                    </div>
                    <span className="font-bold">
                      {item.revenue?.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      })}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Booking Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={bookingStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ status, percentage }) => `${status} (${percentage}%)`}
                  >
                    {bookingStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgencyReports;