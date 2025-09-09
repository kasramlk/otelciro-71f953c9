import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Search,
  Filter
} from "lucide-react";

interface SyncLog {
  id: string;
  sync_type: string;
  sync_status: string;
  records_processed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  channel_connections: {
    channel_name: string;
    channel_type: string;
  };
}

interface ChannelSyncLogsProps {
  hotelId: string | null;
}

export function ChannelSyncLogs({ hotelId }: ChannelSyncLogsProps) {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (hotelId) {
      fetchLogs();
    }
  }, [hotelId]);

  const fetchLogs = async () => {
    if (!hotelId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('channel_sync_logs')
        .select(`
          *,
          channel_connections!inner(
            channel_name,
            channel_type,
            hotel_id
          )
        `)
        .eq('channel_connections.hotel_id', hotelId)
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);

    } catch (error) {
      console.error('Error fetching sync logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.channel_connections.channel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.sync_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || log.sync_status === statusFilter;
    const matchesType = typeFilter === 'all' || log.sync_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-success/10 text-success border-success/20">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatSyncType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Channel Sync Logs</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchLogs}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="rate_push">Rate Push</SelectItem>
              <SelectItem value="availability_push">Availability Push</SelectItem>
              <SelectItem value="reservation_pull">Reservation Pull</SelectItem>
              <SelectItem value="reservation_webhook">Webhook</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Sync Logs Found</h3>
            <p className="text-muted-foreground">
              {logs.length === 0 
                ? "No sync activities yet. Start by syncing a channel."
                : "No logs match your current filters."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(log.sync_status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-foreground">
                        {log.channel_connections.channel_name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {log.channel_connections.channel_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatSyncType(log.sync_type)}
                      {log.records_processed > 0 && (
                        <span className="ml-2">• {log.records_processed} records</span>
                      )}
                    </p>
                    {log.error_message && (
                      <p className="text-sm text-destructive mt-1">
                        {log.error_message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-right">
                  <div className="text-sm text-muted-foreground">
                    <p>{new Date(log.started_at).toLocaleDateString()}</p>
                    <p>{new Date(log.started_at).toLocaleTimeString()}</p>
                    {log.duration_ms && (
                      <p className="text-xs">Duration: {formatDuration(log.duration_ms)}</p>
                    )}
                  </div>
                  {getStatusBadge(log.sync_status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}