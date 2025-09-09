import { useState, useEffect } from "react";
import { useHotelContext } from "@/hooks/use-hotel-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Plus,
  Settings,
  Zap,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChannelConnectionDialog } from "./ChannelConnectionDialog";
import { ChannelSyncLogs } from "./ChannelSyncLogs";
import { RatePushQueue } from "./RatePushQueue";
import { InboundReservations } from "./InboundReservations";

interface ChannelConnection {
  id: string;
  channel_name: string;
  channel_type: string;
  connection_status: string;
  last_sync_at: string;
  rate_push_enabled: boolean;
  availability_push_enabled: boolean;
  receive_reservations: boolean;
}

interface SyncStats {
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  pending_rate_pushes: number;
  pending_reservations: number;
}

export function ChannelManagerDashboard() {
  const { selectedHotelId } = useHotelContext();
  const { toast } = useToast();
  const [channels, setChannels] = useState<ChannelConnection[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats>({
    total_syncs: 0,
    successful_syncs: 0,
    failed_syncs: 0,
    pending_rate_pushes: 0,
    pending_reservations: 0
  });
  const [loading, setLoading] = useState(true);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    if (selectedHotelId) {
      fetchData();
    }
  }, [selectedHotelId]);

  const fetchData = async () => {
    if (!selectedHotelId) return;

    setLoading(true);
    try {
      // Fetch channels
      const { data: channelsData, error: channelsError } = await supabase
        .from('channel_connections')
        .select('*')
        .eq('hotel_id', selectedHotelId)
        .order('created_at', { ascending: false });

      if (channelsError) throw channelsError;
      setChannels(channelsData || []);

      // Fetch sync stats
      const { data: syncLogsData, error: syncLogsError } = await supabase
        .from('channel_sync_logs')
        .select(`
          sync_status,
          channel_connections!inner(hotel_id)
        `)
        .eq('channel_connections.hotel_id', selectedHotelId);

      if (syncLogsError) throw syncLogsError;

      const { data: queueData, error: queueError } = await supabase
        .from('rate_push_queue')
        .select('status')
        .eq('hotel_id', selectedHotelId)
        .eq('status', 'pending');

      if (queueError) throw queueError;

      const { data: inboundData, error: inboundError } = await supabase
        .from('inbound_reservations')
        .select('processing_status')
        .eq('hotel_id', selectedHotelId)
        .eq('processing_status', 'pending');

      if (inboundError) throw inboundError;

      // Calculate stats
      const totalSyncs = syncLogsData?.length || 0;
      const successfulSyncs = syncLogsData?.filter(log => log.sync_status === 'success').length || 0;
      const failedSyncs = syncLogsData?.filter(log => log.sync_status === 'error').length || 0;

      setSyncStats({
        total_syncs: totalSyncs,
        successful_syncs: successfulSyncs,
        failed_syncs: failedSyncs,
        pending_rate_pushes: queueData?.length || 0,
        pending_reservations: inboundData?.length || 0
      });

    } catch (error) {
      console.error('Error fetching channel data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch channel data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (channelId: string, syncType: string) => {
    setSyncing(channelId);
    try {
      const { data, error } = await supabase.functions.invoke('channel-manager', {
        body: {
          hotelId: selectedHotelId,
          channelId,
          syncType
        }
      });

      if (error) throw error;

      toast({
        title: "Sync Initiated",
        description: `${syncType} sync started for channel`
      });

      // Refresh data after a short delay
      setTimeout(fetchData, 2000);

    } catch (error) {
      console.error('Error syncing channel:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to initiate channel sync",
        variant: "destructive"
      });
    } finally {
      setSyncing(null);
    }
  };

  const handleFullSync = async () => {
    setSyncing('all');
    try {
      const { data, error } = await supabase.functions.invoke('channel-manager', {
        body: {
          hotelId: selectedHotelId,
          syncType: 'full_sync'
        }
      });

      if (error) throw error;

      toast({
        title: "Full Sync Initiated",
        description: "Full sync started for all channels"
      });

      setTimeout(fetchData, 2000);

    } catch (error) {
      console.error('Error syncing all channels:', error);
      toast({
        title: "Full Sync Failed",
        description: "Failed to initiate full sync",
        variant: "destructive"
      });
    } finally {
      setSyncing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getChannelTypeIcon = (type: string) => {
    switch (type) {
      case 'beds24':
        return <Activity className="h-4 w-4" />;
      case 'gds':
        return <Zap className="h-4 w-4" />;
      case 'ota':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Channel Manager</h1>
          <p className="text-muted-foreground">Manage real-time distribution and reservations</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowConnectionDialog(true)}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Channel
          </Button>
          <Button
            onClick={handleFullSync}
            disabled={syncing === 'all'}
          >
            {syncing === 'all' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Full Sync
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Channels</p>
                <p className="text-2xl font-bold text-foreground">
                  {channels.filter(c => c.connection_status === 'active').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Successful Syncs</p>
                <p className="text-2xl font-bold text-success">{syncStats.successful_syncs}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Syncs</p>
                <p className="text-2xl font-bold text-destructive">{syncStats.failed_syncs}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Pushes</p>
                <p className="text-2xl font-bold text-warning">{syncStats.pending_rate_pushes}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Reservations</p>
                <p className="text-2xl font-bold text-info">{syncStats.pending_reservations}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels List */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Channels</CardTitle>
        </CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Channels Connected</h3>
              <p className="text-muted-foreground mb-4">
                Connect your first distribution channel to start pushing rates and receiving reservations.
              </p>
              <Button onClick={() => setShowConnectionDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Channel
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {channels.map((channel) => (
                <div key={channel.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getChannelTypeIcon(channel.channel_type)}
                      <div>
                        <h3 className="font-medium text-foreground">{channel.channel_name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{channel.channel_type} Channel</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(channel.connection_status)}
                      {channel.rate_push_enabled && (
                        <Badge variant="outline" className="text-xs">Rate Push</Badge>
                      )}
                      {channel.availability_push_enabled && (
                        <Badge variant="outline" className="text-xs">Availability</Badge>
                      )}
                      {channel.receive_reservations && (
                        <Badge variant="outline" className="text-xs">Reservations</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {channel.last_sync_at && (
                      <p className="text-xs text-muted-foreground">
                        Last sync: {new Date(channel.last_sync_at).toLocaleDateString()}
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync(channel.id, 'rate_push')}
                      disabled={syncing === channel.id}
                    >
                      {syncing === channel.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        "Sync Rates"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync(channel.id, 'reservation_pull')}
                      disabled={syncing === channel.id}
                    >
                      Pull Reservations
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="sync-logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sync-logs">Sync Logs</TabsTrigger>
          <TabsTrigger value="rate-queue">Rate Push Queue</TabsTrigger>
          <TabsTrigger value="inbound-reservations">Inbound Reservations</TabsTrigger>
        </TabsList>

        <TabsContent value="sync-logs">
          <ChannelSyncLogs hotelId={selectedHotelId} />
        </TabsContent>

        <TabsContent value="rate-queue">
          <RatePushQueue hotelId={selectedHotelId} />
        </TabsContent>

        <TabsContent value="inbound-reservations">
          <InboundReservations hotelId={selectedHotelId} />
        </TabsContent>
      </Tabs>

      {/* Connection Dialog */}
      <ChannelConnectionDialog
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
        hotelId={selectedHotelId}
        onSuccess={fetchData}
      />
    </div>
  );
}