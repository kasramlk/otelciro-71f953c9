import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Home, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Settings,
  Calendar,
  DollarSign,
  Users,
  Bell
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface AirbnbConnection {
  status: 'connected' | 'disconnected' | 'pending' | 'error';
  accountInfo?: {
    userId: string;
    username: string;
    listingsCount: number;
    totalBookings: number;
  };
  lastSync?: string;
  settings: {
    autoSync: boolean;
    syncRates: boolean;
    syncAvailability: boolean;
    syncRestrictions: boolean;
    syncInterval: number; // in minutes
  };
}

const initialConnection: AirbnbConnection = {
  status: 'disconnected',
  settings: {
    autoSync: true,
    syncRates: true,
    syncAvailability: true,
    syncRestrictions: true,
    syncInterval: 30
  }
};

export const AirbnbIntegration: React.FC = () => {
  const { toast } = useToast();
  const [connection, setConnection] = useState<AirbnbConnection>(initialConnection);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnection(prev => ({ ...prev, status: 'pending' }));

    // Simulate OAuth flow - in production this would redirect to Airbnb OAuth
    try {
      // Mock OAuth redirect URL construction
      const clientId = 'your-airbnb-client-id'; // This would come from secrets
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/airbnb/callback`);
      const scope = encodeURIComponent('read:listings read:reservations write:availability write:pricing');
      const state = Math.random().toString(36).substring(2);
      
      // Store state for verification
      sessionStorage.setItem('airbnb_oauth_state', state);
      
      const oauthUrl = `https://www.airbnb.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
      
      // In production, this would redirect to Airbnb
      // window.location.href = oauthUrl;
      
      // For demo purposes, simulate successful connection
      setTimeout(() => {
        setConnection(prev => ({
          ...prev,
          status: 'connected',
          accountInfo: {
            userId: 'airbnb_123456789',
            username: 'Your Hotel Airbnb',
            listingsCount: 5,
            totalBookings: 147
          },
          lastSync: new Date().toISOString()
        }));
        setIsConnecting(false);
        
        toast({
          title: "Airbnb Connected",
          description: "Successfully connected to your Airbnb account",
        });
      }, 3000);
      
    } catch (error) {
      setConnection(prev => ({ ...prev, status: 'error' }));
      setIsConnecting(false);
      
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Airbnb. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = () => {
    setConnection(initialConnection);
    toast({
      title: "Airbnb Disconnected",
      description: "Successfully disconnected from Airbnb",
      variant: "destructive"
    });
  };

  const handleSync = async () => {
    if (connection.status !== 'connected') return;
    
    setConnection(prev => ({ ...prev, lastSync: new Date().toISOString() }));
    
    toast({
      title: "Sync Complete",
      description: "Airbnb data has been synchronized with your channel manager",
    });
  };

  const updateSettings = (key: keyof AirbnbConnection['settings'], value: any) => {
    setConnection(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
  };

  const getStatusIcon = () => {
    switch (connection.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (connection.status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Home className="h-8 w-8 text-red-500" />
          <div>
            <h2 className="text-2xl font-bold">Airbnb Integration</h2>
            <p className="text-muted-foreground">
              Connect your Airbnb listings to manage rates, availability, and restrictions
            </p>
          </div>
        </div>
        <Badge className={getStatusColor()}>
          {getStatusIcon()}
          <span className="ml-1 capitalize">{connection.status}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {connection.status === 'connected' && connection.accountInfo ? (
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="bg-muted/50 rounded p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Account:</span>
                    <span className="font-medium">{connection.accountInfo.username}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Listings:</span>
                    <span className="font-medium">{connection.accountInfo.listingsCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Bookings:</span>
                    <span className="font-medium">{connection.accountInfo.totalBookings}</span>
                  </div>
                </div>
                
                {connection.lastSync && (
                  <div className="text-xs text-muted-foreground">
                    Last synced: {new Date(connection.lastSync).toLocaleString()}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    className="flex-1"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Sync Now
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-muted-foreground">
                  Connect your Airbnb account to start syncing your listings
                </div>
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Home className="h-3 w-3 mr-2" />
                      Connect to Airbnb
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sync Settings
            </CardTitle>
            <CardDescription>
              Configure what data to sync with Airbnb
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-sync">Auto Sync</Label>
              <Switch
                id="auto-sync"
                checked={connection.settings.autoSync}
                onCheckedChange={(checked) => updateSettings('autoSync', checked)}
                disabled={connection.status !== 'connected'}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sync-rates">Rates</Label>
              <Switch
                id="sync-rates"
                checked={connection.settings.syncRates}
                onCheckedChange={(checked) => updateSettings('syncRates', checked)}
                disabled={connection.status !== 'connected'}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sync-availability">Availability</Label>
              <Switch
                id="sync-availability"
                checked={connection.settings.syncAvailability}
                onCheckedChange={(checked) => updateSettings('syncAvailability', checked)}
                disabled={connection.status !== 'connected'}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sync-restrictions">Restrictions</Label>
              <Switch
                id="sync-restrictions"
                checked={connection.settings.syncRestrictions}
                onCheckedChange={(checked) => updateSettings('syncRestrictions', checked)}
                disabled={connection.status !== 'connected'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
              <Input
                id="sync-interval"
                type="number"
                value={connection.settings.syncInterval}
                onChange={(e) => updateSettings('syncInterval', parseInt(e.target.value))}
                disabled={connection.status !== 'connected'}
                min="5"
                max="1440"
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Sync Statistics
            </CardTitle>
            <CardDescription>
              Recent sync activity and statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connection.status === 'connected' ? (
              <>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-1">
                    <Calendar className="h-6 w-6 mx-auto text-blue-500" />
                    <div className="text-2xl font-bold">147</div>
                    <div className="text-xs text-muted-foreground">Bookings Synced</div>
                  </div>
                  
                  <div className="space-y-1">
                    <DollarSign className="h-6 w-6 mx-auto text-green-500" />
                    <div className="text-2xl font-bold">95%</div>
                    <div className="text-xs text-muted-foreground">Rate Accuracy</div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Rate Sync:</span>
                      <span>2 min ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Availability Sync:</span>
                      <span>5 min ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sync Errors:</span>
                      <span className="text-green-600">0</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                Connect to Airbnb to view statistics
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};