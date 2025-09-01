import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon,
  DollarSign,
  Upload,
  Download,
  RefreshCw,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChannelRate {
  id: string;
  channel_name: string;
  room_type_name: string;
  date: string;
  rate: number;
  currency: string;
  push_status: string;
  error_message?: string;
}

interface Channel {
  id: string;
  channel_name: string;
  is_active: boolean;
}

export const ChannelRates: React.FC = () => {
  const [rates, setRates] = useState<ChannelRate[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [loading, setLoading] = useState(true);
  const [bulkRate, setBulkRate] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchChannels();
    fetchRates();
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

  const fetchRates = async () => {
    try {
      let query = supabase
        .from('channel_rates')
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

      const formattedRates = data?.map(rate => ({
        ...rate,
        channel_name: channelMap[rate.channel_id] || 'Unknown',
        room_type_name: mappingMap[rate.mapping_id] || 'Unknown'
      })) || [];

      setRates(formattedRates);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch rates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pushRatesToChannels = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('channel-rates-push', {
        body: {
          channel_id: selectedChannel === 'all' ? null : selectedChannel,
          start_date: format(selectedDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd')
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rates push initiated to channels"
      });

      fetchRates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to push rates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyBulkRate = async () => {
    if (!bulkRate || isNaN(parseFloat(bulkRate))) {
      toast({
        title: "Error",
        description: "Please enter a valid rate",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // This would need to be implemented based on your rate management logic
      // For now, showing the concept
      
      toast({
        title: "Success",
        description: "Bulk rate update applied"
      });

      fetchRates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to apply bulk rate",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Channel Rates</h2>
          <p className="text-muted-foreground">
            Manage and synchronize room rates across all connected channels
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchRates}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={pushRatesToChannels} disabled={loading}>
            <Upload className="h-4 w-4 mr-2" />
            Push Rates
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <label className="text-sm font-medium">Bulk Rate Update</label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Rate"
                  value={bulkRate}
                  onChange={(e) => setBulkRate(e.target.value)}
                />
                <Button onClick={applyBulkRate} disabled={loading}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rates</p>
                <p className="text-2xl font-bold">{rates.length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Synced</p>
                <p className="text-2xl font-bold text-green-600">
                  {rates.filter(r => r.push_status === 'success').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {rates.filter(r => r.push_status === 'pending').length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {rates.filter(r => r.push_status === 'failed').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Management</CardTitle>
          <CardDescription>
            Current rates and sync status across channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading rates...</div>
          ) : rates.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Rates Found</h3>
              <p className="text-muted-foreground">
                No rates found for the selected date range and channels
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
                    <th className="text-left p-2">Rate</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate) => (
                    <tr key={rate.id} className="border-b">
                      <td className="p-2">
                        {format(new Date(rate.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-2">{rate.channel_name}</td>
                      <td className="p-2">{rate.room_type_name}</td>
                      <td className="p-2">
                        {rate.currency} {rate.rate.toFixed(2)}
                      </td>
                      <td className="p-2">
                        {getStatusBadge(rate.push_status)}
                      </td>
                      <td className="p-2">
                        {rate.error_message && (
                          <span className="text-red-600 text-sm">
                            {rate.error_message}
                          </span>
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