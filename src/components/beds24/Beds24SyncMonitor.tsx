import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Zap,
  TrendingUp,
  Database,
  Activity
} from "lucide-react";
import { useBeds24SyncLogs, useBeds24Connections } from "@/hooks/use-beds24";

interface Beds24SyncMonitorProps {
  hotelId: string;
}

export function Beds24SyncMonitor({ hotelId }: Beds24SyncMonitorProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: connections = [] } = useBeds24Connections(hotelId);
  const activeConnection = connections.find(c => c.is_active);
  
  const { data: syncLogs = [], refetch } = useBeds24SyncLogs(activeConnection?.id || '');

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const getStatusIcon = (status: string, size = "h-4 w-4") => {
    switch (status) {
      case 'completed':
        return <CheckCircle className={`${size} text-green-500`} />;
      case 'failed':
        return <AlertTriangle className={`${size} text-destructive`} />;
      case 'running':
        return <RefreshCw className={`${size} text-blue-500 animate-spin`} />;
      default:
        return <Clock className={`${size} text-muted-foreground`} />;
    }
  };

  const getSyncTypeIcon = (syncType: string) => {
    switch (syncType) {
      case 'bookings':
        return <Activity className="h-4 w-4" />;
      case 'inventory':
      case 'rates':
      case 'availability':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const recentLogs = syncLogs.slice(0, 10);
  const runningSync = syncLogs.find(log => log.status === 'running');
  const completedToday = syncLogs.filter(log => 
    log.status === 'completed' && 
    new Date(log.created_at).toDateString() === new Date().toDateString()
  ).length;
  const failedToday = syncLogs.filter(log => 
    log.status === 'failed' && 
    new Date(log.created_at).toDateString() === new Date().toDateString()
  ).length;

  if (!activeConnection) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Active Connection</h3>
          <p className="text-muted-foreground text-center">
            Connect to Beds24 to monitor sync activity.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sync Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Syncs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedToday}</div>
            <p className="text-xs text-muted-foreground">Completed successfully</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{failedToday}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Credits</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">-</div>
            <p className="text-xs text-muted-foreground">
              Remaining credits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {runningSync ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm font-medium">Syncing</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Idle</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {runningSync ? 'Sync in progress' : 'Ready for sync'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Sync Progress */}
      {runningSync && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Active Sync
                </CardTitle>
                <CardDescription>
                  {runningSync.sync_type} sync in progress
                </CardDescription>
              </div>
              <Badge variant="secondary">Running</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>
                  {runningSync.records_processed} / {runningSync.records_processed + (runningSync.records_failed || 0)} records
                </span>
              </div>
              <Progress 
                value={
                  runningSync.records_processed > 0 
                    ? (runningSync.records_succeeded / runningSync.records_processed) * 100 
                    : 0
                } 
                className="h-2" 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Started: {new Date(runningSync.started_at).toLocaleTimeString()}</span>
                <span>Direction: {runningSync.sync_direction}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Sync Activity</CardTitle>
              <CardDescription>Latest synchronization operations</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
                Auto-refresh {autoRefresh ? 'On' : 'Off'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    {getSyncTypeIcon(log.sync_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium capitalize">
                        {log.sync_type} {log.sync_direction}
                      </p>
                      <Badge 
                        variant={
                          log.status === 'completed' ? 'default' :
                          log.status === 'failed' ? 'destructive' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {log.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {log.records_processed > 0 && (
                          <>
                            {log.records_succeeded} successful, {log.records_failed} failed
                          </>
                        )}
                      </span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    
                    {log.error_details && log.error_details.length > 0 && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                        {log.error_details[0]?.error || 'Error occurred during sync'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {recentLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p>No sync activity yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}