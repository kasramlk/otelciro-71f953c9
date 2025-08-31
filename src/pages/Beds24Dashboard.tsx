import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Settings, Activity, Zap, Building2, Link2 } from "lucide-react";
import { Beds24SimpleSetup } from "@/components/beds24/Beds24SimpleSetup";
import { Beds24ChannelManager } from "@/components/beds24/Beds24ChannelManager";
import { Beds24SyncMonitor } from "@/components/beds24/Beds24SyncMonitor";
import { useBeds24Connections } from "@/hooks/use-beds24";
import { useAuth } from "@/hooks/use-auth";
import { TestBeds24Auth } from "@/test-auth";

export default function Beds24Dashboard() {
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const { user } = useAuth();
  
  // For now, we'll use a mock hotel ID - in real implementation, this would come from the user context
  const hotelId = "550e8400-e29b-41d4-a716-446655440000";
  
  const { data: connections = [], isLoading } = useBeds24Connections(hotelId);

  if (showSetupWizard) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowSetupWizard(false)}
          >
            ← Back to Dashboard
          </Button>
        </div>
        <Beds24SimpleSetup
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
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6" />
              <h1 className="text-lg font-semibold">Beds24 Channel Manager</h1>
            </div>
            <Badge variant="secondary">Phase 2 - Service Layer</Badge>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button onClick={() => setShowSetupWizard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Connection
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="test" className="space-y-6">
          <TabsList>
            <TabsTrigger value="test">Auth Test</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Beds24 Authentication Test</CardTitle>
                <CardDescription>
                  Testing authentication with your invitation token (check browser console for details)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TestBeds24Auth />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {connections.filter(c => c.is_active).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {connections.length} total connections
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {connections.filter(c => c.is_active).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active connections
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">API Status</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    Ready
                  </div>
                  <p className="text-xs text-muted-foreground">
                    API endpoints active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Edge Functions</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">5</div>
                  <p className="text-xs text-muted-foreground">
                    Functions deployed
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Integration Status</CardTitle>
                  <CardDescription>
                    Current implementation progress
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Schema</span>
                    <Badge variant="secondary">✓ Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Service Layer</span>
                    <Badge variant="secondary">✓ Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Edge Functions</span>
                    <Badge variant="secondary">✓ Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">React Hooks</span>
                    <Badge variant="secondary">✓ Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Channel Management</span>
                    <Badge variant="outline">Phase 3</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Inventory Sync</span>
                    <Badge variant="outline">Phase 4</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Edge Functions</CardTitle>
                  <CardDescription>
                    Secure API endpoints for Beds24 integration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">beds24-auth</span>
                    <Badge variant="outline">Authentication</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">beds24-sync</span>
                    <Badge variant="outline">Data Sync</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">beds24-inventory-push</span>
                    <Badge variant="outline">Inventory</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">beds24-reservations-pull</span>
                    <Badge variant="outline">Bookings</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">beds24-webhook</span>
                    <Badge variant="outline">Webhooks</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="connections" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Beds24 Connections</CardTitle>
                  <CardDescription>
                    Manage your Beds24 channel manager connections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {connections.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        No Beds24 connections found. Set up your first connection to get started.
                      </p>
                      <Button onClick={() => setShowSetupWizard(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Setup Beds24 Connection
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {connections.map((connection) => (
                        <div key={connection.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{connection.account_name || 'Beds24 Connection'}</h3>
                              <p className="text-sm text-muted-foreground">
                                Account ID: {connection.account_id}
                              </p>
                            </div>
                            <Badge variant={connection.is_active ? "default" : "secondary"}>
                              {connection.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="testing">
            <Card>
              <CardHeader>
                <CardTitle>API Testing</CardTitle>
                <CardDescription>
                  Test your Beds24 API connections and endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  API testing tools will be available once connections are established.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sync Logs</CardTitle>
                <CardDescription>
                  Real-time synchronization logs and API activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sync logs will appear here once you have active connections.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}