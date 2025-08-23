import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  ExternalLink
} from 'lucide-react';
import { airbnbService } from '@/lib/services/airbnb-service';

interface AirbnbConnection {
  id: string;
  account_name: string;
  account_id: string;
  last_sync: string | null;
  sync_status: string;
  is_active: boolean;
}

interface AirbnbListing {
  id: string;
  airbnb_listing_id: string;
  airbnb_listing_name: string;
  room_type_id: string;
  sync_rates: boolean;
  sync_availability: boolean;
  sync_restrictions: boolean;
  is_active: boolean;
}

export const AirbnbIntegration: React.FC = () => {
  const [connection, setConnection] = useState<AirbnbConnection | null>(null);
  const [listings, setListings] = useState<AirbnbListing[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Mock hotel ID - in real app this would come from context
  const hotelId = 'mock-hotel-id';

  useEffect(() => {
    loadConnectionStatus();
  }, []);

  const loadConnectionStatus = async () => {
    try {
      const connectionData = await airbnbService.getConnectionStatus(hotelId);
      if (connectionData) {
        setConnection(connectionData);
        await loadListings();
      }
    } catch (error) {
      console.error('Error loading connection status:', error);
    }
  };

  const loadListings = async () => {
    try {
      const listingsData = await airbnbService.getListings(hotelId);
      setListings(listingsData);
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  };

  const handleConnect = () => {
    try {
      setIsConnecting(true);
      const authUrl = airbnbService.startOAuthFlow(hotelId);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error starting OAuth flow:', error);
      toast({
        title: "Connection Error",
        description: "Failed to start Airbnb connection process.",
        variant: "destructive"
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;

    try {
      const success = await airbnbService.disconnect(connection.id);
      if (success) {
        setConnection(null);
        setListings([]);
        toast({
          title: "Disconnected",
          description: "Successfully disconnected from Airbnb.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect from Airbnb.",
        variant: "destructive"
      });
    }
  };

  const handleSync = async (syncType: 'listings' | 'rates' | 'availability' | 'reservations') => {
    if (!connection) return;

    try {
      setIsSyncing(true);
      let result;

      switch (syncType) {
        case 'listings':
          result = await airbnbService.syncListings(connection.id);
          break;
        case 'rates':
          const startDate = new Date().toISOString().split('T')[0];
          const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          result = await airbnbService.syncRates(connection.id, startDate, endDate);
          break;
        case 'availability':
          const availStartDate = new Date().toISOString().split('T')[0];
          const availEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          result = await airbnbService.syncAvailability(connection.id, availStartDate, availEndDate);
          break;
        case 'reservations':
          result = await airbnbService.importReservations(connection.id);
          break;
      }

      toast({
        title: "Sync Completed",
        description: `${syncType} sync completed successfully. Processed: ${result.processed || result.imported || 0}`,
        variant: "default"
      });

      if (syncType === 'listings') {
        await loadListings();
      }
    } catch (error) {
      console.error(`Error syncing ${syncType}:`, error);
      toast({
        title: "Sync Error",
        description: `Failed to sync ${syncType}.`,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleListingSettingsChange = async (listingId: string, field: string, value: any) => {
    try {
      const settings = { [field]: value };
      await airbnbService.updateSyncSettings(listingId, settings);
      
      // Update local state
      setListings(prev => 
        prev.map(listing => 
          listing.id === listingId 
            ? { ...listing, [field]: value }
            : listing
        )
      );

      toast({
        title: "Settings Updated",
        description: "Listing sync settings updated successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update listing settings.",
        variant: "destructive"
      });
    }
  };

  const getConnectionStatusIcon = () => {
    if (!connection) return <WifiOff className="h-5 w-5 text-muted-foreground" />;
    if (connection.sync_status === 'synced') return <Wifi className="h-5 w-5 text-green-500" />;
    if (connection.sync_status === 'error') return <AlertTriangle className="h-5 w-5 text-red-500" />;
    return <RefreshCw className="h-5 w-5 text-yellow-500" />;
  };

  const getConnectionStatusBadge = () => {
    if (!connection) return <Badge variant="secondary">Not Connected</Badge>;
    if (connection.sync_status === 'synced') return <Badge className="bg-green-500">Connected</Badge>;
    if (connection.sync_status === 'error') return <Badge variant="destructive">Error</Badge>;
    return <Badge variant="outline">Connecting</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            {getConnectionStatusIcon()}
            <div>
              <CardTitle className="text-xl">Airbnb Integration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect your hotel to Airbnb for seamless rate and availability sync
              </p>
            </div>
          </div>
          {getConnectionStatusBadge()}
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Connection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {connection ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Account</Label>
                  <p className="text-sm text-muted-foreground">{connection.account_name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Last Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    {connection.last_sync 
                      ? new Date(connection.last_sync).toLocaleString()
                      : 'Never'
                    }
                  </p>
                </div>
                <Button 
                  onClick={handleDisconnect} 
                  variant="destructive" 
                  size="sm"
                  className="w-full"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect to your Airbnb account to start syncing rates and availability.
                </p>
                <Button 
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Connect to Airbnb
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync Controls Card */}
        {connection && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5" />
                <span>Sync Controls</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => handleSync('listings')}
                disabled={isSyncing}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Sync Listings
              </Button>
              <Button 
                onClick={() => handleSync('rates')}
                disabled={isSyncing}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Push Rates
              </Button>
              <Button 
                onClick={() => handleSync('availability')}
                disabled={isSyncing}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Push Availability
              </Button>
              <Button 
                onClick={() => handleSync('reservations')}
                disabled={isSyncing}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Import Reservations
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sync Statistics Card */}
        {connection && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm">Active Listings</Label>
                <p className="text-2xl font-bold">{listings.filter(l => l.is_active).length}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Total Listings</Label>
                <p className="text-2xl font-bold">{listings.length}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Sync Status</Label>
                <Badge variant={connection.sync_status === 'synced' ? 'default' : 'secondary'}>
                  {connection.sync_status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Listings Management */}
      {connection && listings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Listings Management</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure sync settings for each Airbnb listing
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {listings.map((listing) => (
                <div key={listing.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{listing.airbnb_listing_name}</h4>
                      <p className="text-sm text-muted-foreground">ID: {listing.airbnb_listing_id}</p>
                    </div>
                    <Badge variant={listing.is_active ? 'default' : 'secondary'}>
                      {listing.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={listing.sync_rates}
                        onCheckedChange={(value) => handleListingSettingsChange(listing.id, 'sync_rates', value)}
                      />
                      <Label className="text-sm">Sync Rates</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={listing.sync_availability}
                        onCheckedChange={(value) => handleListingSettingsChange(listing.id, 'sync_availability', value)}
                      />
                      <Label className="text-sm">Sync Availability</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={listing.sync_restrictions}
                        onCheckedChange={(value) => handleListingSettingsChange(listing.id, 'sync_restrictions', value)}
                      />
                      <Label className="text-sm">Sync Restrictions</Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};