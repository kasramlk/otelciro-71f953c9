import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  RefreshCw, 
  Plus, 
  Settings, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Zap,
  Globe,
  Building2
} from "lucide-react";
import { useBeds24Connections, useBeds24Properties, useBeds24Channels, usePushInventory } from "@/hooks/use-beds24";

interface Beds24ChannelManagerProps {
  hotelId: string;
}

export function Beds24ChannelManager({ hotelId }: Beds24ChannelManagerProps) {
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [pushData, setPushData] = useState({
    roomTypeId: "",
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    availability: 10,
    rate: 100,
  });

  // Beds24 data hooks
  const { data: connections = [] } = useBeds24Connections(hotelId);
  const activeConnection = connections.find(c => c.is_active);
  
  const { data: properties = [] } = useBeds24Properties(activeConnection?.id || '');
  const { data: channels = [] } = useBeds24Channels(selectedProperty || properties[0]?.id || '');
  
  const pushInventory = usePushInventory();

  const handlePushInventory = async () => {
    if (!selectedProperty && !properties[0]?.id) return;
    
    const propertyId = selectedProperty || properties[0].id;
    const inventoryData = {
      roomTypeId: pushData.roomTypeId || 'default',
      dateRange: { from: pushData.dateFrom, to: pushData.dateTo },
      availability: pushData.availability,
      rates: { 'rate1': pushData.rate },
    };

    await pushInventory.mutateAsync({ 
      connectionId: activeConnection?.id || '',
      propertyId, 
      inventoryData 
    });
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

  if (!activeConnection) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Beds24 Connection</h3>
          <p className="text-muted-foreground text-center mb-6">
            Connect to Beds24 to manage your distribution channels.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Setup Beds24 Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Channel Manager</h2>
          <p className="text-muted-foreground">
            Manage your distribution channels and sync inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {properties.length} Properties
          </Badge>
          <Badge variant="outline">
            {channels.length} Channels
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Push</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-6">
          {/* Channel Status Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Channels</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {channels.filter(c => c.is_active).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {channels.length} total
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
                  {channels.filter(c => c.sync_status === 'synced').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Up to date
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {channels.filter(c => c.sync_status === 'error').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Need attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commission</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(channels.reduce((sum, c) => sum + c.commission_rate, 0) / channels.length || 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Channels Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => (
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
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        disabled={pushInventory.isPending}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Push
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                      >
                        <Settings className="h-3 w-3" />
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
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Push Inventory & Rates</CardTitle>
              <CardDescription>
                Send rates and availability to your distribution channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">Date From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={pushData.dateFrom}
                    onChange={(e) => setPushData(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">Date To</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={pushData.dateTo}
                    onChange={(e) => setPushData(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability</Label>
                  <Input
                    id="availability"
                    type="number"
                    min="0"
                    value={pushData.availability}
                    onChange={(e) => setPushData(prev => ({ ...prev, availability: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Rate (USD)</Label>
                  <Input
                    id="rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={pushData.rate}
                    onChange={(e) => setPushData(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                  />
                </div>
              </div>

              <Separator />

              <Button 
                onClick={handlePushInventory}
                disabled={pushInventory.isPending}
                className="w-full"
              >
                {pushInventory.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                <Zap className="h-4 w-4 mr-2" />
                Push to All Channels
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>
                Monitor your channel distribution performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          channelTypeColors[channel.channel_type as keyof typeof channelTypeColors] || 'bg-gray-500'
                        }`} 
                      />
                      <div>
                        <p className="font-medium">{channel.channel_name}</p>
                        <p className="text-sm text-muted-foreground">{channel.channel_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{channel.commission_rate}%</p>
                      <p className="text-sm text-muted-foreground">Commission</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}