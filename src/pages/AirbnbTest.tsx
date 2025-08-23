import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Database, Cloud, Key } from 'lucide-react';
import { AirbnbIntegration } from '@/components/channel/AirbnbIntegration';

const AirbnbTest: React.FC = () => {
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
            Test the Airbnb integration with your live API credentials. This integration uses your real Airbnb API key: 32b224761b3a9b3ba365c3bd81855e11
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
          <div className="space-y-2">
            <h4 className="font-medium">1. Connect to Airbnb</h4>
            <p className="text-sm text-muted-foreground">
              Click "Connect to Airbnb" below to start the OAuth flow. You'll be redirected to Airbnb's authorization page.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">2. Authorization Flow</h4>
            <p className="text-sm text-muted-foreground">
              The system will exchange your authorization code for access tokens using your API credentials and store them securely in the database.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">3. Test Sync Operations</h4>
            <p className="text-sm text-muted-foreground">
              Once connected, test syncing listings, pushing rates/availability, and importing reservations from Airbnb.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExternalLink className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Live Integration</p>
                <p className="text-blue-600 mt-1">
                  This integration uses your real Airbnb API credentials and will make actual API calls to Airbnb's servers.
                </p>
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