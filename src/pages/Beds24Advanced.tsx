import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Beds24RealtimeMonitor } from "@/components/beds24/Beds24RealtimeMonitor";
import { Beds24AutomationCenter } from "@/components/beds24/Beds24AutomationCenter";
import { Beds24PerformanceDashboard } from "@/components/beds24/Beds24PerformanceDashboard";
import { useBeds24Connections } from "@/hooks/use-beds24";
import { 
  Activity,
  Bot,
  BarChart3,
  Settings,
  Zap
} from "lucide-react";

export default function Beds24Advanced() {
  const [activeTab, setActiveTab] = useState("monitoring");
  
  // For demo purposes, using a mock hotel ID
  const hotelId = "550e8400-e29b-41d4-a716-446655440000";
  const { data: connections = [] } = useBeds24Connections(hotelId);
  const activeConnection = connections.find(c => c.is_active && c.connection_status === 'active');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Advanced Beds24 Management</h1>
        <p className="text-muted-foreground">
          Real-time monitoring, automation, and performance analytics for your Beds24 integration
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-time Monitor
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Automation Center
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-6">
          <Beds24RealtimeMonitor 
            hotelId={hotelId} 
            connectionId={activeConnection?.id}
          />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Beds24AutomationCenter 
            hotelId={hotelId} 
            connectionId={activeConnection?.id}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Beds24PerformanceDashboard 
            hotelId={hotelId} 
            connectionId={activeConnection?.id}
          />
        </TabsContent>
      </Tabs>

      {!activeConnection && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Beds24 Connection</h3>
            <p className="text-muted-foreground text-center mb-6">
              Connect your hotel to Beds24 to access advanced monitoring and automation features.
            </p>
            <div className="flex gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Features will be enabled once connection is established
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}