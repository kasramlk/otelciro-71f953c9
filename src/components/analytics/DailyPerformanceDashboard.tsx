import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CalendarDays, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Percent, 
  Building2,
  Clock
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, startOfDay } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface DailyPerformanceDashboardProps {
  dateRange?: DateRange;
  selectedHotel: string;
}

export const DailyPerformanceDashboard = ({ dateRange, selectedHotel }: DailyPerformanceDashboardProps) => {
  // Today's performance metrics
  const { data: todayMetrics } = useQuery({
    queryKey: ["todayMetrics", selectedHotel],
    queryFn: async () => {
      // Using mock data for today's performance since relations need setup
      const mockTodayMetrics = {
        totalReservations: 18,
        totalRevenue: 7200,
        avgDailyRate: 400,
        reservations: [
          {
            id: '1',
            guests: { first_name: 'John', last_name: 'Smith' },
            check_in: new Date().toISOString(),
            check_out: new Date(Date.now() + 86400000 * 3).toISOString(),
            source: 'Direct',
            balance_due: 450
          },
          {
            id: '2', 
            guests: { first_name: 'Sarah', last_name: 'Johnson' },
            check_in: new Date().toISOString(),
            check_out: new Date(Date.now() + 86400000 * 2).toISOString(),
            source: 'Booking.com',
            balance_due: 320
          },
          {
            id: '3',
            guests: { first_name: 'Michael', last_name: 'Brown' },
            check_in: new Date().toISOString(), 
            check_out: new Date(Date.now() + 86400000 * 4).toISOString(),
            source: 'Expedia',
            balance_due: 380
          }
        ],
        bySource: {
          'Direct': { count: 8, revenue: 3600 },
          'Booking.com': { count: 6, revenue: 1920 },
          'Expedia': { count: 4, revenue: 1680 }
        }
      };

      return mockTodayMetrics;
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
  });

  // Performance trend data
  const { data: trendData } = useQuery({
    queryKey: ["performanceTrend", dateRange, selectedHotel],
    queryFn: async () => {
      // Using mock trend data for demo
      const mockTrendData = [
        { date: '2024-01-15', reservations: 12, revenue: 4800 },
        { date: '2024-01-16', reservations: 15, revenue: 6000 },
        { date: '2024-01-17', reservations: 18, revenue: 7200 },
        { date: '2024-01-18', reservations: 14, revenue: 5600 },
        { date: '2024-01-19', reservations: 20, revenue: 8000 },
        { date: '2024-01-20', reservations: 16, revenue: 6400 },
        { date: '2024-01-21', reservations: 22, revenue: 8800 }
      ];

      return mockTrendData;
    },
  });

  const kpiCards = [
    {
      title: "Today's Reservations",
      value: todayMetrics?.totalReservations || 0,
      icon: CalendarDays,
      change: "+12%",
      changeType: "positive" as const,
      color: "primary"
    },
    {
      title: "Today's Revenue",
      value: `$${todayMetrics?.totalRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      change: "+8.2%",
      changeType: "positive" as const,
      color: "secondary"
    },
    {
      title: "Average Daily Rate",
      value: `$${todayMetrics?.avgDailyRate?.toFixed(0) || 0}`,
      icon: TrendingUp,
      change: "+5.1%",
      changeType: "positive" as const,
      color: "accent"
    },
    {
      title: "Occupancy Rate",
      value: "87.5%",
      icon: Percent,
      change: "+3.2%",
      changeType: "positive" as const,
      color: "neutral"
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="card-modern card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant={kpi.changeType === 'positive' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {kpi.change}
                      </Badge>
                      <span className="text-xs text-muted-foreground">vs yesterday</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    kpi.color === 'primary' ? 'bg-gradient-primary' :
                    kpi.color === 'secondary' ? 'bg-gradient-secondary' :
                    kpi.color === 'accent' ? 'bg-gradient-accent' :
                    'bg-muted'
                  }`}>
                    <kpi.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Reservations Trend */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Reservations Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar
                    dataKey="reservations"
                    fill="hsl(var(--secondary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Reservations Table */}
      <Card className="card-modern">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Reservations
            </CardTitle>
            <Badge variant="secondary">
              {todayMetrics?.totalReservations || 0} reservations
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest Name</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Room Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayMetrics?.reservations?.slice(0, 10).map((reservation, index) => (
                <TableRow key={reservation.id}>
                  <TableCell className="font-medium">
                    {reservation.guests?.first_name} {reservation.guests?.last_name}
                  </TableCell>
                  <TableCell>
                    {format(new Date(reservation.check_in), 'MMM dd')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(reservation.check_out), 'MMM dd')}
                  </TableCell>
                   <TableCell>
                     <Badge variant="outline">
                       {reservation.source || 'Direct'}
                     </Badge>
                   </TableCell>
                  <TableCell>Standard</TableCell>
                  <TableCell className="text-right font-medium">
                    ${reservation.balance_due?.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Source Breakdown */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Today's Bookings by Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(todayMetrics?.bySource || {}).map(([source, data]) => (
              <div key={source} className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">{source}</span>
                  <Badge variant="secondary">{data.count}</Badge>
                </div>
                <p className="text-2xl font-bold text-foreground">${data.revenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  Avg: ${data.count > 0 ? (data.revenue / data.count).toFixed(0) : 0}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};