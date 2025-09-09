import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Building, Clock, 
  Target, Zap, Brain, Eye, Filter, Download 
} from 'lucide-react';
import { useHotelContext } from '@/hooks/use-hotel-context';
import { useProductionData } from '@/hooks/use-production-data';
import { format, subDays, subMonths } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];
const CHART_COLORS = {
  revenue: 'hsl(var(--primary))',
  occupancy: 'hsl(var(--secondary))',
  adr: 'hsl(var(--accent))',
  revpar: 'hsl(var(--primary))',
  bookings: 'hsl(var(--secondary))',
  cancellations: 'hsl(var(--destructive))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))'
};

interface MetricCard {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

export const AdvancedAnalyticsDashboard = () => {
  const { selectedHotelId, selectedHotel } = useHotelContext();
  const [timeRange, setTimeRange] = useState('30d');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'occupancy', 'adr']);
  
  const { reservations = [], rooms = [] } = useProductionData(selectedHotelId || undefined);

  // Generate time series data based on reservations
  const timeSeriesData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayReservations = reservations.filter(res => {
        const checkIn = new Date(res.check_in);
        const checkOut = new Date(res.check_out);
        return date >= checkIn && date < checkOut;
      });

      const totalRevenue = dayReservations.reduce((sum, res) => sum + (res.total_amount || 0), 0);
      const occupancyRate = dayReservations.length / (rooms.length || 1);
      const adr = dayReservations.length > 0 ? totalRevenue / dayReservations.length : 0;
      
      data.push({
        date: format(date, 'MMM dd'),
        fullDate: date,
        revenue: Math.round(totalRevenue),
        occupancy: Math.round(occupancyRate * 100),
        adr: Math.round(adr),
        revpar: Math.round(occupancyRate * adr),
        bookings: dayReservations.length,
        cancellations: Math.floor(Math.random() * 5), // Mock data
        avgStay: 2.3 + Math.random() * 2,
        satisfaction: 4.2 + Math.random() * 0.6
      });
    }
    
    return data;
  }, [reservations, rooms, timeRange]);

  // Channel distribution data
  const channelData = useMemo(() => {
    const channels = ['Direct', 'Booking.com', 'Expedia', 'Airbnb', 'Agoda'];
    return channels.map(channel => ({
      name: channel,
      value: Math.floor(Math.random() * 100) + 20,
      percentage: Math.floor(Math.random() * 30) + 10
    }));
  }, []);

  // Performance metrics
  const metrics: MetricCard[] = useMemo(() => {
    const totalRevenue = timeSeriesData.reduce((sum, day) => sum + day.revenue, 0);
    const avgOccupancy = timeSeriesData.reduce((sum, day) => sum + day.occupancy, 0) / timeSeriesData.length;
    const avgADR = timeSeriesData.reduce((sum, day) => sum + day.adr, 0) / timeSeriesData.length;
    const totalBookings = timeSeriesData.reduce((sum, day) => sum + day.bookings, 0);

    return [
      {
        title: 'Total Revenue',
        value: `€${totalRevenue.toLocaleString()}`,
        change: 12.5,
        trend: 'up',
        icon: <DollarSign className="h-5 w-5" />,
        color: 'text-primary'
      },
      {
        title: 'Avg Occupancy',
        value: `${avgOccupancy.toFixed(1)}%`,
        change: 8.2,
        trend: 'up',
        icon: <Building className="h-5 w-5" />,
        color: 'text-secondary'
      },
      {
        title: 'Avg ADR',
        value: `€${avgADR.toFixed(0)}`,
        change: -3.1,
        trend: 'down',
        icon: <Target className="h-5 w-5" />,
        color: 'text-accent'
      },
      {
        title: 'Total Bookings',
        value: totalBookings.toString(),
        change: 15.7,
        trend: 'up',
        icon: <Users className="h-5 w-5" />,
        color: 'text-muted-foreground'
      }
    ];
  }, [timeSeriesData]);

  // Guest satisfaction radar data
  const satisfactionData = [
    { subject: 'Cleanliness', A: 95, B: 88, fullMark: 100 },
    { subject: 'Service', A: 92, B: 85, fullMark: 100 },
    { subject: 'Location', A: 88, B: 90, fullMark: 100 },
    { subject: 'Value', A: 85, B: 82, fullMark: 100 },
    { subject: 'Amenities', A: 90, B: 87, fullMark: 100 },
    { subject: 'WiFi', A: 93, B: 89, fullMark: 100 }
  ];

  if (!selectedHotelId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Please select a hotel to view analytics
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            {selectedHotel?.name} - Comprehensive Performance Insights
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => setCompareMode(!compareMode)}>
            <Eye className="h-4 w-4 mr-2" />
            {compareMode ? 'Exit Compare' : 'Compare'}
          </Button>
          
          <Button variant="default" className="button-glow">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="card-modern card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <div className="flex items-center gap-1">
                      {metric.trend === 'up' ? 
                        <TrendingUp className="h-4 w-4 text-success" /> : 
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      }
                      <span className={`text-sm ${metric.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                        {Math.abs(metric.change)}%
                      </span>
                    </div>
                  </div>
                  <div className={`${metric.color} opacity-20`}>
                    {metric.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="guests">Guests</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Multi-metric Chart */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Performance Trends - {timeRange}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke={CHART_COLORS.revenue}
                    strokeWidth={3}
                    dot={{ fill: CHART_COLORS.revenue, r: 4 }}
                    name="Revenue (€)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="occupancy" 
                    stroke={CHART_COLORS.occupancy}
                    strokeWidth={3}
                    dot={{ fill: CHART_COLORS.occupancy, r: 4 }}
                    name="Occupancy (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Booking Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Booking Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Guest Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={satisfactionData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Current Period"
                      dataKey="A"
                      stroke={CHART_COLORS.revenue}
                      fill={CHART_COLORS.revenue}
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Previous Period"
                      dataKey="B"
                      stroke={CHART_COLORS.secondary}
                      fill={CHART_COLORS.secondary}
                      fillOpacity={0.3}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Analysis */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke={CHART_COLORS.revenue}
                    fill={CHART_COLORS.revenue}
                    fillOpacity={0.8}
                    name="Total Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="revpar"
                    stackId="2"
                    stroke={CHART_COLORS.revpar}
                    fill={CHART_COLORS.revpar}
                    fillOpacity={0.6}
                    name="RevPAR"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guests" className="space-y-6">
          {/* Guest Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Booking vs Cancellation</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookings" fill={CHART_COLORS.bookings} name="Bookings" />
                    <Bar dataKey="cancellations" fill={CHART_COLORS.cancellations} name="Cancellations" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Satisfaction Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[3, 5]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="satisfaction" 
                      stroke={CHART_COLORS.accent}
                      strokeWidth={3}
                      name="Avg Rating"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Forecasting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">AI Forecasting Engine</p>
                <p>Advanced predictive analytics coming soon</p>
                <Button variant="outline" className="mt-4">
                  <Brain className="h-4 w-4 mr-2" />
                  Configure AI Models
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};