import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useBeds24Auth } from '@/hooks/use-beds24-auth';

interface Beds24AuthDemoProps {
  organizationId: string;
}

/**
 * Demo component showing Beds24 authentication integration
 * 
 * This component demonstrates:
 * - Setting up Beds24 integration with invite code
 * - Making authenticated API calls
 * - Handling rate limits and errors
 * - Real-time auth status monitoring
 */
export function Beds24AuthDemo({ organizationId }: Beds24AuthDemoProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [deviceName, setDeviceName] = useState('OtelCiro Demo');
  const [apiResults, setApiResults] = useState<any>(null);

  const { 
    authState, 
    setupIntegration, 
    makeApiCall, 
    getAuthDetails,
    clearAuth 
  } = useBeds24Auth({ organizationId });

  const handleSetup = async () => {
    if (!inviteCode.trim()) return;
    
    const success = await setupIntegration(inviteCode, deviceName);
    if (success) {
      setInviteCode('');
    }
  };

  const handleGetProperties = async () => {
    const properties = await makeApiCall('/properties');
    setApiResults(properties);
  };

  const handleGetAuthDetails = async () => {
    const details = await getAuthDetails();
    setApiResults(details);
  };

  const getStatusBadge = () => {
    if (authState.isLoading) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading
        </Badge>
      );
    }

    if (authState.error) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    }

    if (authState.isAuthenticated) {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Connected
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Not Connected
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Beds24 Authentication
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            Secure integration with Beds24 API using invite codes and auto-refresh tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!authState.isAuthenticated && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite Code</Label>
                <Input
                  id="inviteCode"
                  placeholder="Enter your Beds24 invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name (Optional)</Label>
                <Input
                  id="deviceName"
                  placeholder="e.g., OtelCiro Production"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleSetup} 
                disabled={!inviteCode.trim() || authState.isLoading}
                className="w-full"
              >
                {authState.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Setup Integration
              </Button>
            </div>
          )}

          {authState.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{authState.error}</p>
            </div>
          )}

          {authState.rateLimits && (
            <div className="p-3 bg-muted rounded-md">
              <h4 className="text-sm font-medium mb-2">Rate Limits</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="ml-1 font-medium">
                    {authState.rateLimits.fiveMinRemaining ?? 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Resets in:</span>
                  <span className="ml-1 font-medium">
                    {authState.rateLimits.fiveMinResetsIn ?? 'N/A'}s
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="ml-1 font-medium">
                    {authState.rateLimits.requestCost ?? 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {authState.isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle>API Testing</CardTitle>
            <CardDescription>
              Test authenticated API calls to Beds24
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleGetProperties}
                disabled={authState.isLoading}
                variant="outline"
              >
                Get Properties
              </Button>
              
              <Button
                onClick={handleGetAuthDetails}
                disabled={authState.isLoading}
                variant="outline"
              >
                Get Auth Details
              </Button>
              
              <Button
                onClick={clearAuth}
                variant="destructive"
                size="sm"
              >
                Clear Auth
              </Button>
            </div>

            {apiResults && (
              <div className="space-y-2">
                <Label>API Response:</Label>
                <pre className="p-3 bg-muted rounded-md text-xs overflow-auto max-h-64">
                  {JSON.stringify(apiResults, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>
            Code examples for integrating Beds24 auth in your components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-3 bg-muted rounded-md text-xs overflow-auto">
{`// Basic usage with React hook
import { useBeds24Auth } from '@/hooks/use-beds24-auth';

const MyComponent = () => {
  const { makeApiCall, authState } = useBeds24Auth({
    organizationId: 'your-org-id'
  });

  const fetchProperties = async () => {
    const properties = await makeApiCall('/properties');
    console.log(properties);
  };

  return (
    <div>
      <p>Status: {authState.isAuthenticated ? 'Connected' : 'Disconnected'}</p>
      <button onClick={fetchProperties}>Get Properties</button>
    </div>
  );
};

// Direct API calls without hooks
import { beds24Fetch } from '@/lib/services/beds24-auth-client';

const properties = await beds24Fetch('/properties', {
  organizationId: 'your-org-id'
});

// Create a booking
const booking = await beds24Fetch('/bookings', {
  method: 'POST',
  organizationId: 'your-org-id',
  body: {
    propertyId: 'prop-123',
    roomId: 'room-456',
    // ... booking data
  }
});`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}