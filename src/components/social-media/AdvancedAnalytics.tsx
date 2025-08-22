import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  Clock,
  Users,
  MessageCircle,
  Heart,
  Share,
  Eye,
  Zap,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface AnalyticsData {
  timeRange: string;
  metrics: {
    engagement: number;
    reach: number;
    impressions: number;
    clicks: number;
    conversions: number;
  };
  trends: {
    metric: string;
    change: number;
    direction: 'up' | 'down';
  }[];
  topPosts: {
    id: string;
    content: string;
    platform: string;
    engagement: number;
    reach: number;
    publishedAt: string;
  }[];
  audienceInsights: {
    demographics: { age: string; percentage: number }[];
    interests: { category: string; affinity: number }[];
    behavior: { time: string; activity: number }[];
  };
  recommendations: {
    type: 'optimization' | 'content' | 'timing' | 'audience';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    confidence: number;
  }[];
}

const mockAnalyticsData: AnalyticsData = {
  timeRange: '30d',
  metrics: {
    engagement: 4.2,
    reach: 125000,
    impressions: 450000,
    clicks: 8500,
    conversions: 340
  },
  trends: [
    { metric: 'Engagement Rate', change: 12.5, direction: 'up' },
    { metric: 'Reach', change: -3.2, direction: 'down' },
    { metric: 'Click-through Rate', change: 8.7, direction: 'up' },
    { metric: 'Conversion Rate', change: 15.3, direction: 'up' }
  ],
  topPosts: [
    {
      id: '1',
      content: 'Experience luxury like never before at our spa...',
      platform: 'instagram',
      engagement: 8.5,
      reach: 25000,
      publishedAt: '2024-01-15'
    },
    {
      id: '2',
      content: 'Discover our new signature restaurant menu...',
      platform: 'facebook',
      engagement: 6.2,
      reach: 18000,
      publishedAt: '2024-01-14'
    }
  ],
  audienceInsights: {
    demographics: [
      { age: '25-34', percentage: 35 },
      { age: '35-44', percentage: 28 },
      { age: '45-54', percentage: 22 },
      { age: '18-24', percentage: 15 }
    ],
    interests: [
      { category: 'Travel', affinity: 95 },
      { category: 'Luxury', affinity: 88 },
      { category: 'Dining', affinity: 76 },
      { category: 'Wellness', affinity: 64 }
    ],
    behavior: [
      { time: '6AM', activity: 15 },
      { time: '9AM', activity: 25 },
      { time: '12PM', activity: 40 },
      { time: '3PM', activity: 60 },
      { time: '6PM', activity: 85 },
      { time: '9PM', activity: 90 },
      { time: '12AM', activity: 30 }
    ]
  },
  recommendations: [
    {
      type: 'timing',
      title: 'Optimize Posting Times',
      description: 'Your audience is most active between 6-9 PM. Consider scheduling more posts during this window.',
      impact: 'high',
      confidence: 92
    },
    {
      type: 'content',
      title: 'Focus on Wellness Content',
      description: 'Wellness-related posts show 40% higher engagement. Increase spa and wellness content.',
      impact: 'medium',
      confidence: 78
    },
    {
      type: 'audience',
      title: 'Target 35-44 Age Group',
      description: 'This demographic shows highest conversion rates but lower reach. Consider targeted campaigns.',
      impact: 'high',
      confidence: 85
    }
  ]
};

const engagementData = [
  { name: 'Week 1', engagement: 3.2, reach: 15000, clicks: 450 },
  { name: 'Week 2', engagement: 3.8, reach: 18000, clicks: 520 },
  { name: 'Week 3', engagement: 4.1, reach: 22000, clicks: 680 },
  { name: 'Week 4', engagement: 4.2, reach: 25000, clicks: 720 }
];

export const AdvancedAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('engagement');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(mockAnalyticsData);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'timing': return <Clock className="h-4 w-4" />;
      case 'content': return <MessageCircle className="h-4 w-4" />;
      case 'audience': return <Users className="h-4 w-4" />;
      case 'optimization': return <Target className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            AI-powered insights and performance analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                <p className="text-2xl font-bold">{analyticsData.metrics.engagement}%</p>
              </div>
              <Heart className="h-8 w-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reach</p>
                <p className="text-2xl font-bold">{(analyticsData.metrics.reach / 1000).toFixed(0)}K</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Impressions</p>
                <p className="text-2xl font-bold">{(analyticsData.metrics.impressions / 1000).toFixed(0)}K</p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clicks</p>
                <p className="text-2xl font-bold">{analyticsData.metrics.clicks.toLocaleString()}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{analyticsData.metrics.conversions}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Trends
            </CardTitle>
            <CardDescription>Key metric changes over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.trends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{trend.metric}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={trend.direction === 'up' ? 'default' : 'destructive'}>
                      {trend.direction === 'up' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(trend.change)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Over Time</CardTitle>
            <CardDescription>Weekly engagement performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="engagement" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Audience Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Age Demographics</CardTitle>
            <CardDescription>Audience age distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analyticsData.audienceInsights.demographics}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                  label={({ age, percentage }) => `${age}: ${percentage}%`}
                >
                  {analyticsData.audienceInsights.demographics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interest Affinity</CardTitle>
            <CardDescription>Top audience interests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData.audienceInsights.interests.map((interest, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{interest.category}</span>
                  <span>{interest.affinity}%</span>
                </div>
                <Progress value={interest.affinity} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>When your audience is most active</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={analyticsData.audienceInsights.behavior}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="activity" 
                  stroke="#82ca9d" 
                  fill="#82ca9d"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Recommendations
          </CardTitle>
          <CardDescription>
            Smart insights to improve your social media performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyticsData.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getRecommendationIcon(rec.type)}
                    <Badge className={getImpactColor(rec.impact)}>
                      {rec.impact} impact
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {rec.confidence}% confidence
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">{rec.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {rec.description}
                  </p>
                </div>
                
                <Button size="sm" variant="outline" className="w-full">
                  Apply Recommendation
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};