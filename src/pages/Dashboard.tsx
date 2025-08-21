import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Hotel, Calendar, Users, FileText, Settings, LogOut } from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
          <div className="flex items-center space-x-2">
            <Hotel className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">Hotel PMS</h1>
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
          <h3 className="text-2xl font-bold mb-4">Hotels by Country</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* United States Hotels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Hotel className="h-5 w-5 mr-2 text-primary" />
                  United States
                </CardTitle>
                <CardDescription>2 Properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-l-primary pl-4">
                  <h4 className="font-semibold">Grand Plaza Manhattan</h4>
                  <p className="text-sm text-muted-foreground">GPM001</p>
                  <p className="text-sm">123 Broadway Ave, New York, NY</p>
                  <p className="text-sm text-muted-foreground">+1 (555) 123-4567 • UTC-5</p>
                </div>
                <div className="border-l-4 border-l-secondary pl-4">
                  <h4 className="font-semibold">Sunset Beach Resort</h4>
                  <p className="text-sm text-muted-foreground">SBR002</p>
                  <p className="text-sm">456 Ocean Drive, Miami, FL</p>
                  <p className="text-sm text-muted-foreground">+1 (555) 987-6543 • UTC-5</p>
                </div>
              </CardContent>
            </Card>

            {/* United Kingdom Hotels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Hotel className="h-5 w-5 mr-2 text-primary" />
                  United Kingdom
                </CardTitle>
                <CardDescription>2 Properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-l-primary pl-4">
                  <h4 className="font-semibold">Royal Westminster Hotel</h4>
                  <p className="text-sm text-muted-foreground">RWH003</p>
                  <p className="text-sm">78 Piccadilly Circus, London</p>
                  <p className="text-sm text-muted-foreground">+44 20 7123 4567 • UTC+0</p>
                </div>
                <div className="border-l-4 border-l-secondary pl-4">
                  <h4 className="font-semibold">Edinburgh Castle View</h4>
                  <p className="text-sm text-muted-foreground">ECV004</p>
                  <p className="text-sm">15 Royal Mile, Edinburgh</p>
                  <p className="text-sm text-muted-foreground">+44 131 555 0123 • UTC+0</p>
                </div>
              </CardContent>
            </Card>

            {/* Japan Hotels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Hotel className="h-5 w-5 mr-2 text-primary" />
                  Japan
                </CardTitle>
                <CardDescription>2 Properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-l-primary pl-4">
                  <h4 className="font-semibold">Tokyo Imperial Suites</h4>
                  <p className="text-sm text-muted-foreground">TIS005</p>
                  <p className="text-sm">2-1-1 Shibuya, Tokyo</p>
                  <p className="text-sm text-muted-foreground">+81 3-1234-5678 • UTC+9</p>
                </div>
                <div className="border-l-4 border-l-secondary pl-4">
                  <h4 className="font-semibold">Kyoto Zen Garden Hotel</h4>
                  <p className="text-sm text-muted-foreground">KZG006</p>
                  <p className="text-sm">123 Gion District, Kyoto</p>
                  <p className="text-sm text-muted-foreground">+81 75-567-8901 • UTC+9</p>
                </div>
              </CardContent>
            </Card>
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