import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Hotel, Calendar, Users, FileText, Settings, LogOut, Filter, LayoutDashboard, Bed, UserCheck, BookOpen, Square, TrendingUp, Receipt, CreditCard, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const navigate = useNavigate();

  // Mock hotel data
  const hotelsByCountry = {
    "United States": [
      { name: "Grand Plaza Manhattan", code: "GPM001", address: "123 Broadway Ave, New York, NY", phone: "+1 (555) 123-4567", timezone: "UTC-5" },
      { name: "Sunset Beach Resort", code: "SBR002", address: "456 Ocean Drive, Miami, FL", phone: "+1 (555) 987-6543", timezone: "UTC-5" }
    ],
    "United Kingdom": [
      { name: "Royal Westminster Hotel", code: "RWH003", address: "78 Piccadilly Circus, London", phone: "+44 20 7123 4567", timezone: "UTC+0" },
      { name: "Edinburgh Castle View", code: "ECV004", address: "15 Royal Mile, Edinburgh", phone: "+44 131 555 0123", timezone: "UTC+0" }
    ],
    "Japan": [
      { name: "Tokyo Imperial Suites", code: "TIS005", address: "2-1-1 Shibuya, Tokyo", phone: "+81 3-1234-5678", timezone: "UTC+9" },
      { name: "Kyoto Zen Garden Hotel", code: "KZG006", address: "123 Gion District, Kyoto", phone: "+81 75-567-8901", timezone: "UTC+9" }
    ]
  };

  // Filter hotels based on selected country
  const filteredHotels = selectedCountry === "all" 
    ? hotelsByCountry 
    : { [selectedCountry]: hotelsByCountry[selectedCountry as keyof typeof hotelsByCountry] };

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/27a5c254-db11-4fe2-927e-a659f46eb769.png" 
                alt="Otelciro PMS" 
                className="h-12"
              />
            </div>
            
            {/* Navigation Menu */}
            <NavigationMenu>
              <NavigationMenuList className="flex space-x-1">
                <NavigationMenuItem>
                  <NavigationMenuLink className={`${navigationMenuTriggerStyle()} cursor-pointer`}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className={`${navigationMenuTriggerStyle()} cursor-pointer`}>
                    <Bed className="h-4 w-4 mr-2" />
                    Room Plan
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    className={`${navigationMenuTriggerStyle()} cursor-pointer`}
                    onClick={() => navigate('/guests')}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Guests
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    className={`${navigationMenuTriggerStyle()} cursor-pointer`}
                    onClick={() => navigate('/reservations')}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Reservation
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className={`${navigationMenuTriggerStyle()} cursor-pointer`}>
                    <Square className="h-4 w-4 mr-2" />
                    Block
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className={`${navigationMenuTriggerStyle()} cursor-pointer`}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Sales
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className={`${navigationMenuTriggerStyle()} cursor-pointer`}>
                    <Receipt className="h-4 w-4 mr-2" />
                    Active Folios
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className={`${navigationMenuTriggerStyle()} cursor-pointer`}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Cashier
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className={`${navigationMenuTriggerStyle()} cursor-pointer`}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Reports
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.user_metadata?.name || user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Manage your hotel operations efficiently</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Arrivals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from yesterday</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
              <Hotel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">38 of 45 rooms</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ADR</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$125</div>
              <p className="text-xs text-muted-foreground">Average Daily Rate</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RevPAR</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$106</div>
              <p className="text-xs text-muted-foreground">Revenue per Available Room</p>
            </CardContent>
          </Card>
        </div>

        {/* Mock Hotels by Country */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Hotels by Country</h3>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by country" />
                </SelectTrigger>
                <SelectContent className="bg-card border shadow-md">
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  <SelectItem value="Japan">Japan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Object.entries(filteredHotels).map(([country, hotels]) => (
              <Card key={country}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Hotel className="h-5 w-5 mr-2 text-primary" />
                    {country}
                  </CardTitle>
                  <CardDescription>{hotels.length} Properties</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hotels.map((hotel, index) => (
                    <div key={hotel.code} className={`border-l-4 ${index % 2 === 0 ? 'border-l-primary' : 'border-l-secondary'} pl-4`}>
                      <h4 className="font-semibold">{hotel.name}</h4>
                      <p className="text-sm text-muted-foreground">{hotel.code}</p>
                      <p className="text-sm">{hotel.address}</p>
                      <p className="text-sm text-muted-foreground">{hotel.phone} • {hotel.timezone}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Availability Calendar
              </CardTitle>
              <CardDescription>
                Manage room inventory and rates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Reservations
              </CardTitle>
              <CardDescription>
                View and manage bookings
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Hotel className="h-5 w-5 mr-2 text-primary" />
                Room Status
              </CardTitle>
              <CardDescription>
                Monitor housekeeping and maintenance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Guest Management
              </CardTitle>
              <CardDescription>
                Check-in, check-out, and guest services
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Reports
              </CardTitle>
              <CardDescription>
                Occupancy, revenue, and operational reports
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-primary" />
                Settings
              </CardTitle>
              <CardDescription>
                Hotel profile, room types, and configuration
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;