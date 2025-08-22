import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Share2, 
  Zap, 
  Calendar, 
  BarChart3, 
  Plus, 
  Instagram, 
  Facebook, 
  Twitter,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SocialMediaKPICard } from './SocialMediaKPICard';
import { PMSContentSuggestions } from './PMSContentSuggestions';

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon, trend }) => (
  <Card className="relative overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className={`flex items-center text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        <ArrowUpRight className={`h-3 w-3 mr-1 ${trend === 'down' ? 'rotate-90' : ''}`} />
        {change}
      </div>
    </CardContent>
  </Card>
);

interface ContentPreviewProps {
  platform: string;
  title: string;
  status: 'draft' | 'scheduled' | 'published';
  engagement?: number;
  scheduledFor?: string;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({ 
  platform, 
  title, 
  status, 
  engagement, 
  scheduledFor 
}) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {platform === 'instagram' && <Instagram className="h-4 w-4 text-pink-600" />}
          {platform === 'facebook' && <Facebook className="h-4 w-4 text-blue-600" />}
          {platform === 'twitter' && <Twitter className="h-4 w-4 text-blue-400" />}
          <span className="text-sm font-medium capitalize">{platform}</span>
        </div>
        <Badge variant={status === 'published' ? 'default' : status === 'scheduled' ? 'secondary' : 'outline'}>
          {status}
        </Badge>
      </div>
      <h4 className="font-medium text-sm mb-2 line-clamp-2">{title}</h4>
      {status === 'scheduled' && scheduledFor && (
        <p className="text-xs text-muted-foreground">Scheduled for {scheduledFor}</p>
      )}
      {status === 'published' && engagement && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {engagement}
          </span>
        </div>
      )}
    </CardContent>
  </Card>
);

export const SocialMediaDashboard: React.FC = () => {
  const quickActions = [
    { title: 'AI Post Generator', icon: <Zap className="h-4 w-4" />, href: '/social-media/generator', color: 'bg-gradient-primary' },
    { title: 'Upload Content', icon: <Plus className="h-4 w-4" />, href: '/social-media/upload', color: 'bg-secondary' },
    { title: 'Schedule Post', icon: <Calendar className="h-4 w-4" />, href: '/social-media/calendar', color: 'bg-accent' }
  ];

  const recentContent = [
    { platform: 'instagram', title: 'Stunning sunset from our rooftop terrace 🌅', status: 'published' as const, engagement: 1240 },
    { platform: 'facebook', title: 'Special weekend offer - 20% off luxury suites', status: 'scheduled' as const, scheduledFor: 'Today 6:00 PM' },
    { platform: 'twitter', title: 'Welcome our new guests from Germany! 🇩🇪', status: 'draft' as const },
    { platform: 'instagram', title: 'Behind the scenes: Our chef preparing tonight\'s special', status: 'scheduled' as const, scheduledFor: 'Tomorrow 2:00 PM' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Social Media Content Studio</h1>
        <p className="text-muted-foreground">
          Create, schedule, and analyze AI-powered social media content for your hotel
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="cursor-pointer hover:shadow-lg transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${action.color} text-white group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">Click to get started</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Reach"
          value="12.4K"
          change="+12.5%"
          icon={<Eye className="h-4 w-4 text-muted-foreground" />}
          trend="up"
        />
        <KPICard
          title="Engagement Rate"
          value="4.8%"
          change="+0.8%"
          icon={<Heart className="h-4 w-4 text-muted-foreground" />}
          trend="up"
        />
        <KPICard
          title="New Followers"
          value="186"
          change="+24.2%"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend="up"
        />
        <KPICard
          title="Bookings from Social"
          value="28"
          change="+18.3%"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          trend="up"
        />
      </div>

      {/* PMS Content Suggestions */}
      <PMSContentSuggestions />

      {/* Content Overview */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Content</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Recent Posts</h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentContent.map((content, index) => (
              <ContentPreview key={index} {...content} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="scheduled" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Scheduled Content</h3>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentContent.filter(c => c.status === 'scheduled').map((content, index) => (
              <ContentPreview key={index} {...content} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="drafts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Draft Content</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Draft
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentContent.filter(c => c.status === 'draft').map((content, index) => (
              <ContentPreview key={index} {...content} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Social Accounts</CardTitle>
          <CardDescription>
            Manage your connected social media platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Instagram className="h-5 w-5 text-pink-600" />
                <div>
                  <p className="font-medium">Instagram</p>
                  <p className="text-sm text-muted-foreground">@yourhotel</p>
                </div>
              </div>
              <Badge variant="secondary">Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Facebook className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Facebook</p>
                  <p className="text-sm text-muted-foreground">Your Hotel Page</p>
                </div>
              </div>
              <Badge variant="secondary">Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Twitter className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="font-medium">Twitter</p>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};