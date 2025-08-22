import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Zap, 
  Server, 
  Database, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Monitor,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  Download,
  Upload,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  network: {
    download: number;
    upload: number;
    latency: number;
  };
  database: {
    connections: number;
    queryTime: number;
    cacheHitRate: number;
  };
  api: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  metric?: string;
  threshold?: number;
  currentValue?: number;
}

const mockSystemMetrics: SystemMetrics = {
  cpu: 45,
  memory: 68,
  storage: 32,
  network: {
    download: 125.5,
    upload: 32.1,
    latency: 12
  },
  database: {
    connections: 15,
    queryTime: 85,
    cacheHitRate: 94
  },
  api: {
    requestsPerMinute: 245,
    averageResponseTime: 120,
    errorRate: 0.8
  }
};

const mockPerformanceData = [
  { time: '00:00', cpu: 35, memory: 60, requests: 180, responseTime: 110 },
  { time: '04:00', cpu: 28, memory: 55, requests: 95, responseTime: 95 },
  { time: '08:00', cpu: 42, memory: 65, requests: 320, responseTime: 125 },
  { time: '12:00', cpu: 55, memory: 72, requests: 450, responseTime: 140 },
  { time: '16:00', cpu: 48, memory: 70, requests: 380, responseTime: 130 },
  { time: '20:00', cpu: 52, memory: 68, requests: 290, responseTime: 115 },
  { time: '24:00', cpu: 45, memory: 68, requests: 245, responseTime: 120 }
];

const mockAlerts: PerformanceAlert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'High Memory Usage',
    description: 'Memory usage has exceeded 65% for the last 10 minutes',
    timestamp: '2024-01-16T10:30:00Z',
    resolved: false,
    metric: 'memory',
    threshold: 65,
    currentValue: 68
  },
  {
    id: '2',
    type: 'info',
    title: 'API Response Time Improved',
    description: 'Average response time decreased by 15% in the last hour',
    timestamp: '2024-01-16T09:45:00Z',
    resolved: true,
    metric: 'responseTime'
  },
  {
    id: '3',
    type: 'error',
    title: 'Database Connection Spike',
    description: 'Unusual increase in database connections detected',
    timestamp: '2024-01-16T09:15:00Z',
    resolved: true,
    metric: 'dbConnections',
    threshold: 20,
    currentValue: 15
  }
];

export const PerformanceMonitoring: React.FC = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<SystemMetrics>(mockSystemMetrics);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>(mockAlerts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(30, Math.min(85, prev.memory + (Math.random() - 0.5) * 5)),
        api: {
          ...prev.api,
          requestsPerMinute: Math.max(50, Math.min(500, prev.api.requestsPerMinute + (Math.random() - 0.5) * 50)),
          averageResponseTime: Math.max(50, Math.min(300, prev.api.averageResponseTime + (Math.random() - 0.5) * 20))
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefreshMetrics = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Metrics Refreshed",
        description: "System metrics have been updated",
      });
    }, 2000);
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
    
    toast({
      title: "Alert Resolved",
      description: "The alert has been marked as resolved",
    });
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-500';
    if (value >= thresholds.warning) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'bg-red-500';
    if (value >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const systemHealth = (
    (100 - metrics.cpu) * 0.3 +
    (100 - metrics.memory) * 0.3 +
    Math.min(100, metrics.database.cacheHitRate) * 0.2 +
    Math.max(0, 100 - metrics.api.errorRate * 10) * 0.2
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system performance and health monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshMetrics}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold">{systemHealth.toFixed(0)}%</p>
              </div>
              <div className={`p-2 rounded-full ${systemHealth >= 90 ? 'bg-green-100' : systemHealth >= 70 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                <Activity className={`h-6 w-6 ${systemHealth >= 90 ? 'text-green-600' : systemHealth >= 70 ? 'text-yellow-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
              </div>
              <AlertTriangle className={`h-6 w-6 ${activeAlerts.length > 0 ? 'text-yellow-500' : 'text-green-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Requests/min</p>
                <p className="text-2xl font-bold">{metrics.api.requestsPerMinute}</p>
              </div>
              <Zap className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.api.averageResponseTime}ms avg response
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold">99.9%</p>
              </div>
              <Server className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Last 30 days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Active Alerts ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <Alert key={alert.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        {alert.currentValue && alert.threshold && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              Current: {alert.currentValue}{alert.metric === 'memory' ? '%' : ''}
                            </Badge>
                            <Badge variant="outline">
                              Threshold: {alert.threshold}{alert.metric === 'memory' ? '%' : ''}
                            </Badge>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              System Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <span className={`text-sm font-bold ${getStatusColor(metrics.cpu, { warning: 70, critical: 85 })}`}>
                  {metrics.cpu}%
                </span>
              </div>
              <Progress value={metrics.cpu} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <span className={`text-sm font-bold ${getStatusColor(metrics.memory, { warning: 65, critical: 80 })}`}>
                  {metrics.memory}%
                </span>
              </div>
              <Progress value={metrics.memory} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  <span className="text-sm font-medium">Storage Usage</span>
                </div>
                <span className={`text-sm font-bold ${getStatusColor(metrics.storage, { warning: 70, critical: 85 })}`}>
                  {metrics.storage}%
                </span>
              </div>
              <Progress value={metrics.storage} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Download className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">Download</span>
                </div>
                <p className="text-sm font-bold">{metrics.network.download} MB/s</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Upload className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                </div>
                <p className="text-sm font-bold">{metrics.network.upload} MB/s</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Wifi className="h-3 w-3 text-purple-500" />
                  <span className="text-xs text-muted-foreground">Latency</span>
                </div>
                <p className="text-sm font-bold">{metrics.network.latency}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Connections</p>
                <p className="text-2xl font-bold">{metrics.database.connections}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Query Time</p>
                <p className="text-2xl font-bold">{metrics.database.queryTime}ms</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Cache Hit Rate</span>
                <span className="text-sm font-bold text-green-600">
                  {metrics.database.cacheHitRate}%
                </span>
              </div>
              <Progress value={metrics.database.cacheHitRate} className="h-2" />
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">API Performance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Requests/min</p>
                  <p className="text-lg font-bold">{metrics.api.requestsPerMinute}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Error Rate</p>
                  <p className="text-lg font-bold text-green-600">{metrics.api.errorRate}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Trends (24h)
          </CardTitle>
          <CardDescription>
            System performance metrics over the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-3">CPU & Memory Usage</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={mockPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="cpu" stroke="#ef4444" strokeWidth={2} name="CPU %" />
                  <Line type="monotone" dataKey="memory" stroke="#3b82f6" strokeWidth={2} name="Memory %" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">API Performance</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={mockPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="requests" stroke="#10b981" strokeWidth={2} name="Requests/min" />
                  <Line type="monotone" dataKey="responseTime" stroke="#f59e0b" strokeWidth={2} name="Response Time (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};