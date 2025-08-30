import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { 
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  TrendingUp,
  Zap,
  WifiOff
} from "lucide-react";

interface PerformanceMetrics {
  timestamp: string;
  syncDuration: number;
  recordsProcessed: number;
  successRate: number;
  apiResponseTime: number;
  errorCount: number;
}

interface ApiUsageStats {
  date: string;
  creditsUsed: number;
  creditsRemaining: number;
  requestCount: number;
}

interface SyncPerformanceData {
  syncType: string;
  avgDuration: number;
  successRate: number;
  totalRuns: number;
  lastRun: string;
}

interface Beds24PerformanceDashboardProps {
  hotelId: string;
  connectionId?: string;
}

export function Beds24PerformanceDashboard({ hotelId, connectionId }: Beds24PerformanceDashboardProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics[]>([]);
  const [apiUsage, setApiUsage] = useState<ApiUsageStats[]>([]);
  const [syncPerformance, setSyncPerformance] = useState<SyncPerformanceData[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalSyncs: 0,
    avgSuccessRate: 0,
    avgDuration: 0,
    totalRecords: 0,
    apiCreditsUsed: 0,
    uptime: 99.5
  });

  useEffect(() => {
    // Generate mock performance data
    const generatePerformanceData = () => {
      const data: PerformanceMetrics[] = [];
      const now = new Date();
      
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)).toISOString();
        data.push({
          timestamp,
          syncDuration: 15 + Math.random() * 20, // 15-35 seconds
          recordsProcessed: Math.floor(50 + Math.random() * 200), // 50-250 records
          successRate: 90 + Math.random() * 10, // 90-100%
          apiResponseTime: 200 + Math.random() * 300, // 200-500ms
          errorCount: Math.floor(Math.random() * 5) // 0-4 errors
        });
      }
      
      setPerformanceData(data);
    };

    const generateApiUsage = () => {
      const data: ApiUsageStats[] = [];
      const now = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)).toLocaleDateString();
        data.push({
          date,
          creditsUsed: Math.floor(100 + Math.random() * 200),
          creditsRemaining: Math.floor(800 + Math.random() * 200),
          requestCount: Math.floor(50 + Math.random() * 100)
        });
      }
      
      setApiUsage(data);
    };

    const generateSyncPerformance = () => {
      const syncTypes = ['inventory', 'rates', 'bookings', 'availability', 'restrictions'];
      const data: SyncPerformanceData[] = syncTypes.map(type => ({
        syncType: type,
        avgDuration: 10 + Math.random() * 25,
        successRate: 85 + Math.random() * 15,
        totalRuns: Math.floor(20 + Math.random() * 80),
        lastRun: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      }));
      
      setSyncPerformance(data);
    };

    generatePerformanceData();
    generateApiUsage();
    generateSyncPerformance();

    // Calculate overall stats
    setOverallStats({
      totalSyncs: 1247,
      avgSuccessRate: 96.8,
      avgDuration: 22.3,
      totalRecords: 45230,
      apiCreditsUsed: 1850,
      uptime: 99.2
    });
  }, [connectionId]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!connectionId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Connection Data</h3>
            <p className="text-muted-foreground">
              Connect to Beds24 to view performance metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Performance Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallStats.uptime}%</div>
            <Progress value={overallStats.uptime} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.avgSuccessRate}%</div>
            <p className="text-xs text-muted-foreground">Average across all syncs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.avgDuration}s</div>
            <p className="text-xs text-muted-foreground">Per sync operation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Syncs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalSyncs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Records Synced</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Credits</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.apiCreditsUsed}</div>
            <p className="text-xs text-muted-foreground">Used this month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Real-time Performance</TabsTrigger>
          <TabsTrigger value="sync-analysis">Sync Analysis</TabsTrigger>
          <TabsTrigger value="api-usage">API Usage</TabsTrigger>
        </TabsList>

        {/* Real-time Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sync Duration (24h)</CardTitle>
                <CardDescription>Average sync time over the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp"
                      tickFormatter={formatTime}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label) => formatTime(label as string)}
                      formatter={(value: number) => [`${value.toFixed(1)}s`, 'Duration']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="syncDuration" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate (24h)</CardTitle>
                <CardDescription>Sync success rate over the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp"
                      tickFormatter={formatTime}
                    />
                    <YAxis domain={[80, 100]} />
                    <Tooltip 
                      labelFormatter={(label) => formatTime(label as string)}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Success Rate']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="successRate" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Records Processed</CardTitle>
              <CardDescription>Number of records processed per hour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp"
                    tickFormatter={formatTime}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => formatTime(label as string)}
                    formatter={(value: number) => [value, 'Records']}
                  />
                  <Bar dataKey="recordsProcessed" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Analysis Tab */}
        <TabsContent value="sync-analysis" className="space-y-4">
          <div className="grid gap-4">
            {syncPerformance.map((sync) => (
              <Card key={sync.syncType}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base capitalize">{sync.syncType} Sync</CardTitle>
                      <Badge variant={sync.successRate >= 95 ? 'default' : 'secondary'}>
                        {sync.successRate.toFixed(1)}% success
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {sync.totalRuns} total runs
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Avg Duration</div>
                      <div className="text-lg font-medium">{sync.avgDuration.toFixed(1)}s</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                      <Progress value={sync.successRate} className="h-2 mt-1" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Last Run</div>
                      <div className="text-sm">{new Date(sync.lastRun).toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* API Usage Tab */}
        <TabsContent value="api-usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Credits Usage (7 days)</CardTitle>
              <CardDescription>Daily API credits consumption</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={apiUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="creditsUsed" fill="hsl(var(--chart-1))" name="Credits Used" />
                  <Bar dataKey="creditsRemaining" fill="hsl(var(--chart-4))" name="Credits Remaining" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Current API Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Credits Remaining</span>
                  <span className="font-medium">8,150 / 10,000</span>
                </div>
                <Progress value={81.5} className="h-2" />
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Reset Date</span>
                  <span className="font-medium">March 1, 2024</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Daily Limit</span>
                  <span className="font-medium">1,000 credits</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Requests Today</span>
                  <span className="font-medium">142</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Response Time</span>
                  <span className="font-medium">285ms</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Error Rate</span>
                  <span className="font-medium text-green-600">0.2%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Peak Hour</span>
                  <span className="font-medium">14:00-15:00</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}