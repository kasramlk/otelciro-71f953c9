import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  RefreshCw,
  Zap,
  WifiOff
} from "lucide-react";

interface SyncStatus {
  id: string;
  connection_id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  records_processed: number;
  records_succeeded: number;
  records_failed: number;
  error_details?: any;
}

interface RealtimeMetrics {
  activeSyncs: number;
  totalProcessed: number;
  successRate: number;
  avgDuration: number;
  lastActivity: string;
}

interface Beds24RealtimeMonitorProps {
  hotelId: string;
  connectionId?: string;
}

export function Beds24RealtimeMonitor({ hotelId, connectionId }: Beds24RealtimeMonitorProps) {
  const [syncLogs, setSyncLogs] = useState<SyncStatus[]>([]);
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    activeSyncs: 0,
    totalProcessed: 0,
    successRate: 0,
    avgDuration: 0,
    lastActivity: 'Never'
  });
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial sync logs
  useEffect(() => {
    const fetchSyncLogs = async () => {
      if (!connectionId) return;

      const { data, error } = await supabase
        .from('beds24_sync_logs')
        .select('*')
        .eq('connection_id', connectionId)
        .order('started_at', { ascending: false })
        .limit(20);

      if (data && !error) {
        setSyncLogs(data);
        calculateMetrics(data);
      }
    };

    fetchSyncLogs();
  }, [connectionId, supabase]);

  // Real-time subscription for sync updates
  useEffect(() => {
    if (!connectionId) return;

    const channel = supabase
      .channel(`beds24-sync-${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'beds24_sync_logs',
          filter: `connection_id=eq.${connectionId}`
        },
        (payload) => {
          console.log('Sync update:', payload);
          
          setSyncLogs(prev => {
            const updated = [...prev];
            
            if (payload.eventType === 'INSERT') {
              updated.unshift(payload.new as SyncStatus);
            } else if (payload.eventType === 'UPDATE') {
              const index = updated.findIndex(log => log.id === payload.new.id);
              if (index !== -1) {
                updated[index] = payload.new as SyncStatus;
              }
            }
            
            // Keep only latest 20 logs
            const latest = updated.slice(0, 20);
            calculateMetrics(latest);
            return latest;
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId, supabase]);

  const calculateMetrics = (logs: SyncStatus[]) => {
    const completed = logs.filter(log => log.status === 'completed' || log.status === 'failed');
    const active = logs.filter(log => log.status === 'pending' || log.status === 'processing').length;
    const successful = logs.filter(log => log.status === 'completed').length;
    const totalProcessed = logs.reduce((sum, log) => sum + log.records_processed, 0);
    
    const durations = completed
      .filter(log => log.completed_at)
      .map(log => new Date(log.completed_at!).getTime() - new Date(log.started_at).getTime());
    
    const avgDuration = durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length / 1000
      : 0;

    const lastActivity = logs.length > 0 
      ? new Date(logs[0].started_at).toLocaleString()
      : 'Never';

    setMetrics({
      activeSyncs: active,
      totalProcessed,
      successRate: completed.length > 0 ? (successful / completed.length) * 100 : 0,
      avgDuration,
      lastActivity
    });
  };

  const triggerManualSync = async (syncType: string) => {
    if (!connectionId) return;

    try {
      const response = await fetch('/api/beds24/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          syncType,
          force: true
        })
      });

      if (response.ok) {
        console.log(`Manual ${syncType} sync triggered`);
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!connectionId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Connection</h3>
            <p className="text-muted-foreground">
              Connect to Beds24 to monitor real-time sync activity.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => triggerManualSync('inventory')}
          >
            <Database className="h-4 w-4 mr-2" />
            Sync Inventory
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => triggerManualSync('rates')}
          >
            <Zap className="h-4 w-4 mr-2" />
            Sync Rates
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Syncs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSyncs}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
            <Progress value={metrics.successRate} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Records Processed</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProcessed}</div>
            <p className="text-xs text-muted-foreground">Total synced</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgDuration.toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">Per sync operation</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sync Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Activity</CardTitle>
          <CardDescription>
            Last updated: {metrics.lastActivity}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {syncLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sync activity recorded yet
              </div>
            ) : (
              syncLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getSyncStatusIcon(log.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.sync_type}</span>
                        <Badge variant={getSyncStatusColor(log.status) as any}>
                          {log.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.started_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {log.records_succeeded}/{log.records_processed} records
                    </div>
                    {log.records_failed > 0 && (
                      <div className="text-xs text-destructive">
                        {log.records_failed} failed
                      </div>
                    )}
                    {log.completed_at && (
                      <div className="text-xs text-muted-foreground">
                        Duration: {(
                          (new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000
                        ).toFixed(1)}s
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
