import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react";

interface TokenManagerProps {
  connectionId: string;
  connection?: {
    access_token?: string;
    token_expires_at?: string;
    account_name?: string;
    is_active: boolean;
  };
}

export function TokenManager({ connectionId, connection }: TokenManagerProps) {
  const [newToken, setNewToken] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const tokenExpiresAt = connection?.token_expires_at ? new Date(connection.token_expires_at) : null;
  const now = new Date();
  const isExpired = tokenExpiresAt ? now >= tokenExpiresAt : true;
  const hoursUntilExpiry = tokenExpiresAt ? Math.round((tokenExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)) : 0;

  const handleUpdateToken = async () => {
    if (!newToken.trim()) {
      toast.error("Please enter a new access token");
      return;
    }

    if (!expirationDate) {
      toast.error("Please set an expiration date for the token");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('beds24_connections')
        .update({
          access_token: newToken.trim(),
          token_expires_at: new Date(expirationDate).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId);

      if (error) throw error;

      toast.success("Access token updated successfully");
      setNewToken("");
      setExpirationDate("");
      
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Error updating token:', error);
      toast.error("Failed to update token");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTestToken = async () => {
    if (!connection?.access_token) {
      toast.error("No token available to test");
      return;
    }

    setIsTesting(true);
    try {
      // Test token by making a simple API call
      const BEDS24_API_URL = 'https://api.beds24.com/v2';
      const BEDS24_ORGANIZATION = 'otelciro';
      
      const response = await fetch(`${BEDS24_API_URL}/authentication/test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'organization': BEDS24_ORGANIZATION,
          'token': connection.access_token,
        }
      });

      if (response.ok) {
        toast.success("Token is valid and working");
      } else {
        toast.error(`Token test failed: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error testing token:', error);
      toast.error("Failed to test token");
    } finally {
      setIsTesting(false);
    }
  };

  const getTokenStatus = () => {
    if (!connection?.access_token) {
      return { status: "missing", color: "destructive", icon: AlertCircle };
    }
    if (isExpired) {
      return { status: "expired", color: "destructive", icon: AlertCircle };
    }
    if (hoursUntilExpiry <= 24) {
      return { status: "expiring", color: "secondary", icon: Clock };
    }
    return { status: "valid", color: "default", icon: CheckCircle2 };
  };

  const tokenStatus = getTokenStatus();
  const StatusIcon = tokenStatus.icon;

  return (
    <div className="space-y-6">
      {/* Current Token Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            Current Token Status
          </CardTitle>
          <CardDescription>
            Connection: {connection?.account_name || 'Unnamed Connection'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={tokenStatus.color as any}>
              {tokenStatus.status === "missing" && "No Token"}
              {tokenStatus.status === "expired" && "Expired"}
              {tokenStatus.status === "expiring" && "Expiring Soon"}
              {tokenStatus.status === "valid" && "Valid"}
            </Badge>
          </div>
          
          {connection?.access_token && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Token</span>
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {connection.access_token.substring(0, 20)}...
              </span>
            </div>
          )}
          
          {tokenExpiresAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Expires</span>
              <span className="text-sm">
                {tokenExpiresAt.toLocaleString()}
                {hoursUntilExpiry > 0 && ` (in ${hoursUntilExpiry}h)`}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTestToken}
              disabled={isTesting || !connection?.access_token}
            >
              {isTesting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Token
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Token Update Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update Access Token</CardTitle>
          <CardDescription>
            Manually update the Beds24 access token when it expires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>How to get a new token:</strong>
              <br />
              1. Log into your Beds24 control panel
              <br />
              2. Go to Settings → Channel Manager → API Keys
              <br />
              3. Generate a new access token
              <br />
              4. Copy and paste it here
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="new-token">New Access Token</Label>
            <Textarea
              id="new-token"
              placeholder="Paste your new Beds24 access token here..."
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiration-date">Token Expiration Date</Label>
            <Input
              id="expiration-date"
              type="datetime-local"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Set when this token will expire (usually 24 hours from generation)
            </p>
          </div>

          <Button 
            onClick={handleUpdateToken} 
            disabled={isUpdating || !newToken.trim() || !expirationDate}
            className="w-full"
          >
            {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
            Update Token
          </Button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Beds24 access tokens typically expire every 24 hours</p>
            <p>• You'll need to update the token manually when it expires</p>
            <p>• Always test the token after updating to ensure it works</p>
            <p>• Keep your Beds24 credentials secure and never share them</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}