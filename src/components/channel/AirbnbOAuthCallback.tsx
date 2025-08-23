import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { airbnbService } from '@/lib/services/airbnb-service';

interface OAuthCallbackState {
  status: 'processing' | 'success' | 'error';
  message: string;
  details?: string;
}

export const AirbnbOAuthCallback: React.FC = () => {
  const [callbackState, setCallbackState] = useState<OAuthCallbackState>({
    status: 'processing',
    message: 'Processing your Airbnb connection...'
  });
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth errors
      if (error) {
        setCallbackState({
          status: 'error',
          message: 'Connection Failed',
          details: errorDescription || `OAuth error: ${error}`
        });
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setCallbackState({
          status: 'error',
          message: 'Invalid callback parameters',
          details: 'Missing authorization code or state parameter'
        });
        return;
      }

      // Extract hotel ID from state
      const hotelId = state.split('_').pop() || 'mock-hotel-id';

      setCallbackState({
        status: 'processing',
        message: 'Exchanging authorization code for access token...'
      });

      // Exchange code for tokens using the service
      const connection = await airbnbService.handleOAuthCallback(code, state, hotelId);

      setCallbackState({
        status: 'processing',
        message: 'Fetching Airbnb listings...'
      });

      // Sync listings from Airbnb
      if (connection.accountId) {
        await airbnbService.syncListings(connection.accountId);
      }

      setCallbackState({
        status: 'success',
        message: 'Successfully connected to Airbnb!',
        details: `Connected to ${connection.accountName}`
      });

      toast({
        title: "Connection Successful",
        description: `Successfully connected to Airbnb account: ${connection.accountName}`,
        variant: "default"
      });

      // Redirect after success
      setTimeout(() => {
        navigate('/channel-manager');
      }, 2000);

    } catch (error) {
      console.error('OAuth callback error:', error);
      setCallbackState({
        status: 'error',
        message: 'Connection Failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });

      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Failed to connect to Airbnb',
        variant: "destructive"
      });
    }
  };

  const handleRetry = () => {
    navigate('/channel-manager');
  };

  const handleContinue = () => {
    navigate('/channel-manager');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex flex-col items-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {getIcon()}
            </motion.div>
            <span className="text-xl">Airbnb Connection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <h3 className={`text-lg font-semibold ${getStatusColor()}`}>
              {callbackState.message}
            </h3>
            {callbackState.details && (
              <p className="text-sm text-muted-foreground">
                {callbackState.details}
              </p>
            )}
          </div>

          {callbackState.status === 'processing' && (
            <div className="space-y-2">
              <Progress value={66} className="w-full" />
              <p className="text-xs text-center text-muted-foreground">
                Please wait while we connect your account...
              </p>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            {callbackState.status === 'success' && (
              <Button onClick={handleContinue} className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" />
                Continue to Channel Manager
              </Button>
            )}

            {callbackState.status === 'error' && (
              <Button onClick={handleRetry} variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Integrations
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};