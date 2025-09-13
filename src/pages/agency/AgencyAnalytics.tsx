import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Globe, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAgencyAnalytics } from "@/hooks/use-agency-analytics";

const AgencyAnalytics = () => {
  const { currentStats, monthlyData, topHotels, isLoading } = useAgencyAnalytics();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  const kpiStats = [
    {
      title: "Total Bookings",
      value: currentStats?.totalBookings.toString() || "0",
      change: `${currentStats?.bookingsGrowth >= 0 ? '+' : ''}${currentStats?.bookingsGrowth.toFixed(1)}%`,
      trend: (currentStats?.bookingsGrowth || 0) >= 0 ? "up" : "down",
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      title: "Commission Earned",
      value: `$${currentStats?.totalCommission.toFixed(0) || '0'}`,
      change: `${currentStats?.commissionGrowth >= 0 ? '+' : ''}${currentStats?.commissionGrowth.toFixed(1)}%`, 
      trend: (currentStats?.commissionGrowth || 0) >= 0 ? "up" : "down",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Average Booking Value",
      value: `$${currentStats?.averageBookingValue.toFixed(0) || '0'}`,
      change: "0%",
      trend: "up",
      icon: Users,
      color: "text-orange-600"
    },
    {
      title: "Partner Hotels",
      value: topHotels?.length.toString() || "0",
      change: "+0%",
      trend: "up", 
      icon: Globe,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Track your agency's performance and booking insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={stat.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>Bookings and commission trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="bookings" stroke="#3b82f6" strokeWidth={2} name="Bookings" />
                <Line type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2} name="Commission ($)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Hotels */}
        <Card>
          <CardHeader>
            <CardTitle>Top Partner Hotels</CardTitle>
            <CardDescription>Best performing hotels this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topHotels?.slice(0, 5).map((hotel, index) => (
                <div key={hotel.hotelId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{hotel.hotelName}</p>
                      <p className="text-sm text-muted-foreground">{hotel.bookings} bookings • {hotel.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${hotel.commission.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">commission</p>
                  </div>
                </div>
              ))}
              {(!topHotels || topHotels.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No performance data yet</p>
                  <p className="text-sm">Start making bookings to see analytics</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Monthly revenue by booking volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgencyAnalytics;