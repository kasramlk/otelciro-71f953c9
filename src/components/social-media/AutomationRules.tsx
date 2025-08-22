import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Zap, 
  Plus, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Users, 
  MessageCircle,
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  Bot,
  Filter,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'schedule' | 'performance' | 'engagement' | 'event';
    conditions: Record<string, any>;
  };
  actions: {
    type: 'post' | 'boost' | 'respond' | 'analyze' | 'notify';
    parameters: Record<string, any>;
  }[];
  isActive: boolean;
  lastRun?: string;
  runCount: number;
  createdAt: string;
}

const mockRules: AutomationRule[] = [
  {
    id: '1',
    name: 'Daily Inspiration Posts',
    description: 'Automatically post inspirational content every morning at 8 AM',
    trigger: {
      type: 'schedule',
      conditions: {
        time: '08:00',
        frequency: 'daily',
        timezone: 'UTC'
      }
    },
    actions: [
      {
        type: 'post',
        parameters: {
          template: 'inspiration',
          platforms: ['instagram', 'facebook'],
          hashtags: ['motivation', 'luxury', 'hotel']
        }
      }
    ],
    isActive: true,
    lastRun: '2024-01-16T08:00:00Z',
    runCount: 45,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'High Engagement Boosts',
    description: 'Boost posts that reach 100+ likes within first hour',
    trigger: {
      type: 'performance',
      conditions: {
        metric: 'likes',
        threshold: 100,
        timeWindow: '1h'
      }
    },
    actions: [
      {
        type: 'boost',
        parameters: {
          budget: 50,
          duration: '24h',
          audience: 'lookalike'
        }
      }
    ],
    isActive: true,
    lastRun: '2024-01-15T14:30:00Z',
    runCount: 12,
    createdAt: '2024-01-05T00:00:00Z'
  },
  {
    id: '3',
    name: 'Weekend Event Promoter',
    description: 'Promote special weekend events every Friday',
    trigger: {
      type: 'schedule',
      conditions: {
        dayOfWeek: 'friday',
        time: '17:00',
        timezone: 'UTC'
      }
    },
    actions: [
      {
        type: 'post',
        parameters: {
          template: 'event',
          platforms: ['instagram', 'facebook', 'twitter'],
          includeStories: true
        }
      }
    ],
    isActive: false,
    lastRun: '2024-01-12T17:00:00Z',
    runCount: 8,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export const AutomationRules: React.FC = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>(mockRules);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    triggerType: 'schedule',
    triggerConditions: {},
    actions: []
  });

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ));
    
    const rule = rules.find(r => r.id === id);
    toast({
      title: `Rule ${rule?.isActive ? 'Disabled' : 'Enabled'}`,
      description: `${rule?.name} has been ${rule?.isActive ? 'disabled' : 'enabled'}`,
    });
  };

  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(rule => rule.id !== id));
    toast({
      title: "Rule Deleted",
      description: "The automation rule has been removed",
    });
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'schedule': return <Clock className="h-4 w-4" />;
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'engagement': return <MessageCircle className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'post': return <MessageCircle className="h-4 w-4" />;
      case 'boost': return <TrendingUp className="h-4 w-4" />;
      case 'respond': return <MessageCircle className="h-4 w-4" />;
      case 'analyze': return <Target className="h-4 w-4" />;
      case 'notify': return <Users className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const formatLastRun = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Rules</h1>
          <p className="text-muted-foreground">
            Create intelligent automation workflows for your social media
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Rules</p>
                <p className="text-2xl font-bold">{rules.length}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">{rules.filter(r => r.isActive).length}</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Runs</p>
                <p className="text-2xl font-bold">{rules.reduce((sum, rule) => sum + rule.runCount, 0)}</p>
              </div>
              <Bot className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Efficiency</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        <AnimatePresence>
          {rules.map((rule, index) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`transition-all duration-200 ${rule.isActive ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${rule.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {getTriggerIcon(rule.trigger.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <CardDescription>{rule.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => handleToggleRule(rule.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">TRIGGER</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {getTriggerIcon(rule.trigger.type)}
                        <span className="text-sm capitalize">{rule.trigger.type}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">ACTIONS</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {rule.actions.map((action, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            {getActionIcon(action.type)}
                            <span className="text-sm capitalize">{action.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">PERFORMANCE</Label>
                      <div className="space-y-1 mt-1">
                        <div className="text-sm">Runs: {rule.runCount}</div>
                        <div className="text-xs text-muted-foreground">
                          Last: {formatLastRun(rule.lastRun)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(rule.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingRule(rule)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {rules.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No Automation Rules</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first automation rule to start automating your social media workflows
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Rule
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Rule Modal would go here */}
      {/* For brevity, not implementing the full modal in this example */}
    </div>
  );
};