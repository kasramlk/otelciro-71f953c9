import React, { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Play, 
  Download, 
  Activity, 
  Shield, 
  BarChart3, 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  Settings,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { asArray } from "@/lib/asArray";

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
  bootstrap_completed_at?: string;
  last_bookings_modified_from?: string;
  last_calendar_start?: string;
  last_calendar_end?: string;
  sync_enabled: boolean;
  metadata: any;
}

interface AuditLog {
  id: number;
  provider: string;
  operation: string;
  status: string;
  hotel_id?: string;
  request_cost: number;
  credit_limit_remaining?: number;
  duration_ms: number;
  error_details?: string;
  created_at: string;
}

export default function Beds24Page() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [propertyId, setPropertyId] = useState<string>('');
  const [auditFilter, setAuditFilter] = useState<string>('');
  const [pushConfig, setPushConfig] = useState({
    hotelId: '',
    roomTypeId: '',
    startDate: '',
    endDate: '',
    rate: '',
    availability: '',
    minStay: '',
    maxStay: '',
    stopSell: false,
    closedArrival: false
  });

  // Runtime assertions for debugging
  function assertArray(name: string, v: any) {
    if (!Array.isArray(v)) console.warn(`[Beds24Page] Expected array for ${name}, got`, v);
  }

  // Query for hotels
  const { data: hotels = [] } = useQuery({
    queryKey: ['hotels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotels')
        .select('id, name, code')
        .order('name');
      
      if (error) throw error;
      return data ?? [];
    }
  });

  // Query for token diagnostics  
  const { data: tokenDiagnostics = [], isLoading: loadingTokens } = useQuery({
    queryKey: ['beds24-token-diagnostics'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('beds24-token-manager', {
        body: { action: 'diagnostics' }
      });
      if (error) throw error;
      return asArray<TokenDiagnostics>(data);
    },
    refetchInterval: 30000,
  });

  // Query for sync status
  const { data: syncStatus = [], isLoading: syncLoading } = useQuery({
    queryKey: ['beds24-sync-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_state')
        .select(`
          *,
          hotels!sync_state_hotel_id_fkey(name, code)
        `)
        .eq('provider', 'beds24');
      
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  // Query for audit logs
  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ['beds24-audit-logs', auditFilter],
    queryFn: async () => {
      let query = supabase
        .from('v_ingestion_audit')
        .select('*')
        .eq('provider', 'beds24')
        .order('created_at', { ascending: false })
        .limit(100);

      if (auditFilter) {
        query = query.ilike('operation', `%${auditFilter}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data ?? []) as AuditLog[];
    },
    refetchInterval: 10000,
  });

  // Query for room types
  const { data: roomTypes = [] } = useQuery({
    queryKey: ['room-types', pushConfig.hotelId],
    queryFn: async () => {
      if (!pushConfig.hotelId) return [];
      const { data, error } = await supabase
        .from('room_types')
        .select('id, name, code')
        .eq('hotel_id', pushConfig.hotelId)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!pushConfig.hotelId
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
      queryClient.invalidateQueries({ queryKey: ['beds24-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['beds24-audit-logs'] });
      toast({
        title: 'Bootstrap completed successfully',
        description: `Imported data successfully`
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

  // Toggle sync mutation
  const toggleSyncMutation = useMutation({
    mutationFn: async ({ hotelId, enabled }: { hotelId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('sync_state')
        .upsert({
          provider: 'beds24',
          hotel_id: hotelId,
          sync_enabled: enabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'provider,hotel_id'
        });

      if (error) throw error;
      return { hotelId, enabled };
    },
    onSuccess: ({ hotelId, enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['beds24-sync-status'] });
      toast({
        title: `Sync ${enabled ? 'enabled' : 'disabled'}`,
        description: `Hotel sync has been ${enabled ? 'enabled' : 'disabled'}`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to toggle sync',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Manual sync mutation
  const manualSyncMutation = useMutation({
    mutationFn: async ({ type, hotelId }: { type: string; hotelId?: string }) => {
      const { data, error } = await supabase.functions.invoke('beds24-sync', {
        body: { type, hotelId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds24-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['beds24-audit-logs'] });
      toast({
        title: 'Manual sync completed',
        description: 'Sync operation completed successfully'
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
    mutationFn: async (config: any) => {
      const { data, error } = await supabase.functions.invoke('beds24-rate-push', {
        body: {
          hotelId: config.hotelId,
          roomTypeId: config.roomTypeId,
          start: config.startDate,
          end: config.endDate,
          changes: {
            rate: config.rate ? parseFloat(config.rate) : undefined,
            numAvail: config.availability ? parseInt(config.availability) : undefined,
            minStay: config.minStay ? parseInt(config.minStay) : undefined,
            maxStay: config.maxStay ? parseInt(config.maxStay) : undefined,
            stopSell: config.stopSell,
            closedArrival: config.closedArrival
          }
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds24-audit-logs'] });
      toast({
        title: 'Rate push completed',
        description: 'Rates updated successfully'
      });
      setPushConfig({
        hotelId: '',
        roomTypeId: '',
        startDate: '',
        endDate: '',
        rate: '',
        availability: '',
        minStay: '',
        maxStay: '',
        stopSell: false,
        closedArrival: false
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Rate push failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Export audit logs to CSV
  const exportAuditLogs = () => {
    const safeAuditLogs = asArray(auditLogs);
    if (safeAuditLogs.length === 0) return;

    const csvData = safeAuditLogs.map(log => ({
      'Timestamp': format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      'Operation': log.operation,
      'Status': log.status,
      'Hotel': log.hotel_id || 'N/A',
      'Duration (ms)': log.duration_ms || 0,
      'Request Cost': log.request_cost || 0,
      'Credits Remaining': log.credit_limit_remaining || 'N/A',
      'Error': log.error_details || ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `beds24-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'partial':
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Partial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      {/* Runtime assertions for debugging */}
      {(() => {
        assertArray("hotels", hotels);
        assertArray("tokenDiagnostics", tokenDiagnostics);
        assertArray("syncStatus", syncStatus);
        assertArray("auditLogs", auditLogs);
        assertArray("roomTypes", roomTypes);
        return null;
      })()}
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Beds24 Integration</h1>
          <p className="text-muted-foreground">
            Manage Beds24 API integration, tokens, and synchronization
          </p>
        </div>
      </div>

      <Tabs defaultValue="diagnostics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="diagnostics">Token Diagnostics</TabsTrigger>
          <TabsTrigger value="bootstrap">Bootstrap Hotels</TabsTrigger>
          <TabsTrigger value="sync-status">Sync Status</TabsTrigger>
          <TabsTrigger value="rate-push">Rate Push</TabsTrigger>
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
                  {asArray(tokenDiagnostics).map((token) => (
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
                  <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hotel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {asArray(hotels).map((hotel) => (
                        <SelectItem key={hotel.id} value={hotel.id}>
                          {hotel.name} ({hotel.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

        {/* Sync Status Tab */}
        <TabsContent value="sync-status">
          <Card>
            <CardHeader>
              <CardTitle>Hotel Sync States</CardTitle>
              <CardDescription>
                View and manage synchronization status for each hotel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {syncLoading ? (
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {asArray(syncStatus).map((state: any) => (
                      <TableRow key={state.hotel_id}>
                        <TableCell className="font-medium">
                          {state.hotels?.name || state.hotel_id}
                        </TableCell>
                        <TableCell>
                          {state.bootstrap_completed_at ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={state.sync_enabled ? "default" : "secondary"}>
                              {state.sync_enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleSyncMutation.mutate({ 
                                hotelId: state.hotel_id, 
                                enabled: !state.sync_enabled 
                              })}
                              disabled={toggleSyncMutation.isPending}
                            >
                              {state.sync_enabled ? 'Disable' : 'Enable'}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {state.last_bookings_modified_from ? (
                            <span className="text-sm">
                              {format(new Date(state.last_bookings_modified_from), 'MMM dd, HH:mm')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {state.last_calendar_start ? (
                            <span className="text-sm">
                              {format(new Date(state.last_calendar_start), 'MMM dd, yyyy')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => manualSyncMutation.mutate({ 
                                type: 'bookings', 
                                hotelId: state.hotel_id 
                              })}
                              disabled={manualSyncMutation.isPending || !state.sync_enabled}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Bookings
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => manualSyncMutation.mutate({ 
                                type: 'calendar', 
                                hotelId: state.hotel_id 
                              })}
                              disabled={manualSyncMutation.isPending || !state.sync_enabled}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Calendar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => manualSyncMutation.mutate({ 
                                type: 'both', 
                                hotelId: state.hotel_id 
                              })}
                              disabled={manualSyncMutation.isPending || !state.sync_enabled}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Both
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Push Tab */}
        <TabsContent value="rate-push">
          <Card>
            <CardHeader>
              <CardTitle>Rate & Availability Push</CardTitle>
              <CardDescription>
                Push rate and availability changes to Beds24
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hotel</Label>
                    <Select 
                      value={pushConfig.hotelId} 
                      onValueChange={(value) => setPushConfig(prev => ({ ...prev, hotelId: value, roomTypeId: '' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select hotel..." />
                      </SelectTrigger>
                      <SelectContent>
                        {asArray(hotels).map((hotel) => (
                          <SelectItem key={hotel.id} value={hotel.id}>
                            {hotel.name} ({hotel.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Room Type</Label>
                    <Select 
                      value={pushConfig.roomTypeId} 
                      onValueChange={(value) => setPushConfig(prev => ({ ...prev, roomTypeId: value }))}
                      disabled={!pushConfig.hotelId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {asArray(roomTypes).map((roomType) => (
                          <SelectItem key={roomType.id} value={roomType.id}>
                            {roomType.name} ({roomType.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={pushConfig.startDate}
                      onChange={(e) => setPushConfig(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={pushConfig.endDate}
                      onChange={(e) => setPushConfig(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Rate (per night)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={pushConfig.rate}
                      onChange={(e) => setPushConfig(prev => ({ ...prev, rate: e.target.value }))}
                      placeholder="Leave empty to skip"
                    />
                  </div>
                  <div>
                    <Label>Availability</Label>
                    <Input
                      type="number"
                      value={pushConfig.availability}
                      onChange={(e) => setPushConfig(prev => ({ ...prev, availability: e.target.value }))}
                      placeholder="Leave empty to skip"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Stay</Label>
                    <Input
                      type="number"
                      value={pushConfig.minStay}
                      onChange={(e) => setPushConfig(prev => ({ ...prev, minStay: e.target.value }))}
                      placeholder="Leave empty to skip"
                    />
                  </div>
                  <div>
                    <Label>Max Stay</Label>
                    <Input
                      type="number"
                      value={pushConfig.maxStay}
                      onChange={(e) => setPushConfig(prev => ({ ...prev, maxStay: e.target.value }))}
                      placeholder="Leave empty to skip"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={pushConfig.stopSell}
                      onChange={(e) => setPushConfig(prev => ({ ...prev, stopSell: e.target.checked }))}
                    />
                    <span className="text-sm">Stop Sell</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={pushConfig.closedArrival}
                      onChange={(e) => setPushConfig(prev => ({ ...prev, closedArrival: e.target.checked }))}
                    />
                    <span className="text-sm">Closed Arrival</span>
                  </label>
                </div>

                <Button
                  onClick={() => ratePushMutation.mutate(pushConfig)}
                  disabled={
                    !pushConfig.hotelId || 
                    !pushConfig.roomTypeId || 
                    !pushConfig.startDate || 
                    !pushConfig.endDate || 
                    ratePushMutation.isPending
                  }
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit-logs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>
                    View Beds24 integration audit trail and logs
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Filter by operation..."
                    value={auditFilter}
                    onChange={(e) => setAuditFilter(e.target.value)}
                    className="w-48"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportAuditLogs}
                    disabled={asArray(auditLogs).length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {asArray(auditLogs).map((log) => (
                    <div key={log.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{log.operation}</span>
                          {getStatusBadge(log.status)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>Hotel: {log.hotel_id || 'N/A'}</div>
                        <div>Duration: {log.duration_ms || 0}ms</div>
                        <div>Cost: {log.request_cost || 0}</div>
                        <div>Credits: {log.credit_limit_remaining || 'N/A'}</div>
                      </div>
                      
                      {log.error_details && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                          {log.error_details}
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
    </div>
  );
}