import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Hotel, Calendar, Users, FileText, ArrowRight } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate("/dashboard");
      }
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Hotel className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-5xl font-bold text-primary">Hotel PMS</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Complete Property Management System for hotels. Manage reservations, 
            track occupancy, handle check-ins, and optimize your revenue.
          </p>
          <div className="space-x-4">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to manage your hotel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="text-center">
                <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Availability Calendar</CardTitle>
                <CardDescription>
                  Manage room inventory and pricing with real-time availability
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <FileText className="h-12 w-12 text-secondary mx-auto mb-4" />
                <CardTitle>Reservations</CardTitle>
                <CardDescription>
                  Complete booking management from inquiry to checkout
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Hotel className="h-12 w-12 text-accent mx-auto mb-4" />
                <CardTitle>Room Management</CardTitle>
                <CardDescription>
                  Track room status, housekeeping, and maintenance tasks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Guest Services</CardTitle>
                <CardDescription>
                  Streamlined check-in/out process and guest management
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 text-center">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your hotel operations?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join hundreds of hotels already using our PMS to increase efficiency and revenue.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
