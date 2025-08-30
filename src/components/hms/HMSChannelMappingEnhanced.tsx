import { useState } from "react";
import { useChannelStore } from "@/stores/channel-store";
import { useBeds24Connections, useBeds24Properties, useBeds24Channels, useSyncBeds24Channels } from "@/hooks/use-beds24";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Plus, 
  Link2, 
  Zap, 
  Globe,
  Building2,
  Activity 
} from "lucide-react";

interface HMSChannelMappingEnhancedProps {
  hotelId: string;
}

export function HMSChannelMappingEnhanced({ hotelId }: HMSChannelMappingEnhancedProps) {
  const [activeTab, setActiveTab] = useState("beds24");
  
  const { 
    channelMappings, 
    publishQueue, 
    enqueuePublish, 
    processPublishQueue,
    isPublishing: false
  } = useChannelStore();

  // Beds24 data hooks
  const { data: connections = [] } = useBeds24Connections(hotelId);
  const activeConnection = connections.find(c => c.is_active && c.connection_status === 'active');
  
  const { data: properties = [] } = useBeds24Properties(activeConnection?.id || '');
  const syncChannels = useSyncBeds24Channels();

  // Get channels for the first property
  const { data: beds24Channels = [] } = useBeds24Channels(properties[0]?.id || '');

  const handleSyncChannels = async () => {
    if (properties[0]?.id) {
      await syncChannels.mutateAsync(properties[0].id);
    }
  };

  const channelTypeColors = {
    'OTA': 'bg-blue-500',
    'GDS': 'bg-green-500', 
    'Direct': 'bg-purple-500',
    'Metasearch': 'bg-orange-500',
    'Airbnb': 'bg-red-500',
    'Booking.com': 'bg-blue-600',
    'Expedia': 'bg-yellow-500',
    'Agoda': 'bg-pink-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Enhanced Channel Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage distribution channels via Beds24 and legacy systems
          </p>
        </div>
        {activeConnection && (
          <Button 
            onClick={handleSyncChannels}
            disabled={syncChannels.isPending}
            variant="outline"
          >
            {syncChannels.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All Channels
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="beds24">Beds24 Channels</TabsTrigger>
          <TabsTrigger value="legacy">Legacy Channels</TabsTrigger>
          <TabsTrigger value="queue">Publish Queue</TabsTrigger>
        </TabsList>

        {/* Beds24 Channels Tab */}
        <TabsContent value="beds24" className="space-y-6">
          {!activeConnection ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Beds24 Connection</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Connect to Beds24 to start managing your distribution channels.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect to Beds24
                </Button>
              </CardContent>
            </Card>
          ) : beds24Channels.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Channels Found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Sync with Beds24 to import your distribution channels.
                </p>
                <Button onClick={handleSyncChannels} disabled={syncChannels.isPending}>
                  {syncChannels.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Channels
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Channel Status Overview */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Channels</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {beds24Channels.filter(c => c.is_active).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      of {beds24Channels.length} total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Synced</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {beds24Channels.filter(c => c.sync_status === 'synced').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Up to date</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Errors</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      {beds24Channels.filter(c => c.sync_status === 'error').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Need attention</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(beds24Channels.reduce((sum, c) => sum + c.commission_rate, 0) / beds24Channels.length || 0).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Across all channels</p>
                  </CardContent>
                </Card>
              </div>

              {/* Beds24 Channels Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {beds24Channels.map((channel) => (
                  <Card key={channel.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className={`w-3 h-3 rounded-full ${
                              channelTypeColors[channel.channel_type as keyof typeof channelTypeColors] || 'bg-gray-500'
                            }`} 
                          />
                          <CardTitle className="text-base">{channel.channel_name}</CardTitle>
                        </div>
                        <Badge 
                          variant={
                            channel.sync_status === 'synced' ? 'default' : 
                            channel.sync_status === 'error' ? 'destructive' : 'secondary'
                          }
                        >
                          {channel.sync_status}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {channel.channel_type} • {channel.commission_rate}% commission
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <span className={`font-medium ${channel.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {channel.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Last sync: {channel.last_sync_at 
                              ? new Date(channel.last_sync_at).toLocaleString()
                              : 'Never'
                            }
                          </span>
                          <div className="flex items-center gap-1">
                            {channel.sync_status === 'syncing' ? (
                              <Clock className="h-3 w-3 animate-pulse" />
                            ) : channel.sync_status === 'synced' ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-destructive" />
                            )}
                          </div>
                        </div>

                        <Separator />

                        <div className="flex justify-between gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                        onClick={() => {
                          // Add to queue logic here
                        }}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Push Rates
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => enqueuePublish({
                              channelId: channel.id,
                              type: 'availability',
                              priority: 'normal',
                              data: { roomTypeId: 'all', dateRange: '7days' }
                            })}
                          >
                            <Building2 className="h-3 w-3 mr-1" />
                            Push Avail
                          </Button>
                        </div>

                        {/* Error Details */}
                        {channel.sync_errors && channel.sync_errors.length > 0 && (
                          <div className="mt-2 p-2 bg-destructive/10 rounded-md">
                            <p className="text-xs text-destructive">
                              {channel.sync_errors[0] || 'Sync error occurred'}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Legacy Channels Tab */}
        <TabsContent value="legacy" className="space-y-6">
          {channelMappings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Legacy Channels</h3>
                <p className="text-muted-foreground text-center">
                  Legacy channel mappings will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {channelMappings.map((mapping) => (
                <Card key={mapping.id} className="relative border-dashed opacity-70">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{mapping.channelName}</CardTitle>
                      <Badge variant="outline">Legacy</Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {mapping.channelType} • {mapping.roomsMapped} rooms mapped
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sync Progress</span>
                        <span className="font-medium">{mapping.lastSync}%</span>
                      </div>
                      <Progress value={mapping.lastSync} className="h-2" />
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Last sync: {new Date(mapping.lastSyncTime).toLocaleTimeString()}</span>
                        <div className="flex items-center gap-1">
                          {mapping.status === 'syncing' ? (
                            <Clock className="h-3 w-3" />
                          ) : mapping.status === 'connected' ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => enqueuePublish({
                            channelId: mapping.id,
                            type: 'rates',
                            priority: 'normal',
                            data: { roomTypeId: 'all', dateRange: '7days' }
                          })}
                        >
                          Push Rates
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => enqueuePublish({
                            channelId: mapping.id,
                            type: 'availability',
                            priority: 'normal',
                            data: { roomTypeId: 'all', dateRange: '7days' }
                          })}
                        >
                          Push Avail
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Publish Queue Tab */}
        <TabsContent value="queue" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Publish Queue</h3>
              <p className="text-sm text-muted-foreground">
                Monitor and manage pending rate/availability updates
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={processPublishQueue}
                disabled={publishQueue.length === 0 || isPublishing}
                variant="outline"
              >
                {isPublishing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Process Queue ({publishQueue.length})
              </Button>
            </div>
          </div>

          {publishQueue.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Queue Empty</h3>
                <p className="text-muted-foreground text-center">
                  No pending publish operations.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {publishQueue.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{item.type}</Badge>
                      <div>
                        <p className="font-medium">Channel: {item.channelId}</p>
                        <p className="text-sm text-muted-foreground">
                          Priority: {item.priority} • Created: {new Date(item.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          item.status === 'completed' ? 'default' :
                          item.status === 'failed' ? 'destructive' : 'secondary'
                        }
                      >
                        {item.status}
                      </Badge>
                      {item.status === 'processing' && (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}