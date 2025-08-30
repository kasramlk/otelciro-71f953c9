import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings } from "lucide-react";
import { Beds24ChannelManager } from "@/components/beds24/Beds24ChannelManager";
import { Beds24SyncMonitor } from "@/components/beds24/Beds24SyncMonitor";
import { Beds24SetupWizard } from "@/components/beds24/Beds24SetupWizard";
import { useBeds24Connections } from "@/hooks/use-beds24";

export default function ChannelManager() {
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  
  // For now, we'll use a mock hotel ID - in real implementation, this would come from the user context
  const hotelId = "550e8400-e29b-41d4-a716-446655440000";
  
  const { data: connections = [] } = useBeds24Connections(hotelId);
  const hasActiveConnection = connections.some(c => c.is_active && c.connection_status === 'active');

  if (showSetupWizard) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowSetupWizard(false)}
          >
            ← Back to Channel Manager
          </Button>
        </div>
        <Beds24SetupWizard
          hotelId={hotelId}
          onComplete={() => setShowSetupWizard(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">Channel Manager</h1>
            <Badge variant="secondary">Phase 3 - Enhanced Management</Badge>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            {!hasActiveConnection && (
              <Button onClick={() => setShowSetupWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Setup Beds24
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!hasActiveConnection ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold">Welcome to Channel Manager</h2>
                <p className="text-muted-foreground max-w-md">
                  Connect to Beds24 to manage your distribution channels, sync inventory, 
                  and streamline your booking operations across multiple platforms.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => setShowSetupWizard(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Setup Beds24 Connection
                  </Button>
                  <Button variant="outline">
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="channels" className="space-y-6">
            <TabsList>
              <TabsTrigger value="channels">Channel Management</TabsTrigger>
              <TabsTrigger value="sync">Sync Monitoring</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="channels">
              <Beds24ChannelManager hotelId={hotelId} />
            </TabsContent>

            <TabsContent value="sync">
              <Beds24SyncMonitor hotelId={hotelId} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Channel Analytics</CardTitle>
                  <CardDescription>
                    Comprehensive analytics and reporting for your distribution channels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                    <p>Advanced channel analytics and performance reporting will be available in Phase 5.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}