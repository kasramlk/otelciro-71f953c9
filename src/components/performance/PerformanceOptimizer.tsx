import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gauge,
  Zap,
  Server,
  Database,
  Globe,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  target: number;
  description: string;
}

interface OptimizationSuggestion {
  id: string;
  category: 'frontend' | 'backend' | 'database' | 'network';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
}

export const PerformanceOptimizer: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics');
  const { toast } = useToast();

  const metrics: PerformanceMetric[] = [
    {
      name: 'Page Load Time',
      value: 2.1,
      unit: 'seconds',
      status: 'good',
      target: 2.0,
      description: 'Average time to fully load pages'
    },
    {
      name: 'First Contentful Paint',
      value: 1.3,
      unit: 'seconds',
      status: 'excellent',
      target: 1.5,
      description: 'Time to first meaningful content'
    },
    {
      name: 'Database Query Time',
      value: 145,
      unit: 'ms',
      status: 'warning',
      target: 100,
      description: 'Average database response time'
    },
    {
      name: 'API Response Time',
      value: 89,
      unit: 'ms',
      status: 'good',
      target: 100,
      description: 'Average API endpoint response'
    },
    {
      name: 'Memory Usage',
      value: 72,
      unit: '%',
      status: 'warning',
      target: 70,
      description: 'Current memory utilization'
    },
    {
      name: 'Cache Hit Rate',
      value: 94,
      unit: '%',
      status: 'excellent',
      target: 90,
      description: 'Percentage of requests served from cache'
    }
  ];

  const suggestions: OptimizationSuggestion[] = [
    {
      id: '1',
      category: 'frontend',
      priority: 'high',
      title: 'Implement Image Lazy Loading',
      description: 'Add lazy loading to images to improve initial page load performance',
      impact: '25% faster page load',
      difficulty: 'easy',
      estimatedTime: '2 hours'
    },
    {
      id: '2',
      category: 'database',
      priority: 'high',
      title: 'Optimize Database Indexes',
      description: 'Add missing indexes on frequently queried columns',
      impact: '40% faster queries',
      difficulty: 'medium',
      estimatedTime: '4 hours'
    },
    {
      id: '3',
      category: 'backend',
      priority: 'medium',
      title: 'Enable Response Compression',
      description: 'Implement gzip compression for API responses',
      impact: '30% smaller payload',
      difficulty: 'easy',
      estimatedTime: '1 hour'
    },
    {
      id: '4',
      category: 'network',
      priority: 'medium',
      title: 'Setup CDN for Static Assets',
      description: 'Use CDN to serve images and static files globally',
      impact: '50% faster asset loading',
      difficulty: 'medium',
      estimatedTime: '6 hours'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

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
      case 'frontend': return <Globe className="h-4 w-4" />;
      case 'backend': return <Server className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'network': return <Activity className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate performance analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    toast({
      title: 'Performance Analysis Complete',
      description: 'Found optimization opportunities to improve system performance'
    });
    
    setIsAnalyzing(false);
  };

  const overallScore = Math.round(
    metrics.reduce((acc, metric) => {
      const score = metric.value <= metric.target ? 100 : Math.max(0, 100 - ((metric.value - metric.target) / metric.target) * 50);
      return acc + score;
    }, 0) / metrics.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Performance Optimizer
          </h1>
          <p className="text-muted-foreground">
            Monitor and optimize system performance for better user experience
          </p>
        </div>
        
        <Button 
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="bg-gradient-primary"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Gauge className="h-4 w-4 mr-2" />
              Run Analysis
            </>
          )}
        </Button>
      </div>

      {/* Performance Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Overall Performance Score</h3>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-primary">{overallScore}</div>
                  <div className="flex-1">
                    <Progress value={overallScore} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {overallScore >= 90 ? 'Excellent' : overallScore >= 70 ? 'Good' : overallScore >= 50 ? 'Needs Improvement' : 'Critical'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <Gauge className="h-16 w-16 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Performance Index</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                      {getStatusIcon(metric.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{metric.value}</span>
                        <span className="text-sm text-muted-foreground">{metric.unit}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Target: {metric.target}{metric.unit}</span>
                          <Badge variant="outline" className={getStatusColor(metric.status)}>
                            {metric.status}
                          </Badge>
                        </div>
                        <Progress 
                          value={Math.min(100, (metric.target / metric.value) * 100)} 
                          className="h-2" 
                        />
                      </div>

                      <p className="text-xs text-muted-foreground">{metric.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(suggestion.category)}
                      <div>
                        <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                        <p className="text-sm text-muted-foreground capitalize">
                          {suggestion.category} optimization
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(suggestion.priority)} className="capitalize">
                        {suggestion.priority} priority
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {suggestion.difficulty}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">{suggestion.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Expected Impact</p>
                        <p className="font-bold text-success">{suggestion.impact}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Time</p>
                        <p className="font-medium">{suggestion.estimatedTime}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="bg-gradient-primary">
                        <Zap className="h-4 w-4 mr-2" />
                        Implement
                      </Button>
                      <Button size="sm" variant="outline">
                        Learn More
                      </Button>
                      <Button size="sm" variant="outline">
                        Schedule Later
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">247</p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-success" />
                  <p className="text-2xl font-bold">98.9%</p>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Server className="h-8 w-8 mx-auto mb-2 text-warning" />
                  <p className="text-2xl font-bold">45%</p>
                  <p className="text-sm text-muted-foreground">CPU Usage</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">1.2GB</p>
                  <p className="text-sm text-muted-foreground">DB Size</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="p-6 h-auto flex flex-col items-center gap-2">
                    <TrendingUp className="h-8 w-8" />
                    <span>Weekly Performance Report</span>
                    <span className="text-xs text-muted-foreground">Last 7 days analysis</span>
                  </Button>
                  <Button variant="outline" className="p-6 h-auto flex flex-col items-center gap-2">
                    <Gauge className="h-8 w-8" />
                    <span>Benchmark Report</span>
                    <span className="text-xs text-muted-foreground">Compare against industry</span>
                  </Button>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Next Scheduled Report</h4>
                  <p className="text-sm text-muted-foreground">Weekly performance analysis will be generated on Monday at 9:00 AM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};