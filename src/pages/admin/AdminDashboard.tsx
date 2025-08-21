import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Building, Users, Plane, AlertTriangle, CheckCircle, Clock, TrendingUp, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardStats {
  totalHotels: number;
  activeHotels: number;
  onboardingHotels: number;
  totalUsers: number;
  totalAgencies: number;
  activeAgencies: number;
  totalReservations: number;
  totalRevenue: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalHotels: 0,
    activeHotels: 0, 
    onboardingHotels: 0,
    totalUsers: 0,
    totalAgencies: 0,
    activeAgencies: 0,
    totalReservations: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [recentActivity] = useState([
    { id: 1, action: "New hotel onboarding started", hotel: "Grand Plaza Hotel", time: "2 hours ago", status: "pending" },
    { id: 2, action: "User registration completed", hotel: "Ocean View Resort", time: "4 hours ago", status: "completed" },
    { id: 3, action: "Agency contract signed", hotel: "City Center Inn", time: "6 hours ago", status: "completed" },
    { id: 4, action: "Room types configuration", hotel: "Mountain Lodge", time: "1 day ago", status: "pending" },
  ]);

  const [chartData] = useState([
    { name: 'Jan', hotels: 12, agencies: 8, revenue: 45000 },
    { name: 'Feb', hotels: 19, agencies: 12, revenue: 67000 },
    { name: 'Mar', hotels: 24, agencies: 15, revenue: 89000 },
    { name: 'Apr', hotels: 31, agencies: 19, revenue: 112000 },
    { name: 'May', hotels: 38, agencies: 23, revenue: 134000 },
    { name: 'Jun', hotels: 45, agencies: 28, revenue: 156000 },
  ]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch hotels count
      const { count: hotelsCount } = await supabase
        .from('hotels')
        .select('*', { count: 'exact', head: true });
      
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      // Fetch agencies count  
      const { count: agenciesCount } = await supabase
        .from('agencies')
        .select('*', { count: 'exact', head: true });

      const { count: activeAgenciesCount } = await supabase
        .from('agencies')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch reservations count and revenue
      const { count: reservationsCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true });

      const { data: revenueData } = await supabase
        .from('reservations')
        .select('total_price')
        .not('total_price', 'is', null);

      const totalRevenue = revenueData?.reduce((sum, reservation) => 
        sum + Number(reservation.total_price || 0), 0) || 0;

      setStats({
        totalHotels: hotelsCount || 0,
        activeHotels: hotelsCount || 0, // For now, assume all are active
        onboardingHotels: 0, // This would need a status field in hotels table
        totalUsers: usersCount || 0,
        totalAgencies: agenciesCount || 0,
        activeAgencies: activeAgenciesCount || 0,
        totalReservations: reservationsCount || 0,
        totalRevenue: totalRevenue
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Hotels",
      value: stats.totalHotels,
      icon: Building,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      trend: "+12%"
    },
    {
      title: "Total Users",
      value: stats.totalUsers, 
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
      trend: "+8%"
    },
    {
      title: "Active Agencies",
      value: stats.activeAgencies,
      icon: Plane,
      color: "text-purple-600", 
      bgColor: "bg-purple-100",
      trend: "+15%"
    },
    {
      title: "Total Revenue",
      value: `$${(stats.totalRevenue / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100", 
      trend: "+23%"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of the OtelCiro platform</p>
        </div>
        <Button onClick={() => navigate('/admin/onboarding')}>
          <Building className="mr-2 h-4 w-4" />
          Onboard New Hotel
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <span className="text-xs text-green-600 font-medium">{stat.trend}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Growth Trends</CardTitle>
            <CardDescription>Hotels and agencies over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hotels" fill="hsl(var(--primary))" />
                <Bar dataKey="agencies" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
            <CardDescription>Monthly revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform activities and status updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {activity.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-orange-500" />
                  )}
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.hotel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                    {activity.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/onboarding')}>
          <CardContent className="p-6 text-center">
            <Building className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Onboard Hotel</h3>
            <p className="text-sm text-muted-foreground">Start the hotel onboarding process</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/users')}>
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Manage Users</h3>
            <p className="text-sm text-muted-foreground">Add and manage platform users</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/agencies')}>
          <CardContent className="p-6 text-center">
            <Plane className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Manage Agencies</h3>
            <p className="text-sm text-muted-foreground">Setup travel agency partnerships</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;