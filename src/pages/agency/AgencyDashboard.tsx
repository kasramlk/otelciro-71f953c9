import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  MapPin, 
  Building2,
  Users,
  Clock,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { useAgencyAnalytics } from "@/hooks/use-agency-analytics";
import { useRecentBookings } from "@/hooks/use-agency-bookings";
import { format } from "date-fns";

const AgencyDashboard = () => {
  const navigate = useNavigate();
  
  // Fetch real analytics data
  const { currentStats, topHotels, isLoading: analyticsLoading } = useAgencyAnalytics();
  const { data: recentBookings, isLoading: bookingsLoading } = useRecentBookings(5);
  
  if (analyticsLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Bookings",
      value: currentStats?.totalBookings.toString() || "0",
      change: `${currentStats?.bookingsGrowth >= 0 ? '+' : ''}${currentStats?.bookingsGrowth.toFixed(1)}%`,
      changeType: (currentStats?.bookingsGrowth || 0) >= 0 ? "positive" : "negative",
      icon: Calendar,
      description: "This month"
    },
    {
      title: "Commission Earned",
      value: `$${currentStats?.totalCommission.toFixed(0) || '0'}`,
      change: `${currentStats?.commissionGrowth >= 0 ? '+' : ''}${currentStats?.commissionGrowth.toFixed(1)}%`, 
      changeType: (currentStats?.commissionGrowth || 0) >= 0 ? "positive" : "negative",
      icon: DollarSign,
      description: "Last 30 days"
    },
    {
      title: "Partner Hotels", 
      value: topHotels?.length.toString() || "0",
      change: "+0%",
      changeType: "positive", 
      icon: Building2,
      description: "Active properties"
    },
    {
      title: "Avg Booking Value",
      value: `$${currentStats?.averageBookingValue.toFixed(0) || '0'}`,
      change: "0%",
      changeType: "positive",
      icon: TrendingUp,
      description: "Per reservation"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Quick Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-r from-green-50 to-blue-50 dark:from-background dark:to-background">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground">AI-Powered Hotel Search</h3>
                <p className="text-muted-foreground">Try: "Find me a 5-star hotel in Istanbul with spa and pool for business travelers"</p>
              </div>
          <Button 
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90 text-white"
            onClick={() => navigate('/agency/search')}
          >
            Start Booking
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <stat.icon className="mr-2 h-4 w-4 text-primary" />
                    {stat.title}
                  </CardTitle>
                  <Badge 
                    variant={stat.changeType === 'positive' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {stat.change}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentBookings?.map((booking, index) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{booking.hotelName}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.guestName} • {format(new Date(booking.checkIn), 'MMM dd')} - {format(new Date(booking.checkOut), 'MMM dd')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={booking.status === 'confirmed' ? 'default' : 'outline'}>
                      {booking.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">${booking.totalAmount}</p>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/agency/bookings')}
              >
                View All Bookings
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Performing Hotels */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top Performing Hotels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topHotels?.slice(0, 4).map((hotel, index) => (
                <div key={hotel.hotelId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-sm">{hotel.hotelName}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{hotel.city}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{hotel.bookings} bookings</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${hotel.commission.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">commission</p>
                  </div>
                </div>
              ))}
              {(!topHotels || topHotels.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hotel partnerships yet</p>
                  <p className="text-sm">Start making bookings to see performance data</p>
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/agency/partners')}
              >
                View All Hotels
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AgencyDashboard;