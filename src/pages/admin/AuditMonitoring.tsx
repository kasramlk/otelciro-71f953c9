import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  Users,
  Activity,
  Database,
  AlertTriangle
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  old_values: any;
  new_values: any;
  diff_json: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const AuditMonitoring = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { toast } = useToast();

  const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT'];
  const entities = ['user', 'hotel', 'agency', 'reservation', 'payment', 'room'];

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }

      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedLogs = (data || []).map(log => ({
        ...log,
        ip_address: log.ip_address as string || 'Unknown',
        user_agent: log.user_agent as string || 'Unknown'
      }));
      
      setAuditLogs(transformedLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLogs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('export-data', {
        body: {
          type: 'csv',
          dataType: 'audit',
          dateRange: dateRange ? {
            from: dateRange.from?.toISOString(),
            to: dateRange.to?.toISOString()
          } : undefined,
          filters: {
            action: actionFilter !== 'all' ? actionFilter : undefined,
            entity: entityFilter !== 'all' ? entityFilter : undefined,
            search: searchTerm || undefined
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Export Complete",
        description: "Audit logs have been exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export audit logs",
        variant: "destructive",
      });
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      case 'LOGIN': return 'default';
      case 'LOGOUT': return 'outline';
      case 'EXPORT': return 'secondary';
      default: return 'outline';
    }
  };

  const filteredLogs = auditLogs.filter(log =>
    (searchTerm === '' || 
     log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.entity_id.includes(searchTerm) ||
     log.user_id?.includes(searchTerm))
  );

  const stats = {
    totalActions: auditLogs.length,
    uniqueUsers: new Set(auditLogs.map(log => log.user_id).filter(Boolean)).size,
    recentActions: auditLogs.filter(log => 
      new Date(log.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length,
    criticalActions: auditLogs.filter(log => 
      log.action === 'DELETE' || log.entity_type === 'user'
    ).length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Audit Monitoring</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Monitoring</h1>
          <p className="text-muted-foreground">Track all system activities and user actions</p>
        </div>
        <Button onClick={exportAuditLogs} className="gap-2">
          <Download className="h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Actions</p>
                <p className="text-2xl font-bold">{stats.totalActions.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Activity (24h)</p>
                <p className="text-2xl font-bold">{stats.recentActions}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Actions</p>
                <p className="text-2xl font-bold">{stats.criticalActions}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by action, entity, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entities.map(entity => (
                  <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={fetchAuditLogs} variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail ({filteredLogs.length} records)</CardTitle>
          <CardDescription>Chronological record of all system activities</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span className="font-mono text-sm">{log.user_id || 'System'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.entity_type}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {log.entity_id.substring(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {log.diff_json ? (
                      <div className="text-sm">
                        <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(log.diff_json, null, 2).substring(0, 100)}...
                        </pre>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No changes recorded</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.ip_address || 'Unknown'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditMonitoring;