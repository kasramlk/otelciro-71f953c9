import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Database, 
  Calendar, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  Settings, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Activity
} from 'lucide-react';

interface SyncStatus {
  operation: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  lastSync?: string;
  recordsProcessed?: number;
}

interface Beds24Stats {
  totalProperties: number;
  totalRooms: number;
  totalBookings: number;
  lastSyncDate: string | null;
  syncEnabled: boolean;
}

export const Beds24Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Beds24Stats | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, SyncStatus>>({});
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const { data: properties } = await supabase.from('beds24_properties').select('*');
      const { data: rooms } = await supabase.from('beds24_room_types').select('*');
      const { data: bookings } = await supabase.from('beds24_bookings').select('*');
      
      // Fetch connections instead of config
      const { data: connections } = await supabase
        .from('beds24_connections')
        .select('*')
        .eq('status', 'active')
        .limit(1);
      
      const activeConnection = connections?.[0];

      // Get latest API logs instead of sync logs
      const { data: apiLogs } = await supabase
        .from('beds24_api_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      // Get sync state for last sync info
      const { data: syncState } = await supabase
        .from('beds24_sync_state')
        .select('*')
        .limit(1);

      const lastSyncDate = syncState?.[0]?.last_calendar_full_refresh || 
                          syncState?.[0]?.last_properties_refresh ||
                          activeConnection?.last_token_use_at;

      setStats({
        totalProperties: properties?.length || 0,
        totalRooms: rooms?.length || 0,
        totalBookings: bookings?.length || 0,
        lastSyncDate: lastSyncDate,
        syncEnabled: !!activeConnection
      });

      setConfig({
        sync_enabled: !!activeConnection,
        beds24_property_id: activeConnection?.beds24_property_id,
        auto_sync_calendar: true,
        auto_sync_bookings: true,
        sync_frequency: 3600
      });

      // Process API logs into sync status
      const statusMap: Record<string, SyncStatus> = {};
      
      // Create mock statuses based on available data
      if (properties && properties.length > 0) {
        statusMap['properties'] = {
          operation: 'sync_properties',
          status: 'completed',
          lastSync: properties[0].last_sync_at || properties[0].created_at,
          recordsProcessed: properties.length
        };
      }
      
      if (rooms && rooms.length > 0) {
        statusMap['rooms'] = {
          operation: 'sync_rooms', 
          status: 'completed',
          lastSync: rooms[0].updated_at || rooms[0].created_at,
          recordsProcessed: rooms.length
        };
      }
      
      if (bookings && bookings.length > 0) {
        statusMap['bookings'] = {
          operation: 'sync_bookings',
          status: 'completed', 
          lastSync: bookings[0].updated_at || bookings[0].created_at,
          recordsProcessed: bookings.length
        };
      }

      // Check if we have recent errors in API logs
      const recentErrors = apiLogs?.filter(log => (log.status || 0) >= 400);
      if (recentErrors && recentErrors.length > 0) {
        // Mark operations as failed if there are recent errors
        Object.keys(statusMap).forEach(key => {
          if (statusMap[key].status === 'completed') {
            statusMap[key].status = 'failed';
          }
        });
      }

      setSyncStatus(statusMap);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const handleSync = async (operation: string, propertyId?: string) => {
    if (!config?.sync_enabled) {
      toast.error('Beds24 integration is not configured. Please contact your administrator.');
      return;
    }

    setLoading(true);
    
    try {
      // For now, just show a success message since the new architecture 
      // uses different edge functions that are admin-controlled
      toast.success(`${operation.replace('_', ' ')} would be initiated here`);
      
      // Refresh data after sync
      setTimeout(() => {
        fetchDashboardData();
      }, 2000);

    } catch (error: any) {
      console.error('Sync failed:', error);
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getSyncStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>;
      case 'running':
        return <Badge className="bg-warning/10 text-warning border-warning/20"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Running</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const syncOperations = [
    { 
      id: 'sync_properties', 
      label: 'Sync Properties', 
      icon: Database, 
      description: 'Import property details from Beds24' 
    },
    { 
      id: 'sync_rooms', 
      label: 'Sync Rooms', 
      icon: BookOpen, 
      description: 'Import room types and configurations' 
    },
    { 
      id: 'sync_calendar', 
      label: 'Sync Calendar', 
      icon: Calendar, 
      description: 'Import availability and rates (ARI)' 
    },
    { 
      id: 'sync_bookings', 
      label: 'Sync Bookings', 
      icon: BookOpen, 
      description: 'Import reservations and booking data' 
    },
    { 
      id: 'sync_messages', 
      label: 'Sync Messages', 
      icon: MessageSquare, 
      description: 'Import guest communications' 
    },
    { 
      id: 'sync_invoices', 
      label: 'Sync Invoices', 
      icon: FileText, 
      description: 'Import billing and invoice data' 
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beds24 Integration</h1>
          <p className="text-muted-foreground">
            Manage your Beds24 property management system integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleSync('full_sync')}
            disabled={loading || !config?.sync_enabled}
            className="bg-primary hover:bg-primary/90"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Full Sync
          </Button>
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProperties || 0}</div>
            <p className="text-xs text-muted-foreground">
              Connected properties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Room Types</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRooms || 0}</div>
            <p className="text-xs text-muted-foreground">
              Synced room types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Imported bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.syncEnabled ? (
                <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
              ) : (
                <Badge variant="outline">Inactive</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.lastSyncDate 
                ? `Last sync: ${new Date(stats.lastSyncDate).toLocaleDateString()}`
                : 'Never synced'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="operations">Sync Operations</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Synchronization</CardTitle>
              <CardDescription>
                Sync different types of data from your Beds24 account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!config?.sync_enabled && (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sync is currently disabled. Enable it in Configuration tab to start syncing data.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {syncOperations.map((operation) => {
                  const status = syncStatus[operation.id.replace('sync_', '')];
                  const Icon = operation.icon;

                  return (
                    <Card key={operation.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Icon className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base">{operation.label}</CardTitle>
                          </div>
                          {getSyncStatusBadge(status?.status)}
                        </div>
                        <CardDescription>{operation.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            {status?.lastSync && (
                              <>Last: {new Date(status.lastSync).toLocaleString()}</>
                            )}
                            {status?.recordsProcessed && (
                              <> • {status.recordsProcessed} records</>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSync(operation.id)}
                            disabled={loading || !config?.sync_enabled}
                            variant="outline"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Sync
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
              <CardDescription>
                Recent synchronization operations and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(syncStatus).map(([entityType, status]) => (
                  <div key={entityType} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium capitalize">{entityType.replace('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        {status.lastSync && new Date(status.lastSync).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      {getSyncStatusBadge(status.status)}
                      {status.recordsProcessed && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {status.recordsProcessed} records
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {Object.keys(syncStatus).length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No sync operations found. Run your first sync to see history here.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>
                Configure your Beds24 integration preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Configuration settings are managed through the admin panel. Contact your system administrator to modify sync settings, property mappings, and API credentials.
                </AlertDescription>
              </Alert>
              
              <Separator className="my-6" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Sync Enabled</span>
                  <Badge variant={config?.sync_enabled ? 'default' : 'outline'}>
                    {config?.sync_enabled ? 'Yes' : 'No'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Sync Frequency</span>
                  <span className="text-muted-foreground">
                    {config?.sync_frequency ? `${config.sync_frequency / 3600} hours` : 'Not configured'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Property ID</span>
                  <span className="text-muted-foreground">
                    {config?.beds24_property_id || 'Not configured'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Auto Sync Calendar</span>
                  <Badge variant={config?.auto_sync_calendar ? 'default' : 'outline'}>
                    {config?.auto_sync_calendar ? 'Yes' : 'No'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Auto Sync Bookings</span>
                  <Badge variant={config?.auto_sync_bookings ? 'default' : 'outline'}>
                    {config?.auto_sync_bookings ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};