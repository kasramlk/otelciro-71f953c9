import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useProductionData } from "@/hooks/use-production-data";
import { useDailyReservations } from "@/hooks/use-daily-reservations";
import { DailyReservationsModal } from "@/components/analytics/DailyReservationsModal";
import { checkSocialMediaAccess, features } from "@/lib/config";
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
  CheckCircle,
  Megaphone,
  ArrowRight
} from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Get user role from user metadata
  const userRole = user?.user_metadata?.role || 'hotel_manager';
  const canAccessSocialMedia = checkSocialMediaAccess(userRole);
  
  // Daily reservations modal state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showReservationsModal, setShowReservationsModal] = useState(false);
  
  const { 
    hotels, 
    reservations, 
    analytics, 
    rooms,
    loading: dataLoading,
    refreshData 
  } = useProductionData();

  // Get first hotel ID for daily reservations (fallback if no hotel context)
  const selectedHotelId = hotels?.[0]?.id || '';
  
  // Daily reservations data - only fetch when modal is open and date is selected
  const { 
    data: dailyReservationsData, 
    isLoading: reservationsLoading 
  } = useDailyReservations(selectedHotelId, selectedDate || new Date(), {
    enabled: !!selectedDate && !!selectedHotelId && showReservationsModal
  });

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
    if (!user && !authLoading) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!dataLoading && !authLoading) {
        refreshData();
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [dataLoading, authLoading, refreshData]);

  // Calculate real metrics
  const currentMetrics = {
    occupancy: analytics?.avgOccupancyRate || 0,
    adr: analytics?.adr || 0,
    revpar: analytics?.revPAR || 0,
    revenue: analytics?.totalRevenue || 0,
    totalRooms: rooms?.length || 0,
    arrivals: analytics?.totalArrivals || 0,
    departures: analytics?.totalDepartures || 0
  };

  if (authLoading) {
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
          <Button 
            className="bg-gradient-primary text-white shadow-glow hover:shadow-xl button-glow"
            onClick={() => navigate('/reservations')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Quick Booking
          </Button>
          <Button 
            variant="outline" 
            className="border-primary/20"
            onClick={() => navigate('/room-status')}
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Check In
          </Button>
        </div>
      </motion.div>

      {/* Platform Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-all group">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">Hotel Operations</CardTitle>
              <CardDescription className="text-sm">
                Complete property management and operations
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="text-sm space-y-1.5 mb-4">
                <li>• Reservations & Check-ins</li>
                <li>• Room Management</li>
                <li>• Housekeeping</li>
                <li>• Guest Services</li>
              </ul>
              <Button 
                className="w-full bg-primary hover:bg-primary/90" 
                onClick={() => navigate('/reservations')}
              >
                Manage Operations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-all group">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-4 p-4 rounded-full bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                <TrendingUp className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-lg">Revenue Analytics</CardTitle>
              <CardDescription className="text-sm">
                AI-powered revenue optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="text-sm space-y-1.5 mb-4">
                <li>• Dynamic Pricing</li>
                <li>• Occupancy Forecasting</li>
                <li>• Performance Analytics</li>
                <li>• Market Intelligence</li>
              </ul>
              <Button 
                variant="secondary" 
                className="w-full" 
                onClick={() => navigate('/analytics')}
              >
                View Analytics
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-all group">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-4 p-4 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-lg">Guest Experience</CardTitle>
              <CardDescription className="text-sm">
                Digital services and guest engagement
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="text-sm space-y-1.5 mb-4">
                <li>• Mobile Check-in</li>
                <li>• Digital Services</li>
                <li>• Guest Communications</li>
                <li>• Service Requests</li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full border-accent text-accent hover:bg-accent hover:text-white" 
                onClick={() => navigate('/guest-experience')}
              >
                Manage Experience
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {canAccessSocialMedia && features.socialMedia && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-all group border-blue-200">
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-blue-600 text-white text-xs">NEW</Badge>
              </div>
              <CardHeader className="text-center pb-3">
                <div className="mx-auto mb-4 p-4 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <Megaphone className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Social Media Studio</CardTitle>
                <CardDescription className="text-sm">
                  Create, schedule, and analyze AI-generated content
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-sm space-y-1.5 mb-4">
                  <li>• AI Content Generator</li>
                  <li>• Social Calendar</li>
                  <li>• Auto-Publishing</li>
                  <li>• Analytics & ROI</li>
                </ul>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                  onClick={() => navigate('/social-media')}
                >
                  Access Social Media
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Occupancy Rate"
          value={dataLoading ? "..." : `${currentMetrics.occupancy.toFixed(1)}%`}
          change={{ value: 5.2, type: 'increase', period: 'vs last month' }}
          icon={<Hotel className="h-6 w-6" />}
          color="primary"
        />
        <KPICard
          title="Average Daily Rate"
          value={dataLoading ? "..." : `$${currentMetrics.adr.toFixed(0)}`}
          change={{ value: 3.1, type: 'increase', period: 'vs last month' }}
          icon={<TrendingUp className="h-6 w-6" />}
          color="secondary"
        />
        <KPICard
          title="RevPAR"
          value={dataLoading ? "..." : `$${currentMetrics.revpar.toFixed(0)}`}
          change={{ value: 8.7, type: 'increase', period: 'vs last month' }}
          icon={<CreditCard className="h-6 w-6" />}
          color="accent"
        />
        <KPICard
          title="Total Revenue"
          value={dataLoading ? "..." : `$${currentMetrics.revenue.toLocaleString()}`}
          change={{ value: 12.3, type: 'increase', period: 'this month' }}
          icon={<TrendingUp className="h-6 w-6" />}
          color="success"
        />
      </div>

      {/* Test Button for Daily Reservations - Sept 25 */}
      <Card className="card-modern bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">🔧 Debug Test</h3>
          <p className="text-sm opacity-90 mb-4">Test the Sept 25 reservations modal (should show 3 reservations)</p>
          <Button 
            onClick={() => {
              console.log('🔘 BIG TEST BUTTON CLICKED for Sept 25');
              console.log('Selected Hotel ID:', selectedHotelId);
              setSelectedDate(new Date(2025, 8, 25)); // Sept 25, 2025
              setShowReservationsModal(true);
            }}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            🎯 TEST SEPT 25 RESERVATIONS
          </Button>
        </CardContent>
      </Card>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Arrivals"
          value={dataLoading ? "..." : currentMetrics.arrivals.toString()}
          subtitle="Expected check-ins"
          icon={<UserCheck className="h-4 w-4" />}
          trend={{ direction: 'up', value: '+2', label: 'vs yesterday' }}
          color="blue"
        />
        <StatCard
          title="Departures"
          value={dataLoading ? "..." : currentMetrics.departures.toString()}
          subtitle="Expected check-outs"
          icon={<Clock className="h-4 w-4" />}
          color="green"
        />
        <StatCard
          title="Rooms Available"
          value={dataLoading ? "..." : (currentMetrics.totalRooms - Math.round(currentMetrics.occupancy * currentMetrics.totalRooms / 100)).toString()}
          subtitle={`Out of ${currentMetrics.totalRooms} rooms`}
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

      {/* Daily Reservations Modal */}
      {selectedDate && (
        <DailyReservationsModal
          isOpen={showReservationsModal}
          onClose={() => {
            setShowReservationsModal(false);
            setSelectedDate(null);
          }}
          date={selectedDate}
          reservations={dailyReservationsData?.reservations || []}
          totalRevenue={dailyReservationsData?.totalRevenue}
          avgDailyRate={dailyReservationsData?.avgDailyRate}
        />
      )}
    </div>
  );
};

export default Dashboard;