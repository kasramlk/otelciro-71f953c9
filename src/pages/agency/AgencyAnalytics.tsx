import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Globe } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const AgencyAnalytics = () => {
  const monthlyData = [
    { month: "Jan", bookings: 45, commission: 8450, revenue: 127500 },
    { month: "Feb", bookings: 52, commission: 9800, revenue: 148200 },
    { month: "Mar", bookings: 38, commission: 7200, revenue: 108000 },
    { month: "Apr", bookings: 67, commission: 12600, revenue: 189900 },
    { month: "May", bookings: 71, commission: 13400, revenue: 201600 },
    { month: "Jun", bookings: 89, commission: 16800, revenue: 252700 },
  ];

  const topDestinations = [
    { city: "Barcelona", bookings: 89, revenue: 134000, growth: 12.5 },
    { city: "Madrid", bookings: 67, revenue: 98500, growth: 8.3 },
    { city: "Santorini", bookings: 45, revenue: 112000, growth: -3.2 },
    { city: "Rome", bookings: 52, revenue: 89600, growth: 15.7 },
  ];

  const kpiStats = [
    {
      title: "Total Bookings",
      value: "362",
      change: "+23.5%",
      trend: "up",
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      title: "Commission Earned",
      value: "$68,250",
      change: "+18.2%", 
      trend: "up",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Average Booking Value",
      value: "$1,870",
      change: "-4.1%",
      trend: "down",
      icon: Users,
      color: "text-orange-600"
    },
    {
      title: "Active Destinations",
      value: "28",
      change: "+12.0%",
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
              <LineChart data={monthlyData}>
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

        {/* Top Destinations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Destinations</CardTitle>
            <CardDescription>Best performing cities this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topDestinations.map((destination, index) => (
                <div key={destination.city} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{destination.city}</p>
                      <p className="text-sm text-muted-foreground">{destination.bookings} bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${destination.revenue.toLocaleString()}</p>
                    <div className="flex items-center gap-1">
                      {destination.growth > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={`text-xs ${destination.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Math.abs(destination.growth)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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
              <BarChart data={monthlyData}>
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