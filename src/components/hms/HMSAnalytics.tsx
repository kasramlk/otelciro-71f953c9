import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, BarChart3, Download, RefreshCw, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHMSStore } from '@/stores/hms-store';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export const HMSAnalytics = () => {
  const { occupancyData, reservations, addAuditEntry } = useHMSStore();
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [chartType, setChartType] = useState('occupancy');
  const [showExportModal, setShowExportModal] = useState(false);
  const { toast } = useToast();

  // Process data based on date range
  const chartData = useMemo(() => {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    
    const filteredData = occupancyData.filter(item => 
      item.date >= fromDate && item.date <= toDate
    );

    return filteredData.map(item => ({
      date: format(item.date, 'MMM dd'),
      occupancy: Math.round(item.occupancyRate * 100),
      adr: Math.round(item.adr),
      revenue: Math.round(item.totalRevenue),
      arrivals: item.arrivals,
      departures: item.departures
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [occupancyData, dateRange]);

  // KPI calculations
  const kpis = useMemo(() => {
    if (chartData.length === 0) return null;

    const totalRevenue = chartData.reduce((sum, day) => sum + day.revenue, 0);
    const avgOccupancy = chartData.reduce((sum, day) => sum + day.occupancy, 0) / chartData.length;
    const avgADR = chartData.reduce((sum, day) => sum + day.adr, 0) / chartData.length;
    const totalArrivals = chartData.reduce((sum, day) => sum + day.arrivals, 0);
    const revPAR = (avgOccupancy / 100) * avgADR;

    // Mock trend calculations (compare with previous period)
    const trends = {
      revenue: Math.random() > 0.5 ? 'up' as const : 'down' as const,
      occupancy: Math.random() > 0.5 ? 'up' as const : 'down' as const,
      adr: Math.random() > 0.5 ? 'up' as const : 'down' as const,
      arrivals: Math.random() > 0.5 ? 'up' as const : 'down' as const
    };

    return {
      totalRevenue,
      avgOccupancy,
      avgADR,
      revPAR,
      totalArrivals,
      trends
    };
  }, [chartData]);

  // Reservation source data for pie chart
  const sourceData = useMemo(() => {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    
    const filteredReservations = reservations.filter(res => 
      res.createdAt >= fromDate && res.createdAt <= toDate
    );

    const sourceCount = filteredReservations.reduce((acc, res) => {
      acc[res.source] = (acc[res.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sourceCount).map(([source, count]) => ({
      name: source.charAt(0).toUpperCase() + source.slice(1),
      value: count,
      percentage: Math.round((count / filteredReservations.length) * 100)
    }));
  }, [reservations, dateRange]);

  // Handle date range change
  const handleDateRangeChange = (period: string) => {
    const today = new Date();
    let from: Date, to: Date;

    switch (period) {
      case 'today':
        from = to = today;
        break;
      case 'week':
        from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        to = today;
        break;
      case 'month':
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      case 'quarter':
        from = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        to = today;
        break;
      default:
        return;
    }

    setDateRange({
      from: format(from, 'yyyy-MM-dd'),
      to: format(to, 'yyyy-MM-dd')
    });
  };

  // Handle refresh data
  const handleRefresh = () => {
    // In real app, this would fetch fresh data
    toast({ title: 'Data refreshed successfully' });
    addAuditEntry('Analytics Refresh', `Data refreshed for period ${dateRange.from} to ${dateRange.to}`);
  };

  // Handle export
  const handleExport = (exportFormat: 'pdf' | 'csv' | 'excel') => {
    const exportData = chartData.map(item => 
      `${item.date},${item.occupancy}%,€${item.adr},€${item.revenue},${item.arrivals},${item.departures}`
    );
    
    const headers = 'Date,Occupancy,ADR,Revenue,Arrivals,Departures';
    const csvContent = [headers, ...exportData].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${exportFormat}_${format(new Date(), 'yyyy-MM-dd')}.${exportFormat === 'csv' ? 'csv' : exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
    
    addAuditEntry('Analytics Export', `${exportFormat.toUpperCase()} export generated for ${dateRange.from} to ${dateRange.to}`);
    toast({ title: `${exportFormat.toUpperCase()} exported successfully` });
    setShowExportModal(false);
  };

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' }) => 
    trend === 'up' ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (!kpis) return <div>Loading analytics...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Forecasting</h1>
          <p className="text-muted-foreground">Performance insights and trend analysis</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowExportModal(true)} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Range Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Period:</span>
            </div>
            
            {['today', 'week', 'month', 'lastMonth', 'quarter'].map(period => (
              <Button
                key={period}
                variant="outline"
                size="sm"
                onClick={() => handleDateRangeChange(period)}
                className="capitalize"
              >
                {period === 'lastMonth' ? 'Last Month' : period}
              </Button>
            ))}

            <div className="flex items-center gap-2 ml-auto">
              <Label htmlFor="from">From:</Label>
              <Input
                id="from"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                className="w-40"
              />
              <Label htmlFor="to">To:</Label>
              <Input
                id="to"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">€{kpis.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1">
                <TrendIcon trend={kpis.trends.revenue} />
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Occupancy</p>
                <p className="text-2xl font-bold">{kpis.avgOccupancy.toFixed(1)}%</p>
              </div>
              <div className="flex items-center gap-1">
                <TrendIcon trend={kpis.trends.occupancy} />
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg ADR</p>
                <p className="text-2xl font-bold">€{kpis.avgADR.toFixed(0)}</p>
              </div>
              <div className="flex items-center gap-1">
                <TrendIcon trend={kpis.trends.adr} />
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">RevPAR</p>
                <p className="text-2xl font-bold">€{kpis.revPAR.toFixed(0)}</p>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Type Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Chart Type:</span>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="occupancy">Occupancy Trend</SelectItem>
                <SelectItem value="revenue">Revenue Analysis</SelectItem>
                <SelectItem value="adr">ADR Performance</SelectItem>
                <SelectItem value="arrivals">Arrivals & Departures</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {chartType === 'occupancy' ? 'Occupancy Trend' :
               chartType === 'revenue' ? 'Revenue Analysis' :
               chartType === 'adr' ? 'ADR Performance' : 'Arrivals & Departures'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'occupancy' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="occupancy" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Occupancy (%)"
                    />
                  </LineChart>
                ) : chartType === 'revenue' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue (€)" />
                  </BarChart>
                ) : chartType === 'adr' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="adr" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                      name="ADR (€)"
                    />
                  </LineChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="arrivals" fill="#8884d8" name="Arrivals" />
                    <Bar dataKey="departures" fill="#82ca9d" name="Departures" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Best Performing Day:</span>
                <Badge variant="default">
                  {chartData.reduce((max, day) => day.revenue > max.revenue ? day : max, chartData[0])?.date}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Highest Occupancy:</span>
                <Badge variant="default">
                  {Math.max(...chartData.map(d => d.occupancy))}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Peak ADR:</span>
                <Badge variant="default">
                  €{Math.max(...chartData.map(d => d.adr))}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Arrivals:</span>
                <Badge variant="outline">
                  {kpis.totalArrivals}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Recommendations:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Focus marketing on low-occupancy days</li>
                <li>• Consider dynamic pricing during peak periods</li>
                <li>• Optimize direct booking channels</li>
                <li>• Review weekend vs weekday performance</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Analytics Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date Range:</Label>
              <p className="text-sm text-muted-foreground">
                {format(new Date(dateRange.from), 'MMM dd, yyyy')} - {format(new Date(dateRange.to), 'MMM dd, yyyy')}
              </p>
            </div>
            
            <div>
              <Label>Include:</Label>
              <ul className="text-sm text-muted-foreground mt-1">
                <li>• Daily occupancy and revenue data</li>
                <li>• ADR and RevPAR metrics</li>
                <li>• Booking source breakdown</li>
                <li>• Performance summary</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowExportModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleExport('csv')} variant="outline">
                Export CSV
              </Button>
              <Button onClick={() => handleExport('excel')} variant="outline">
                Export Excel
              </Button>
              <Button onClick={() => handleExport('pdf')} className="bg-gradient-primary">
                Export PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};