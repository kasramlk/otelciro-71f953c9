import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  DollarSign, 
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  Activity
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  ComposedChart,
  Legend
} from "recharts";

// Mock data for charts
const occupancyTrendData = [
  { date: "Jan 01", occupancy: 75, revenue: 12500, adr: 167 },
  { date: "Jan 02", occupancy: 80, revenue: 13200, adr: 165 },
  { date: "Jan 03", occupancy: 85, revenue: 14100, adr: 166 },
  { date: "Jan 04", occupancy: 90, revenue: 15000, adr: 167 },
  { date: "Jan 05", occupancy: 95, revenue: 15800, adr: 166 },
  { date: "Jan 06", occupancy: 88, revenue: 14600, adr: 166 },
  { date: "Jan 07", occupancy: 78, revenue: 13000, adr: 167 },
  { date: "Jan 08", occupancy: 82, revenue: 13800, adr: 168 },
  { date: "Jan 09", occupancy: 87, revenue: 14700, adr: 169 },
  { date: "Jan 10", occupancy: 92, revenue: 15600, adr: 170 },
  { date: "Jan 11", occupancy: 89, revenue: 15100, adr: 170 },
  { date: "Jan 12", occupancy: 85, revenue: 14400, adr: 169 },
  { date: "Jan 13", occupancy: 79, revenue: 13400, adr: 170 },
  { date: "Jan 14", occupancy: 83, revenue: 14100, adr: 170 }
];

const roomTypeData = [
  { name: "Standard", occupancy: 85, rooms: 60, revenue: 45000 },
  { name: "Deluxe", occupancy: 78, rooms: 35, revenue: 38000 },
  { name: "Suite", occupancy: 65, rooms: 15, revenue: 32000 },
  { name: "Executive", occupancy: 72, rooms: 10, revenue: 28000 }
];

const sourceDistributionData = [
  { name: "Direct", value: 35, revenue: 52000, color: "#0088FE" },
  { name: "Booking.com", value: 25, revenue: 38000, color: "#00C49F" },
  { name: "Expedia", value: 20, revenue: 28000, color: "#FFBB28" },
  { name: "Corporate", value: 15, revenue: 22000, color: "#FF8042" },
  { name: "Walk-in", value: 5, revenue: 8000, color: "#8884D8" }
];

const forecastData = [
  { date: "Week 1", actual: 82, forecast: 85, revenue: 145000 },
  { date: "Week 2", actual: 78, forecast: 80, revenue: 138000 },
  { date: "Week 3", actual: 85, forecast: 83, revenue: 152000 },
  { date: "Week 4", actual: null, forecast: 88, revenue: 158000 },
  { date: "Week 5", actual: null, forecast: 90, revenue: 165000 },
  { date: "Week 6", actual: null, forecast: 85, revenue: 148000 }
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-popover-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.dataKey}: ${
              entry.dataKey === 'revenue' ? `$${entry.value?.toLocaleString()}` :
              entry.dataKey === 'adr' ? `$${entry.value}` :
              entry.dataKey === 'occupancy' ? `${entry.value}%` :
              entry.value
            }`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const OccupancyCharts = () => {
  return (
    <div className="space-y-6">
      {/* Main Occupancy & Revenue Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                Occupancy Trend (14 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={occupancyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="occupancy"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="revenue"
                      fill="hsl(var(--secondary))"
                      fillOpacity={0.7}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-primary" />
                ADR Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={occupancyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="adr"
                      stroke="hsl(var(--accent))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "hsl(var(--accent))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Room Type Performance & Source Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                Room Type Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roomTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="occupancy" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5 text-primary" />
                Booking Source Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sourceDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'value' ? `${value}%` : `$${value?.toLocaleString()}`,
                        name === 'value' ? 'Share' : 'Revenue'
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Forecast vs Actual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="mr-2 h-5 w-5 text-primary" />
                Occupancy Forecast vs Actual (6 Weeks)
              </div>
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                Predictive Analytics
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="actual" 
                    fill="hsl(var(--primary))"
                    name="Actual Occupancy"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    name="Forecast"
                    dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};