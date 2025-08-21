import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { 
  Hotel, 
  Users, 
  Calendar, 
  TrendingUp, 
  CreditCard, 
  UserCheck, 
  Bed,
  Clock,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Mock data for charts
  const occupancyData = [
    { date: '2024-01', occupancy: 65 },
    { date: '2024-02', occupancy: 72 },
    { date: '2024-03', occupancy: 68 },
    { date: '2024-04', occupancy: 85 },
    { date: '2024-05', occupancy: 92 },
    { date: '2024-06', occupancy: 88 },
  ];

  const sourceData = [
    { name: 'Direct', value: 35, color: '#003580' },
    { name: 'Booking.com', value: 25, color: '#009fe3' },
    { name: 'Expedia', value: 20, color: '#feba02' },
    { name: 'Walk-in', value: 20, color: '#10b981' },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 45000, adr: 125 },
    { month: 'Feb', revenue: 52000, adr: 135 },
    { month: 'Mar', revenue: 48000, adr: 128 },
    { month: 'Apr', revenue: 65000, adr: 145 },
    { month: 'May', revenue: 72000, adr: 152 },
    { month: 'Jun', revenue: 68000, adr: 148 },
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-display font-bold bg-gradient-hero bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-2">Here's what's happening at your hotel today</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button className="bg-gradient-primary text-white shadow-glow hover:shadow-xl button-glow">
            <Calendar className="h-4 w-4 mr-2" />
            Quick Booking
          </Button>
          <Button variant="outline" className="border-primary/20">
            <UserCheck className="h-4 w-4 mr-2" />
            Check In
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Occupancy Rate"
          value="87.5%"
          change={{ value: 5.2, type: 'increase', period: 'vs last month' }}
          icon={<Hotel className="h-6 w-6" />}
          color="primary"
        />
        <KPICard
          title="Average Daily Rate"
          value="$148"
          change={{ value: 3.1, type: 'increase', period: 'vs last month' }}
          icon={<TrendingUp className="h-6 w-6" />}
          color="secondary"
        />
        <KPICard
          title="RevPAR"
          value="$129"
          change={{ value: 8.7, type: 'increase', period: 'vs last month' }}
          icon={<CreditCard className="h-6 w-6" />}
          color="accent"
        />
        <KPICard
          title="Total Revenue"
          value="$68,420"
          change={{ value: 12.3, type: 'increase', period: 'this month' }}
          icon={<TrendingUp className="h-6 w-6" />}
          color="success"
        />
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Arrivals"
          value="14"
          subtitle="Expected check-ins"
          icon={<UserCheck className="h-4 w-4" />}
          trend={{ direction: 'up', value: '+2', label: 'vs yesterday' }}
          color="blue"
        />
        <StatCard
          title="Departures"
          value="11"
          subtitle="Expected check-outs"
          icon={<Clock className="h-4 w-4" />}
          color="green"
        />
        <StatCard
          title="Rooms Available"
          value="8"
          subtitle="Out of 65 rooms"
          icon={<Bed className="h-4 w-4" />}
          trend={{ direction: 'down', value: '-3', label: 'vs yesterday' }}
          color="yellow"
        />
        <StatCard
          title="Maintenance Issues"
          value="2"
          subtitle="Requiring attention"
          icon={<AlertTriangle className="h-4 w-4" />}
          color="red"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Trend */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Occupancy Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" />
                <YAxis />
                <Line 
                  type="monotone" 
                  dataKey="occupancy" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booking Sources */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-secondary" />
              Booking Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {sourceData.map((item) => (
                <div key={item.name} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Today's Priority Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { task: "Room 204 maintenance completed", status: "done", time: "2 hours ago" },
              { task: "VIP guest arrival at 3 PM - Room 501", status: "pending", time: "in 1 hour" },
              { task: "Late checkout request - Room 302", status: "pending", time: "30 min ago" },
              { task: "Housekeeping completed Floor 2", status: "done", time: "1 hour ago" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className={`h-4 w-4 ${item.status === 'done' ? 'text-green-500' : 'text-yellow-500'}`} />
                  <span className={item.status === 'done' ? 'line-through text-muted-foreground' : ''}>{item.task}</span>
                </div>
                <Badge variant="secondary" className="text-xs">{item.time}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;