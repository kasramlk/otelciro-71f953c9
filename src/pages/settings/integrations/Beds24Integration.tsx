import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ExternalLink, RefreshCw, Check, AlertTriangle, X, Activity } from 'lucide-react';
import { useBeds24Auth } from '@/hooks/use-beds24-auth';
import { toast } from 'sonner';

// Sparkline component for credit usage visualization
const CreditSparkline = ({ data }: { data: number[] }) => {
  if (!data.length) return <div className="w-20 h-6 bg-muted rounded" />;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  return (
    <div className="flex items-end gap-px h-6 w-20">
      {data.map((value, i) => (
        <div
          key={i}
          className="bg-primary/60 rounded-sm flex-1 min-w-[2px]"
          style={{ height: `${((value - min) / range) * 100}%` }}
        />
      ))}
    </div>
  );
};

interface CreditInfo {
  remaining: number;
  resetsIn: number;
  requestCost: number;
  timestamp: number;
}

export default function Beds24Integration() {
  const [inviteCode, setInviteCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [selectedOrg] = useState('550e8400-e29b-41d4-a716-446655440000'); // Default org
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [creditHistory, setCreditHistory] = useState<number[]>([]);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  
  const { authState, setupIntegration, makeApiCall } = useBeds24Auth({
    organizationId: selectedOrg
  });

  const handleConnect = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    const success = await setupIntegration(inviteCode, deviceName || undefined);
    if (success) {
      // Clear form on success
      setInviteCode('');
      setDeviceName('');
    }
  };

  const handleCheckConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const response = await makeApiCall('/accounts');
      
      if (response && authState.rateLimits) {
        const newCreditInfo: CreditInfo = {
          remaining: authState.rateLimits.fiveMinRemaining || 0,
          resetsIn: authState.rateLimits.fiveMinResetsIn || 0,
          requestCost: authState.rateLimits.requestCost || 0,
          timestamp: Date.now()
        };
        
        setCreditInfo(newCreditInfo);
        setCreditHistory(prev => [...prev.slice(-23), newCreditInfo.remaining]);
        
        toast.success('Connection test successful');
      }
    } catch (error) {
      toast.error('Connection test failed');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleRotateCredentials = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter a new invite code to rotate credentials');
      return;
    }

    const success = await setupIntegration(inviteCode, deviceName || undefined);
    if (success) {
      setInviteCode('');
      setDeviceName('');
      toast.success('Credentials rotated successfully');
    }
  };

  const getConnectionStatus = () => {
    if (authState.isLoading) return { status: 'loading', color: 'secondary', text: 'Connecting...' };
    if (authState.error) return { status: 'error', color: 'destructive', text: 'Connection Failed' };
    if (authState.isAuthenticated) {
      // Check if token expires soon (less than 60 minutes)
      const expiresWarning = creditInfo && creditInfo.resetsIn < 3600;
      return { 
        status: expiresWarning ? 'warning' : 'success', 
        color: expiresWarning ? 'warning' : 'success', 
        text: expiresWarning ? 'Expires Soon' : 'Connected' 
      };
    }
    return { status: 'disconnected', color: 'secondary', text: 'Not Connected' };
  };

  const connectionStatus = getConnectionStatus();

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Beds24 Integration</h1>
        <p className="text-muted-foreground">
          Connect your hotel to Beds24 for channel management, inventory sync, and booking processing.
        </p>
      </div>

      {/* Card 1: Connect */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Connect to Beds24
                <Badge variant={connectionStatus.color as any}>
                  {connectionStatus.status === 'loading' && <RefreshCw className="w-3 h-3 animate-spin mr-1" />}
                  {connectionStatus.status === 'success' && <Check className="w-3 h-3 mr-1" />}
                  {connectionStatus.status === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {connectionStatus.status === 'error' && <X className="w-3 h-3 mr-1" />}
                  {connectionStatus.text}
                </Badge>
              </CardTitle>
            </div>
          </div>
          <CardDescription>
            Use your Beds24 invite code to establish a secure connection. Your refresh token will be encrypted and stored server-side.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code *</Label>
              <Input
                id="inviteCode"
                placeholder="Enter your Beds24 invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                disabled={authState.isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceName">Device Name (Optional)</Label>
              <Input
                id="deviceName"
                placeholder="e.g., OtelCiro HMS"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                disabled={authState.isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Select value={selectedOrg} disabled>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="550e8400-e29b-41d4-a716-446655440000">Default Organization</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {authState.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{authState.error}</AlertDescription>
            </Alert>
          )}

          {authState.isAuthenticated && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Connected successfully. Refresh token stored securely (masked: ...{inviteCode.slice(-4)})
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleConnect} 
              disabled={authState.isLoading || !inviteCode.trim()}
              className="flex-1"
            >
              {authState.isLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              {authState.isAuthenticated ? 'Update Connection' : 'Exchange Code'}
            </Button>
            
            {authState.isAuthenticated && (
              <Button 
                variant="outline" 
                onClick={handleRotateCredentials}
                disabled={authState.isLoading || !inviteCode.trim()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Rotate Credentials
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Scopes & Linked Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Scopes & Linked Properties</CardTitle>
          <CardDescription>
            Understanding Beds24 API permissions and property access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">API Scopes Available</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                'bookings',
                'bookings-personal', 
                'bookings-financial',
                'inventory',
                'properties',
                'accounts'
              ].map((scope) => (
                <Badge key={scope} variant="secondary" className="justify-center">
                  {scope}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Linked Properties Concept</h4>
            <p className="text-sm text-muted-foreground">
              When you connect with Beds24, you can only access properties that have been explicitly linked to your API token. 
              This ensures secure, property-specific access control. Properties must be linked in your Beds24 account settings.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Token Limitations</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Access tokens expire in 24 hours and must be sent as 'token' header</p>
              <p>• Refresh tokens expire if unused for 30 days</p>
              <p>• Long-life tokens are read-only (bookings scope only)</p>
            </div>
          </div>

          <Button variant="outline" size="sm" asChild>
            <a href="https://wiki.beds24.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Beds24 Documentation
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Card 3: Status & Credits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Status & Credits
          </CardTitle>
          <CardDescription>
            Monitor your API connection status and rate limit usage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Button 
              onClick={handleCheckConnection}
              disabled={!authState.isAuthenticated || isCheckingConnection}
              variant="outline"
            >
              {isCheckingConnection && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Check Connection
            </Button>
            
            {creditInfo && (
              <div className="text-sm text-muted-foreground">
                Last checked: {new Date(creditInfo.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>

          {creditInfo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Remaining Credits (5-min)</span>
                  <CreditSparkline data={creditHistory} />
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(creditInfo.remaining / 1000) * 100} 
                    className="flex-1" 
                  />
                  <span className="text-sm font-mono">{creditInfo.remaining}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Resets In</span>
                <div className="text-lg font-mono">
                  {formatTimeRemaining(creditInfo.resetsIn)}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Last Request Cost</span>
                <div className="text-lg font-mono">
                  {creditInfo.requestCost} credits
                </div>
              </div>
            </div>
          )}

          {!creditInfo && authState.isAuthenticated && (
            <Alert>
              <AlertDescription>
                Click "Check Connection" to test your API connection and view current rate limits.
              </AlertDescription>
            </Alert>
          )}

          {!authState.isAuthenticated && (
            <Alert>
              <AlertDescription>
                Connect to Beds24 first to monitor your API status and credit usage.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}