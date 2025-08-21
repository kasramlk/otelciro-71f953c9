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
  ArrowUpRight
} from "lucide-react";

const AgencyDashboard = () => {
  const navigate = useNavigate();
  const stats = [
    {
      title: "Total Bookings",
      value: "247",
      change: "+12%",
      changeType: "positive",
      icon: Calendar,
      description: "This month"
    },
    {
      title: "Commission Earned",
      value: "$18,249",
      change: "+8.2%", 
      changeType: "positive",
      icon: DollarSign,
      description: "Last 30 days"
    },
    {
      title: "Active Hotels", 
      value: "89",
      change: "+3",
      changeType: "positive", 
      icon: Building2,
      description: "Partner properties"
    },
    {
      title: "Average ADR",
      value: "$156.80",
      change: "-2.1%",
      changeType: "negative",
      icon: TrendingUp,
      description: "Weighted average"
    }
  ];

  const recentSearches = [
    { query: "5-star hotel in Istanbul with pool", timestamp: "2 minutes ago", results: 24 },
    { query: "Beach resort in Antalya for families", timestamp: "15 minutes ago", results: 18 },
    { query: "Business hotel near airport", timestamp: "1 hour ago", results: 31 },
    { query: "Luxury spa hotel in Cappadocia", timestamp: "2 hours ago", results: 12 }
  ];

  const topPerformingHotels = [
    { name: "Grand Hyatt Istanbul", bookings: 28, commission: "$4,200", city: "Istanbul" },
    { name: "Swissotel Ankara", bookings: 22, commission: "$3,150", city: "Ankara" },
    { name: "Hilton Antalya", bookings: 19, commission: "$2,890", city: "Antalya" },
    { name: "Raffles Istanbul", bookings: 16, commission: "$2,540", city: "Istanbul" }
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
            Start Search
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
        {/* Recent Searches */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent AI Searches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentSearches.map((search, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{search.query}</p>
                    <p className="text-xs text-muted-foreground">{search.timestamp}</p>
                  </div>
                  <Badge variant="outline">{search.results} results</Badge>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View All Searches
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
              {topPerformingHotels.map((hotel, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-sm">{hotel.name}</p>
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
                    <p className="font-semibold text-green-600">{hotel.commission}</p>
                    <p className="text-xs text-muted-foreground">commission</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
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