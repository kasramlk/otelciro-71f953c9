import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle,
  Share,
  Eye,
  MousePointer,
  DollarSign,
  Calendar,
  Download,
  Filter,
  Instagram,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SocialMediaKPICard } from './SocialMediaKPICard';

interface PlatformPerformance {
  platform: string;
  posts: number;
  reach: number;
  engagement: number;
  clicks: number;
  conversions: number;
  roi: string;
}

interface TopPost {
  id: string;
  platform: string;
  title: string;
  publishedAt: string;
  engagement: number;
  reach: number;
  clicks: number;
  thumbnail?: string;
}

const mockPlatformData: PlatformPerformance[] = [
  {
    platform: 'Instagram',
    posts: 24,
    reach: 12400,
    engagement: 892,
    clicks: 156,
    conversions: 12,
    roi: '+285%'
  },
  {
    platform: 'Facebook',
    posts: 18,
    reach: 8900,
    engagement: 654,
    clicks: 234,
    conversions: 18,
    roi: '+340%'
  },
  {
    platform: 'Twitter',
    posts: 32,
    reach: 5600,
    engagement: 423,
    clicks: 89,
    conversions: 6,
    roi: '+125%'
  },
  {
    platform: 'LinkedIn',
    posts: 12,
    reach: 3200,
    engagement: 287,
    clicks: 67,
    conversions: 8,
    roi: '+450%'
  }
];

const mockTopPosts: TopPost[] = [
  {
    id: '1',
    platform: 'Instagram',
    title: 'Sunset from our rooftop terrace 🌅',
    publishedAt: '2024-01-20T18:00:00Z',
    engagement: 1240,
    reach: 8900,
    clicks: 89
  },
  {
    id: '2',
    platform: 'Facebook',
    title: 'Special weekend offer - 20% off luxury suites',
    publishedAt: '2024-01-19T14:30:00Z',
    engagement: 892,
    reach: 6700,
    clicks: 156
  },
  {
    id: '3',
    platform: 'LinkedIn',
    title: 'Business travelers choose us for our executive amenities',
    publishedAt: '2024-01-18T09:00:00Z',
    engagement: 234,
    reach: 2100,
    clicks: 67
  }
];

const PLATFORMS = {
  Instagram: { icon: Instagram, color: 'text-pink-600' },
  Facebook: { icon: Facebook, color: 'text-blue-600' },
  Twitter: { icon: Twitter, color: 'text-blue-400' },
  LinkedIn: { icon: Linkedin, color: 'text-blue-700' }
};

export const SocialMediaAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  const filteredPlatformData = selectedPlatform === 'all' 
    ? mockPlatformData 
    : mockPlatformData.filter(p => p.platform.toLowerCase() === selectedPlatform);

  const totalReach = mockPlatformData.reduce((sum, p) => sum + p.reach, 0);
  const totalEngagement = mockPlatformData.reduce((sum, p) => sum + p.engagement, 0);
  const totalClicks = mockPlatformData.reduce((sum, p) => sum + p.clicks, 0);
  const totalConversions = mockPlatformData.reduce((sum, p) => sum + p.conversions, 0);

  const engagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(1) : '0.0';
  const ctr = totalReach > 0 ? ((totalClicks / totalReach) * 100).toFixed(2) : '0.00';
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Media Analytics</h1>
          <p className="text-muted-foreground">
            Track performance, engagement, and ROI across all your social platforms
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SocialMediaKPICard
          title="Total Reach"
          value={totalReach.toLocaleString()}
          change="+12.5%"
          icon={<Eye className="h-4 w-4 text-primary" />}
          trend="up"
        />
        <SocialMediaKPICard
          title="Engagement Rate"
          value={`${engagementRate}%`}
          change="+0.8%"
          icon={<Heart className="h-4 w-4 text-primary" />}
          trend="up"
        />
        <SocialMediaKPICard
          title="Click-Through Rate"
          value={`${ctr}%`}
          change="+0.3%"
          icon={<MousePointer className="h-4 w-4 text-primary" />}
          trend="up"
        />
        <SocialMediaKPICard
          title="Bookings from Social"
          value={totalConversions.toString()}
          change="+18.3%"
          icon={<DollarSign className="h-4 w-4 text-primary" />}
          trend="up"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platform Performance</TabsTrigger>
          <TabsTrigger value="content">Top Content</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Platform Performance Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
              <CardDescription>
                Compare performance across all connected social media platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPlatformData.map((platform, index) => {
                  const PlatformIcon = PLATFORMS[platform.platform as keyof typeof PLATFORMS]?.icon || BarChart3;
                  const platformColor = PLATFORMS[platform.platform as keyof typeof PLATFORMS]?.color || 'text-gray-600';
                  
                  return (
                    <motion.div
                      key={platform.platform}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <PlatformIcon className={`h-5 w-5 ${platformColor}`} />
                        <div>
                          <h4 className="font-medium">{platform.platform}</h4>
                          <p className="text-sm text-muted-foreground">{platform.posts} posts</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-8 text-center">
                        <div>
                          <p className="text-sm font-medium">{platform.reach.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Reach</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{platform.engagement.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Engagement</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{platform.clicks}</p>
                          <p className="text-xs text-muted-foreground">Clicks</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-600">{platform.roi}</p>
                          <p className="text-xs text-muted-foreground">ROI</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>
                Your most successful posts across all platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTopPosts.map((post, index) => {
                  const PlatformIcon = PLATFORMS[post.platform as keyof typeof PLATFORMS]?.icon || BarChart3;
                  const platformColor = PLATFORMS[post.platform as keyof typeof PLATFORMS]?.color || 'text-gray-600';
                  
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <PlatformIcon className={`h-4 w-4 ${platformColor}`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{post.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            Published {new Date(post.publishedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{post.reach.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Reach</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{post.engagement.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Engagement</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{post.clicks}</p>
                          <p className="text-xs text-muted-foreground">Clicks</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI Insights
                </CardTitle>
                <CardDescription>
                  AI-powered recommendations for your content strategy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">🎯 Content Performance</h4>
                  <p className="text-sm text-blue-800">
                    Food posts get 2.3x more engagement than room photos. Consider showcasing your restaurant more often.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">⏰ Optimal Timing</h4>
                  <p className="text-sm text-green-800">
                    Your audience is most active on weekends at 6-8 PM. Schedule luxury content during these times.
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">💰 Revenue Impact</h4>
                  <p className="text-sm text-purple-800">
                    Stories with direct booking links convert 40% better than regular posts. Add more CTAs.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Recommendations</CardTitle>
                <CardDescription>
                  Suggested content types for next week
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    <div>
                      <p className="font-medium text-sm">Behind-the-scenes Reel</p>
                      <p className="text-xs text-muted-foreground">Kitchen preparation</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">High Impact</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">Guest Testimonial</p>
                      <p className="text-xs text-muted-foreground">5-star review showcase</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Medium Impact</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-blue-700" />
                    <div>
                      <p className="font-medium text-sm">Business Amenities</p>
                      <p className="text-xs text-muted-foreground">Meeting room features</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">Medium Impact</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};