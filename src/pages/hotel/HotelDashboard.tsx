import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Building2,
  Bed,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Settings,
  Bell,
  Activity,
  Target,
  Zap
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function HotelDashboard() {
  const navigate = useNavigate();
  const [selectedTimeRange, setSelectedTimeRange] = useState("today");

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['hotel-dashboard', selectedTimeRange],
    queryFn: async () => {
      const today = new Date();
      const daysAgo = new Date(today);
      daysAgo.setDate(today.getDate() - 7); // Default to 7 days

      // Get reservations data
      const { data: reservations } = await supabase
        .from('reservations')
        .select(`
          *,
          guests (first_name, last_name),
          room_types (name, capacity_adults),
          rooms (number),
          hotels (name)
        `)
        .gte('check_in', daysAgo.toISOString())
        .order('created_at', { ascending: false });

      // Get room occupancy data
      const { data: rooms } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types (name, capacity_adults),
          hotels (name)
        `);

      // Calculate metrics
      const totalRooms = rooms?.length || 0;
      const occupiedRooms = reservations?.filter(r => 
        r.status === 'Checked In' || 
        (r.status === 'Confirmed' && new Date(r.check_in) <= today && new Date(r.check_out) > today)
      ).length || 0;

      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
      
      const totalRevenue = reservations?.reduce((sum, r) => sum + (r.total_price || 0), 0) || 0;
      const totalNights = reservations?.reduce((sum, r) => {
        const checkIn = new Date(r.check_in);
        const checkOut = new Date(r.check_out);
        return sum + Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      }, 0) || 0;

      const adr = totalNights > 0 ? totalRevenue / totalNights : 0;
      const revpar = totalRooms > 0 ? totalRevenue / totalRooms : 0;

      return {
        occupancyRate,
        adr,
        revpar,
        totalRevenue,
        totalReservations: reservations?.length || 0,
        occupiedRooms,
        totalRooms,
        reservations: reservations || [],
        rooms: rooms || []
      };
    }
  });

  // KPI data
  const kpiData = [
    {
      title: "Occupancy Rate",
      value: `${dashboardData?.occupancyRate.toFixed(1)}%`,
      change: "+5.2%",
      changeType: "positive",
      icon: Bed,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      target: 85
    },
    {
      title: "ADR (Avg Daily Rate)",
      value: dashboardData?.adr.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      change: "+12.5%",
      changeType: "positive", 
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      target: 150
    },
    {
      title: "RevPAR",
      value: dashboardData?.revpar.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      change: "+8.3%",
      changeType: "positive",
      icon: TrendingUp,
      color: "text-purple-600", 
      bgColor: "bg-purple-100",
      target: 120
    },
    {
      title: "Total Revenue",
      value: dashboardData?.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      change: "+15.7%",
      changeType: "positive",
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      target: 50000
    }
  ];

  // Revenue trend data (mock for demo)
  const revenueTrendData = [
    { date: 'Mon', revenue: 12500, occupancy: 78 },
    { date: 'Tue', revenue: 11200, occupancy: 72 },
    { date: 'Wed', revenue: 13800, occupancy: 85 },
    { date: 'Thu', revenue: 14500, occupancy: 89 },
    { date: 'Fri', revenue: 16200, occupancy: 94 },
    { date: 'Sat', revenue: 18900, occupancy: 98 },
    { date: 'Sun', revenue: 15600, occupancy: 88 }
  ];

  // Booking source data
  const bookingSourceData = [
    { name: 'Direct', value: 35, color: '#003580' },
    { name: 'Booking.com', value: 28, color: '#009fe3' },
    { name: 'Agencies', value: 22, color: '#feba02' },
    { name: 'Expedia', value: 15, color: '#ff6b6b' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hotel Dashboard</h1>
          <p className="text-muted-foreground">Complete overview of your property performance</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            ARI Calendar
          </Button>
          <Button variant="outline" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </Button>
          <Button 
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 gap-2"
            onClick={() => navigate('/reservations/new')}
          >
            <Plus className="h-4 w-4" />
            New Reservation
          </Button>
        </div>
      </div>

      {/* AI Recommendations Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Zap className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">AI Revenue Optimization</h3>
            <p className="opacity-90">Increase weekend rates by 15% - High demand detected for next weekend. Potential revenue increase: +$3,240</p>
          </div>
          <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
            Apply Suggestion
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={kpi.changeType === 'positive' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {kpi.changeType === 'positive' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {kpi.change}
                      </Badge>
                      <span className="text-xs text-muted-foreground">vs last period</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Target: {kpi.target}{kpi.title.includes('Rate') || kpi.title.includes('Occupancy') ? '%' : ''}</span>
                  </div>
                  <Progress value={75} className="h-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Revenue & Occupancy Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stackId="1"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Booking Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Booking Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bookingSourceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {bookingSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Reservations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Reservations
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.reservations?.slice(0, 5).map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {reservation.guests?.first_name} {reservation.guests?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(reservation.check_in).toLocaleDateString()} - {new Date(reservation.check_out).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={reservation.status === 'Confirmed' ? 'default' : 'secondary'}>
                      {reservation.status}
                    </Badge>
                    <p className="text-sm font-medium mt-1">
                      {reservation.total_price?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-16 flex-col gap-2">
                <Plus className="h-5 w-5" />
                New Booking
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2">
                <Calendar className="h-5 w-5" />
                Rate Calendar
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2">
                <Users className="h-5 w-5" />
                Guest Folio
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2">
                <Bed className="h-5 w-5" />
                Housekeeping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};