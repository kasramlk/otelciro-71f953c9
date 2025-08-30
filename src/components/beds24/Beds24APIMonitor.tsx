import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, AlertCircle, CheckCircle, Clock, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface APIMonitorProps {
  connectionId: string;
}

export function Beds24APIMonitor({ connectionId }: APIMonitorProps) {
  const [connection, setConnection] = useState<any>(null);
  const [apiUsage, setApiUsage] = useState<any[]>([]);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnectionStatus();
    loadAPIUsage();
    loadSyncLogs();
    
    // Set up real-time subscription for API usage
    const subscription = supabase
      .channel('api-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'beds24_api_usage',
          filter: `connection_id=eq.${connectionId}`,
        },
        () => {
          loadAPIUsage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [connectionId]);

  const loadConnectionStatus = async () => {
    try {
      const { data } = await supabase
        .from('beds24_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      setConnection(data);
    } catch (error) {
      console.error('Error loading connection status:', error);
    }
  };

  const loadAPIUsage = async () => {
    try {
      const { data } = await supabase
        .from('beds24_api_usage')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: false })
        .limit(20);

      setApiUsage(data || []);
    } catch (error) {
      console.error('Error loading API usage:', error);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const { data } = await supabase
        .from('beds24_sync_logs')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: false })
        .limit(10);

      setSyncLogs(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading sync logs:', error);
      setLoading(false);
    }
  };

  const getCreditsPercentage = () => {
    if (!connection?.api_credits_remaining) return 0;
    return (connection.api_credits_remaining / 1000) * 100; // Assuming 1000 is max
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <div>Loading API monitor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <div>
                <div className="text-lg font-semibold">Connection Status</div>
                <Badge variant={getStatusColor(connection?.connection_status || 'unknown')}>
                  {connection?.connection_status || 'Unknown'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <div>
                <div className="text-lg font-semibold">API Credits</div>
                <div className="text-2xl font-bold">{connection?.api_credits_remaining || 0}</div>
                <Progress value={getCreditsPercentage()} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <div>
                <div className="text-lg font-semibold">Last Sync</div>
                <div className="text-sm text-muted-foreground">
                  {connection?.last_sync_at ? 
                    new Date(connection.last_sync_at).toLocaleString() : 
                    'Never'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="usage">API Usage</TabsTrigger>
          <TabsTrigger value="sync">Sync Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent API Calls</CardTitle>
            </CardHeader>
            <CardContent>
              {apiUsage.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No API usage recorded yet. API calls will appear here once you start using the integration.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {apiUsage.map((usage) => (
                    <div key={usage.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{usage.method} {usage.endpoint}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(usage.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={usage.success ? 'default' : 'destructive'}>
                            {usage.success ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                            {usage.success ? 'Success' : 'Failed'}
                          </Badge>
                          {usage.request_cost && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Cost: {usage.request_cost} credits
                            </div>
                          )}
                        </div>
                      </div>
                      {usage.response_time_ms && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Response time: {usage.response_time_ms}ms
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Operation Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {syncLogs.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No sync operations recorded yet. Sync operations will appear here once you start syncing data.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">
                            {log.sync_type} - {log.sync_direction}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Started: {new Date(log.started_at).toLocaleString()}
                          </div>
                          {log.completed_at && (
                            <div className="text-sm text-muted-foreground">
                              Completed: {new Date(log.completed_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            log.status === 'completed' ? 'default' :
                            log.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {log.status}
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            Processed: {log.records_processed || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Success: {log.records_succeeded || 0} | Failed: {log.records_failed || 0}
                          </div>
                        </div>
                      </div>
                      {log.error_details && log.error_details.length > 0 && (
                        <div className="mt-2 text-sm text-red-600">
                          Errors: {log.error_details.map((err: any) => err.error).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {connection?.api_credits_remaining < 100 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            API credits are running low ({connection.api_credits_remaining} remaining). 
            Credits will reset at {connection.api_credits_reset_at ? 
              new Date(connection.api_credits_reset_at).toLocaleString() : 'unknown time'}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}