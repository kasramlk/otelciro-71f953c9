import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot,
  Calendar,
  Clock,
  Cog,
  Database,
  RefreshCw,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  type: 'sync' | 'rate_push' | 'availability_push' | 'booking_pull';
  trigger: 'schedule' | 'event' | 'threshold';
  conditions: any;
  actions: any;
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
  successRate: number;
}

interface Beds24AutomationCenterProps {
  hotelId: string;
  connectionId?: string;
}

export function Beds24AutomationCenter({ hotelId, connectionId }: Beds24AutomationCenterProps) {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Hourly Inventory Sync',
      type: 'sync',
      trigger: 'schedule',
      conditions: { interval: 'hourly' },
      actions: { sync_type: 'inventory', sync_direction: 'bidirectional' },
      isActive: true,
      lastRun: new Date(Date.now() - 3600000).toISOString(),
      nextRun: new Date(Date.now() + 600000).toISOString(),
      successRate: 98.5
    },
    {
      id: '2', 
      name: 'Rate Push on Change',
      type: 'rate_push',
      trigger: 'event',
      conditions: { event_type: 'rate_modified', delay_minutes: 5 },
      actions: { push_to_channels: 'all', include_restrictions: true },
      isActive: true,
      lastRun: new Date(Date.now() - 1800000).toISOString(),
      successRate: 95.2
    },
    {
      id: '3',
      name: 'Low Availability Alert',
      type: 'availability_push',
      trigger: 'threshold',
      conditions: { availability_below: 5, room_types: 'all' },
      actions: { push_availability: true, notify_staff: true },
      isActive: false,
      successRate: 100
    }
  ]);

  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleToggleRule = (ruleId: string) => {
    setAutomationRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  const handleRunRule = async (ruleId: string) => {
    // Trigger manual execution of automation rule
    console.log(`Running automation rule: ${ruleId}`);
    
    // Update last run time
    setAutomationRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, lastRun: new Date().toISOString() } : rule
      )
    );
  };

  const getRuleStatusIcon = (rule: AutomationRule) => {
    if (!rule.isActive) return <Shield className="h-4 w-4 text-muted-foreground" />;
    if (rule.successRate >= 95) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (rule.successRate >= 80) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-destructive" />;
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'sync':
        return <RefreshCw className="h-4 w-4" />;
      case 'rate_push':
        return <Zap className="h-4 w-4" />;
      case 'availability_push':
        return <Database className="h-4 w-4" />;
      case 'booking_pull':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getTriggerDisplay = (rule: AutomationRule) => {
    switch (rule.trigger) {
      case 'schedule':
        return `Every ${rule.conditions.interval}`;
      case 'event':
        return `On ${rule.conditions.event_type}`;
      case 'threshold':
        return `When ${Object.keys(rule.conditions)[0]} ${Object.values(rule.conditions)[0]}`;
      default:
        return 'Manual';
    }
  };

  if (!connectionId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Automation Center</h3>
            <p className="text-muted-foreground">
              Connect to Beds24 to set up automated sync rules.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Automation Center</h3>
          <p className="text-sm text-muted-foreground">
            Manage automated sync rules and triggers for Beds24 integration
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Bot className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="monitoring">Performance</TabsTrigger>
        </TabsList>

        {/* Automation Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          {automationRules.map((rule) => (
            <Card key={rule.id} className={!rule.isActive ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getRuleTypeIcon(rule.type)}
                    <div>
                      <CardTitle className="text-base">{rule.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {getTriggerDisplay(rule)}
                        <Badge variant="outline" className="text-xs">
                          {rule.type.replace('_', ' ')}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRuleStatusIcon(rule)}
                    <Switch 
                      checked={rule.isActive}
                      onCheckedChange={() => handleToggleRule(rule.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Success Rate</Label>
                    <div className="text-sm font-medium">{rule.successRate.toFixed(1)}%</div>
                  </div>
                  
                  {rule.lastRun && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Run</Label>
                      <div className="text-sm">{new Date(rule.lastRun).toLocaleString()}</div>
                    </div>
                  )}
                  
                  {rule.nextRun && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Next Run</Label>
                      <div className="text-sm">{new Date(rule.nextRun).toLocaleString()}</div>
                    </div>
                  )}
                </div>

                <Separator className="my-3" />

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Trigger: {rule.trigger} • Actions: {Object.keys(rule.actions).length}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRunRule(rule.id)}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Run Now
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setSelectedRule(rule)}
                    >
                      <Cog className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {automationRules
              .filter(rule => rule.trigger === 'schedule' && rule.isActive)
              .map((rule) => (
                <Card key={rule.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <CardTitle className="text-sm">{rule.name}</CardTitle>
                      </div>
                      <Badge variant="outline">{rule.conditions.interval}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {rule.nextRun && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Next execution: </span>
                        <span className="font-medium">
                          {new Date(rule.nextRun).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Performance Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Active Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {automationRules.filter(r => r.isActive).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {automationRules.length} total rules
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Avg Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(automationRules.reduce((sum, r) => sum + r.successRate, 0) / automationRules.length).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all rules
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rules Executed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {automationRules.filter(r => r.lastRun).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  In the last 24 hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Rule Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Rule Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {automationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      {getRuleTypeIcon(rule.type)}
                      <span className="text-sm font-medium">{rule.name}</span>
                      <Badge 
                        variant={rule.isActive ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">
                        {rule.successRate.toFixed(1)}%
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        rule.successRate >= 95 ? 'bg-green-500' :
                        rule.successRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}