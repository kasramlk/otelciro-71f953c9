import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Loader2, Zap, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useExchangeInviteCode } from "@/hooks/use-beds24";

export function Beds24ConnectionTester() {
  const [inviteCode, setInviteCode] = useState("KzoV9HA5KlYh2/ppGMo7t+KdFC8LTEgGh8t3EqO8Ezu/xmCEIUs0RBegeHncwR7lALfTbA9shFZ7YpAaI9ETbU7ZzwOPHjIQkhAeZpBaTtxPMOxDaugcuiKUeGM8bV5tQb7JdBTRkCg6aI7ZgGN3+smyTQKKzS42hKj0DSEaPsg=");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const exchangeInviteCode = useExchangeInviteCode();

  const handleTestConnection = async () => {
    if (!inviteCode.trim()) return;

    setError(null);
    setResult(null);

    try {
      const response = await exchangeInviteCode.mutateAsync(inviteCode);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Beds24 API Connection Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testInviteCode">Test Invite Code</Label>
            <Input
              id="testInviteCode"
              placeholder="Enter Beds24 invite code to test"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This will test the connection to Beds24 API using your invite code
            </p>
          </div>

          <Button 
            onClick={handleTestConnection}
            disabled={!inviteCode.trim() || exchangeInviteCode.isPending}
            className="w-full"
          >
            {exchangeInviteCode.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <RefreshCw className="w-4 h-4 mr-2" />
            Test Connection
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
                    ✅ Connection successful! Token exchange completed.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ❌ Connection failed: {result.error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Response Details:</h4>
                <pre className="text-xs bg-background p-2 rounded border overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>

              {result.success && result.data && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Access Token</Label>
                    <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                      {result.data.token ? `${result.data.token.substring(0, 20)}...` : 'Not provided'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Refresh Token</Label>
                    <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                      {result.data.refreshToken ? `${result.data.refreshToken.substring(0, 20)}...` : 'Not provided'}
                    </div>
                  </div>
                </div>
              )}

              {result.success && (
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    Phase 2 Complete
                  </Badge>
                  <Badge variant="outline">
                    Edge Functions Deployed
                  </Badge>
                  <Badge variant="outline">
                    API Integration Ready
                  </Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            After successful connection testing, you can:
          </p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Set up your first Beds24 connection using the Setup Wizard</li>
            <li>• Sync properties and channels from your Beds24 account</li>
            <li>• Configure inventory and rate pushing to channels</li>
            <li>• Start receiving bookings from multiple distribution channels</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}