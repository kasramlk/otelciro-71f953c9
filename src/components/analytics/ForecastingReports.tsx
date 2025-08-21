import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  AlertTriangle,
  Target,
  Clock,
  Zap
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays, format, startOfWeek, endOfWeek } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Area } from "recharts";

interface ForecastingReportsProps {
  dateRange?: DateRange;
  selectedHotel: string;
}

export const ForecastingReports = ({ dateRange, selectedHotel }: ForecastingReportsProps) => {
  // Booking pace analysis
  const { data: bookingPace } = useQuery({
    queryKey: ["bookingPace", selectedHotel],
    queryFn: async () => {
      // Get data for this year and last year for comparison
      const thisYear = new Date().getFullYear();
      const lastYear = thisYear - 1;
      
      let query = supabase
        .from("reservations")
        .select("created_at, check_in, total_amount")
        .gte("created_at", `${lastYear}-01-01`)
        .lte("created_at", `${thisYear}-12-31`);

      if (selectedHotel !== "all") {
        query = query.eq("hotel_id", selectedHotel);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process booking pace data by week
      const weeklyData = data?.reduce((acc, res) => {
        const checkInDate = new Date(res.check_in);
        const weekStart = startOfWeek(checkInDate);
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        const year = checkInDate.getFullYear();
        
        if (!acc[weekKey]) {
          acc[weekKey] = { 
            week: weekKey,
            thisYear: 0, 
            lastYear: 0,
            thisYearRevenue: 0,
            lastYearRevenue: 0 
          };
        }
        
        if (year === thisYear) {
          acc[weekKey].thisYear++;
          acc[weekKey].thisYearRevenue += res.total_amount || 0;
        } else {
          acc[weekKey].lastYear++;
          acc[weekKey].lastYearRevenue += res.total_amount || 0;
        }
        
        return acc;
      }, {} as Record<string, any>) || {};

      return Object.values(weeklyData)
        .sort((a: any, b: any) => a.week.localeCompare(b.week))
        .slice(-12); // Last 12 weeks
    },
  });

  // Occupancy forecast for next 90 days
  const { data: occupancyForecast } = useQuery({
    queryKey: ["occupancyForecast", selectedHotel],
    queryFn: async () => {
      const today = new Date();
      const next90Days = addDays(today, 90);

      // Get existing reservations
      let query = supabase
        .from("reservations")
        .select("check_in, check_out, status")
        .gte("check_in", today.toISOString())
        .lte("check_in", next90Days.toISOString())
        .neq("status", "cancelled");

      if (selectedHotel !== "all") {
        query = query.eq("hotel_id", selectedHotel);
      }

      const { data: reservations, error } = await query;
      if (error) throw error;

      // Generate forecast data (mock algorithm for demo)
      const forecastData = [];
      for (let i = 0; i < 90; i++) {
        const date = addDays(today, i);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Count actual reservations for this date
        const actualBookings = reservations?.filter(res => {
          const checkIn = new Date(res.check_in);
          const checkOut = new Date(res.check_out);
          return date >= checkIn && date < checkOut;
        }).length || 0;

        // Simple forecast model
        const baseOccupancy = isWeekend ? 0.85 : 0.72;
        const seasonalFactor = Math.sin((i / 365) * 2 * Math.PI) * 0.15 + 1;
        const forecastOccupancy = Math.min(0.98, baseOccupancy * seasonalFactor);
        
        forecastData.push({
          date: format(date, 'yyyy-MM-dd'),
          actualBookings,
          forecastOccupancy: forecastOccupancy * 100,
          confidence: Math.max(60, 95 - (i / 90) * 35) // Confidence decreases over time
        });
      }

      return forecastData;
    },
  });

  // Housekeeping workload forecast
  const { data: housekeepingForecast } = useQuery({
    queryKey: ["housekeepingForecast", selectedHotel],
    queryFn: async () => {
      const today = new Date();
      const next30Days = addDays(today, 30);

      let query = supabase
        .from("reservations")
        .select("check_in, check_out, status")
        .gte("check_out", today.toISOString())
        .lte("check_out", next30Days.toISOString())
        .neq("status", "cancelled");

      if (selectedHotel !== "all") {
        query = query.eq("hotel_id", selectedHotel);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate daily checkout/checkin workload
      const workloadData = [];
      for (let i = 0; i < 30; i++) {
        const date = addDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const checkouts = data?.filter(res => 
          format(new Date(res.check_out), 'yyyy-MM-dd') === dateStr
        ).length || 0;
        
        const checkins = data?.filter(res => 
          format(new Date(res.check_in), 'yyyy-MM-dd') === dateStr
        ).length || 0;

        const totalWorkload = checkouts + checkins;
        const priority = totalWorkload > 20 ? 'high' : totalWorkload > 10 ? 'medium' : 'low';

        workloadData.push({
          date: dateStr,
          checkouts,
          checkins,
          totalWorkload,
          priority
        });
      }

      return workloadData;
    },
  });

  const forecastKPIs = [
    {
      title: "30-Day Booking Pace",
      value: "+15.2%",
      subtitle: "vs last year",
      icon: TrendingUp,
      color: "primary",
      trend: "positive"
    },
    {
      title: "Avg Forecast Confidence",
      value: "87.3%",
      subtitle: "next 30 days",
      icon: Target,
      color: "secondary",
      trend: "stable"
    },
    {
      title: "Peak Occupancy Day",
      value: format(addDays(new Date(), 12), 'MMM dd'),
      subtitle: "94.2% forecast",
      icon: Calendar,
      color: "accent",
      trend: "positive"
    },
    {
      title: "Housekeeping Alerts",
      value: "3",
      subtitle: "high workload days",
      icon: AlertTriangle,
      color: "destructive",
      trend: "warning"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Forecast KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {forecastKPIs.map((kpi, index) => (
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
                    <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    kpi.color === 'primary' ? 'bg-gradient-primary' :
                    kpi.color === 'secondary' ? 'bg-gradient-secondary' :
                    kpi.color === 'accent' ? 'bg-gradient-accent' :
                    kpi.color === 'destructive' ? 'bg-red-500' :
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

      {/* Booking Pace Chart */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Booking Pace Analysis (This Year vs Last Year)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={bookingPace}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="week" 
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
                  dataKey="lastYear"
                  fill="hsl(var(--muted))"
                  name="Last Year"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="thisYear"
                  fill="hsl(var(--primary))"
                  name="This Year"
                  radius={[2, 2, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="thisYear"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Occupancy Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              90-Day Occupancy Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={occupancyForecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    interval={10}
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any, name: string) => [
                      name === 'forecastOccupancy' ? `${value.toFixed(1)}%` : value,
                      name === 'forecastOccupancy' ? 'Forecast Occupancy' : 'Actual Bookings'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="forecastOccupancy"
                    fill="hsl(var(--primary) / 0.2)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <Bar
                    dataKey="actualBookings"
                    fill="hsl(var(--secondary))"
                    name="Actual Bookings"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Housekeeping Workload */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Housekeeping Workload Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={housekeepingForecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    interval={5}
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
                    dataKey="checkouts"
                    stackId="workload"
                    fill="hsl(var(--destructive) / 0.8)"
                    name="Checkouts"
                  />
                  <Bar
                    dataKey="checkins"
                    stackId="workload"
                    fill="hsl(var(--secondary) / 0.8)"
                    name="Check-ins"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalWorkload"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* High Workload Alert Days */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            High Workload Alert Days (Next 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {housekeepingForecast
              ?.filter(day => day.priority === 'high')
              ?.slice(0, 5)
              ?.map((day, index) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400">
                      {format(new Date(day.date), 'EEEE, MMMM dd')}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-500">
                      {day.checkouts} checkouts, {day.checkins} check-ins
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="destructive" className="mb-1">
                    High Priority
                  </Badge>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    {day.totalWorkload} rooms
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
