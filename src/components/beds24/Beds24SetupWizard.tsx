import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useExchangeInviteCode, useCreateBeds24Connection, useTestBeds24Connection } from "@/hooks/use-beds24";

interface Beds24SetupWizardProps {
  hotelId: string;
  onComplete: () => void;
}

const AVAILABLE_SCOPES = [
  { id: 'read:bookings', name: 'Read Bookings', description: 'View booking information' },
  { id: 'write:bookings', name: 'Write Bookings', description: 'Create and modify bookings' },
  { id: 'bookings-personal', name: 'Booking Personal Data', description: 'Access guest personal information' },
  { id: 'bookings-financial', name: 'Booking Financial Data', description: 'Access financial information' },
  { id: 'read:inventory', name: 'Read Inventory', description: 'View availability and rates' },
  { id: 'write:inventory', name: 'Write Inventory', description: 'Update availability and rates' },
  { id: 'read:properties', name: 'Read Properties', description: 'View property information' },
  { id: 'write:properties', name: 'Write Properties', description: 'Modify property settings' },
  { id: 'accounts', name: 'Account Management', description: 'Manage account settings' },
];

export function Beds24SetupWizard({ hotelId, onComplete }: Beds24SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [inviteCode, setInviteCode] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    'read:bookings', 'write:bookings', 'read:inventory', 'write:inventory', 'read:properties'
  ]);
  const [allowLinkedProperties, setAllowLinkedProperties] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [refreshToken, setRefreshToken] = useState("");

  const exchangeInviteCode = useExchangeInviteCode();
  const createConnection = useCreateBeds24Connection();
  const testConnection = useTestBeds24Connection();

  const handleExchangeInviteCode = async () => {
    if (!inviteCode.trim()) return;

    const result = await exchangeInviteCode.mutateAsync(inviteCode);
    
    if (result.success && result.data) {
      setRefreshToken(result.data.refreshToken);
      setStep(2);
    }
  };

  const handleCreateConnection = async () => {
    if (!accountId.trim() || !accountEmail.trim() || !refreshToken) return;

    const connectionData = {
      account_id: accountId,
      account_email: accountEmail,
      refresh_token: refreshToken,
      scopes: selectedScopes,
      allow_linked_properties: allowLinkedProperties,
      ip_whitelist: ipWhitelist ? ipWhitelist.split(',').map(ip => ip.trim()) : undefined,
    };

    const connection = await createConnection.mutateAsync({ hotelId, connectionData });
    
    if (connection) {
      setStep(3);
      // Test the connection
      const testResult = await testConnection.mutateAsync(connection.id);
      if (testResult.success) {
        setStep(4);
      }
    }
  };

  const handleScopeToggle = (scopeId: string, checked: boolean) => {
    setSelectedScopes(prev => 
      checked 
        ? [...prev, scopeId]
        : prev.filter(id => id !== scopeId)
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Beds24 Channel Manager Setup</h2>
        <p className="text-muted-foreground">
          Connect your hotel to multiple distribution channels through Beds24
        </p>
        <div className="flex justify-center space-x-2 mt-4">
          {[1, 2, 3, 4].map((stepNum) => (
            <div
              key={stepNum}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNum
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > stepNum ? <CheckCircle className="w-4 h-4" /> : stepNum}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Step 1: Exchange Invite Code</span>
              <Badge variant="outline">Required</Badge>
            </CardTitle>
            <CardDescription>
              Enter the invite code provided by your Beds24 account manager or generated from your Beds24 control panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                If you don't have an invite code, you can generate one from your Beds24 control panel under 
                <strong> Settings → Apps & Integrations → API</strong>.
                <Button variant="link" size="sm" className="ml-2 p-0 h-auto">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open Beds24 Control Panel
                </Button>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="inviteCode">Beds24 Invite Code</Label>
              <Input
                id="inviteCode"
                placeholder="Enter your Beds24 invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="font-mono"
              />
            </div>

            <Button 
              onClick={handleExchangeInviteCode}
              disabled={!inviteCode.trim() || exchangeInviteCode.isPending}
              className="w-full"
            >
              {exchangeInviteCode.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Exchange Invite Code
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Configure Connection</CardTitle>
            <CardDescription>
              Set up your Beds24 connection with the appropriate permissions and settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountId">Account ID</Label>
                <Input
                  id="accountId"
                  placeholder="Your Beds24 account ID"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountEmail">Account Email</Label>
                <Input
                  id="accountEmail"
                  type="email"
                  placeholder="Your Beds24 account email"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">API Permissions (Scopes)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVAILABLE_SCOPES.map((scope) => (
                  <div key={scope.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={scope.id}
                      checked={selectedScopes.includes(scope.id)}
                      onCheckedChange={(checked) => handleScopeToggle(scope.id, checked as boolean)}
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor={scope.id} className="text-sm font-medium">
                        {scope.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {scope.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="linkedProperties"
                  checked={allowLinkedProperties}
                  onCheckedChange={(checked) => setAllowLinkedProperties(checked === true)}
                />
                <Label htmlFor="linkedProperties" className="text-sm font-medium">
                  Allow access to linked properties
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ipWhitelist">IP Whitelist (Optional)</Label>
                <Textarea
                  id="ipWhitelist"
                  placeholder="192.168.1.1, 10.0.0.1 (comma-separated)"
                  value={ipWhitelist}
                  onChange={(e) => setIpWhitelist(e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to allow access from any IP address
                </p>
              </div>
            </div>

            <Button 
              onClick={handleCreateConnection}
              disabled={!accountId.trim() || !accountEmail.trim() || createConnection.isPending}
              className="w-full"
            >
              {createConnection.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Connection
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Testing Connection</CardTitle>
            <CardDescription>
              Verifying your Beds24 connection and API access...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Testing connection...</p>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Setup Complete!
            </CardTitle>
            <CardDescription>
              Your Beds24 connection has been successfully established.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You can now sync your properties, manage channels, and start receiving bookings from multiple distribution channels.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button onClick={onComplete} className="flex-1">
                Go to Channel Management
              </Button>
              <Button variant="outline" onClick={() => setStep(1)}>
                Setup Another Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}