import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Settings, 
  Database, 
  Key, 
  Clock, 
  Save, 
  TestTube,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Monitor,
  Activity
} from 'lucide-react';

interface Beds24Config {
  id?: string;
  hotel_id?: string;
  beds24_property_id?: string;
  sync_enabled: boolean;
  sync_frequency: number;
  auto_sync_calendar: boolean;
  auto_sync_bookings: boolean;
  auto_sync_messages: boolean;
  auto_push_updates: boolean;
  config_data: any;
}

interface Hotel {
  id: string;
  name: string;
  code: string;
}

interface RateLimit {
  request_timestamp: string;
  five_min_credits_remaining: number;
  daily_credits_remaining: number;
  request_cost: number;
}

export const Beds24AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [config, setConfig] = useState<Beds24Config>({
    sync_enabled: false,
    sync_frequency: 3600,
    auto_sync_calendar: true,
    auto_sync_bookings: true,
    auto_sync_messages: false,
    auto_push_updates: false,
    config_data: {}
  });
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  useEffect(() => {
    fetchHotels();
    fetchConfig();
    fetchRateLimits();
  }, []);

  const fetchHotels = async () => {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('id, name, code');

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error('Failed to fetch hotels:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('beds24_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const fetchRateLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('beds24_rate_limits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRateLimits(data || []);
    } catch (error) {
      console.error('Failed to fetch rate limits:', error);
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('unknown');

    try {
      const { data, error } = await supabase.functions.invoke('beds24-sync', {
        body: {
          operation: 'sync_properties'
        }
      });

      if (error) throw error;

      setConnectionStatus('connected');
      toast.success('Connection test successful');
      
      // Refresh rate limits after test
      setTimeout(() => {
        fetchRateLimits();
      }, 1000);

    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      toast.error(`Connection test failed: ${error.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const saveConfig = async () => {
    setLoading(true);

    try {
      const configData = {
        ...config,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('beds24_config')
        .upsert(configData, { onConflict: 'hotel_id' });

      if (error) throw error;

      toast.success('Configuration saved successfully');
      
    } catch (error: any) {
      console.error('Failed to save config:', error);
      toast.error(`Failed to save configuration: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'error':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline"><Monitor className="w-3 h-3 mr-1" />Unknown</Badge>;
    }
  };

  const getCurrentRateLimit = () => {
    if (rateLimits.length === 0) return null;
    return rateLimits[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beds24 Administration</h1>
          <p className="text-muted-foreground">
            Configure and manage Beds24 API integration settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={testConnection}
            disabled={testingConnection}
            variant="outline"
          >
            {testingConnection ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>
          <Button onClick={saveConfig} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Connection Status
            {getConnectionStatusBadge()}
          </CardTitle>
          <CardDescription>
            Current status of your Beds24 API connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="text-sm text-muted-foreground">API Endpoint</Label>
              <div className="font-mono text-sm">https://api.beds24.com/v2</div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">5-Min Credits</Label>
              <div className="font-mono text-sm">
                {getCurrentRateLimit()?.five_min_credits_remaining ?? 'N/A'}
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Daily Credits</Label>
              <div className="font-mono text-sm">
                {getCurrentRateLimit()?.daily_credits_remaining ?? 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="sync">Sync Settings</TabsTrigger>
          <TabsTrigger value="mapping">Hotel Mapping</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Configure your Beds24 API credentials and basic settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  API tokens are securely stored in Supabase secrets. The current token is configured and ready for use.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="property-id">Beds24 Property ID</Label>
                  <Input
                    id="property-id"
                    placeholder="Enter your Beds24 property ID"
                    value={config.beds24_property_id || ''}
                    onChange={(e) => setConfig({ ...config, beds24_property_id: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    The main property ID from your Beds24 account
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow data synchronization with Beds24
                    </p>
                  </div>
                  <Switch
                    checked={config.sync_enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, sync_enabled: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Settings</CardTitle>
              <CardDescription>
                Configure automatic synchronization preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="sync-frequency">Sync Frequency (hours)</Label>
                <Input
                  id="sync-frequency"
                  type="number"
                  min="1"
                  max="24"
                  value={config.sync_frequency / 3600}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    sync_frequency: parseInt(e.target.value) * 3600 
                  })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  How often to automatically sync data (1-24 hours)
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Auto-Sync Options</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Calendar & Rates (ARI)</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync availability, rates, and restrictions
                    </p>
                  </div>
                  <Switch
                    checked={config.auto_sync_calendar}
                    onCheckedChange={(checked) => setConfig({ ...config, auto_sync_calendar: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Bookings & Reservations</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically import new bookings from channels
                    </p>
                  </div>
                  <Switch
                    checked={config.auto_sync_bookings}
                    onCheckedChange={(checked) => setConfig({ ...config, auto_sync_bookings: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Guest Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync guest communication
                    </p>
                  </div>
                  <Switch
                    checked={config.auto_sync_messages}
                    onCheckedChange={(checked) => setConfig({ ...config, auto_sync_messages: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Updates to Beds24</Label>
                    <p className="text-sm text-muted-foreground">
                      Send PMS changes back to Beds24 (two-way sync)
                    </p>
                  </div>
                  <Switch
                    checked={config.auto_push_updates}
                    onCheckedChange={(checked) => setConfig({ ...config, auto_push_updates: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hotel Property Mapping</CardTitle>
              <CardDescription>
                Map your PMS hotels to Beds24 properties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hotel-select">Select Hotel</Label>
                <select
                  id="hotel-select"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={config.hotel_id || ''}
                  onChange={(e) => setConfig({ ...config, hotel_id: e.target.value })}
                >
                  <option value="">Select a hotel...</option>
                  {hotels.map((hotel) => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.name} ({hotel.code})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose which hotel this Beds24 integration belongs to
                </p>
              </div>

              {config.hotel_id && (
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    This integration will sync data for the selected hotel. Make sure your Beds24 property ID corresponds to this hotel.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Usage Monitoring</CardTitle>
              <CardDescription>
                Monitor your Beds24 API usage and rate limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Current Rate Limits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getCurrentRateLimit() ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>5-min credits:</span>
                            <span className="font-mono">{getCurrentRateLimit()?.five_min_credits_remaining}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Daily credits:</span>
                            <span className="font-mono">{getCurrentRateLimit()?.daily_credits_remaining}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Last request cost:</span>
                            <span className="font-mono">{getCurrentRateLimit()?.request_cost}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No usage data available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {rateLimits.slice(0, 5).map((limit, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{new Date(limit.request_timestamp).toLocaleTimeString()}</span>
                            <span className="font-mono">-{limit.request_cost}</span>
                          </div>
                        ))}
                        {rateLimits.length === 0 && (
                          <p className="text-sm text-muted-foreground">No recent activity</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    Beds24 API has rate limits: 1000 requests per 5 minutes and 10,000 requests per day. 
                    The system automatically manages these limits to prevent service interruption.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};