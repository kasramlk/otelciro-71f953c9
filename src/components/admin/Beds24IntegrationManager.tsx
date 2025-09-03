import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Play, Download, Activity, Shield, BarChart3, AlertTriangle, TrendingUp, Zap, Settings, Wrench } from 'lucide-react';
import { format } from 'date-fns';

interface TokenDiagnostics {
  type: string;
  scopes: string[];
  expires_at?: string;
  last_used_at?: string;
  properties_count: number;
  is_expired: boolean;
  last_refresh?: string;
}

interface SyncState {
  provider: string;
  hotel_id: string;
  bootstrap_completed: boolean;
  bootstrap_completed_at?: string;
  last_bookings_modified_from?: string;
  last_calendar_start?: string;
  last_calendar_end?: string;
  sync_enabled: boolean;
  settings: any;
  hotels?: { name: string };
}

interface AuditLog {
  id: number;
  provider: string;
  entity_type: string;
  action: string;
  operation: string;
  status: string;
  hotel_id?: string;
  request_cost: number;
  limit_remaining?: number;
  duration_ms: number;
  records_processed: number;
  error_message?: string;
  created_at: string;
  hotels?: { name: string };
}

interface HealthOverview {
  system_status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  metrics: {
    total_tokens: number;
    expired_tokens: number;
    enabled_hotels: number;
    total_hotels: number;
    error_rate_24h: number;
    active_jobs: number;
    sync_success_rate: number;
  };
  last_updated: string;
}

interface PerformanceMetrics {
  time_range: string;
  total_operations: number;
  avg_response_time: number;
  success_rate: number;
  api_usage: {
    total_cost: number;
    avg_cost_per_operation: number;
  };
  operations_by_type: Record<string, number>;
  performance_trends: Array<{
    timestamp: string;
    operations: number;
    avg_response_time: number;
    success_rate: number;
    api_cost: number;
  }>;
}

interface SyncStatusData {
  hotel_sync_status: Array<{
    hotel_id: string;
    hotel_name: string;
    hotel_code: string;
    sync_enabled: boolean;
    bootstrap_completed: boolean;
    last_booking_sync: string | null;
    last_calendar_sync: string | null;
    recent_errors: number;
    total_operations_24h: number;
  }>;
  summary: {
    total_hotels: number;
    enabled_hotels: number;
    bootstrapped_hotels: number;
    hotels_with_errors: number;
  };
}

export default function Beds24IntegrationManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [propertyId, setPropertyId] = useState('');
  const [selectedHotelId, setSelectedHotelId] = useState('');
  
  // Delta sync state
  const [selectedSyncType, setSelectedSyncType] = useState('all');
  const [selectedSyncHotelId, setSelectedSyncHotelId] = useState('');
  
  // Rate push state
  const [selectedPushHotelId, setSelectedPushHotelId] = useState('');
  const [selectedPushRoomTypeId, setSelectedPushRoomTypeId] = useState('');
  const [pushDateRange, setPushDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [pushUpdates, setPushUpdates] = useState({
    rate: '',
    availability: '',
    stopSell: false,
    closedArrival: false
  });

  // Phase 3: Monitoring & Recovery state
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Auto-refresh interval effect
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['beds24-health-overview'] });
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, queryClient]);

  // Fetch token diagnostics
  const { data: tokenDiagnostics, isLoading: loadingTokens } = useQuery({
    queryKey: ['beds24-token-diagnostics'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('beds24-token-manager', {
        body: { action: 'diagnostics' }
      });
      if (error) throw error;
      return data.diagnostics as TokenDiagnostics[];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch hotels for bootstrap selection
  const { data: hotels } = useQuery({
    queryKey: ['hotels-for-bootstrap'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotels')
        .select('id, name, code')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch sync states
  const { data: syncStates, isLoading: loadingSyncStates } = useQuery({
    queryKey: ['beds24-sync-states'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_state')
        .select(`
          *,
          hotels!sync_state_hotel_id_fkey(name)
        `)
        .eq('provider', 'beds24')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as SyncState[];
    }
  });

  // Fetch recent audit logs
  const { data: auditLogs, isLoading: loadingAuditLogs } = useQuery({
    queryKey: ['beds24-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingestion_audit')
        .select(`
          *,
          hotels!ingestion_audit_hotel_id_fkey(name)
        `)
        .eq('provider', 'beds24')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AuditLog[];
    }
  });

  // Fetch scheduled jobs
  const { data: scheduledJobs, isLoading: loadingScheduledJobs } = useQuery({
    queryKey: ['beds24-scheduled-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch room types for selected hotel
  const { data: roomTypes } = useQuery({
    queryKey: ['room-types', selectedPushHotelId],
    queryFn: async () => {
      if (!selectedPushHotelId) return null;
      const { data, error } = await supabase
        .from('room_types')
        .select('id, name, code')
        .eq('hotel_id', selectedPushHotelId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPushHotelId
  });

  // Fetch rate push history
  const { data: ratePushHistory, isLoading: loadingRatePushHistory } = useQuery({
    queryKey: ['beds24-rate-push-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rate_push_history')
        .select(`
          *,
          hotels!rate_push_history_hotel_id_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    }
  });

  // Phase 3: Monitoring queries
  const { data: healthOverview, isLoading: loadingHealth } = useQuery({
    queryKey: ['beds24-health-overview'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('beds24-monitoring', {
        body: { action: 'health_overview' }
      });
      if (error) throw error;
      return data as HealthOverview;
    },
    refetchInterval: autoRefreshEnabled ? 30000 : false
  });

  const { data: performanceMetrics, isLoading: loadingPerformance } = useQuery({
    queryKey: ['beds24-performance', selectedTimeRange],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('beds24-monitoring', {
        body: { 
          action: 'performance_metrics',
          time_range: selectedTimeRange
        }
      });
      if (error) throw error;
      return data as PerformanceMetrics;
    },
    refetchInterval: autoRefreshEnabled ? 60000 : false
  });

  const { data: syncStatusData, isLoading: loadingSyncStatus } = useQuery({
    queryKey: ['beds24-sync-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('beds24-monitoring', {
        body: { action: 'sync_status' }
      });
      if (error) throw error;
      return data as SyncStatusData;
    },
    refetchInterval: autoRefreshEnabled ? 45000 : false
  });

  // Refresh token mutation
  const refreshTokenMutation = useMutation({
    mutationFn: async (tokenType: string) => {
      const { data, error } = await supabase.functions.invoke('beds24-token-manager', {
        body: { action: 'refresh_token', tokenType }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds24-token-diagnostics'] });
      toast({ title: 'Token refreshed successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to refresh token',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Bootstrap mutation
  const bootstrapMutation = useMutation({
    mutationFn: async ({ propertyId, hotelId }: { propertyId: string; hotelId: string }) => {
      const { data, error } = await supabase.functions.invoke('beds24-bootstrap', {
        body: { propertyId, hotelId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['beds24-sync-states'] });
      queryClient.invalidateQueries({ queryKey: ['beds24-audit-logs'] });
      toast({
        title: 'Bootstrap completed successfully',
        description: `Imported: ${data.results.roomTypes} room types, ${data.results.bookings} bookings, ${data.results.guests} guests`
      });
      setPropertyId('');
      setSelectedHotelId('');
    },
    onError: (error: any) => {
      toast({
        title: 'Bootstrap failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Manual sync mutation
  const manualSyncMutation = useMutation({
    mutationFn: async ({ syncType, hotelId }: { syncType: string; hotelId?: string }) => {
      const { data, error } = await supabase.functions.invoke('beds24-scheduler', {
        body: { 
          action: 'manual_trigger',
          syncType,
          hotelId
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['beds24-sync-states'] });
      queryClient.invalidateQueries({ queryKey: ['beds24-audit-logs'] });
      toast({
        title: 'Manual sync completed',
        description: `Processed: ${data.results.bookings?.processed || 0} bookings, ${data.results.calendar?.processed || 0} calendar records`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Manual sync failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Rate push mutation
  const ratePushMutation = useMutation({
    mutationFn: async ({ hotelId, roomTypeId, dateRange, updates }: any) => {
      const { data, error } = await supabase.functions.invoke('beds24-rate-push', {
        body: {
          hotelId,
          roomTypeId,
          dateRange,
          updates
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['beds24-rate-push-history'] });
      queryClient.invalidateQueries({ queryKey: ['beds24-audit-logs'] });
      toast({
        title: 'Rate push completed',
        description: `${data.result.successful_batches}/${data.result.batches} batches successful`
      });
      // Reset form
      setSelectedPushHotelId('');
      setSelectedPushRoomTypeId('');
      setPushDateRange({ startDate: '', endDate: '' });
      setPushUpdates({ rate: '', availability: '', stopSell: false, closedArrival: false });
    },
    onError: (error: any) => {
      toast({
        title: 'Rate push failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Phase 3: Recovery mutations
  const autoRecoveryMutation = useMutation({
    mutationFn: async (hotelId?: string) => {
      const { data, error } = await supabase.functions.invoke('beds24-recovery', {
        body: { 
          action: 'auto_recovery',
          hotel_id: hotelId
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['beds24-health-overview'] });
      queryClient.invalidateQueries({ queryKey: ['beds24-audit-logs'] });
      toast({
        title: 'Auto-recovery completed',
        description: `${data.actions_taken?.length || 0} recovery actions performed`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Auto-recovery failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const manualRecoveryMutation = useMutation({
    mutationFn: async (options: any) => {
      const { data, error } = await supabase.functions.invoke('beds24-recovery', {
        body: { 
          action: 'manual_recovery',
          ...options
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['beds24-health-overview'] });
      queryClient.invalidateQueries({ queryKey: ['beds24-sync-status'] });
      toast({
        title: 'Manual recovery completed',
        description: data.message
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Manual recovery failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: "default",
      error: "destructive",
      partial: "secondary"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const exportAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('ingestion_audit')
        .select('*')
        .eq('provider', 'beds24')
        .order('created_at', { ascending: false })
        .csv();
      
      if (error) throw error;
      
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beds24-audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Beds24 Integration Manager</h2>
          <p className="text-muted-foreground">
            Manage Beds24 API integration, tokens, and synchronization
          </p>
        </div>
      </div>

      <Tabs defaultValue="diagnostics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="diagnostics">Token Diagnostics</TabsTrigger>
          <TabsTrigger value="bootstrap">Bootstrap Hotels</TabsTrigger>
          <TabsTrigger value="sync-states">Sync States</TabsTrigger>
          <TabsTrigger value="delta-sync">Delta Sync</TabsTrigger>
          <TabsTrigger value="rate-push">Rate Push</TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="h-4 w-4 mr-2" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="recovery">
            <Shield className="h-4 w-4 mr-2" />
            Recovery
          </TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Token Diagnostics Tab */}
        <TabsContent value="diagnostics">
          <Card>
            <CardHeader>
              <CardTitle>API Token Status</CardTitle>
              <CardDescription>
                Monitor Beds24 API token health and usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTokens ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {tokenDiagnostics?.map((token) => (
                    <div key={token.type} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium flex items-center gap-2">
                          {token.type.toUpperCase()} Token
                          {token.is_expired ? (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => refreshTokenMutation.mutate(token.type)}
                          disabled={refreshTokenMutation.isPending}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Scopes:</span>
                          <div className="font-mono text-xs mt-1">
                            {token.scopes.join(', ')}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Properties:</span>
                          <div className="font-medium">{token.properties_count}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expires:</span>
                          <div className="font-medium">
                            {token.expires_at 
                              ? format(new Date(token.expires_at), 'MMM dd, HH:mm')
                              : 'No expiry'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Used:</span>
                          <div className="font-medium">
                            {token.last_used_at 
                              ? format(new Date(token.last_used_at), 'MMM dd, HH:mm')
                              : 'Never'}
                          </div>
                        </div>
                      </div>

                      {token.is_expired && (
                        <Alert className="mt-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This token has expired and needs to be refreshed before making API calls.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bootstrap Tab */}
        <TabsContent value="bootstrap">
          <Card>
            <CardHeader>
              <CardTitle>Bootstrap New Hotel</CardTitle>
              <CardDescription>
                Import a Beds24 property into OtelCiro PMS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <div>
                  <Label htmlFor="propertyId">Beds24 Property ID</Label>
                  <Input
                    id="propertyId"
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    placeholder="Enter Beds24 property ID"
                  />
                </div>
                
                <div>
                  <Label htmlFor="hotelId">OtelCiro Hotel</Label>
                  <select
                    id="hotelId"
                    value={selectedHotelId}
                    onChange={(e) => setSelectedHotelId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select hotel...</option>
                    {hotels?.map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name} ({hotel.code})
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={() => bootstrapMutation.mutate({ propertyId, hotelId: selectedHotelId })}
                  disabled={!propertyId || !selectedHotelId || bootstrapMutation.isPending}
                  className="w-full"
                >
                  {bootstrapMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run Bootstrap
                </Button>
              </div>

              {bootstrapMutation.isPending && (
                <Alert className="mt-4">
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Bootstrap is running... This may take several minutes to complete.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync States Tab */}
        <TabsContent value="sync-states">
          <Card>
            <CardHeader>
              <CardTitle>Hotel Sync States</CardTitle>
              <CardDescription>
                View synchronization status for each hotel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSyncStates ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Bootstrap</TableHead>
                      <TableHead>Sync Enabled</TableHead>
                      <TableHead>Last Booking Sync</TableHead>
                      <TableHead>Last Calendar Sync</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncStates?.map((state) => (
                      <TableRow key={state.hotel_id}>
                        <TableCell className="font-medium">
                          {state.hotels?.name || 'Unknown Hotel'}
                        </TableCell>
                        <TableCell>
                          {state.bootstrap_completed ? (
                            <Badge variant="default">Completed</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {state.sync_enabled ? (
                            <Badge variant="default">Enabled</Badge>
                          ) : (
                            <Badge variant="destructive">Disabled</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {state.last_bookings_modified_from 
                            ? format(new Date(state.last_bookings_modified_from), 'MMM dd, HH:mm')
                            : 'Never'}
                        </TableCell>
                        <TableCell>
                          {state.last_calendar_start 
                            ? `${state.last_calendar_start} to ${state.last_calendar_end}`
                            : 'Never'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit-logs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Audit Logs</CardTitle>
                  <CardDescription>
                    Recent Beds24 API operations and their results
                  </CardDescription>
                </div>
                <Button onClick={exportAuditLogs} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAuditLogs ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.created_at), 'MMM dd HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          {log.hotels?.name || 'System'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.operation}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log.status)}
                        </TableCell>
                        <TableCell>{log.records_processed}</TableCell>
                        <TableCell>{log.duration_ms}ms</TableCell>
                        <TableCell>
                          {log.request_cost > 0 && (
                            <span className="text-xs">
                              {log.request_cost} 
                              {log.limit_remaining && ` (${log.limit_remaining} left)`}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delta Sync Controls Tab */}
        <TabsContent value="delta-sync">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Manual Sync</CardTitle>
                <CardDescription>
                  Trigger immediate synchronization for specific hotels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="syncType">Sync Type</Label>
                    <select
                      id="syncType"
                      value={selectedSyncType}
                      onChange={(e) => setSelectedSyncType(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="all">All (Bookings + Calendar)</option>
                      <option value="bookings">Bookings Only</option>
                      <option value="calendar">Calendar Only</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="syncHotelId">Hotel (Optional)</Label>
                    <select
                      id="syncHotelId"
                      value={selectedSyncHotelId}
                      onChange={(e) => setSelectedSyncHotelId(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">All Hotels</option>
                      {hotels?.map((hotel) => (
                        <option key={hotel.id} value={hotel.id}>
                          {hotel.name} ({hotel.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    onClick={() => manualSyncMutation.mutate({ 
                      syncType: selectedSyncType, 
                      hotelId: selectedSyncHotelId || undefined 
                    })}
                    disabled={manualSyncMutation.isPending}
                    className="w-full"
                  >
                    {manualSyncMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Start Manual Sync
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduled Jobs</CardTitle>
                <CardDescription>
                  Automated sync job status and controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingScheduledJobs ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scheduledJobs?.map((job) => (
                      <div key={job.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{job.job_name}</h4>
                          <Badge variant={job.is_enabled ? "default" : "secondary"}>
                            {job.is_enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Schedule: {job.schedule_cron}</div>
                          <div>Last Run: {job.last_run_at 
                            ? format(new Date(job.last_run_at), 'MMM dd, HH:mm') 
                            : 'Never'}
                          </div>
                          <div>Status: {job.last_run_status || 'Not run'}</div>
                          <div>Runs: {job.run_count} (Errors: {job.error_count})</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rate Push Tab */}
        <TabsContent value="rate-push">
          <Card>
            <CardHeader>
              <CardTitle>Rate & Availability Push</CardTitle>
              <CardDescription>
                Push rate and availability changes from OtelCiro to Beds24
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pushHotelId">Hotel</Label>
                    <select
                      id="pushHotelId"
                      value={selectedPushHotelId}
                      onChange={(e) => setSelectedPushHotelId(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select hotel...</option>
                      {hotels?.map((hotel) => (
                        <option key={hotel.id} value={hotel.id}>
                          {hotel.name} ({hotel.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="pushRoomTypeId">Room Type</Label>
                    <select
                      id="pushRoomTypeId"
                      value={selectedPushRoomTypeId}
                      onChange={(e) => setSelectedPushRoomTypeId(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={!selectedPushHotelId}
                    >
                      <option value="">Select room type...</option>
                      {roomTypes?.map((roomType) => (
                        <option key={roomType.id} value={roomType.id}>
                          {roomType.name} ({roomType.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pushStartDate">Start Date</Label>
                      <Input
                        id="pushStartDate"
                        type="date"
                        value={pushDateRange.startDate}
                        onChange={(e) => setPushDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pushEndDate">End Date</Label>
                      <Input
                        id="pushEndDate"
                        type="date"
                        value={pushDateRange.endDate}
                        onChange={(e) => setPushDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Updates to Push</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pushRate">Rate (per night)</Label>
                        <Input
                          id="pushRate"
                          type="number"
                          step="0.01"
                          value={pushUpdates.rate}
                          onChange={(e) => setPushUpdates(prev => ({ ...prev, rate: e.target.value }))}
                          placeholder="Leave empty to skip"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pushAvailability">Availability</Label>
                        <Input
                          id="pushAvailability"
                          type="number"
                          value={pushUpdates.availability}
                          onChange={(e) => setPushUpdates(prev => ({ ...prev, availability: e.target.value }))}
                          placeholder="Leave empty to skip"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={pushUpdates.stopSell}
                          onChange={(e) => setPushUpdates(prev => ({ ...prev, stopSell: e.target.checked }))}
                        />
                        <span className="text-sm">Stop Sell</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={pushUpdates.closedArrival}
                          onChange={(e) => setPushUpdates(prev => ({ ...prev, closedArrival: e.target.checked }))}
                        />
                        <span className="text-sm">Closed Arrival</span>
                      </label>
                    </div>
                  </div>

                  <Button
                    onClick={() => ratePushMutation.mutate({
                      hotelId: selectedPushHotelId,
                      roomTypeId: selectedPushRoomTypeId,
                      dateRange: pushDateRange,
                      updates: Object.fromEntries(
                        Object.entries(pushUpdates).filter(([_, value]) => 
                          value !== '' && value !== null && value !== undefined
                        )
                      )
                    })}
                    disabled={!selectedPushHotelId || !selectedPushRoomTypeId || !pushDateRange.startDate || !pushDateRange.endDate || ratePushMutation.isPending}
                    className="w-full"
                  >
                    {ratePushMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Push to Beds24
                  </Button>
                </div>
                
                <div>
                  <h4 className="font-medium mb-4">Recent Rate Pushes</h4>
                  {loadingRatePushHistory ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {ratePushHistory?.map((push) => (
                        <div key={push.id} className="border rounded p-3 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{push.hotels?.name}</span>
                            {getStatusBadge(push.status)}
                          </div>
                          <div className="text-muted-foreground">
                            <div>{push.date_range_start} to {push.date_range_end}</div>
                            <div>{push.lines_successful}/{push.lines_total} lines successful</div>
                            <div>{format(new Date(push.created_at), 'MMM dd, HH:mm')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phase 3: Monitoring Tab */}
        <TabsContent value="monitoring">
          <div className="space-y-6">
            {/* System Health Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      System Health Overview
                    </CardTitle>
                    <CardDescription>
                      Real-time monitoring of Beds24 integration health
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${autoRefreshEnabled ? 'animate-spin' : ''}`} />
                      {autoRefreshEnabled ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingHealth ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : healthOverview ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        healthOverview.system_status === 'healthy' ? 'bg-green-100 text-green-800' :
                        healthOverview.system_status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {healthOverview.system_status.toUpperCase()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Last updated: {format(new Date(healthOverview.last_updated), 'MMM dd, HH:mm:ss')}
                      </div>
                    </div>

                    {healthOverview.issues.length > 0 && (
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Issues detected:</strong>
                          <ul className="mt-2 list-disc list-inside">
                            {healthOverview.issues.map((issue, index) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-primary">{healthOverview.metrics.enabled_hotels}/{healthOverview.metrics.total_hotels}</div>
                        <div className="text-sm text-muted-foreground">Hotels Enabled</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-primary">{healthOverview.metrics.total_tokens}</div>
                        <div className="text-sm text-muted-foreground">Active Tokens</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{Math.round(healthOverview.metrics.sync_success_rate)}%</div>
                        <div className="text-sm text-muted-foreground">Sync Success Rate</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-destructive">{healthOverview.metrics.error_rate_24h}</div>
                        <div className="text-sm text-muted-foreground">Errors (24h)</div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Performance Metrics
                    </CardTitle>
                    <CardDescription>
                      API performance and usage statistics
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTimeRange}
                      onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="1h">Last Hour</option>
                      <option value="24h">Last 24 Hours</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPerformance ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : performanceMetrics ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-primary">{performanceMetrics.total_operations}</div>
                        <div className="text-sm text-muted-foreground">Total Operations</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{performanceMetrics.avg_response_time}ms</div>
                        <div className="text-sm text-muted-foreground">Avg Response Time</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{performanceMetrics.success_rate}%</div>
                        <div className="text-sm text-muted-foreground">Success Rate</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{performanceMetrics.api_usage.total_cost}</div>
                        <div className="text-sm text-muted-foreground">API Cost</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Operations by Type</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(performanceMetrics.operations_by_type).map(([type, count]) => (
                          <div key={type} className="flex justify-between p-2 border rounded text-sm">
                            <span className="font-mono">{type}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Sync Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Hotel Sync Status
                </CardTitle>
                <CardDescription>
                  Detailed synchronization status per hotel
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSyncStatus ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : syncStatusData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 border rounded">
                        <div className="text-lg font-bold">{syncStatusData.summary.total_hotels}</div>
                        <div className="text-xs text-muted-foreground">Total Hotels</div>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <div className="text-lg font-bold text-green-600">{syncStatusData.summary.enabled_hotels}</div>
                        <div className="text-xs text-muted-foreground">Enabled</div>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <div className="text-lg font-bold text-blue-600">{syncStatusData.summary.bootstrapped_hotels}</div>
                        <div className="text-xs text-muted-foreground">Bootstrapped</div>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <div className="text-lg font-bold text-red-600">{syncStatusData.summary.hotels_with_errors}</div>
                        <div className="text-xs text-muted-foreground">With Errors</div>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {syncStatusData.hotel_sync_status.map((hotel) => (
                        <div key={hotel.hotel_id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{hotel.hotel_name} ({hotel.hotel_code})</div>
                            <div className="flex gap-1">
                              <Badge variant={hotel.sync_enabled ? "default" : "secondary"}>
                                {hotel.sync_enabled ? "Enabled" : "Disabled"}
                              </Badge>
                              {hotel.recent_errors > 0 && (
                                <Badge variant="destructive">{hotel.recent_errors} errors</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground grid grid-cols-2 gap-4">
                            <div>
                              <div>Last booking sync: {hotel.last_booking_sync ? format(new Date(hotel.last_booking_sync), 'MMM dd, HH:mm') : 'Never'}</div>
                              <div>Last calendar sync: {hotel.last_calendar_sync ? format(new Date(hotel.last_calendar_sync), 'MMM dd, HH:mm') : 'Never'}</div>
                            </div>
                            <div>
                              <div>Operations (24h): {hotel.total_operations_24h}</div>
                              <div>Bootstrap: {hotel.bootstrap_completed ? '✓ Complete' : '✗ Pending'}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Phase 3: Recovery Tab */}
        <TabsContent value="recovery">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  System Recovery & Maintenance
                </CardTitle>
                <CardDescription>
                  Tools for recovering from errors and maintaining system health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Auto Recovery
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically diagnose and attempt to fix common issues
                    </p>
                    <Button
                      onClick={() => autoRecoveryMutation.mutate()}
                      disabled={autoRecoveryMutation.isPending}
                      className="w-full"
                      variant="default"
                    >
                      {autoRecoveryMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      Run Auto Recovery
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Manual Recovery Options
                    </h4>
                    <div className="space-y-2">
                      <Button
                        onClick={() => manualRecoveryMutation.mutate({
                          recovery_options: { reset_tokens: true }
                        })}
                        disabled={manualRecoveryMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Reset Authentication Tokens
                      </Button>
                      <Button
                        onClick={() => manualRecoveryMutation.mutate({
                          recovery_options: { clear_errors: true }
                        })}
                        disabled={manualRecoveryMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Clear Error Logs
                      </Button>
                      <Button
                        onClick={() => supabase.functions.invoke('beds24-recovery', {
                          body: { action: 'reset_sync_state' }
                        }).then((result) => {
                          queryClient.invalidateQueries({ queryKey: ['beds24-sync-states'] });
                          toast({ title: 'Sync state reset completed' });
                        })}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Reset All Sync States
                      </Button>
                      <Button
                        onClick={() => supabase.functions.invoke('beds24-recovery', {
                          body: { action: 'repair_data_integrity' }
                        }).then((result) => {
                          queryClient.invalidateQueries({ queryKey: ['beds24-health-overview'] });
                          toast({ title: 'Data integrity repair completed' });
                        })}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Repair Data Integrity
                      </Button>
                    </div>
                  </div>
                </div>

                <Alert className="mt-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Recovery operations may temporarily disrupt sync processes. 
                    Use with caution in production environments.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}