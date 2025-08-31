import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { beds24Service } from "@/lib/services/beds24-service";
import { toast } from "sonner";

interface Beds24SimpleSetupProps {
  hotelId: string;
  onComplete: () => void;
}

export function Beds24SimpleSetup({ hotelId, onComplete }: Beds24SimpleSetupProps) {
  const [invitationCode, setInvitationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSetup = async () => {
    if (!invitationCode.trim()) {
      toast.error("Please enter your Beds24 invitation code");
      return;
    }

    setIsLoading(true);

    try {
      const result = await beds24Service.setupConnection(invitationCode, hotelId);
      
      if (result.success) {
        setIsSuccess(true);
        toast.success("Beds24 connection established successfully!");
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        toast.error(result.error || "Failed to setup Beds24 connection");
      }
    } catch (error) {
      console.error('Setup error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
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
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Connect to Beds24</h2>
        <p className="text-muted-foreground">
          Enter your Beds24 invitation code to establish the connection
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Beds24 Integration Setup</CardTitle>
          <CardDescription>
            Enter the invitation code provided by your Beds24 account manager.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If you don't have an invitation code, you can generate one from your Beds24 control panel under{" "}
              <strong>Settings → Apps & Integrations → API</strong>.
              <Button 
                variant="link" 
                size="sm" 
                className="ml-2 p-0 h-auto"
                onClick={() => window.open('https://beds24.com/control3.php?pagetype=apiv2', '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Open Beds24 Control Panel
              </Button>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="invitationCode">Beds24 Invitation Code</Label>
            <Input
              id="invitationCode"
              placeholder="Enter your Beds24 invitation code"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
              className="font-mono"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              The invitation code is a long encoded string provided by Beds24
            </p>
          </div>

          <Button 
            onClick={handleSetup}
            disabled={!invitationCode.trim() || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? 'Connecting...' : 'Connect to Beds24'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}