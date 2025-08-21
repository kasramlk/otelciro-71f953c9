import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Percent,
  Users,
  Building2,
  Target
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart, Line } from "recharts";

interface ChannelAnalysisProps {
  dateRange?: DateRange;
  selectedHotel: string;
}

export const ChannelAnalysis = ({ dateRange, selectedHotel }: ChannelAnalysisProps) => {
  // Channel performance data
  const { data: channelData } = useQuery({
    queryKey: ["channelAnalysis", dateRange, selectedHotel],
    queryFn: async () => {
      let query = supabase
        .from("reservations")
        .select(`
          *,
          channels(name, channel_type, commission_rate),
          guests(first_name, last_name)
        `);

      if (dateRange?.from && dateRange?.to) {
        query = query
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString());
      }

      if (selectedHotel !== "all") {
        query = query.eq("hotel_id", selectedHotel);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Analyze by channel
      const channelAnalysis = data?.reduce((acc, res) => {
        const channelName = res.channels?.name || 'Direct';
        const channelType = res.channels?.channel_type || 'Direct';
        const commissionRate = res.channels?.commission_rate || 0;

        if (!acc[channelName]) {
          acc[channelName] = {
            name: channelName,
            type: channelType,
            reservations: 0,
            revenue: 0,
            avgDailyRate: 0,
            commissionRate: commissionRate,
            totalCommission: 0,
            guests: new Set()
          };
        }

        acc[channelName].reservations++;
        acc[channelName].revenue += res.total_amount || 0;
        acc[channelName].totalCommission += (res.total_amount || 0) * (commissionRate / 100);
        acc[channelName].guests.add(res.guest_id);

        return acc;
      }, {} as Record<string, any>) || {};

      // Calculate averages and convert Set to count
      Object.values(channelAnalysis).forEach((channel: any) => {
        channel.avgDailyRate = channel.reservations > 0 ? channel.revenue / channel.reservations : 0;
        channel.uniqueGuests = channel.guests.size;
        channel.netRevenue = channel.revenue - channel.totalCommission;
        delete channel.guests; // Remove Set object
      });

      return Object.values(channelAnalysis).sort((a: any, b: any) => b.revenue - a.revenue);
    },
  });

  // Segment analysis
  const { data: segmentData } = useQuery({
    queryKey: ["segmentAnalysis", dateRange, selectedHotel],
    queryFn: async () => {
      let query = supabase
        .from("reservations")
        .select("*");

      if (dateRange?.from && dateRange?.to) {
        query = query
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString());
      }

      if (selectedHotel !== "all") {
        query = query.eq("hotel_id", selectedHotel);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Segment by business type (simplified logic)
      const segments = {
        'Corporate': { count: 0, revenue: 0, avgLength: 0 },
        'Leisure': { count: 0, revenue: 0, avgLength: 0 },
        'Groups': { count: 0, revenue: 0, avgLength: 0 }
      };

      data?.forEach(res => {
        // Simple segmentation logic - in real app this would be based on rate codes, guest profiles, etc.
        const stayLength = Math.ceil((new Date(res.check_out).getTime() - new Date(res.check_in).getTime()) / (1000 * 60 * 60 * 24));
        
        let segment = 'Leisure';
        if (res.room_count && res.room_count > 5) {
          segment = 'Groups';
        } else if (stayLength <= 2) {
          segment = 'Corporate';
        }

        segments[segment as keyof typeof segments].count++;
        segments[segment as keyof typeof segments].revenue += res.total_amount || 0;
        segments[segment as keyof typeof segments].avgLength += stayLength;
      });

      // Calculate averages
      Object.values(segments).forEach(segment => {
        if (segment.count > 0) {
          segment.avgLength = segment.avgLength / segment.count;
        }
      });

      return Object.entries(segments).map(([name, data]) => ({
        name,
        ...data,
        avgDailyRate: data.count > 0 ? data.revenue / data.count : 0
      }));
    },
  });

  // Room type profitability
  const { data: roomTypeProfitability } = useQuery({
    queryKey: ["roomTypeProfitability", dateRange, selectedHotel],
    queryFn: async () => {
      let query = supabase
        .from("reservations")
        .select("room_type, total_amount, room_count");

      if (dateRange?.from && dateRange?.to) {
        query = query
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString());
      }

      if (selectedHotel !== "all") {
        query = query.eq("hotel_id", selectedHotel);
      }

      const { data, error } = await query;
      if (error) throw error;

      const roomTypeData = data?.reduce((acc, res) => {
        const roomType = res.room_type || 'Standard';
        
        if (!acc[roomType]) {
          acc[roomType] = {
            roomType,
            reservations: 0,
            revenue: 0,
            rooms: 0
          };
        }

        acc[roomType].reservations++;
        acc[roomType].revenue += res.total_amount || 0;
        acc[roomType].rooms += res.room_count || 1;

        return acc;
      }, {} as Record<string, any>) || {};

      return Object.values(roomTypeData)
        .map((room: any) => ({
          ...room,
          avgRate: room.reservations > 0 ? room.revenue / room.reservations : 0,
          revPAR: room.rooms > 0 ? room.revenue / room.rooms : 0
        }))
        .sort((a: any, b: any) => b.revenue - a.revenue);
    },
  });

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#8884d8', '#82ca9d'];

  const channelKPIs = [
    {
      title: "Top Channel Revenue",
      value: channelData?.[0] ? `$${channelData[0].revenue.toLocaleString()}` : "$0",
      subtitle: channelData?.[0]?.name || "No data",
      icon: DollarSign,
      color: "primary"
    },
    {
      title: "Best Performing ADR",
      value: channelData?.length ? `$${Math.max(...channelData.map(c => c.avgDailyRate)).toFixed(0)}` : "$0",
      subtitle: "highest avg daily rate",
      icon: TrendingUp,
      color: "secondary"
    },
    {
      title: "Total Channels Active",
      value: channelData?.length || 0,
      subtitle: "distribution channels",
      icon: Building2,
      color: "accent"
    },
    {
      title: "Commission Costs",
      value: channelData ? `$${channelData.reduce((sum, c) => sum + c.totalCommission, 0).toLocaleString()}` : "$0",
      subtitle: "total paid in period",
      icon: Target,
      color: "destructive"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Channel KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {channelKPIs.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="card-modern card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    kpi.color === 'primary' ? 'bg-gradient-primary' :
                    kpi.color === 'secondary' ? 'bg-gradient-secondary' :
                    kpi.color === 'accent' ? 'bg-gradient-accent' :
                    kpi.color === 'destructive' ? 'bg-red-500' :
                    'bg-muted'
                  }`}>
                    <kpi.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Channel Distribution & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Revenue Distribution */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Distribution by Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {channelData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Channel ADR Comparison */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Average Daily Rate by Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`$${value.toFixed(0)}`, 'ADR']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar
                    dataKey="avgDailyRate"
                    fill="hsl(var(--secondary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Channel Performance Table */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Detailed Channel Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Reservations</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">ADR</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Net Revenue</TableHead>
                <TableHead className="text-right">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channelData?.map((channel, index) => (
                <TableRow key={channel.name}>
                  <TableCell className="font-medium">{channel.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{channel.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{channel.reservations}</TableCell>
                  <TableCell className="text-right">${channel.revenue.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${channel.avgDailyRate.toFixed(0)}</TableCell>
                  <TableCell className="text-right">
                    {channel.commissionRate}% (${channel.totalCommission.toLocaleString()})
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${channel.netRevenue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={index < 3 ? 'default' : 'secondary'}>
                      {index < 3 ? 'High' : 'Medium'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Segment Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Segments */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Business Segment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {segmentData?.map((segment, index) => (
                <div key={segment.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">{segment.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {segment.count} reservations • {segment.avgLength.toFixed(1)} avg nights
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      ${segment.revenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${segment.avgDailyRate.toFixed(0)} ADR
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Room Type Profitability */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Room Type Profitability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={roomTypeProfitability}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="roomType" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary) / 0.8)"
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="avgRate"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    name="Avg Rate"
                    yAxisId="right"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};