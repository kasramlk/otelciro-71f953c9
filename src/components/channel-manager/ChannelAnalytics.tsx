import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChannelPerformance {
  channel_name: string;
  reservations: number;
  revenue: number;
  adr: number;
  commission: number;
  conversion_rate: number;
}

interface TimeSeriesData {
  date: string;
  reservations: number;
  revenue: number;
}

export const ChannelAnalytics: React.FC = () => {
  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformance[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      // Fetch channel performance data
      const { data: performanceData, error: performanceError } = await supabase
        .from('channel_reservations')
        .select(`
          *,
          channels (channel_name)
        `);

      if (performanceError) throw performanceError;

      // Process performance data
      const channelStats: { [key: string]: ChannelPerformance } = {};
      
      performanceData?.forEach(reservation => {
        const channelName = reservation.channels?.channel_name || 'Unknown';
        
        if (!channelStats[channelName]) {
          channelStats[channelName] = {
            channel_name: channelName,
            reservations: 0,
            revenue: 0,
            adr: 0,
            commission: 0,
            conversion_rate: 0
          };
        }
        
        channelStats[channelName].reservations += 1;
        channelStats[channelName].revenue += reservation.total_amount || 0;
        channelStats[channelName].commission += reservation.commission_amount || 0;
      });

      // Calculate ADR for each channel
      Object.keys(channelStats).forEach(channel => {
        const stats = channelStats[channel];
        stats.adr = stats.reservations > 0 ? stats.revenue / stats.reservations : 0;
        // Mock conversion rate for now
        stats.conversion_rate = Math.random() * 0.1 + 0.02;
      });

      setChannelPerformance(Object.values(channelStats));

      // Generate mock time series data
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      const timeData: TimeSeriesData[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        timeData.push({
          date: date.toISOString().split('T')[0],
          reservations: Math.floor(Math.random() * 20) + 5,
          revenue: Math.floor(Math.random() * 5000) + 1000
        });
      }
      
      setTimeSeriesData(timeData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalReservations = channelPerformance.reduce((sum, channel) => sum + channel.reservations, 0);
  const totalRevenue = channelPerformance.reduce((sum, channel) => sum + channel.revenue, 0);
  const totalCommission = channelPerformance.reduce((sum, channel) => sum + channel.commission, 0);
  const averageADR = channelPerformance.length > 0 
    ? channelPerformance.reduce((sum, channel) => sum + channel.adr, 0) / channelPerformance.length 
    : 0;

  const pieChartData = channelPerformance.map(channel => ({
    name: channel.channel_name,
    value: channel.reservations,
    revenue: channel.revenue
  }));

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Channel Analytics</h2>
          <p className="text-muted-foreground">
            Performance insights across all connected channels
          </p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reservations</p>
                <p className="text-2xl font-bold">{totalReservations}</p>
                <p className="text-xs text-green-600">+12% vs last period</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">USD {totalRevenue.toFixed(0)}</p>
                <p className="text-xs text-green-600">+8% vs last period</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average ADR</p>
                <p className="text-2xl font-bold">USD {averageADR.toFixed(0)}</p>
                <p className="text-xs text-red-600">-2% vs last period</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Commission</p>
                <p className="text-2xl font-bold">USD {totalCommission.toFixed(0)}</p>
                <p className="text-xs text-amber-600">+5% vs last period</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Revenue Trend</span>
            </CardTitle>
            <CardDescription>Daily revenue across all channels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Channel Distribution</span>
            </CardTitle>
            <CardDescription>Reservation distribution by channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
          <CardDescription>
            Detailed performance metrics for each channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {channelPerformance.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Data Available</h3>
              <p className="text-muted-foreground">
                No performance data found for the selected period
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Channel</th>
                    <th className="text-left p-2">Reservations</th>
                    <th className="text-left p-2">Revenue</th>
                    <th className="text-left p-2">ADR</th>
                    <th className="text-left p-2">Commission</th>
                    <th className="text-left p-2">Conversion Rate</th>
                    <th className="text-left p-2">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {channelPerformance.map((channel) => {
                    const marketShare = totalReservations > 0 
                      ? (channel.reservations / totalReservations * 100) 
                      : 0;
                    
                    return (
                      <tr key={channel.channel_name} className="border-b">
                        <td className="p-2">
                          <div className="font-medium">{channel.channel_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {marketShare.toFixed(1)}% market share
                          </div>
                        </td>
                        <td className="p-2">{channel.reservations}</td>
                        <td className="p-2">USD {channel.revenue.toFixed(0)}</td>
                        <td className="p-2">USD {channel.adr.toFixed(0)}</td>
                        <td className="p-2">USD {channel.commission.toFixed(0)}</td>
                        <td className="p-2">{(channel.conversion_rate * 100).toFixed(2)}%</td>
                        <td className="p-2">
                          <Badge 
                            variant={
                              marketShare > 30 ? "default" : 
                              marketShare > 15 ? "secondary" : 
                              "outline"
                            }
                          >
                            {marketShare > 30 ? "High" : marketShare > 15 ? "Medium" : "Low"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reservations Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Reservations Trend</span>
          </CardTitle>
          <CardDescription>Daily reservation volume across all channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="reservations" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};