import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Calendar, 
  DollarSign, 
  Hotel, 
  BarChart3,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChannelConnection } from './ChannelConnection';
import { ChannelMappings } from './ChannelMappings';
import { ChannelRates } from './ChannelRates';
import { ChannelInventory } from './ChannelInventory';
import { ChannelReservations } from './ChannelReservations';
import { ChannelAnalytics } from './ChannelAnalytics';

interface Channel {
  id: string;
  channel_name: string;
  channel_type: string;
  is_active: boolean;
  sync_enabled: boolean;
  last_sync_at: string | null;
}

export const ChannelManagerDashboard: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChannels(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch channels",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    toast({
      title: "Sync Started",
      description: "Syncing all active channels..."
    });

    try {
      const { error } = await supabase.functions.invoke('channel-sync', {
        body: { operation: 'sync_all' }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Channel sync initiated successfully"
      });
      
      fetchChannels();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sync channels",
        variant: "destructive"
      });
    }
  };

  const getChannelStatusBadge = (channel: Channel) => {
    if (!channel.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (channel.sync_enabled) {
      return <Badge variant="default">Syncing</Badge>;
    }
    return <Badge variant="outline">Connected</Badge>;
  };

  const connectedChannels = channels.filter(c => c.is_active).length;
  const syncingChannels = channels.filter(c => c.sync_enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Channel Manager</h1>
          <p className="text-muted-foreground">
            Manage your distribution channels and synchronize rates, inventory, and reservations
          </p>
        </div>
        <Button onClick={handleSyncAll} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync All
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Channels</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channels.length}</div>
            <p className="text-xs text-muted-foreground">
              {connectedChannels} connected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sync</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncingChannels}</div>
            <p className="text-xs text-muted-foreground">
              Auto-syncing channels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {channels.some(c => c.last_sync_at) ? 'Recent' : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              Sync status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Channels</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {channels.filter(c => c.channel_type === 'OTA').length}
            </div>
            <p className="text-xs text-muted-foreground">
              OTA connections
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Channel List */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Channels</CardTitle>
          <CardDescription>
            Overview of all your channel connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading channels...</div>
            ) : channels.length === 0 ? (
              <div className="text-center py-8">
                <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Channels Connected</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your first channel to start managing your distribution
                </p>
                <Button onClick={() => setActiveTab('connections')}>
                  Connect Channel
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channels.map((channel) => (
                  <Card key={channel.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{channel.channel_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {channel.channel_type}
                          </p>
                        </div>
                        {getChannelStatusBadge(channel)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className={channel.is_active ? 'text-green-600' : 'text-red-600'}>
                            {channel.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Auto Sync:</span>
                          <span>{channel.sync_enabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Sync:</span>
                          <span>
                            {channel.last_sync_at 
                              ? new Date(channel.last_sync_at).toLocaleTimeString()
                              : 'Never'
                            }
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="mappings">Mappings</TabsTrigger>
          <TabsTrigger value="rates">Rates</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ChannelAnalytics />
        </TabsContent>

        <TabsContent value="connections">
          <ChannelConnection onChannelConnected={fetchChannels} />
        </TabsContent>

        <TabsContent value="mappings">
          <ChannelMappings />
        </TabsContent>

        <TabsContent value="rates">
          <ChannelRates />
        </TabsContent>

        <TabsContent value="inventory">
          <ChannelInventory />
        </TabsContent>

        <TabsContent value="reservations">
          <ChannelReservations />
        </TabsContent>
      </Tabs>
    </div>
  );
};