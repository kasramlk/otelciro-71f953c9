import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bot, Settings, TrendingUp, TrendingDown, Zap, Eye, Check, X, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHMSStore } from '@/stores/hms-store';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface PricingRecommendation {
  id: string;
  date: Date;
  roomTypeId: string;
  roomTypeName: string;
  currentRate: number;
  recommendedRate: number;
  confidence: number;
  potentialRevenue: number;
  reasoning: string;
  status: 'pending' | 'applied' | 'modified' | 'declined';
}

interface PricingRule {
  id: string;
  name: string;
  isActive: boolean;
  conditions: {
    occupancyMin?: number;
    occupancyMax?: number;
    leadTimeMin?: number;
    leadTimeMax?: number;
    dayOfWeek?: number[];
  };
  actions: {
    rateAdjustment: number;
    adjustmentType: 'percentage' | 'fixed';
  };
}

export const HMSRevenueAI = () => {
  const { occupancyData, ariData, updateARI, addAuditEntry } = useHMSStore();
  const [aiActive, setAiActive] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<PricingRecommendation | null>(null);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const { toast } = useToast();

  // AI Configuration
  const [aiConfig, setAiConfig] = useState({
    strategy: 'balanced',
    minRateGuard: 50,
    maxRateGuard: 500,
    rounding: 'nearest_1'
  });

  // Mock pricing recommendations
  const [recommendations, setRecommendations] = useState<PricingRecommendation[]>([
    {
      id: 'rec-1',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      roomTypeId: '1',
      roomTypeName: 'Standard Double',
      currentRate: 120,
      recommendedRate: 135,
      confidence: 89,
      potentialRevenue: 450,
      reasoning: 'High demand forecast + local event detected',
      status: 'pending'
    },
    {
      id: 'rec-2',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      roomTypeId: '2',
      roomTypeName: 'Deluxe Double',
      currentRate: 180,
      recommendedRate: 165,
      confidence: 76,
      potentialRevenue: -200,
      reasoning: 'Competitor rates decreased, low occupancy forecast',
      status: 'pending'
    },
    {
      id: 'rec-3',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      roomTypeId: '5',
      roomTypeName: 'Suite Sea',
      currentRate: 300,
      recommendedRate: 320,
      confidence: 92,
      potentialRevenue: 240,
      reasoning: 'Weekend premium + high-value guest segment booking',
      status: 'pending'
    }
  ]);

  // Mock competitor data
  const competitorData = [
    {
      id: 'comp-1',
      name: 'Grand Hotel Riviera',
      avgRate: 145,
      occupancy: 78,
      trend: 'up' as const,
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 'comp-2',
      name: 'Seaside Resort',
      avgRate: 132,
      occupancy: 85,
      trend: 'down' as const,
      lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: 'comp-3',
      name: 'Ocean View Hotel',
      avgRate: 155,
      occupancy: 72,
      trend: 'up' as const,
      lastUpdated: new Date(Date.now() - 30 * 60 * 1000)
    }
  ];

  // Mock pricing rules
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([
    {
      id: 'rule-1',
      name: 'Weekend Premium',
      isActive: true,
      conditions: {
        dayOfWeek: [0, 6], // Sunday, Saturday
        occupancyMin: 60
      },
      actions: {
        rateAdjustment: 20,
        adjustmentType: 'percentage'
      }
    },
    {
      id: 'rule-2',
      name: 'Last Minute Boost',
      isActive: true,
      conditions: {
        leadTimeMax: 7,
        occupancyMin: 80
      },
      actions: {
        rateAdjustment: 15,
        adjustmentType: 'percentage'
      }
    }
  ]);

  // Apply AI recommendation
  const handleApplyRecommendation = (rec: PricingRecommendation) => {
    // Update ARI data with new rate
    const targetDate = rec.date;
    const updates = [{
      date: targetDate,
      roomTypeId: rec.roomTypeId,
      ratePlanId: '1', // BAR rate plan
      rate: rec.recommendedRate
    }];

    updateARI(updates);
    
    // Update recommendation status
    setRecommendations(prev => prev.map(r => 
      r.id === rec.id ? { ...r, status: 'applied' as const } : r
    ));

    addAuditEntry('AI Recommendation Applied', 
      `Rate updated to €${rec.recommendedRate} for ${rec.roomTypeName} on ${format(rec.date, 'MMM dd')}`
    );

    toast({
      title: 'Recommendation applied',
      description: `Rate updated to €${rec.recommendedRate} for ${rec.roomTypeName}`
    });
  };

  // Modify recommendation (inline editor)
  const handleModifyRecommendation = (rec: PricingRecommendation, newRate: number) => {
    if (newRate < aiConfig.minRateGuard || newRate > aiConfig.maxRateGuard) {
      toast({
        title: 'Rate out of bounds',
        description: `Rate must be between €${aiConfig.minRateGuard} and €${aiConfig.maxRateGuard}`,
        variant: 'destructive'
      });
      return;
    }

    // Apply rounding
    let roundedRate = newRate;
    switch (aiConfig.rounding) {
      case 'nearest_5':
        roundedRate = Math.round(newRate / 5) * 5;
        break;
      case 'nearest_10':
        roundedRate = Math.round(newRate / 10) * 10;
        break;
    }

    const updates = [{
      date: rec.date,
      roomTypeId: rec.roomTypeId,
      ratePlanId: '1',
      rate: roundedRate
    }];

    updateARI(updates);
    
    setRecommendations(prev => prev.map(r => 
      r.id === rec.id ? { ...r, status: 'modified' as const, recommendedRate: roundedRate } : r
    ));

    addAuditEntry('AI Recommendation Modified', 
      `Rate manually adjusted to €${roundedRate} for ${rec.roomTypeName} on ${format(rec.date, 'MMM dd')}`
    );

    toast({
      title: 'Recommendation modified',
      description: `Rate updated to €${roundedRate} for ${rec.roomTypeName}`
    });
  };

  // Decline recommendation
  const handleDeclineRecommendation = (rec: PricingRecommendation) => {
    setRecommendations(prev => prev.map(r => 
      r.id === rec.id ? { ...r, status: 'declined' as const } : r
    ));

    addAuditEntry('AI Recommendation Declined', 
      `Recommendation declined for ${rec.roomTypeName} on ${format(rec.date, 'MMM dd')}`
    );

    toast({
      title: 'Recommendation declined',
      description: `No changes made to ${rec.roomTypeName} rates`
    });
  };

  // AI performance metrics
  const aiMetrics = useMemo(() => {
    const applied = recommendations.filter(r => r.status === 'applied').length;
    const total = recommendations.length;
    const accuracy = total > 0 ? Math.round((applied / total) * 100) : 0;
    
    return {
      revenueOptimization: 12.5, // Mock percentage
      pricingAccuracy: accuracy,
      demandForecast: 87, // Mock percentage
      competitorAnalysis: 94 // Mock percentage
    };
  }, [recommendations]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'default';
      case 'modified': return 'secondary';
      case 'declined': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <Check className="h-4 w-4" />;
      case 'modified': return <Edit className="h-4 w-4" />;
      case 'declined': return <X className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' }) => 
    trend === 'up' ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Revenue AI Copilot</h1>
          <p className="text-muted-foreground">AI-powered dynamic pricing and revenue optimization</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={aiActive ? "default" : "outline"} className="flex items-center gap-1">
              <Bot className="h-3 w-3" />
              AI {aiActive ? 'Active' : 'Inactive'}
            </Badge>
            <Switch checked={aiActive} onCheckedChange={setAiActive} />
          </div>
          <Button onClick={() => setShowConfigModal(true)} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure AI
          </Button>
        </div>
      </div>

      {/* AI Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Revenue Optimization</p>
              <p className="text-2xl font-bold text-blue-600">+{aiMetrics.revenueOptimization}%</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Pricing Accuracy</p>
              <p className="text-2xl font-bold text-green-600">{aiMetrics.pricingAccuracy}%</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Demand Forecast</p>
              <p className="text-2xl font-bold text-purple-600">{aiMetrics.demandForecast}%</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Competitor Analysis</p>
              <p className="text-2xl font-bold text-orange-600">{aiMetrics.competitorAnalysis}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="forecasts">Demand Forecasts</TabsTrigger>
          <TabsTrigger value="competitors">Competitor Analysis</TabsTrigger>
          <TabsTrigger value="rules">Auto-Pricing Rules</TabsTrigger>
        </TabsList>

        {/* AI Recommendations Tab */}
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Pricing Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Current Rate</TableHead>
                      <TableHead>Recommended</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Revenue Impact</TableHead>
                      <TableHead>Reasoning</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recommendations.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell>{format(rec.date, 'MMM dd')}</TableCell>
                        <TableCell>{rec.roomTypeName}</TableCell>
                        <TableCell>€{rec.currentRate}</TableCell>
                        <TableCell className="font-medium">€{rec.recommendedRate}</TableCell>
                        <TableCell>
                          <Badge variant={rec.confidence > 80 ? "default" : "secondary"}>
                            {rec.confidence}%
                          </Badge>
                        </TableCell>
                        <TableCell className={rec.potentialRevenue > 0 ? "text-green-600" : "text-red-600"}>
                          {rec.potentialRevenue > 0 ? '+' : ''}€{rec.potentialRevenue}
                        </TableCell>
                        <TableCell className="max-w-48 truncate" title={rec.reasoning}>
                          {rec.reasoning}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(rec.status)} className="flex items-center gap-1">
                            {getStatusIcon(rec.status)}
                            {rec.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {rec.status === 'pending' && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleApplyRecommendation(rec)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Apply
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedRecommendation(rec)}
                              >
                                Modify
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeclineRecommendation(rec)}
                              >
                                Decline
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demand Forecasts Tab */}
        <TabsContent value="forecasts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>7-Day Demand Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({length: 7}, (_, i) => {
                    const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
                    const occupancy = Math.floor(Math.random() * 40 + 60);
                    const adr = Math.floor(Math.random() * 50 + 100);
                    const revpar = Math.floor((occupancy / 100) * adr);
                    
                    return (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{format(date, 'MMM dd')}</p>
                          <p className="text-sm text-muted-foreground">{format(date, 'EEEE')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Occ: {occupancy}% | ADR: €{adr}</p>
                          <p className="text-sm font-medium">RevPAR: €{revpar}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Events Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Business Conference</p>
                        <p className="text-sm text-muted-foreground">Dec 15-17</p>
                      </div>
                      <Badge variant="default">+25% demand</Badge>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Music Festival</p>
                        <p className="text-sm text-muted-foreground">Dec 20-22</p>
                      </div>
                      <Badge variant="default">+40% demand</Badge>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Holiday Weekend</p>
                        <p className="text-sm text-muted-foreground">Dec 24-26</p>
                      </div>
                      <Badge variant="secondary">+15% demand</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Competitor Analysis Tab */}
        <TabsContent value="competitors">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Rate Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitorData.map((comp) => (
                  <div key={comp.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="font-medium">{comp.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {format(comp.lastUpdated, 'MMM dd, HH:mm')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm">Avg Rate: €{comp.avgRate}</p>
                        <p className="text-sm">Occupancy: {comp.occupancy}%</p>
                      </div>
                      <TrendIcon trend={comp.trend} />
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Pricing Rules Tab */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Automated Pricing Rules</CardTitle>
                <Button onClick={() => setShowRuleModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pricingRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Switch checked={rule.isActive} />
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {rule.actions.adjustmentType === 'percentage' ? '+' : ''}
                          {rule.actions.rateAdjustment}
                          {rule.actions.adjustmentType === 'percentage' ? '%' : '€'} adjustment
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingRule(rule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modify Recommendation Modal */}
      {selectedRecommendation && (
        <Dialog open={true} onOpenChange={() => setSelectedRecommendation(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modify Recommendation</DialogTitle>
            </DialogHeader>
            <ModifyRecommendationForm 
              recommendation={selectedRecommendation}
              onSave={(newRate) => {
                handleModifyRecommendation(selectedRecommendation, newRate);
                setSelectedRecommendation(null);
              }}
              onCancel={() => setSelectedRecommendation(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* AI Configuration Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure AI Settings</DialogTitle>
          </DialogHeader>
          <AIConfigForm 
            config={aiConfig}
            onSave={(newConfig) => {
              setAiConfig(newConfig);
              setShowConfigModal(false);
              toast({ title: 'AI configuration updated' });
            }}
            onCancel={() => setShowConfigModal(false)}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// Modify Recommendation Form Component
const ModifyRecommendationForm = ({ recommendation, onSave, onCancel }: any) => {
  const [newRate, setNewRate] = useState(recommendation.recommendedRate);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <label className="font-medium">Room Type:</label>
          <p>{recommendation.roomTypeName}</p>
        </div>
        <div>
          <label className="font-medium">Date:</label>
          <p>{format(recommendation.date, 'MMM dd, yyyy')}</p>
        </div>
        <div>
          <label className="font-medium">Current Rate:</label>
          <p>€{recommendation.currentRate}</p>
        </div>
        <div>
          <label className="font-medium">AI Recommended:</label>
          <p>€{recommendation.recommendedRate}</p>
        </div>
      </div>

      <div>
        <Label htmlFor="newRate">Your Rate (€)</Label>
        <Input
          id="newRate"
          type="number"
          step="0.01"
          value={newRate}
          onChange={(e) => setNewRate(Number(e.target.value))}
        />
      </div>

      <div className="bg-muted p-3 rounded-lg">
        <p className="text-sm">
          <strong>Revenue Impact:</strong> {newRate > recommendation.currentRate ? '+' : ''}
          €{Math.round((newRate - recommendation.currentRate) * 10)} estimated
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(newRate)} className="bg-gradient-primary">
          Apply Changes
        </Button>
      </div>
    </div>
  );
};

// AI Config Form Component
const AIConfigForm = ({ config, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState(config);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="strategy">Pricing Strategy</Label>
        <Select value={formData.strategy} onValueChange={(value) => setFormData({...formData, strategy: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="conservative">Conservative</SelectItem>
            <SelectItem value="balanced">Balanced</SelectItem>
            <SelectItem value="aggressive">Aggressive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minRate">Min Rate Guard (€)</Label>
          <Input
            id="minRate"
            type="number"
            value={formData.minRateGuard}
            onChange={(e) => setFormData({...formData, minRateGuard: Number(e.target.value)})}
          />
        </div>
        <div>
          <Label htmlFor="maxRate">Max Rate Guard (€)</Label>
          <Input
            id="maxRate"
            type="number"
            value={formData.maxRateGuard}
            onChange={(e) => setFormData({...formData, maxRateGuard: Number(e.target.value)})}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="rounding">Rate Rounding</Label>
        <Select value={formData.rounding} onValueChange={(value) => setFormData({...formData, rounding: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Rounding</SelectItem>
            <SelectItem value="nearest_1">To Nearest €1</SelectItem>
            <SelectItem value="nearest_5">To Nearest €5</SelectItem>
            <SelectItem value="nearest_10">To Nearest €10</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(formData)} className="bg-gradient-primary">
          Save Configuration
        </Button>
      </div>
    </div>
  );
};