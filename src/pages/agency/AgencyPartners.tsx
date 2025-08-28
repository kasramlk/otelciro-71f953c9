import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  MapPin, 
  Star, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Users,
  Search,
  Filter,
  Download,
  Eye,
  MessageCircle,
  Percent
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AgencyPartners = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [performanceFilter, setPerformanceFilter] = useState("all");

  // Mock hotel partners data - in production this would come from Supabase
  const mockPartners = [
    {
      id: "1",
      name: "Grand Hyatt Istanbul",
      location: "Taksim, Istanbul",
      city: "Istanbul",
      country: "Turkey",
      stars: 5,
      category: "Luxury",
      commission_rate: 12,
      monthly_bookings: 28,
      monthly_revenue: 42000,
      avg_rating: 4.8,
      total_reviews: 2847,
      partnership_since: "2023-01-15",
      contract_status: "active",
      payment_terms: "Net 30",
      specialties: ["Business", "Luxury", "Conference"],
      contact_person: "Sarah Johnson",
      contact_email: "partnerships@grandhyatt-istanbul.com"
    },
    {
      id: "2", 
      name: "Four Seasons Bosphorus",
      location: "Beşiktaş, Istanbul",
      city: "Istanbul", 
      country: "Turkey",
      stars: 5,
      category: "Ultra Luxury",
      commission_rate: 15,
      monthly_bookings: 22,
      monthly_revenue: 38500,
      avg_rating: 4.9,
      total_reviews: 1923,
      partnership_since: "2022-08-20",
      contract_status: "active",
      payment_terms: "Net 15",
      specialties: ["Luxury", "Romance", "Spa"],
      contact_person: "Michael Chen",
      contact_email: "partners@fourseasons-bosphorus.com"
    },
    {
      id: "3",
      name: "Swissôtel The Bosphorus",
      location: "Beşiktaş, Istanbul",
      city: "Istanbul",
      country: "Turkey", 
      stars: 5,
      category: "Luxury",
      commission_rate: 10,
      monthly_bookings: 35,
      monthly_revenue: 31200,
      avg_rating: 4.7,
      total_reviews: 3156,
      partnership_since: "2023-03-10",
      contract_status: "active",
      payment_terms: "Net 30",
      specialties: ["Business", "Conference", "Spa"],
      contact_person: "Emma Wilson",
      contact_email: "sales@swissotel-istanbul.com"
    },
    {
      id: "4",
      name: "Museum Hotel Cappadocia",
      location: "Uchisar, Cappadocia",
      city: "Cappadocia",
      country: "Turkey",
      stars: 5,
      category: "Boutique",
      commission_rate: 18,
      monthly_bookings: 16,
      monthly_revenue: 24800,
      avg_rating: 4.9,
      total_reviews: 856,
      partnership_since: "2023-06-01",
      contract_status: "active", 
      payment_terms: "Net 15",
      specialties: ["Luxury", "Unique", "Romance"],
      contact_person: "David Rodriguez",
      contact_email: "reservations@museumhotel.com"
    },
    {
      id: "5",
      name: "Hilton Antalya",
      location: "Konyaaltı, Antalya",
      city: "Antalya",
      country: "Turkey",
      stars: 4,
      category: "Resort",
      commission_rate: 8,
      monthly_bookings: 45,
      monthly_revenue: 28900,
      avg_rating: 4.5,
      total_reviews: 4231,
      partnership_since: "2022-11-15",
      contract_status: "active",
      payment_terms: "Net 30",
      specialties: ["Family", "Beach", "Conference"],
      contact_person: "Lisa Anderson",
      contact_email: "groups@hilton-antalya.com"
    }
  ];

  const filteredPartners = mockPartners.filter(partner => {
    const matchesSearch = searchQuery === "" || 
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = locationFilter === "all" || partner.city === locationFilter;
    
    const matchesCategory = categoryFilter === "all" || partner.category === categoryFilter;
    
    const matchesPerformance = performanceFilter === "all" ||
      (performanceFilter === "high" && partner.monthly_bookings > 30) ||
      (performanceFilter === "medium" && partner.monthly_bookings >= 20 && partner.monthly_bookings <= 30) ||
      (performanceFilter === "low" && partner.monthly_bookings < 20);
    
    return matchesSearch && matchesLocation && matchesCategory && matchesPerformance;
  });

  const stats = [
    { 
      title: "Total Partners", 
      value: mockPartners.length.toString(), 
      change: "+12%", 
      icon: Building2,
      color: "text-primary" 
    },
    { 
      title: "Active Contracts", 
      value: mockPartners.filter(p => p.contract_status === 'active').length.toString(), 
      change: "+8%", 
      icon: TrendingUp,
      color: "text-green-600" 
    },
    { 
      title: "Monthly Revenue", 
      value: mockPartners.reduce((acc, p) => acc + p.monthly_revenue, 0).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      }), 
      change: "+15%", 
      icon: DollarSign,
      color: "text-secondary" 
    },
    { 
      title: "Avg Commission", 
      value: `${Math.round(mockPartners.reduce((acc, p) => acc + p.commission_rate, 0) / mockPartners.length)}%`, 
      change: "+2%", 
      icon: Percent,
      color: "text-accent" 
    }
  ];

  const handleViewDetails = (partnerId: string) => {
    // Navigate to partner details or open modal
    console.log("View partner details:", partnerId);
  };

  const handleContactPartner = (partner: any) => {
    // Open email client or messaging system
    window.open(`mailto:${partner.contact_email}?subject=Partnership Inquiry - ${partner.name}`);
  };

  const handleNewBooking = (partner: any) => {
    navigate('/agency/search', { state: { selectedHotel: partner.name } });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hotel Partners</h1>
          <p className="text-muted-foreground">Manage your hotel partnerships and performance</p>
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
            Find New Partners
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by hotel name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="Istanbul">Istanbul</SelectItem>
                <SelectItem value="Antalya">Antalya</SelectItem>
                <SelectItem value="Cappadocia">Cappadocia</SelectItem>
                <SelectItem value="Ankara">Ankara</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Luxury">Luxury</SelectItem>
                <SelectItem value="Ultra Luxury">Ultra Luxury</SelectItem>
                <SelectItem value="Boutique">Boutique</SelectItem>
                <SelectItem value="Resort">Resort</SelectItem>
              </SelectContent>
            </Select>

            <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
              <SelectTrigger className="w-[180px]">
                <TrendingUp className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                <SelectItem value="high">High (30+ bookings)</SelectItem>
                <SelectItem value="medium">Medium (20-30)</SelectItem>
                <SelectItem value="low">Low (&lt;20)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Partners Grid */}
      <div className="grid gap-6">
        {filteredPartners.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No partners found</h3>
              <p className="text-muted-foreground">Try adjusting your search filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredPartners.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-4 gap-6">
                    {/* Hotel Info */}
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold">{partner.name}</h3>
                          <div className="flex">
                            {[...Array(partner.stars)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <Badge variant="secondary">{partner.category}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {partner.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <span>★ {partner.avg_rating}</span>
                            <span>({partner.total_reviews} reviews)</span>
                          </div>
                        </div>
                      </div>

                      {/* Specialties */}
                      <div>
                        <p className="text-sm font-medium mb-2">Specialties</p>
                        <div className="flex flex-wrap gap-2">
                          {partner.specialties.map((specialty, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div>
                        <p className="text-sm font-medium mb-1">Partnership Manager</p>
                        <p className="text-sm text-muted-foreground">{partner.contact_person}</p>
                        <p className="text-xs text-muted-foreground">{partner.contact_email}</p>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Performance (Monthly)</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Bookings</span>
                            <span className="font-medium">{partner.monthly_bookings}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Revenue</span>
                            <span className="font-medium">
                              {partner.monthly_revenue.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Commission</span>
                            <span className="font-medium text-green-600">{partner.commission_rate}%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Contract Details</p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              {partner.contract_status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Payment Terms</span>
                            <span className="text-sm">{partner.payment_terms}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Since</span>
                            <span className="text-sm">
                              {new Date(partner.partnership_since).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col justify-between">
                      <div className="text-right mb-4">
                        <p className="text-sm text-muted-foreground">Avg. Commission</p>
                        <p className="text-2xl font-bold text-green-600">{partner.commission_rate}%</p>
                        <p className="text-sm text-muted-foreground">per booking</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Button 
                          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90"
                          onClick={() => handleNewBooking(partner)}
                        >
                          Book Now
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleContactPartner(partner)}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Contact
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full text-sm"
                          onClick={() => handleViewDetails(partner.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgencyPartners;