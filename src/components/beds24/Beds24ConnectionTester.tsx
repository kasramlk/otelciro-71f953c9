import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Loader2, Zap, RefreshCw, Settings, Activity } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useExchangeInviteCode } from "@/hooks/use-beds24";
import { Beds24InventoryManager } from "./Beds24InventoryManager";
import { Beds24ReservationManager } from "./Beds24ReservationManager";
import { Beds24APIMonitor } from "./Beds24APIMonitor";

interface ConnectionTesterProps {
  hotelId?: string;
}

export function Beds24ConnectionTester({ hotelId = "550e8400-e29b-41d4-a716-446655440000" }: ConnectionTesterProps) {
  const [inviteCode, setInviteCode] = useState("KzoV9HA5KlYh2/ppGMo7t+KdFC8LTEgGh8t3EqO8Ezu/xmCEIUs0RBegeHncwR7lALfTbA9shFZ7YpAaI9ETbU7ZzwOPHjIQkhAeZpBaTtxPMOxDaugcuiKUeGM8bV5tQb7JdBTRkCg6aI7ZgGN3+smyTQKKzS42hKj0DSEaPsg=");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeConnection, setActiveConnection] = useState<any>(null);

  const exchangeInviteCode = useExchangeInviteCode();

  const handleTestConnection = async () => {
    if (!inviteCode.trim()) return;

    setError(null);
    setResult(null);

    try {
      const response = await exchangeInviteCode.mutateAsync(inviteCode);
      setResult(response);
      
      // If successful, this would be where we'd create a connection
      if (response.success) {
        // For demo purposes, create a mock active connection
        setActiveConnection({
          id: 'demo-connection-id',
          connection_status: 'active',
          api_credits_remaining: 950,
          last_sync_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Beds24 API Connection & Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testInviteCode">Beds24 Invite Code</Label>
            <Input
              id="testInviteCode"
              placeholder="Enter Beds24 invite code to test"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This will authenticate with Beds24 API and set up the connection for full channel management
            </p>
          </div>

          <Button 
            onClick={handleTestConnection}
            disabled={!inviteCode.trim() || exchangeInviteCode.isPending}
            className="w-full"
          >
            {exchangeInviteCode.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <RefreshCw className="w-4 h-4 mr-2" />
            Authenticate & Connect
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <Separator />
              
              {result.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ✅ Authentication successful! Beds24 channel manager is now ready.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ❌ Authentication failed: {result.error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Authentication Response:</h4>
                <pre className="text-xs bg-background p-2 rounded border overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>

              {result.success && (
                <div className="flex gap-2">
                  <Badge variant="default">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Authentication Complete
                  </Badge>
                  <Badge variant="outline">
                    <Activity className="w-3 h-3 mr-1" />
                    Channel Manager Ready
                  </Badge>
                  <Badge variant="outline">
                    <Settings className="w-3 h-3 mr-1" />
                    Full API Access
                  </Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {activeConnection && (
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
            <TabsTrigger value="reservations">Reservation Management</TabsTrigger>
            <TabsTrigger value="monitor">API Monitor</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <Beds24InventoryManager 
              connectionId={activeConnection.id} 
              hotelId={hotelId}
            />
          </TabsContent>

          <TabsContent value="reservations">
            <Beds24ReservationManager 
              connectionId={activeConnection.id} 
              hotelId={hotelId}
            />
          </TabsContent>

          <TabsContent value="monitor">
            <Beds24APIMonitor connectionId={activeConnection.id} />
          </TabsContent>
        </Tabs>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Beds24 Channel Manager Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground mb-4">
            Once authenticated, you can use the full Beds24 channel manager integration:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">📊 Inventory Management</h4>
              <ul className="space-y-1 ml-4">
                <li>• Pull rates & availability from Beds24</li>
                <li>• Push your rates to all channels</li>
                <li>• Manage restrictions & minimum stays</li>
                <li>• Real-time inventory caching (6h intervals)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🏨 Reservation Management</h4>
              <ul className="space-y-1 ml-4">
                <li>• Pull new bookings from all channels</li>
                <li>• Push your direct bookings to Beds24</li>
                <li>• Sync guest information & preferences</li>
                <li>• Handle booking modifications & cancellations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">📈 Analytics & Monitoring</h4>
              <ul className="space-y-1 ml-4">
                <li>• API usage tracking & credit monitoring</li>
                <li>• Sync operation logs & performance metrics</li>
                <li>• Real-time connection status</li>
                <li>• Error handling & retry mechanisms</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🔄 Automation & Best Practices</h4>
              <ul className="space-y-1 ml-4">
                <li>• Automatic token refresh & management</li>
                <li>• Intelligent caching & rate limiting</li>
                <li>• Batch processing for efficiency</li>
                <li>• Webhook processing for real-time updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}