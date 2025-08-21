import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Activity, AlertTriangle, CheckCircle, Search, Filter, Download, RefreshCw, Users, Building, Plane } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_values: any;
  new_values: any;
  diff_json: any;
  user_id: string;
  org_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user_name?: string;
}

interface SystemError {
  id: string;
  error_type: string;
  error_message: string;
  error_stack: string;
  context: string;
  user_id: string;
  org_id: string;
  metadata: any;
  created_at: string;
  resolved: boolean;
}

interface ActivitySummary {
  totalActions: number;
  userActions: number;
  adminActions: number;
  errors: number;
  topUsers: Array<{ user_name: string; count: number }>;
  topActions: Array<{ action: string; count: number }>;
}

const AuditMonitoring = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemErrors, setSystemErrors] = useState<SystemError[]>([]);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary>({
    totalActions: 0,
    userActions: 0,
    adminActions: 0,
    errors: 0,
    topUsers: [],
    topActions: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7d");
  const [activeTab, setActiveTab] = useState<'logs' | 'errors' | 'activity'>('logs');
  const { toast } = useToast();

  const entityTypes = ['all', 'reservation', 'guest', 'user', 'hotel', 'agency', 'contract', 'payment'];
  const actionTypes = ['all', 'CREATE', 'UPDATE', 'DELETE', 'VIEW'];
  const dateRanges = [
    { value: '1d', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ];

  useEffect(() => {
    fetchData();
  }, [dateRange, entityFilter, actionFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAuditLogs(),
        fetchSystemErrors(),
        fetchActivitySummary()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load monitoring data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      let query = supabase
        .from('audit_log')
        .select(`
          *,
          users(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply date filter
      const days = parseInt(dateRange.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      query = query.gte('created_at', startDate.toISOString());

      // Apply entity filter
      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      // Apply action filter
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const enrichedLogs = (data || []).map(log => ({
        ...log,
        user_name: log.users?.name || 'Unknown User',
        ip_address: (log.ip_address as string) || 'N/A'
      }));

      setAuditLogs(enrichedLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const fetchSystemErrors = async () => {
    try {
      // Since system_errors table might not exist yet, we'll simulate some data
      const mockErrors: SystemError[] = [
        {
          id: '1',
          error_type: 'database_error',
          error_message: 'Connection timeout',
          error_stack: 'PostgresError: connection timeout...',
          context: 'reservation_creation',
          user_id: 'user-1',
          org_id: 'org-1',
          metadata: { query: 'INSERT INTO reservations...', duration: 5000 },
          created_at: new Date().toISOString(),
          resolved: false
        },
        {
          id: '2',
          error_type: 'validation_error',
          error_message: 'Invalid email format',
          error_stack: 'ValidationError: email format invalid...',
          context: 'user_registration',
          user_id: 'user-2',
          org_id: 'org-2',
          metadata: { email: 'invalid-email', field: 'email' },
          created_at: new Date(Date.now() - 86400000).toISOString(),
          resolved: true
        }
      ];

      setSystemErrors(mockErrors);
    } catch (error) {
      console.error('Error fetching system errors:', error);
    }
  };

  const fetchActivitySummary = async () => {
    try {
      // Calculate summary from audit logs
      const totalActions = auditLogs.length;
      const userActions = auditLogs.filter(log => log.entity_type === 'user' || log.entity_type === 'guest').length;
      const adminActions = auditLogs.filter(log => 
        log.entity_type === 'hotel' || 
        log.entity_type === 'agency' || 
        log.entity_type === 'platform_settings'
      ).length;
      const errors = systemErrors.filter(err => !err.resolved).length;

      // Calculate top users
      const userCounts: Record<string, number> = {};
      auditLogs.forEach(log => {
        const userName = log.user_name || 'Unknown';
        userCounts[userName] = (userCounts[userName] || 0) + 1;
      });
      
      const topUsers = Object.entries(userCounts)
        .map(([user_name, count]) => ({ user_name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate top actions
      const actionCounts: Record<string, number> = {};
      auditLogs.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });
      
      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setActivitySummary({
        totalActions,
        userActions,
        adminActions,
        errors,
        topUsers,
        topActions
      });
    } catch (error) {
      console.error('Error calculating activity summary:', error);
    }
  };

  const exportLogs = () => {
    const filteredLogs = auditLogs.filter(log =>
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const csvContent = [
      'Timestamp,User,Entity Type,Entity ID,Action,IP Address',
      ...filteredLogs.map(log => 
        `${format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')},${log.user_name},${log.entity_type},${log.entity_id},${log.action},${log.ip_address || 'N/A'}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const resolveError = async (errorId: string) => {
    try {
      // In a real implementation, you'd update the system_errors table
      setSystemErrors(prev => 
        prev.map(error => 
          error.id === errorId ? { ...error, resolved: true } : error
        )
      );

      toast({
        title: "Error Resolved",
        description: "System error has been marked as resolved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to resolve error",
        variant: "destructive",
      });
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'UPDATE': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'DELETE': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'VIEW': return <FileText className="h-4 w-4 text-gray-600" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'user': return <Users className="h-4 w-4" />;
      case 'hotel': return <Building className="h-4 w-4" />;
      case 'agency': return <Plane className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredLogs = auditLogs.filter(log =>
    log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredErrors = systemErrors.filter(error =>
    error.error_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    error.error_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    error.context.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Audit & Monitoring</h1>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit & Monitoring</h1>
          <p className="text-muted-foreground">Monitor system activity, errors, and user actions</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Actions</p>
                <p className="text-2xl font-bold">{activitySummary.totalActions}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User Actions</p>
                <p className="text-2xl font-bold">{activitySummary.userActions}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admin Actions</p>
                <p className="text-2xl font-bold">{activitySummary.adminActions}</p>
              </div>
              <Building className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Errors</p>
                <p className="text-2xl font-bold">{activitySummary.errors}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="errors">System Errors</TabsTrigger>
          <TabsTrigger value="activity">Activity Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRanges.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    {entityTypes.slice(1).map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actionTypes.slice(1).map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs ({filteredLogs.length})</CardTitle>
              <CardDescription>Detailed log of all system activities and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.user_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEntityIcon(log.entity_type)}
                          <div>
                            <div className="font-medium">{log.entity_type}</div>
                            <div className="text-xs text-muted-foreground">{log.entity_id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <Badge variant="outline">{log.action}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.diff_json && (
                          <div className="text-sm text-muted-foreground">
                            {Object.keys(log.diff_json).length} field(s) changed
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.ip_address || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search errors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* System Errors */}
          <Card>
            <CardHeader>
              <CardTitle>System Errors ({filteredErrors.length})</CardTitle>
              <CardDescription>Application errors and exceptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredErrors.map((error) => (
                  <div key={error.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-5 w-5 ${error.resolved ? 'text-green-600' : 'text-red-600'}`} />
                        <Badge variant={error.resolved ? "default" : "destructive"}>
                          {error.error_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(error.created_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      {!error.resolved && (
                        <Button size="sm" onClick={() => resolveError(error.id)}>
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                    
                    <h4 className="font-medium mb-1">{error.error_message}</h4>
                    <p className="text-sm text-muted-foreground mb-2">Context: {error.context}</p>
                    
                    {error.metadata && (
                      <div className="text-xs bg-muted p-2 rounded">
                        <pre>{JSON.stringify(error.metadata, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Users */}
            <Card>
              <CardHeader>
                <CardTitle>Most Active Users</CardTitle>
                <CardDescription>Users with the most actions in the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activitySummary.topUsers.map((user, index) => (
                    <div key={user.user_name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                        <span className="font-medium">{user.user_name}</span>
                      </div>
                      <Badge variant="secondary">{user.count} actions</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Most Common Actions</CardTitle>
                <CardDescription>Breakdown of action types in the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activitySummary.topActions.map((action, index) => (
                    <div key={action.action} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getActionIcon(action.action)}
                        <span className="font-medium">{action.action}</span>
                      </div>
                      <Badge variant="secondary">{action.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditMonitoring;