import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  Calendar,
  Users,
  DollarSign,
  AlertTriangle,
  Target,
  BarChart3,
  Brain,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface Prediction {
  id: string;
  category: 'occupancy' | 'revenue' | 'demand' | 'pricing';
  title: string;
  prediction: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  timeframe: string;
  description: string;
  factors: string[];
}

export const PredictiveAnalytics: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock prediction data
  const mockPredictions: Prediction[] = [
    {
      id: '1',
      category: 'occupancy',
      title: 'Weekend Occupancy Rate',
      prediction: 87.5,
      confidence: 92,
      trend: 'up',
      timeframe: 'Next 30 days',
      description: 'Weekend occupancy expected to increase due to local events and favorable weather',
      factors: ['Local festivals', 'Weather patterns', 'Historical data', 'Competitor analysis']
    },
    {
      id: '2',
      category: 'revenue',
      title: 'Monthly Revenue Growth',
      prediction: 15.3,
      confidence: 88,
      trend: 'up',
      timeframe: 'Next month',
      description: 'Revenue growth projected based on booking trends and pricing optimization',
      factors: ['Booking velocity', 'Dynamic pricing', 'Upselling rates', 'Cancellation patterns']
    },
    {
      id: '3',
      category: 'demand',
      title: 'Peak Season Demand',
      prediction: 94.2,
      confidence: 85,
      trend: 'up',
      timeframe: 'Next quarter',
      description: 'High demand expected during peak season with potential overbooking risk',
      factors: ['Seasonal patterns', 'Economic indicators', 'Travel trends', 'Marketing campaigns']
    },
    {
      id: '4',
      category: 'pricing',
      title: 'Optimal Room Rate',
      prediction: 245,
      confidence: 90,
      trend: 'stable',
      timeframe: 'Current',
      description: 'Current pricing is near optimal with minor adjustment opportunities',
      factors: ['Competitor rates', 'Demand elasticity', 'Guest satisfaction', 'Market conditions']
    }
  ];

  // Mock chart data
  const occupancyForecast = [
    { month: 'Jan', actual: 65, predicted: 68 },
    { month: 'Feb', actual: 72, predicted: 75 },
    { month: 'Mar', actual: 78, predicted: 82 },
    { month: 'Apr', actual: 85, predicted: 88 },
    { month: 'May', actual: null, predicted: 92 },
    { month: 'Jun', actual: null, predicted: 95 },
  ];

  const revenueBreakdown = [
    { name: 'Rooms', value: 65, color: '#8884d8' },
    { name: 'F&B', value: 20, color: '#82ca9d' },
    { name: 'Spa', value: 10, color: '#ffc658' },
    { name: 'Events', value: 5, color: '#ff7c7c' },
  ];

  const demandPatterns = [
    { day: 'Mon', demand: 60 },
    { day: 'Tue', demand: 55 },
    { day: 'Wed', demand: 62 },
    { day: 'Thu', demand: 70 },
    { day: 'Fri', demand: 88 },
    { day: 'Sat', demand: 95 },
    { day: 'Sun', demand: 82 },
  ];

  useEffect(() => {
    setPredictions(mockPredictions);
  }, []);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setIsAnalyzing(false);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Activity className="h-4 w-4 text-warning" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'occupancy': return <Users className="h-4 w-4" />;
      case 'revenue': return <DollarSign className="h-4 w-4" />;
      case 'demand': return <Target className="h-4 w-4" />;
      case 'pricing': return <BarChart3 className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const filteredPredictions = selectedCategory === 'all' 
    ? predictions 
    : predictions.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Predictive Analytics
          </h1>
          <p className="text-muted-foreground">
            AI-powered forecasting and business intelligence
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="bg-gradient-primary"
          >
            {isAnalyzing ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {predictions.map((prediction, index) => (
          <motion.div
            key={prediction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  {getCategoryIcon(prediction.category)}
                  {getTrendIcon(prediction.trend)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{prediction.title}</p>
                  <p className="text-2xl font-bold">
                    {prediction.category === 'pricing' ? '€' : ''}
                    {prediction.prediction}
                    {prediction.category !== 'pricing' ? '%' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {prediction.confidence}% confidence
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="forecasts">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Occupancy Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={occupancyForecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Actual"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Predicted"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Weekly Demand Pattern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={demandPatterns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="demand" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="mb-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="occupancy">Occupancy</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="demand">Demand</SelectItem>
                <SelectItem value="pricing">Pricing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredPredictions.map((prediction, index) => (
            <motion.div
              key={prediction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(prediction.category)}
                      <div>
                        <CardTitle className="text-lg">{prediction.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{prediction.timeframe}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(prediction.trend)}
                        <Badge variant="outline">
                          {prediction.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">{prediction.description}</p>
                    
                    <div>
                      <h4 className="font-medium mb-2">Key Factors:</h4>
                      <div className="flex flex-wrap gap-2">
                        {prediction.factors.map((factor, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Predicted Value</p>
                        <p className="text-lg font-bold">
                          {prediction.category === 'pricing' ? '€' : ''}
                          {prediction.prediction}
                          {prediction.category !== 'pricing' ? '%' : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Trend Direction</p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(prediction.trend)}
                          <span className="capitalize">{prediction.trend}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-medium text-success">Optimistic</h4>
                    <p className="text-2xl font-bold text-success">+25%</p>
                    <p className="text-sm text-muted-foreground">Revenue Growth</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-medium">Realistic</h4>
                    <p className="text-2xl font-bold">+15%</p>
                    <p className="text-sm text-muted-foreground">Revenue Growth</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-medium text-destructive">Conservative</h4>
                    <p className="text-2xl font-bold text-destructive">+8%</p>
                    <p className="text-sm text-muted-foreground">Revenue Growth</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Generate Risk Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};