import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Play,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QueueItem {
  id: string;
  room_type_id: string;
  rate_plan_id: string;
  date_from: string;
  date_to: string;
  push_type: string;
  priority: number;
  status: string;
  retry_count: number;
  max_retries: number;
  scheduled_at: string;
  error_message: string | null;
  room_types: {
    name: string;
    code: string;
  };
  rate_plans: {
    name: string;
    code: string;
  };
  channel_connections?: {
    channel_name: string;
    channel_type: string;
  };
}

interface RatePushQueueProps {
  hotelId: string | null;
}

export function RatePushQueue({ hotelId }: RatePushQueueProps) {
  const { toast } = useToast();
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (hotelId) {
      fetchQueue();
      // Set up real-time subscription
      const subscription = supabase
        .channel('rate_push_queue_changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rate_push_queue',
            filter: `hotel_id=eq.${hotelId}`
          },
          () => {
            fetchQueue();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [hotelId]);

  const fetchQueue = async () => {
    if (!hotelId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rate_push_queue')
        .select(`
          *,
          room_types!inner(name, code),
          rate_plans!inner(name, code),
          channel_connections(channel_name, channel_type)
        `)
        .eq('hotel_id', hotelId)
        .order('priority', { ascending: true })
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setQueueItems((data as any) || []);

    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = queueItems.filter(item => {
    return statusFilter === 'all' || item.status === statusFilter;
  });

  const handleProcessItem = async (itemId: string) => {
    setProcessing(itemId);
    try {
      // Update status to processing
      await supabase
        .from('rate_push_queue')
        .update({ 
          status: 'processing',
          started_at: new Date().toISOString()
        })
        .eq('id', itemId);

      // Trigger channel manager to process this specific item
      const { error } = await supabase.functions.invoke('channel-manager', {
        body: {
          hotelId,
          syncType: 'rate_push',
          queueItemId: itemId
        }
      });

      if (error) throw error;

      toast({
        title: "Processing Started",
        description: "Rate push has been queued for processing"
      });

    } catch (error) {
      console.error('Error processing queue item:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to start rate push processing",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('rate_push_queue')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Item Removed",
        description: "Queue item has been removed"
      });

    } catch (error) {
      console.error('Error deleting queue item:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to remove queue item",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-info animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-success/10 text-success border-success/20">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-info/10 text-info border-info/20">Processing</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority <= 2) {
      return <Badge variant="destructive" className="text-xs">High</Badge>;
    } else if (priority <= 5) {
      return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20 text-xs">Medium</Badge>;
    } else {
      return <Badge variant="outline" className="text-xs">Low</Badge>;
    }
  };

  const formatPushType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Rate Push Queue</CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchQueue}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Queue Items</h3>
            <p className="text-muted-foreground">
              {queueItems.length === 0 
                ? "No rate pushes are currently queued."
                : "No items match your current filter."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(item.status)}
                  <div className="flex items-center space-x-2">
                    {getPriorityBadge(item.priority)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-foreground">
                        {item.room_types.name} - {item.rate_plans.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {formatPushType(item.push_type)}
                      </Badge>
                      {item.channel_connections && (
                        <Badge variant="outline" className="text-xs">
                          {item.channel_connections.channel_name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.date_from === item.date_to 
                        ? item.date_from 
                        : `${item.date_from} to ${item.date_to}`
                      }
                    </p>
                    {item.error_message && (
                      <p className="text-sm text-destructive mt-1">
                        {item.error_message}
                      </p>
                    )}
                    {item.retry_count > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Retry {item.retry_count}/{item.max_retries}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-sm text-muted-foreground text-right">
                    <p>Scheduled: {new Date(item.scheduled_at).toLocaleDateString()}</p>
                    <p>{new Date(item.scheduled_at).toLocaleTimeString()}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(item.status)}
                    
                    {item.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleProcessItem(item.id)}
                        disabled={processing === item.id}
                      >
                        {processing === item.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    {(item.status === 'failed' || item.status === 'completed') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}