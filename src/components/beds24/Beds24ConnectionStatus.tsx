import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Zap,
  Building2
} from "lucide-react";
import { useBeds24Connections, useTestBeds24Connection } from "@/hooks/use-beds24";

interface Beds24ConnectionStatusProps {
  hotelId: string;
}

export function Beds24ConnectionStatus({ hotelId }: Beds24ConnectionStatusProps) {
  const { data: connections = [], isLoading } = useBeds24Connections(hotelId);
  const testConnection = useTestBeds24Connection();

  const activeConnection = connections.find(c => c.is_active && c.connection_status === 'active');
  const totalConnections = connections.length;
  const healthyConnections = connections.filter(c => c.connection_status === 'active').length;
  const errorConnections = connections.filter(c => c.connection_status === 'error').length;

  const getStatusIcon = (status: string, size = "h-4 w-4") => {
    switch (status) {
      case 'active':
        return <CheckCircle className={`${size} text-green-500`} />;
      case 'error':
        return <AlertTriangle className={`${size} text-destructive`} />;
      case 'expired':
        return <Clock className={`${size} text-orange-500`} />;
      default:
        return <Clock className={`${size} text-muted-foreground`} />;
    }
  };

  const handleTestConnection = (connectionId: string) => {
    testConnection.mutate(connectionId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading connections...</span>
        </CardContent>
      </Card>
    );
  }

  if (totalConnections === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Connections</h3>
          <p className="text-muted-foreground text-center">
            Set up your first Beds24 connection to start managing channels.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConnections}</div>
            <p className="text-xs text-muted-foreground">
              Configured accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthyConnections}</div>
            <p className="text-xs text-muted-foreground">
              Active connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{errorConnections}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Credits</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeConnection ? activeConnection.api_credits_remaining : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Remaining today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connection Details */}
      <div className="grid gap-4">
        {connections.map((connection) => (
          <Card key={connection.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(connection.connection_status, "h-5 w-5")}
                  <div>
                    <CardTitle className="text-base">{connection.account_email}</CardTitle>
                    <CardDescription>
                      Account: {connection.account_id}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      connection.connection_status === 'active' ? 'default' :
                      connection.connection_status === 'error' ? 'destructive' : 'secondary'
                    }
                  >
                    {connection.connection_status}
                  </Badge>
                  {connection.is_active && (
                    <Badge variant="outline">Primary</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Connection Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">API Credits:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium">{connection.api_credits_remaining}</span>
                      <Progress 
                        value={(connection.api_credits_remaining / 1000) * 100} 
                        className="h-1 flex-1" 
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Sync:</span>
                    <p className="mt-1 font-medium">
                      {connection.last_sync_at 
                        ? new Date(connection.last_sync_at).toLocaleString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>

                {/* Scopes */}
                <div>
                  <span className="text-sm text-muted-foreground">Permissions:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {connection.scopes.slice(0, 4).map((scope) => (
                      <Badge key={scope} variant="outline" className="text-xs">
                        {scope.replace(/^(read|write):/, '')}
                      </Badge>
                    ))}
                    {connection.scopes.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{connection.scopes.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTestConnection(connection.id)}
                    disabled={testConnection.isPending}
                  >
                    {testConnection.isPending && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                    Test Connection
                  </Button>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>

                {/* Error Details */}
                {connection.sync_errors && connection.sync_errors.length > 0 && (
                  <div className="p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm text-destructive font-medium">Recent Error:</p>
                    <p className="text-xs text-destructive mt-1">
                      {connection.sync_errors[0]?.error || 'Unknown error occurred'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}