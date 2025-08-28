import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Clock, 
  MapPin, 
  Users, 
  Calendar,
  Filter,
  Download,
  Eye,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AgencySearches = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [resultsFilter, setResultsFilter] = useState("all");

  const mockSearchHistory = [
    {
      id: "1",
      query: "5-star hotel in Istanbul with pool and spa for business travelers",
      timestamp: "2024-01-20T10:30:00Z",
      results_count: 24,
      location: "Istanbul, Turkey",
      filters_applied: ["5-star", "Pool", "Spa", "Business facilities"],
      user: "Sarah Johnson",
      booking_made: true,
      clicked_hotels: ["Grand Hyatt Istanbul", "Four Seasons Bosphorus"]
    },
    {
      id: "2", 
      query: "Beach resort in Antalya for families with kids",
      timestamp: "2024-01-20T09:15:00Z",
      results_count: 18,
      location: "Antalya, Turkey",
      filters_applied: ["Family-friendly", "Beach", "Kids club"],
      user: "Michael Chen",
      booking_made: false,
      clicked_hotels: ["Hotel Side Crown", "Crystal Sunrise"]
    },
    {
      id: "3",
      query: "Business hotel near airport with conference rooms",
      timestamp: "2024-01-19T16:45:00Z", 
      results_count: 31,
      location: "Istanbul, Turkey",
      filters_applied: ["Airport shuttle", "Conference rooms", "Business center"],
      user: "Emma Wilson",
      booking_made: true,
      clicked_hotels: ["Hilton Airport", "Marriott Airport"]
    },
    {
      id: "4",
      query: "Luxury spa hotel in Cappadocia with balloon tour packages",
      timestamp: "2024-01-19T14:20:00Z",
      results_count: 12,
      location: "Cappadocia, Turkey", 
      filters_applied: ["Luxury", "Spa", "Hot air balloon", "Cave rooms"],
      user: "David Rodriguez",
      booking_made: false,
      clicked_hotels: ["Museum Hotel", "Argos in Cappadocia"]
    },
    {
      id: "5",
      query: "Budget hotel in Ankara city center",
      timestamp: "2024-01-19T11:30:00Z",
      results_count: 42,
      location: "Ankara, Turkey",
      filters_applied: ["Budget", "City center", "Metro access"],
      user: "Lisa Anderson",
      booking_made: true,
      clicked_hotels: ["Swissotel Ankara", "Hilton Ankara"]
    }
  ];

  const filteredSearches = mockSearchHistory.filter(search => {
    const matchesQuery = searchQuery === "" || 
      search.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      search.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      search.user.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTime = timeFilter === "all" || 
      (timeFilter === "today" && new Date(search.timestamp).toDateString() === new Date().toDateString()) ||
      (timeFilter === "week" && new Date(search.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (timeFilter === "month" && new Date(search.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    const matchesResults = resultsFilter === "all" ||
      (resultsFilter === "high" && search.results_count > 20) ||
      (resultsFilter === "medium" && search.results_count >= 10 && search.results_count <= 20) ||
      (resultsFilter === "low" && search.results_count < 10);
    
    return matchesQuery && matchesTime && matchesResults;
  });

  const stats = [
    { 
      title: "Total Searches", 
      value: mockSearchHistory.length.toString(), 
      change: "+12%", 
      icon: Search,
      color: "text-primary" 
    },
    { 
      title: "Successful Bookings", 
      value: mockSearchHistory.filter(s => s.booking_made).length.toString(), 
      change: "+8%", 
      icon: TrendingUp,
      color: "text-green-600" 
    },
    { 
      title: "Avg. Results", 
      value: Math.round(mockSearchHistory.reduce((acc, s) => acc + s.results_count, 0) / mockSearchHistory.length).toString(), 
      change: "+5%", 
      icon: BarChart3,
      color: "text-secondary" 
    },
    { 
      title: "Conversion Rate", 
      value: `${Math.round((mockSearchHistory.filter(s => s.booking_made).length / mockSearchHistory.length) * 100)}%`, 
      change: "+3%", 
      icon: Calendar,
      color: "text-accent" 
    }
  ];

  const handleRepeatSearch = (query: string) => {
    navigate('/agency/search', { state: { initialQuery: query } });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Search History</h1>
          <p className="text-muted-foreground">View and analyze your AI-powered hotel searches</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button 
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 gap-2"
            onClick={() => navigate('/agency/search')}
          >
            <Search className="h-4 w-4" />
            New Search
          </Button>
        </div>
      </div>

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
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <Badge variant="outline" className="mt-1 text-green-600 border-green-600">
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by query, location, or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              <Select value={resultsFilter} onValueChange={setResultsFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Results" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="high">High (20+)</SelectItem>
                  <SelectItem value="medium">Medium (10-20)</SelectItem>
                  <SelectItem value="low">Low (&lt;10)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Search History ({filteredSearches.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Search Query</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSearches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No searches found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSearches.map((search) => (
                    <TableRow key={search.id}>
                      <TableCell className="max-w-[300px]">
                        <div className="space-y-1">
                          <p className="font-medium text-sm leading-tight">{search.query}</p>
                          <div className="flex flex-wrap gap-1">
                            {search.filters_applied.slice(0, 3).map((filter, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {filter}
                              </Badge>
                            ))}
                            {search.filters_applied.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{search.filters_applied.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{search.user}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{search.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {search.results_count} hotels
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={search.booking_made ? 
                            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : 
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                          }
                        >
                          {search.booking_made ? "Booked" : "Viewed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(search.timestamp).toLocaleDateString()} at{' '}
                        {new Date(search.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRepeatSearch(search.query)}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencySearches;