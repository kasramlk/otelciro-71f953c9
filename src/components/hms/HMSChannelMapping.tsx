import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Settings, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Globe,
  Link,
  Edit,
  Trash2,
  Cable,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHMSStore } from "@/stores/hms-store";
import { useToast } from "@/hooks/use-toast";

interface ChannelMapping {
  id: string;
  channelName: string;
  channelType: 'OTA' | 'GDS' | 'Direct' | 'Metasearch';
  status: 'Connected' | 'Disconnected' | 'Error' | 'Syncing';
  lastSync: string;
  roomTypeMappings: {
    hotelRoomType: string;
    channelRoomType: string;
    ratePlanMappings: {
      hotelRatePlan: string;
      channelRatePlan: string;
    }[];
  }[];
  syncSettings: {
    rates: boolean;
    availability: boolean;
    restrictions: boolean;
    inventory: boolean;
  };
  connectionDetails: {
    endpoint?: string;
    username?: string;
    hotelId?: string;
    propertyId?: string;
  };
}

// Mock data
const mockChannelMappings: ChannelMapping[] = [
  {
    id: '1',
    channelName: 'Booking.com',
    channelType: 'OTA',
    status: 'Connected',
    lastSync: '2024-01-15 14:30:00',
    roomTypeMappings: [
      {
        hotelRoomType: 'Standard Double',
        channelRoomType: 'Double Room',
        ratePlanMappings: [
          { hotelRatePlan: 'BAR', channelRatePlan: 'Best Available Rate' },
          { hotelRatePlan: 'NRF', channelRatePlan: 'Non-Refundable' }
        ]
      }
    ],
    syncSettings: {
      rates: true,
      availability: true,
      restrictions: true,
      inventory: true
    },
    connectionDetails: {
      endpoint: 'https://supply-xml.booking.com/hotels/xml/',
      username: 'hotel_user_123',
      hotelId: 'HTL_001'
    }
  },
  {
    id: '2',
    channelName: 'Expedia',
    channelType: 'OTA',
    status: 'Error',
    lastSync: '2024-01-15 12:15:00',
    roomTypeMappings: [
      {
        hotelRoomType: 'Standard Double',
        channelRoomType: 'Standard Room, 1 Double Bed',
        ratePlanMappings: [
          { hotelRatePlan: 'BAR', channelRatePlan: 'Room Only' }
        ]
      }
    ],
    syncSettings: {
      rates: true,
      availability: true,
      restrictions: false,
      inventory: true
    },
    connectionDetails: {
      endpoint: 'https://ws.expediaquickconnect.com/',
      username: 'exp_user_456',
      hotelId: 'EXP_HTL_002'
    }
  },
  {
    id: '3',
    channelName: 'Airbnb',
    channelType: 'OTA',
    status: 'Disconnected',
    lastSync: '2024-01-14 18:45:00',
    roomTypeMappings: [],
    syncSettings: {
      rates: false,
      availability: false,
      restrictions: false,
      inventory: false
    },
    connectionDetails: {
      endpoint: 'https://api.airbnb.com/v2/',
      propertyId: 'AIR_PROP_789'
    }
  }
];

export const HMSChannelMapping = () => {
  const [channelMappings, setChannelMappings] = useState<ChannelMapping[]>(mockChannelMappings);
  const [selectedChannel, setSelectedChannel] = useState<ChannelMapping | null>(null);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { addAuditEntry } = useHMSStore();
  const { toast } = useToast();

  // Filter channels based on search and status
  const filteredChannels = useMemo(() => {
    return channelMappings.filter(channel => {
      const matchesSearch = channel.channelName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || channel.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [channelMappings, searchQuery, statusFilter]);

  const handleSyncChannel = async (channelId: string) => {
    const channel = channelMappings.find(c => c.id === channelId);
    if (!channel) return;

    setChannelMappings(prev => prev.map(c => 
      c.id === channelId ? { ...c, status: 'Syncing' as const } : c
    ));

    // Simulate sync process
    setTimeout(() => {
      setChannelMappings(prev => prev.map(c => 
        c.id === channelId 
          ? { ...c, status: 'Connected' as const, lastSync: new Date().toLocaleString() }
          : c
      ));
      
      addAuditEntry('Channel Sync', `Manual sync triggered for ${channel.channelName}`);
      toast({ title: `${channel.channelName} synced successfully` });
    }, 2000);
  };

  const handleTestConnection = async (channelId: string) => {
    const channel = channelMappings.find(c => c.id === channelId);
    if (!channel) return;

    toast({ title: `Testing connection to ${channel.channelName}...` });
    
    // Simulate connection test
    setTimeout(() => {
      const isSuccess = Math.random() > 0.3; // 70% success rate
      if (isSuccess) {
        toast({ title: `Connection to ${channel.channelName} successful` });
      } else {
        toast({ 
          title: `Connection to ${channel.channelName} failed`,
          description: "Please check connection settings",
          variant: "destructive"
        });
      }
    }, 1500);
  };

  const getStatusIcon = (status: ChannelMapping['status']) => {
    switch (status) {
      case 'Connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'Disconnected':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: ChannelMapping['status']) => {
    switch (status) {
      case 'Connected':
        return 'bg-green-500';
      case 'Error':
        return 'bg-red-500';
      case 'Syncing':
        return 'bg-blue-500';
      case 'Disconnected':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Channel Mapping</h1>
          <p className="text-muted-foreground">Manage room type and rate plan mappings across channels</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddChannel(true)}
            className="bg-gradient-primary text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Channel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="connected">Connected</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="disconnected">Disconnected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChannels.map((channel) => (
          <Card key={channel.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Globe className="h-8 w-8 text-primary" />
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(channel.status)} rounded-full border-2 border-white`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{channel.channelName}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {channel.channelType}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(channel.status)}
                  <Badge variant={channel.status === 'Connected' ? 'default' : 'destructive'}>
                    {channel.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Last sync: {channel.lastSync}
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Sync Settings</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-1 ${channel.syncSettings.rates ? 'text-green-600' : 'text-red-600'}`}>
                    {channel.syncSettings.rates ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Rates
                  </div>
                  <div className={`flex items-center gap-1 ${channel.syncSettings.availability ? 'text-green-600' : 'text-red-600'}`}>
                    {channel.syncSettings.availability ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Availability
                  </div>
                  <div className={`flex items-center gap-1 ${channel.syncSettings.restrictions ? 'text-green-600' : 'text-red-600'}`}>
                    {channel.syncSettings.restrictions ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Restrictions
                  </div>
                  <div className={`flex items-center gap-1 ${channel.syncSettings.inventory ? 'text-green-600' : 'text-red-600'}`}>
                    {channel.syncSettings.inventory ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Inventory
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSyncChannel(channel.id)}
                  disabled={channel.status === 'Syncing'}
                  className="flex-1"
                >
                  {channel.status === 'Syncing' ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Sync
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedChannel(channel)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Channel Details Dialog */}
      {selectedChannel && (
        <Dialog open={!!selectedChannel} onOpenChange={() => setSelectedChannel(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {selectedChannel.channelName} - Channel Configuration
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="mappings" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="mappings">Room Mappings</TabsTrigger>
                <TabsTrigger value="connection">Connection</TabsTrigger>
                <TabsTrigger value="sync">Sync Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="mappings" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Room Type Mappings</h3>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Mapping
                  </Button>
                </div>

                {selectedChannel.roomTypeMappings.length > 0 ? (
                  <div className="space-y-4">
                    {selectedChannel.roomTypeMappings.map((mapping, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label className="text-sm font-medium">Hotel Room Type</Label>
                              <div className="mt-1 p-2 bg-muted rounded text-sm">{mapping.hotelRoomType}</div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Channel Room Type</Label>
                              <div className="mt-1 p-2 bg-muted rounded text-sm">{mapping.channelRoomType}</div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-2 block">Rate Plan Mappings</Label>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Hotel Rate Plan</TableHead>
                                  <TableHead>Channel Rate Plan</TableHead>
                                  <TableHead className="w-20">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {mapping.ratePlanMappings.map((ratePlan, rpIndex) => (
                                  <TableRow key={rpIndex}>
                                    <TableCell>{ratePlan.hotelRatePlan}</TableCell>
                                    <TableCell>{ratePlan.channelRatePlan}</TableCell>
                                    <TableCell>
                                      <Button size="sm" variant="ghost">
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No room type mappings configured</p>
                    <Button className="mt-2" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Create First Mapping
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="connection" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">API Endpoint</Label>
                    <Input
                      id="endpoint"
                      value={selectedChannel.connectionDetails.endpoint || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username/ID</Label>
                    <Input
                      id="username"
                      value={selectedChannel.connectionDetails.username || selectedChannel.connectionDetails.propertyId || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleTestConnection(selectedChannel.id)}
                    className="flex-1"
                  >
                    <Cable className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Settings
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="sync" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Sync Configuration</Label>
                    {Object.entries(selectedChannel.syncSettings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded">
                        <span className="capitalize">{key}</span>
                        <Badge variant={value ? 'default' : 'secondary'}>
                          {value ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Sync Status</Label>
                    <div className="p-4 border rounded">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(selectedChannel.status)}
                        <span className="font-medium">{selectedChannel.status}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Last successful sync: {selectedChannel.lastSync}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Channel Dialog */}
      <Dialog open={showAddChannel} onOpenChange={setShowAddChannel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channelName">Channel Name</Label>
              <Input id="channelName" placeholder="e.g., Booking.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channelType">Channel Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select channel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OTA">OTA</SelectItem>
                  <SelectItem value="GDS">GDS</SelectItem>
                  <SelectItem value="Direct">Direct</SelectItem>
                  <SelectItem value="Metasearch">Metasearch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpoint">API Endpoint</Label>
              <Input id="endpoint" placeholder="https://api.example.com" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddChannel(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowAddChannel(false);
                toast({ title: "Channel added successfully" });
              }}>
                Add Channel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};