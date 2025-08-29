import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  Zap,
  BarChart3,
  Calendar,
  Settings
} from 'lucide-react';
import { RevenueOptimizer } from './RevenueOptimizer';
import { PredictiveAnalytics } from './PredictiveAnalytics';
import { useToast } from '@/hooks/use-toast';

interface AIInsight {
  id: string;
  category: 'revenue' | 'operations' | 'guest' | 'marketing';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  impact: string;
  confidence: number;
  dateGenerated: Date;
  status: 'new' | 'reviewing' | 'implemented' | 'dismissed';
}

export const AIInsightsCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [insights] = useState<AIInsight[]>([
    {
      id: '1',
      category: 'revenue',
      priority: 'high',
      title: 'Weekend Rate Optimization',
      description: 'Analysis shows potential for 18% revenue increase through strategic weekend pricing',
      recommendation: 'Implement dynamic weekend rates: Fri-Sun +20%, leverage local event calendar',
      impact: '+€15,400 monthly',
      confidence: 94,
      dateGenerated: new Date(),
      status: 'new'
    },
    {
      id: '2',
      category: 'operations',
      priority: 'medium',
      title: 'Housekeeping Efficiency',
      description: 'Room turnover time can be reduced by optimizing staff scheduling patterns',
      recommendation: 'Shift housekeeping start time 30 minutes earlier on high-checkout days',
      impact: '25% faster turnover',
      confidence: 87,
      dateGenerated: new Date(),
      status: 'new'
    },
    {
      id: '3',
      category: 'guest',
      priority: 'high',
      title: 'Guest Satisfaction Driver',
      description: 'Wi-Fi speed issues correlate with 23% of negative reviews',
      recommendation: 'Upgrade Wi-Fi infrastructure in rooms 201-230, most affected areas',
      impact: '+0.7 review score',
      confidence: 91,
      dateGenerated: new Date(),
      status: 'reviewing'
    },
    {
      id: '4',
      category: 'marketing',
      priority: 'medium',
      title: 'Social Media Engagement',
      description: 'Food photography posts generate 340% more engagement than room photos',
      recommendation: 'Increase F&B content to 60% of social posts, focus on signature dishes',
      impact: '+45% engagement',
      confidence: 83,
      dateGenerated: new Date(),
      status: 'new'
    }
  ]);

  const { toast } = useToast();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'revenue': return <DollarSign className="h-4 w-4" />;
      case 'operations': return <Settings className="h-4 w-4" />;
      case 'guest': return <Users className="h-4 w-4" />;
      case 'marketing': return <Target className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Lightbulb className="h-4 w-4 text-warning" />;
      case 'reviewing': return <AlertTriangle className="h-4 w-4 text-primary" />;
      case 'implemented': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'dismissed': return <div className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const handleGenerateInsights = () => {
    toast({
      title: 'Generating AI Insights',
      description: 'Analyzing hotel data to generate new insights...'
    });
  };

  const newInsights = insights.filter(i => i.status === 'new').length;
  const highPriorityInsights = insights.filter(i => i.priority === 'high').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            AI Insights Center
          </h1>
          <p className="text-muted-foreground">
            Comprehensive AI-powered business intelligence and recommendations
          </p>
        </div>
        
        <Button onClick={handleGenerateInsights} className="bg-gradient-primary">
          <Brain className="h-4 w-4 mr-2" />
          Generate New Insights
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New Insights</p>
                  <p className="text-2xl font-bold text-warning">{newInsights}</p>
                </div>
                <Lightbulb className="h-8 w-8 text-warning" />
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
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold text-destructive">{highPriorityInsights}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
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
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Insights</p>
                  <p className="text-2xl font-bold">{insights.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Confidence</p>
                  <p className="text-2xl font-bold text-success">89%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue AI</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
          <TabsTrigger value="insights">All Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Recent AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.slice(0, 3).map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    {getCategoryIcon(insight.category)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {insight.confidence}% confidence
                        </Badge>
                        <span className="text-xs text-success">{insight.impact}</span>
                      </div>
                    </div>
                    {getStatusIcon(insight.status)}
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* AI Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-success">€47K</p>
                      <p className="text-xs text-muted-foreground">Revenue Generated</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">92%</p>
                      <p className="text-xs text-muted-foreground">Prediction Accuracy</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Implementation Rate</span>
                      <span>78%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>ROI from AI Insights</span>
                      <span>340%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-success h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueOptimizer />
        </TabsContent>

        <TabsContent value="predictive">
          <PredictiveAnalytics />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(insight.category)}
                      <div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <p className="text-sm text-muted-foreground capitalize">
                          {insight.category} • {insight.dateGenerated.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(insight.priority)} className="capitalize">
                        {insight.priority} Priority
                      </Badge>
                      <Badge variant="outline">
                        {insight.confidence}% confidence
                      </Badge>
                      {getStatusIcon(insight.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Analysis</h4>
                      <p className="text-muted-foreground">{insight.description}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">AI Recommendation</h4>
                      <p className="text-sm">{insight.recommendation}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Expected Impact</p>
                        <p className="font-bold text-success">{insight.impact}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">{insight.status}</p>
                      </div>
                    </div>

                    {insight.status === 'new' && (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-gradient-primary">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Implement
                        </Button>
                        <Button size="sm" variant="outline">
                          Review Later
                        </Button>
                        <Button size="sm" variant="outline">
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
      </Tabs>
    </div>
  );
};