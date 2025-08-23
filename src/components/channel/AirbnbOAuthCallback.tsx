import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface OAuthCallbackState {
  status: 'processing' | 'success' | 'error';
  message: string;
  details?: string;
}

export const AirbnbOAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [callbackState, setCallbackState] = useState<OAuthCallbackState>({
    status: 'processing',
    message: 'Processing Airbnb authentication...'
  });

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract OAuth parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for OAuth errors
        if (error) {
          setCallbackState({
            status: 'error',
            message: 'Authentication failed',
            details: errorDescription || `Error: ${error}`
          });
          return;
        }

        // Verify state parameter to prevent CSRF attacks
        const storedState = sessionStorage.getItem('airbnb_oauth_state');
        if (!state || state !== storedState) {
          setCallbackState({
            status: 'error',
            message: 'Security validation failed',
            details: 'Invalid state parameter. This could indicate a security issue.'
          });
          return;
        }

        // Clean up stored state
        sessionStorage.removeItem('airbnb_oauth_state');

        if (!code) {
          setCallbackState({
            status: 'error',
            message: 'No authorization code received',
            details: 'The authorization code is required to complete the connection.'
          });
          return;
        }

        // Exchange authorization code for access token
        // In production, this would call your backend API which would:
        // 1. Exchange the code for an access token
        // 2. Store the tokens securely
        // 3. Return connection status
        
        setCallbackState({
          status: 'processing',
          message: 'Exchanging authorization code for access token...'
        });

        // Simulate API call to exchange code for tokens
        const tokenResponse = await fetch('/api/airbnb/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirectUri: `${window.location.origin}/auth/airbnb/callback`
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange authorization code');
        }

        const tokenData = await tokenResponse.json();

        // Fetch user profile to verify connection
        setCallbackState({
          status: 'processing',
          message: 'Verifying connection and fetching account details...'
        });

        // Simulate fetching user profile
        const profileResponse = await fetch('/api/airbnb/profile', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const profileData = await profileResponse.json();

        // Success - connection established
        setCallbackState({
          status: 'success',
          message: 'Successfully connected to Airbnb!',
          details: `Connected account: ${profileData.username || profileData.email}`
        });

        // Store connection info in localStorage or context
        localStorage.setItem('airbnb_connection', JSON.stringify({
          connected: true,
          userId: profileData.id,
          username: profileData.username,
          email: profileData.email,
          connectedAt: new Date().toISOString()
        }));

        toast({
          title: "Airbnb Connected",
          description: "Your Airbnb account has been successfully connected to the channel manager.",
        });

        // Redirect after a delay
        setTimeout(() => {
          navigate('/channel-manager/integrations');
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setCallbackState({
          status: 'error',
          message: 'Connection failed',
          details: error instanceof Error ? error.message : 'An unexpected error occurred'
        });

        toast({
          title: "Connection Failed",
          description: "Failed to connect to Airbnb. Please try again.",
          variant: "destructive"
        });
      }
    };

    processCallback();
  }, [searchParams, navigate, toast]);

  const handleRetry = () => {
    navigate('/channel-manager/integrations');
  };

  const handleContinue = () => {
    navigate('/channel-manager/integrations');
  };

  const getIcon = () => {
    switch (callbackState.status) {
      case 'processing':
        return <RefreshCw className="h-12 w-12 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-12 w-12 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (callbackState.status) {
      case 'processing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Home className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              Airbnb Integration
            </CardTitle>
            <CardDescription>
              Connecting your Airbnb account to the channel manager
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              {getIcon()}
              <div className="text-center space-y-2">
                <h3 className={`text-lg font-semibold ${getStatusColor()}`}>
                  {callbackState.message}
                </h3>
                {callbackState.details && (
                  <p className="text-sm text-muted-foreground">
                    {callbackState.details}
                  </p>
                )}
              </div>
            </div>

            {callbackState.status === 'processing' && (
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  This may take a few moments...
                </p>
              </div>
            )}

            {callbackState.status === 'success' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-green-800">Connection Successful</p>
                      <p className="text-green-600 mt-1">
                        You can now sync your listings, rates, and availability between your PMS and Airbnb.
                      </p>
                    </div>
                  </div>
                </div>
                <Button onClick={handleContinue} className="w-full">
                  Continue to Channel Manager
                </Button>
              </motion.div>
            )}

            {callbackState.status === 'error' && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-800">Connection Failed</p>
                      <p className="text-red-600 mt-1">
                        We couldn't complete the connection to your Airbnb account. Please try again.
                      </p>
                    </div>
                  </div>
                </div>
                <Button onClick={handleRetry} className="w-full">
                  Return to Integrations
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};