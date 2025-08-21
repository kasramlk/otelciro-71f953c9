import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState<'hotel_manager' | 'travel_agency' | 'admin'>('hotel_manager');
  const [showRoleSelector, setShowRoleSelector] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Route based on user role
        const userRole = session.user.user_metadata?.role || 'hotel_manager';
        if (userRole === 'travel_agency') {
          navigate("/agency");
        } else if (userRole === 'admin') {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleRoleSelect = (selectedRole: 'hotel_manager' | 'travel_agency' | 'admin') => {
    setRole(selectedRole);
    setShowRoleSelector(false);
  };

  const signUp = async () => {
    if (!email || !password || !name || !orgName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name,
            org_name: orgName,
            role: role,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Please check your email to confirm your account",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showRoleSelector) {
    return <RoleSelector onRoleSelect={handleRoleSelect} />;
  }

  const getRoleTitle = () => {
    switch (role) {
      case 'hotel_manager': return 'Hotel Manager Portal';
      case 'travel_agency': return 'Travel Agency Portal';  
      case 'admin': return 'System Admin Portal';
      default: return 'OtelCiro Platform';
    }
  };

  const getRoleDescription = () => {
    switch (role) {
      case 'hotel_manager': return 'Access your Property Management System';
      case 'travel_agency': return 'Search and book hotel inventory';
      case 'admin': return 'Manage platform users and settings';
      default: return 'Multi-tenant Hotel Platform';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => setShowRoleSelector(true)}
            className="mb-4 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Change Role
          </Button>
          <CardTitle className="text-2xl font-bold text-primary">{getRoleTitle()}</CardTitle>
          <CardDescription>{getRoleDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button 
                onClick={signIn} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder={role === 'travel_agency' ? 'Agency Name' : 'Hotel/Organization Name'}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Select 
                  value={role} 
                  onValueChange={(value) => setRole(value as 'hotel_manager' | 'travel_agency' | 'admin')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel_manager">Hotel Manager</SelectItem>
                    <SelectItem value="travel_agency">Travel Agency</SelectItem>
                    <SelectItem value="admin">System Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={signUp} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;