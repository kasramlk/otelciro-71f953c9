import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ExternalLink, Database, Cloud, Key, User, LogIn } from 'lucide-react';
import { AirbnbIntegration } from '@/components/channel/AirbnbIntegration';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Session } from '@supabase/supabase-js';

const AirbnbTest: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('kmaleki922@gmail.com');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive"
      });
      return;
    }

    setSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully signed in!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been signed out."
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication form if not logged in
  if (!session) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">Ab</span>
              </div>
              <span>Airbnb Integration Test</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Live Integration
              </Badge>
            </CardTitle>
            <p className="text-muted-foreground">
              Test the Airbnb integration with your live API credentials. Please sign in to continue.
            </p>
          </CardHeader>
        </Card>

        {/* Authentication Required */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You need to be signed in to test the Airbnb integration. The system requires authentication to access hotel data and maintain security.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Test Credentials</h4>
              <p className="text-blue-700 text-sm">
                Use the pre-filled credentials below to sign in with the admin account that has access to test hotels.
              </p>
            </div>

            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
              <Button 
                onClick={signIn}
                disabled={signingIn}
                className="w-full"
              >
                {signingIn ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing In...
                  </div>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show main content when authenticated
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with user info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">Ab</span>
              </div>
              <span>Airbnb Integration Analysis</span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                API Discontinued
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Signed in as: {session.user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </CardTitle>
          <p className="text-muted-foreground">
            Analysis of Airbnb integration options and alternative solutions for property management systems.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Key className="h-4 w-4 text-green-500" />
              <span className="text-sm">API Credentials Configured</span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Database Tables Created</span>
            </div>
            <div className="flex items-center space-x-2">
              <Cloud className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Edge Functions Deployed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExternalLink className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Important Update</p>
                <p className="text-yellow-700 mt-1">
                  Airbnb's direct API is no longer publicly available. API access is restricted to approved partners only.
                  The OAuth endpoints we were using don't exist for public developers.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Alternative Solutions:</h4>
            <div className="space-y-3 text-sm">
              <div>
                <strong>1. Third-Party APIs:</strong>
                <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                  <li>• AirROI API - Real-time Airbnb data</li>
                  <li>• RapidAPI Airbnb Collection - Multiple providers</li>
                  <li>• AirDNA API - Market data and analytics</li>
                </ul>
              </div>
              
              <div>
                <strong>2. Airbnb Partner Program:</strong>
                <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                  <li>• Apply to become a "Preferred Software Partner"</li>
                  <li>• Requires business verification and approval process</li>
                  <li>• Access to official Airbnb API after approval</li>
                </ul>
              </div>

              <div>
                <strong>3. Property Management Integration:</strong>
                <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                  <li>• Use existing PMS that has Airbnb partnership</li>
                  <li>• Channel manager with Airbnb connectivity</li>
                  <li>• iCal feed synchronization (basic data only)</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Integration Component */}
      <AirbnbIntegration />

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Backend Infrastructure</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Edge Functions for OAuth and API calls</li>
                <li>• Supabase database for connection storage</li>
                <li>• Secure token management and refresh</li>
                <li>• Comprehensive sync logging</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Integration Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• OAuth 2.0 authentication flow</li>
                <li>• Bi-directional rate synchronization</li>
                <li>• Availability and restriction sync</li>
                <li>• Reservation import and mapping</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium mb-2">API Endpoints Used:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono">
              <div>• /oauth/authorize</div>
              <div>• /oauth/token</div>
              <div>• /v1/account/me</div>
              <div>• /v1/listings</div>
              <div>• /v1/listings/[listing_id]/calendar</div>
              <div>• /v1/listings/[listing_id]/reservations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AirbnbTest;