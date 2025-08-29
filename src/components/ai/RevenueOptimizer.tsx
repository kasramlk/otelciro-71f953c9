import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Zap,
  BarChart3,
  Calendar,
  Users,
  Settings,
  Lightbulb,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RevenueInsight {
  id: string;
  type: 'pricing' | 'demand' | 'occupancy' | 'upselling';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  potentialRevenue: number;
  recommendation: string;
  status: 'pending' | 'applied' | 'dismissed';
}

export const RevenueOptimizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('insights');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [insights, setInsights] = useState<RevenueInsight[]>([]);
  const { toast } = useToast();

  // Mock AI insights
  const mockInsights: RevenueInsight[] = [
    {
      id: '1',
      type: 'pricing',
      title: 'Dynamic Pricing Opportunity',
      description: 'Weekend rates can be increased by 15-20% based on demand patterns',
      impact: 'high',
      confidence: 92,
      potentialRevenue: 12500,
      recommendation: 'Implement dynamic weekend pricing starting Friday 6PM to Sunday 6PM',
      status: 'pending'
    },
    {
      id: '2',
      type: 'upselling',
      title: 'Spa Package Upselling',
      description: 'Guests booking 3+ nights show 78% acceptance rate for spa packages',
      impact: 'medium',
      confidence: 85,
      potentialRevenue: 8900,
      recommendation: 'Auto-offer spa packages to guests with 3+ night stays during booking',
      status: 'pending'
    },
    {
      id: '3',
      type: 'demand',
      title: 'Corporate Booking Optimization',
      description: 'Tuesday-Thursday have 23% lower occupancy but high corporate potential',
      impact: 'medium',
      confidence: 88,
      potentialRevenue: 15600,
      recommendation: 'Launch targeted corporate rates for mid-week stays',
      status: 'pending'
    },
    {
      id: '4',
      type: 'occupancy',
      title: 'Last-Minute Booking Strategy',
      description: 'Rooms remain empty within 48h - implement flash sale pricing',
      impact: 'high',
      confidence: 90,
      potentialRevenue: 6700,
      recommendation: 'Activate 30% discount for bookings made within 48 hours',
      status: 'applied'
    }
  ];

  useEffect(() => {
    setInsights(mockInsights);
  }, []);

  const handleOptimizeRevenue = async () => {
    setIsOptimizing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    toast({
      title: 'Revenue Analysis Complete',
      description: `Found ${insights.filter(i => i.status === 'pending').length} new optimization opportunities`
    });
    
    setIsOptimizing(false);
  };

  const handleApplyInsight = (insightId: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === insightId 
        ? { ...insight, status: 'applied' }
        : insight
    ));
    
    const insight = insights.find(i => i.id === insightId);
    toast({
      title: 'Optimization Applied',
      description: `${insight?.title} has been implemented`
    });
  };

  const handleDismissInsight = (insightId: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === insightId 
        ? { ...insight, status: 'dismissed' }
        : insight
    ));
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Target className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const totalPotentialRevenue = insights
    .filter(i => i.status === 'pending')
    .reduce((sum, insight) => sum + insight.potentialRevenue, 0);

  const appliedRevenue = insights
    .filter(i => i.status === 'applied')
    .reduce((sum, insight) => sum + insight.potentialRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            AI Revenue Optimizer
          </h1>
          <p className="text-muted-foreground">
            AI-powered revenue optimization and pricing recommendations
          </p>
        </div>
        
        <Button 
          onClick={handleOptimizeRevenue}
          disabled={isOptimizing}
          className="bg-gradient-primary"
        >
          {isOptimizing ? (
            <>
              <Zap className="h-4 w-4 mr-2 animate-pulse" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Run AI Analysis
            </>
          )}
        </Button>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Potential Revenue</p>
                  <p className="text-2xl font-bold text-success">
                    €{totalPotentialRevenue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Applied Revenue</p>
                  <p className="text-2xl font-bold text-primary">
                    €{appliedRevenue.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Insights</p>
                  <p className="text-2xl font-bold">
                    {insights.filter(i => i.status === 'pending').length}
                  </p>
                </div>
                <Lightbulb className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="demand">Demand</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {insights.map((insight) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: parseInt(insight.id) * 0.1 }}
            >
              <Card className={insight.status === 'applied' ? 'border-success' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className={`${getImpactColor(insight.impact)} capitalize`}
                      >
                        {getImpactIcon(insight.impact)}
                        <span className="ml-1">{insight.impact} Impact</span>
                      </Badge>
                      <Badge variant="secondary">
                        {insight.confidence}% Confidence
                      </Badge>
                      {insight.status === 'applied' && (
                        <Badge variant="default">Applied</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Potential Revenue</p>
                      <p className="text-lg font-bold text-success">
                        +€{insight.potentialRevenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <CardTitle>{insight.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">{insight.description}</p>
                    
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-medium mb-2">AI Recommendation:</p>
                      <p className="text-sm">{insight.recommendation}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence Score</span>
                        <span>{insight.confidence}%</span>
                      </div>
                      <Progress value={insight.confidence} className="h-2" />
                    </div>

                    {insight.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleApplyInsight(insight.id)}
                          className="bg-gradient-primary"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Apply Recommendation
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleDismissInsight(insight.id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Pricing Engine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Current Strategy</h4>
                    <p className="text-sm text-muted-foreground">
                      Fixed pricing with seasonal adjustments
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">AI Recommendation</h4>
                    <p className="text-sm text-muted-foreground">
                      Dynamic pricing based on demand, events, and competitor analysis
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Pricing Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demand" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demand Forecasting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-success">78%</p>
                    <p className="text-sm text-muted-foreground">Next 7 Days</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-warning">65%</p>
                    <p className="text-sm text-muted-foreground">Next 30 Days</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">82%</p>
                    <p className="text-sm text-muted-foreground">Peak Season</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Detailed Forecast
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">€45,200</p>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-success">+12.5%</p>
                    <p className="text-sm text-muted-foreground">vs Last Month</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Generate Revenue Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};