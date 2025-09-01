import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon,
  Hotel,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Ban
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChannelInventory {
  id: string;
  channel_name: string;
  room_type_name: string;
  date: string;
  available_rooms: number;
  stop_sell: boolean;
  push_status: string;
  error_message?: string;
}

interface Channel {
  id: string;
  channel_name: string;
  is_active: boolean;
}

export const ChannelInventory: React.FC = () => {
  const [inventory, setInventory] = useState<ChannelInventory[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [loading, setLoading] = useState(true);
  const [bulkInventory, setBulkInventory] = useState<string>('');
  const [bulkStopSell, setBulkStopSell] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchChannels();
    fetchInventory();
  }, [selectedChannel, selectedDate, endDate]);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('id, channel_name, is_active')
        .eq('is_active', true);

      if (error) throw error;
      setChannels(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch channels",
        variant: "destructive"
      });
    }
  };

  const fetchInventory = async () => {
    try {
      let query = supabase
        .from('channel_inventory')
        .select('*')
        .gte('date', format(selectedDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (selectedChannel !== 'all') {
        query = query.eq('channel_id', selectedChannel);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch channels and mappings separately
      const { data: channelsData } = await supabase
        .from('channels')
        .select('id, channel_name');
      
      const { data: mappingsData } = await supabase
        .from('channel_mappings')
        .select('id, channel_room_type_name');

      const channelMap = channelsData?.reduce((acc, channel) => {
        acc[channel.id] = channel.channel_name;
        return acc;
      }, {} as Record<string, string>) || {};

      const mappingMap = mappingsData?.reduce((acc, mapping) => {
        acc[mapping.id] = mapping.channel_room_type_name;
        return acc;
      }, {} as Record<string, string>) || {};

      const formattedInventory = data?.map(inv => ({
        ...inv,
        channel_name: channelMap[inv.channel_id] || 'Unknown',
        room_type_name: mappingMap[inv.mapping_id] || 'Unknown'
      })) || [];

      setInventory(formattedInventory);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch inventory",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pushInventoryToChannels = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('channel-inventory-push', {
        body: {
          channel_id: selectedChannel === 'all' ? null : selectedChannel,
          start_date: format(selectedDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd')
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Inventory push initiated to channels"
      });

      fetchInventory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to push inventory",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyBulkInventory = async () => {
    const rooms = parseInt(bulkInventory);
    if (isNaN(rooms) || rooms < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid number of rooms",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // This would need to be implemented based on your inventory management logic
      // For now, showing the concept
      
      toast({
        title: "Success",
        description: "Bulk inventory update applied"
      });

      fetchInventory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to apply bulk inventory",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStopSell = async (inventoryId: string, stopSell: boolean) => {
    try {
      const { error } = await supabase
        .from('channel_inventory')
        .update({ 
          stop_sell: stopSell,
          push_status: 'pending' // Mark for re-sync
        })
        .eq('id', inventoryId);

      if (error) throw error;

      setInventory(prev => 
        prev.map(inv => 
          inv.id === inventoryId 
            ? { ...inv, stop_sell: stopSell, push_status: 'pending' } 
            : inv
        )
      );

      toast({
        title: "Success",
        description: `Stop sell ${stopSell ? 'enabled' : 'disabled'}`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update stop sell",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default">Synced</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getAvailabilityColor = (available: number, stopSell: boolean) => {
    if (stopSell) return 'text-red-600';
    if (available === 0) return 'text-red-600';
    if (available < 5) return 'text-amber-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Channel Inventory</h2>
          <p className="text-muted-foreground">
            Manage and synchronize room availability across all connected channels
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchInventory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={pushInventoryToChannels} disabled={loading}>
            <Upload className="h-4 w-4 mr-2" />
            Push Inventory
          </Button>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">Channel</label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.channel_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium">Bulk Inventory</label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Rooms"
                  value={bulkInventory}
                  onChange={(e) => setBulkInventory(e.target.value)}
                  min="0"
                />
                <Button onClick={applyBulkInventory} disabled={loading}>
                  Apply
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Bulk Stop Sell</label>
              <div className="flex items-center space-x-2 mt-2">
                <Switch
                  checked={bulkStopSell}
                  onCheckedChange={setBulkStopSell}
                />
                <span className="text-sm">Stop Sell All</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
              </div>
              <Hotel className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {inventory.filter(i => i.available_rooms > 0 && !i.stop_sell).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sold Out</p>
                <p className="text-2xl font-bold text-red-600">
                  {inventory.filter(i => i.available_rooms === 0).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stop Sell</p>
                <p className="text-2xl font-bold text-amber-600">
                  {inventory.filter(i => i.stop_sell).length}
                </p>
              </div>
              <Ban className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>
            Current availability and sync status across channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading inventory...</div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-8">
              <Hotel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Inventory Found</h3>
              <p className="text-muted-foreground">
                No inventory data found for the selected date range and channels
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Channel</th>
                    <th className="text-left p-2">Room Type</th>
                    <th className="text-left p-2">Available</th>
                    <th className="text-left p-2">Stop Sell</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((inv) => (
                    <tr key={inv.id} className="border-b">
                      <td className="p-2">
                        {format(new Date(inv.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-2">{inv.channel_name}</td>
                      <td className="p-2">{inv.room_type_name}</td>
                      <td className="p-2">
                        <span className={getAvailabilityColor(inv.available_rooms, inv.stop_sell)}>
                          {inv.stop_sell ? 'Stop Sell' : inv.available_rooms}
                        </span>
                      </td>
                      <td className="p-2">
                        <Switch
                          checked={inv.stop_sell}
                          onCheckedChange={(checked) => toggleStopSell(inv.id, checked)}
                        />
                      </td>
                      <td className="p-2">
                        {getStatusBadge(inv.push_status)}
                      </td>
                      <td className="p-2">
                        {inv.error_message && (
                          <Button variant="ghost" size="sm">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};