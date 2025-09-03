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
import { AlertCircle, CheckCircle, Clock, RefreshCw, Play, Download } from 'lucide-react';
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

export default function Beds24IntegrationManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [propertyId, setPropertyId] = useState('');
  const [selectedHotelId, setSelectedHotelId] = useState('');

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
      </Tabs>
    </div>
  );
}