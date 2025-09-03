import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Monitor,
  Link as LinkIcon,
  Activity,
  Download,
  AlertCircle
} from 'lucide-react';

interface Beds24Connection {
  id: string;
  org_id: string;
  hotel_id: string;
  beds24_property_id: string; // Changed from number to string
  scopes: string[];
  status: string;
  last_token_use_at?: string;
  created_at: string;
  secret_id?: string; // Added optional secret_id field
}

interface Hotel {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
}

interface ApiLog {
  id: number;
  hotel_id?: string;
  beds24_property_id?: number;
  method?: string;
  path?: string;
  status?: number;
  request_cost?: number;
  five_min_remaining?: number;
  started_at: string;
  duration_ms?: number;
  error?: string;
}

interface ConnectionHealth {
  connection: any;
  syncState: any;
  accountDetails: any;
  rateLimitInfo: any;
  statistics: any;
  recentLogs: ApiLog[];
}

interface ImportResult {
  connectionId: string;
  loading: boolean;
  success: boolean;
  error?: string;
  statistics?: {
    properties: number;
    roomTypes: number;
    bookings: number;
    messages: number;
    calendarEntries: number;
  };
  importedAt?: string;
}

const Beds24AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connections, setConnections] = useState<Beds24Connection[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth | null>(null);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  
  // Form state for new connection
  const [linkForm, setLinkForm] = useState({
    orgId: '550e8400-e29b-41d4-a716-446655440000', // Default org ID
    hotelId: '',
    beds24PropertyId: '',
    inviteCode: '',
    scopes: ['bookings', 'inventory', 'properties', 'accounts', 'channels']
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchHotels();
    fetchConnections();
    fetchApiLogs();
  }, []);

  const fetchHotels = async () => {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('id, name, address, city, country')
        .order('name');

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      toast({
        title: "Error",
        description: "Failed to fetch hotels",
        variant: "destructive",
      });
    }
  };

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('beds24_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast({
        title: "Error",
        description: "Failed to fetch connections",
        variant: "destructive",
      });
    }
  };

  const fetchApiLogs = async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { data, error } = await supabase
        .from('beds24_api_logs')
        .select('*')
        .gte('started_at', twentyFourHoursAgo.toISOString())
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setApiLogs(data || []);
    } catch (error) {
      console.error('Error fetching API logs:', error);
    }
  };

  const linkProperty = async () => {
    if (!linkForm.orgId || !linkForm.hotelId || !linkForm.beds24PropertyId || !linkForm.inviteCode) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('beds24-admin-link', {
        body: {
          orgId: linkForm.orgId,
          hotelId: linkForm.hotelId,
          beds24PropertyId: parseInt(linkForm.beds24PropertyId),
          inviteCode: linkForm.inviteCode,
          scopes: linkForm.scopes
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to link property');
      }

      toast({
        title: "Success",
        description: "Property linked successfully! Initial import has started.",
      });

      // Reset form and refresh data
      setLinkForm({
        orgId: '550e8400-e29b-41d4-a716-446655440000',
        hotelId: '',
        beds24PropertyId: '',
        inviteCode: '',
        scopes: ['bookings', 'inventory', 'properties', 'accounts', 'channels']
      });
      
      fetchConnections();
    } catch (error: any) {
      console.error('Link failed:', error);
      toast({
        title: "Link Failed",
        description: error.message || "Failed to link property",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionHealth = async (hotelId: string) => {
    setTesting(true);
    try {
      const response = await supabase.functions.invoke('beds24-connection-health', {
        body: { hotelId }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setConnectionHealth(response.data);
      toast({
        title: "Success",
        description: "Connection health check completed",
      });
    } catch (error: any) {
      console.error('Health check failed:', error);
      toast({
        title: "Health Check Failed",
        description: error.message || "Failed to check connection health",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Token Expired</Badge>;
      case 'disabled':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Disabled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getHotelName = (hotelId: string) => {
    const hotel = hotels.find(h => h.id === hotelId);
    return hotel?.name || 'Unknown Hotel';
  };

  const triggerManualImport = async (connection: Beds24Connection) => {
    // Set loading state for this connection
    setImportResults(prev => [
      ...prev.filter(r => r.connectionId !== connection.id),
      { connectionId: connection.id, loading: true, success: false }
    ]);

    try {
      const response = await supabase.functions.invoke('beds24-initial-import', {
        body: {
          hotelId: connection.hotel_id,
          beds24PropertyId: parseInt(connection.beds24_property_id)
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Import failed');
      }

      const result = response.data;
      
      // Update with success result
      setImportResults(prev => [
        ...prev.filter(r => r.connectionId !== connection.id),
        {
          connectionId: connection.id,
          loading: false,
          success: true,
          statistics: result.statistics || {
            properties: result.propertiesImported || 0,
            roomTypes: result.roomTypesImported || 0,
            bookings: result.bookingsImported || 0,
            messages: result.messagesImported || 0,
            calendarEntries: result.calendarEntriesImported || 0
          },
          importedAt: new Date().toISOString()
        }
      ]);

      toast({
        title: "Import Successful",
        description: `Imported ${result.statistics?.properties || 0} properties, ${result.statistics?.roomTypes || 0} room types, ${result.statistics?.bookings || 0} bookings`,
      });

      // Refresh connections and API logs
      fetchConnections();
      fetchApiLogs();
    } catch (error: any) {
      console.error('Import failed:', error);
      
      // Update with error result
      setImportResults(prev => [
        ...prev.filter(r => r.connectionId !== connection.id),
        {
          connectionId: connection.id,
          loading: false,
          success: false,
          error: error.message || 'Import failed'
        }
      ]);

      toast({
        title: "Import Failed",
        description: error.message || "Failed to import data from Beds24",
        variant: "destructive",
      });
    }
  };

  const getImportResult = (connectionId: string) => {
    return importResults.find(r => r.connectionId === connectionId);
  };

  const getRecentStats = () => {
    const totalRequests = apiLogs.length;
    const errorRequests = apiLogs.filter(log => (log.status || 0) >= 400).length;
    const avgResponseTime = totalRequests > 0 ? 
      apiLogs.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / totalRequests : 0;
    
    return {
      totalRequests,
      errorRequests,
      errorRate: totalRequests > 0 ? ((errorRequests / totalRequests) * 100).toFixed(1) + '%' : '0%',
      avgResponseTime: Math.round(avgResponseTime) + 'ms'
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Beds24 Integration Management</h1>
        <p className="text-muted-foreground">Admin-only interface for managing Beds24 connections via invitation codes</p>
      </div>

      <Alert>
        <LinkIcon className="h-4 w-4" />
        <AlertDescription>
          This is the admin interface for linking properties using Beds24 invitation codes. 
          Hotel users will never see Beds24 directly - they only interact with the PMS import process.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">Active Connections</TabsTrigger>
          <TabsTrigger value="link">Link New Property</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Beds24 Connections</CardTitle>
            </CardHeader>
            <CardContent>
              {connections.length > 0 ? (
                <div className="space-y-4">
                  {connections.map((connection) => {
                    const importResult = getImportResult(connection.id);
                    return (
                      <div key={connection.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{getHotelName(connection.hotel_id)}</h4>
                            <p className="text-sm text-muted-foreground">
                              Beds24 Property ID: {connection.beds24_property_id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Scopes: {connection.scopes?.join(', ')}
                            </p>
                            {connection.last_token_use_at && (
                              <p className="text-xs text-muted-foreground">
                                Last activity: {new Date(connection.last_token_use_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(connection.status)}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => checkConnectionHealth(connection.hotel_id)}
                              disabled={testing}
                            >
                              {testing ? <Clock className="w-3 h-3 animate-spin" /> : <Monitor className="w-3 h-3" />}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => triggerManualImport(connection)}
                              disabled={importResult?.loading || connection.status === 'error'}
                            >
                              {importResult?.loading ? (
                                <Clock className="w-3 h-3 animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                              {importResult?.loading ? 'Importing...' : 'Import Data'}
                            </Button>
                            {connection.status === 'error' && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => {
                                  toast({
                                    title: "Connection Error",
                                    description: "This connection has expired. Please use the 'Link New Property' tab to re-establish the connection with a new invitation code.",
                                    variant: "destructive",
                                  });
                                }}
                              >
                                <AlertCircle className="w-3 h-3" />
                                Re-link Required
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Import Results */}
                        {importResult && !importResult.loading && (
                          <div className={`p-3 rounded border-l-4 ${
                            importResult.success 
                              ? 'bg-green-50 border-l-green-500 dark:bg-green-950' 
                              : 'bg-red-50 border-l-red-500 dark:bg-red-950'
                          }`}>
                            <div className="flex items-start gap-2">
                              {importResult.success ? (
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {importResult.success ? 'Import Successful' : 'Import Failed'}
                                </p>
                                {importResult.success && importResult.statistics && (
                                  <div className="mt-1 text-xs text-muted-foreground grid grid-cols-2 gap-1">
                                    <span>Properties: {importResult.statistics.properties}</span>
                                    <span>Room Types: {importResult.statistics.roomTypes}</span>
                                    <span>Bookings: {importResult.statistics.bookings}</span>
                                    <span>Messages: {importResult.statistics.messages}</span>
                                    <span>Calendar: {importResult.statistics.calendarEntries}</span>
                                    {importResult.importedAt && (
                                      <span className="col-span-2">
                                        Imported: {new Date(importResult.importedAt).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {importResult.error && (
                                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                    {importResult.error}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No active connections. Use the Link New Property tab to get started.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="link" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Link New Property via Invitation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Get the invitation code from Beds24 for the specific property and scopes you want to access.
                  This will establish a secure server-side connection with long-lived refresh tokens.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="orgId">Organization ID</Label>
                  <Input
                    id="orgId"
                    placeholder="550e8400-e29b-41d4-a716-446655440000"
                    value={linkForm.orgId}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, orgId: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hotelSelect">PMS Hotel</Label>
                  <select 
                    id="hotelSelect"
                    className="w-full p-2 border rounded-md bg-background"
                    value={linkForm.hotelId}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, hotelId: e.target.value }))}
                  >
                    <option value="">Select a hotel...</option>
                    {hotels.map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyId">Beds24 Property ID</Label>
                  <Input
                    id="propertyId"
                    type="number"
                    placeholder="123456"
                    value={linkForm.beds24PropertyId}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, beds24PropertyId: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Invitation Code</Label>
                  <Input
                    id="inviteCode"
                    placeholder="Enter invitation code from Beds24"
                    value={linkForm.inviteCode}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, inviteCode: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={linkProperty}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Clock className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                Link Property
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-4 h-4" />
                  API Usage (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Requests:</span>
                    <span className="font-medium">{getRecentStats().totalRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Error Rate:</span>
                    <span className="font-medium">{getRecentStats().errorRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Response:</span>
                    <span className="font-medium">{getRecentStats().avgResponseTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Connection Health</CardTitle>
              </CardHeader>
              <CardContent>
                {connectionHealth ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Status:</span>
                      {getStatusBadge(connectionHealth.connection?.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">5min Credits:</span>
                      <span className="font-medium">{connectionHealth.rateLimitInfo?.fiveMinRemaining || 'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Click monitor button on a connection to view health details</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {apiLogs.slice(0, 5).map((log, index) => (
                    <div key={log.id} className="text-sm">
                      <div className="flex justify-between">
                        <span className="truncate">{log.method} {log.path}</span>
                        <span className={`ml-2 ${(log.status || 0) >= 400 ? 'text-red-500' : 'text-green-500'}`}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {apiLogs.length === 0 && (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { Beds24AdminSettings };