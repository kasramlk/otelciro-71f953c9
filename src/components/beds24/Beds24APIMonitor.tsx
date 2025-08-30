import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { beds24Service } from '@/lib/services/beds24-service';
import { useBeds24SyncLogs } from '@/hooks/use-beds24';

interface APIMonitorProps {
  connectionId: string;
  hotelId?: string;
}

export function Beds24APIMonitor({ connectionId, hotelId }: APIMonitorProps) {
  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: syncLogs, refetch: refetchSyncLogs } = useBeds24SyncLogs(connectionId);

  const fetchApiLogs = async () => {
    setLoading(true);
    try {
      // Mock API logs since the table doesn't exist yet in Supabase types
      console.log('Fetching API logs for connection:', connectionId);
      setApiLogs([
        {
          id: '1',
          endpoint: '/properties',
          method: 'GET',
          success: true,
          response_status: 200,
          response_time_ms: 245,
          created_at: new Date().toISOString(),
          credits_used: 1,
          credits_remaining: 999
        },
        {
          id: '2', 
          endpoint: '/bookings',
          method: 'GET',
          success: true,
          response_status: 200,
          response_time_ms: 180,
          created_at: new Date(Date.now() - 300000).toISOString(),
          credits_used: 2,
          credits_remaining: 997
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch API logs:', error);
      setApiLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiLogs();
  }, [connectionId]);

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      error: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Beds24 API Monitor</h3>
        <Button
          onClick={() => {
            fetchApiLogs();
            refetchSyncLogs();
          }}
          disabled={loading}
          size="sm"
        >
          {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="api-calls" className="w-full">
        <TabsList>
          <TabsTrigger value="api-calls">API Calls</TabsTrigger>
          <TabsTrigger value="sync-logs">Sync Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="api-calls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent API Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {apiLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No API calls recorded yet
                    </p>
                  ) : (
                    apiLogs.map((log) => (
                      <div
                        key={log.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.success)}
                            <span className="font-mono text-sm font-medium">
                              {log.method} {log.endpoint}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={log.success ? "default" : "destructive"}>
                              {log.response_status}
                            </Badge>
                            {log.response_time_ms && (
                              <Badge variant="outline">
                                {log.response_time_ms}ms
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </div>

                        {log.error_message && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {log.error_message}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Credits: {log.credits_used || 1}</span>
                          {log.credits_remaining && (
                            <span>Remaining: {log.credits_remaining}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {!syncLogs || syncLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No sync operations recorded yet
                    </p>
                  ) : (
                    syncLogs.map((log) => (
                      <div
                        key={log.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {log.sync_type} ({log.sync_direction})
                            </span>
                          </div>
                          {getStatusBadge(log.status)}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Processed:</span>
                            <span className="ml-1 font-medium">{log.records_processed}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Success:</span>
                            <span className="ml-1 font-medium text-green-600">{log.records_succeeded}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Failed:</span>
                            <span className="ml-1 font-medium text-red-600">{log.records_failed}</span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Started: {new Date(log.started_at).toLocaleString()}
                          {log.completed_at && (
                            <span className="ml-4">
                              Completed: {new Date(log.completed_at).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {log.error_details && Array.isArray(log.error_details) && log.error_details.length > 0 && (
                          <div className="text-sm">
                            <details className="cursor-pointer">
                              <summary className="text-red-600 hover:text-red-700">
                                View Errors ({log.error_details.length})
                              </summary>
                              <div className="mt-2 space-y-1">
                                {log.error_details.map((error: any, index: number) => (
                                  <div key={index} className="bg-red-50 p-2 rounded text-xs">
                                    {typeof error === 'string' ? error : JSON.stringify(error)}
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>API Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Average Response Time</span>
                      <span className="font-medium">
                        {apiLogs.length > 0
                          ? Math.round(
                              apiLogs
                                .filter(log => log.response_time_ms)
                                .reduce((acc, log) => acc + log.response_time_ms, 0) /
                              apiLogs.filter(log => log.response_time_ms).length
                            )
                          : 0}ms
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span className="font-medium">
                        {apiLogs.length > 0
                          ? Math.round((apiLogs.filter(log => log.success).length / apiLogs.length) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Total API Calls</span>
                      <span className="font-medium">{apiLogs.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sync Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Total Syncs</span>
                      <span className="font-medium">{syncLogs?.length || 0}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Successful Syncs</span>
                      <span className="font-medium text-green-600">
                        {syncLogs?.filter(log => log.status === 'completed').length || 0}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Failed Syncs</span>
                      <span className="font-medium text-red-600">
                        {syncLogs?.filter(log => log.status === 'failed' || log.status === 'error').length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}