import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  MessageSquare,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AutomationRule {
  id: string;
  name: string;
  type: 'social_media' | 'guest_communication' | 'revenue_optimization' | 'housekeeping';
  trigger: string;
  action: string;
  conditions: Record<string, any>;
  isActive: boolean;
  lastExecuted?: Date;
  executionCount: number;
  successRate: number;
}

export const WorkflowAutomation = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('social');
  
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Welcome Post for New Guests',
      type: 'social_media',
      trigger: 'guest_checkin',
      action: 'create_welcome_post',
      conditions: { vip_only: false, min_stay: 2 },
      isActive: true,
      lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000),
      executionCount: 45,
      successRate: 98.2
    },
    {
      id: '2', 
      name: 'Guest Satisfaction Follow-up',
      type: 'guest_communication',
      trigger: 'guest_checkout',
      action: 'send_feedback_request',
      conditions: { delay_hours: 24, rating_threshold: 4 },
      isActive: true,
      lastExecuted: new Date(Date.now() - 4 * 60 * 60 * 1000),
      executionCount: 128,
      successRate: 94.5
    },
    {
      id: '3',
      name: 'Dynamic Pricing Adjustment',
      type: 'revenue_optimization', 
      trigger: 'occupancy_threshold',
      action: 'adjust_rates',
      conditions: { occupancy_above: 85, increase_percent: 15 },
      isActive: true,
      lastExecuted: new Date(Date.now() - 1 * 60 * 60 * 1000),
      executionCount: 67,
      successRate: 92.1
    },
    {
      id: '4',
      name: 'Room Ready Notification',
      type: 'housekeeping',
      trigger: 'room_cleaned',
      action: 'notify_front_desk',
      conditions: { priority_rooms_only: true },
      isActive: false,
      lastExecuted: new Date(Date.now() - 6 * 60 * 60 * 1000),
      executionCount: 203,
      successRate: 99.1
    }
  ]);

  const toggleRule = (ruleId: string) => {
    setAutomationRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, isActive: !rule.isActive }
          : rule
      )
    );
    
    const rule = automationRules.find(r => r.id === ruleId);
    toast({
      title: rule?.isActive ? 'Automation Paused' : 'Automation Activated',
      description: `${rule?.name} has been ${rule?.isActive ? 'paused' : 'activated'}`
    });
  };

  const deleteRule = (ruleId: string) => {
    setAutomationRules(prev => prev.filter(rule => rule.id !== ruleId));
    toast({
      title: 'Automation Rule Deleted',
      description: 'The automation rule has been permanently removed'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'social_media': return <MessageSquare className="h-4 w-4" />;
      case 'guest_communication': return <Users className="h-4 w-4" />;
      case 'revenue_optimization': return <TrendingUp className="h-4 w-4" />;
      case 'housekeeping': return <Settings className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'social_media': return 'bg-blue-100 text-blue-800';
      case 'guest_communication': return 'bg-green-100 text-green-800';  
      case 'revenue_optimization': return 'bg-purple-100 text-purple-800';
      case 'housekeeping': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRules = automationRules.filter(rule => {
    switch (activeTab) {
      case 'social': return rule.type === 'social_media';
      case 'guest': return rule.type === 'guest_communication';
      case 'revenue': return rule.type === 'revenue_optimization';
      case 'operations': return rule.type === 'housekeeping';
      default: return true;
    }
  });

  const stats = {
    total: automationRules.length,
    active: automationRules.filter(r => r.isActive).length,
    executions: automationRules.reduce((sum, r) => sum + r.executionCount, 0),
    avgSuccessRate: automationRules.reduce((sum, r) => sum + r.successRate, 0) / automationRules.length
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Workflow Automation
          </h1>
          <p className="text-muted-foreground">
            Automate repetitive tasks and optimize operations with AI-powered workflows
          </p>
        </div>
        
        <Button className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Automation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rules</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-success">{stats.active}</p>
              </div>
              <Play className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Executions</p>
                <p className="text-2xl font-bold">{stats.executions}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{stats.avgSuccessRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Rules */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Rules</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="guest">Guest Services</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-4">
            {filteredRules.map((rule) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className={`${rule.isActive ? 'border-success/50 bg-success/5' : 'border-muted'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getTypeColor(rule.type)}`}>
                          {getTypeIcon(rule.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{rule.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            When {rule.trigger.replace('_', ' ')} → {rule.action.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Active' : 'Paused'}
                        </Badge>
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">EXECUTIONS</Label>
                        <p className="font-medium">{rule.executionCount}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">SUCCESS RATE</Label>
                        <p className="font-medium text-success">{rule.successRate}%</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">LAST EXECUTED</Label>
                        <p className="font-medium text-xs">
                          {rule.lastExecuted?.toLocaleTimeString() || 'Never'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">TYPE</Label>
                        <Badge variant="outline" className="text-xs">
                          {rule.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Conditions: {Object.keys(rule.conditions).length} configured
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteRule(rule.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredRules.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No automation rules found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first automation rule to start optimizing your workflows
                </p>
                <Button className="bg-gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Rule
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};