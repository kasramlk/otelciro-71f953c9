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
  Clock,
  CalendarPlus
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, startOfDay } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useState } from "react";
import { useDailyPerformance } from "@/hooks/use-daily-performance";
import { useDailyBookingsCreated } from "@/hooks/use-daily-bookings-created";
import { useDailyReservations } from "@/hooks/use-daily-reservations";
import { DailyReservationsModal } from "./DailyReservationsModal";

interface DailyPerformanceDashboardProps {
  dateRange?: DateRange;
  selectedHotel: string;
}

export const DailyPerformanceDashboard = ({ dateRange, selectedHotel }: DailyPerformanceDashboardProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Get today's performance metrics with real-time data
  const { data: todayMetrics, isLoading } = useDailyPerformance(selectedHotel, new Date());
  
  // Get reservations for selected date when modal is opened  
  const { data: selectedDateReservations, isLoading: isLoadingSelectedDate, error: selectedDateError } = useDailyReservations(
    selectedHotel, 
    selectedDate || new Date(),
    { enabled: !!selectedDate && !!selectedHotel } // Only run when we have both hotel and selected date
  );
  
  console.log('🔍 Dashboard Debug:', {
    selectedDate: selectedDate?.toISOString(),
    hasSelectedDate: !!selectedDate,
    selectedDateReservations,
    isLoadingSelectedDate,
    selectedDateError,
    showModal,
    selectedHotel
  });
  
  const dailyBookings = useDailyBookingsCreated(selectedHotel);

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
      change: todayMetrics?.totalReservations > 0 ? "+12%" : "0%",
      changeType: (todayMetrics?.totalReservations || 0) > 0 ? "positive" as const : "neutral" as const,
      color: "primary"
    },
    {
      title: "24h New Bookings",
      value: dailyBookings.total,
      icon: CalendarPlus,
      change: `${dailyBookings.trend > 0 ? '+' : ''}${dailyBookings.trend}%`,
      changeType: dailyBookings.trend > 0 ? "positive" as const : dailyBookings.trend < 0 ? "negative" as const : "neutral" as const,
      color: "secondary",
      subtitle: `${dailyBookings.direct} direct, ${dailyBookings.channels} channels`,
      clickable: true,
      onClick: () => {
        setSelectedDate(new Date());
        setShowModal(true);
      }
    },
    {
      title: "Today's Revenue",
      value: `$${todayMetrics?.totalRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      change: (todayMetrics?.totalRevenue || 0) > 0 ? "+8.2%" : "0%",
      changeType: (todayMetrics?.totalRevenue || 0) > 0 ? "positive" as const : "neutral" as const,
      color: "accent"
    },
    {
      title: "Average Daily Rate",
      value: `$${todayMetrics?.avgDailyRate?.toFixed(0) || 0}`,
      icon: TrendingUp,
      change: (todayMetrics?.avgDailyRate || 0) > 0 ? "+5.1%" : "0%",
      changeType: (todayMetrics?.avgDailyRate || 0) > 0 ? "positive" as const : "neutral" as const,
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
            <Card 
              className={`card-modern card-hover ${kpi.clickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
              onClick={kpi.onClick}
            >
              <CardContent className="p-6">
                 <div className="flex items-center justify-between">
                   <div className="space-y-2">
                     <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                     <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                     {kpi.subtitle && (
                       <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
                     )}
                     <div className="flex items-center gap-1">
                       <Badge 
                         variant={kpi.changeType === 'positive' ? 'default' : kpi.changeType === 'negative' ? 'destructive' : 'secondary'}
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
              <button 
                onClick={() => {
                  console.log('🔘 Testing Sept 25 button clicked');
                  setSelectedDate(new Date(2025, 8, 25)); // Sept 25, 2025
                  setShowModal(true);
                }}
                className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/80"
              >
                Test Sept 25
              </button>
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
                   <TableCell>{reservation.room_types?.name || 'Standard'}</TableCell>
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

      {/* Daily Reservations Modal */}
      {selectedDate && (
        <DailyReservationsModal
          isOpen={showModal}
          onClose={() => {
            console.log('🚪 Closing modal');
            setShowModal(false);
            setSelectedDate(null);
          }}
          date={selectedDate}
          reservations={selectedDateReservations?.reservations || []}
          totalRevenue={selectedDateReservations?.totalRevenue || 0}
          avgDailyRate={selectedDateReservations?.avgDailyRate || 0}
        />
      )}
    </div>
  );
};