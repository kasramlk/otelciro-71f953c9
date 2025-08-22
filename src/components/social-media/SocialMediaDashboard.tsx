import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useSocialMediaStore } from '@/stores/social-media-store';
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
  ArrowUpRight,
  Link as LinkIcon,
  RefreshCw,
  Linkedin
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
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'archived';
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
          {platform === 'linkedin' && <Linkedin className="h-4 w-4 text-blue-700" />}
          <span className="text-sm font-medium capitalize">{platform}</span>
        </div>
        <Badge variant={status === 'published' ? 'default' : status === 'scheduled' ? 'secondary' : 'outline'}>
          {status}
        </Badge>
      </div>
      <h4 className="font-medium text-sm mb-2 line-clamp-2">{title}</h4>
      {status === 'scheduled' && scheduledFor && (
        <p className="text-xs text-muted-foreground">Scheduled for {new Date(scheduledFor).toLocaleDateString()}</p>
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
  const { user } = useAuth();
  const { 
    accounts, 
    content, 
    currentBrandKit, 
    loading, 
    error,
    fetchAccounts,
    fetchContent,
    fetchBrandKits,
    seedDemoData,
    resetDemoData
  } = useSocialMediaStore();

  const hotelId = user?.id || 'demo-hotel-id';

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      if (content.length === 0 && accounts.length === 0) {
        // Seed demo data if no data exists
        await seedDemoData(hotelId);
      } else {
        // Fetch real data if available
        await Promise.all([
          fetchAccounts(hotelId),
          fetchContent(hotelId),
          fetchBrandKits(hotelId)
        ]);
      }
    };

    initializeData();
  }, [hotelId, content.length, accounts.length]);

  const quickActions = [
    { title: 'AI Post Generator', icon: <Zap className="h-4 w-4" />, href: '/social-media/generator', color: 'bg-gradient-primary' },
    { title: 'Content Calendar', icon: <Calendar className="h-4 w-4" />, href: '/social-media/calendar', color: 'bg-secondary' },
    { title: 'Schedule Post', icon: <Plus className="h-4 w-4" />, href: '/social-media/calendar', color: 'bg-accent' }
  ];

  // Get stats from actual data
  const stats = {
    totalPosts: content.length,
    scheduledPosts: content.filter(c => c.status === 'scheduled').length,
    draftPosts: content.filter(c => c.status === 'draft').length,
    publishedPosts: content.filter(c => c.status === 'published').length,
    connectedAccounts: accounts.filter(a => a.is_connected).length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Media Content Studio</h1>
          <p className="text-muted-foreground">
            Create, schedule, and analyze AI-powered social media content for your hotel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => resetDemoData(hotelId)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Reset Demo Data
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={action.href}>
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
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Analytics & Advanced Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics Overview
            </CardTitle>
            <CardDescription>Performance insights and metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Track your social media performance with detailed analytics and AI-powered insights
            </p>
            <Button variant="outline" asChild>
              <Link to="/social-media/analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Advanced Features
            </CardTitle>
            <CardDescription>AI automation and competitor analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Access advanced analytics, automation rules, and competitor insights
            </p>
          <Button variant="outline" asChild>
            <Link to="/social-media/advanced">
              <TrendingUp className="h-4 w-4 mr-2" />
              Advanced Tools
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/social-media/integrations">
              <LinkIcon className="h-4 w-4 mr-2" />
              Integrations
            </Link>
          </Button>
          </CardContent>
        </Card>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Scheduled Posts"
          value={stats.scheduledPosts.toString()}
          change="+12.5%"
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          trend="up"
        />
        <KPICard
          title="Published This Week"
          value={stats.publishedPosts.toString()}
          change="+8.3%"
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
          title="CTR"
          value="2.1%"
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
            {content.slice(0, 8).map((item) => (
              <ContentPreview 
                key={item.id} 
                platform={item.platform}
                title={item.title || item.caption}
                status={item.status}
                scheduledFor={item.scheduled_for}
              />
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
            {content.filter(c => c.status === 'scheduled').map((item) => (
              <ContentPreview 
                key={item.id} 
                platform={item.platform}
                title={item.title || item.caption}
                status={item.status}
                scheduledFor={item.scheduled_for}
              />
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
            {content.filter(c => c.status === 'draft').map((item) => (
              <ContentPreview 
                key={item.id} 
                platform={item.platform}
                title={item.title || item.caption}
                status={item.status}
                scheduledFor={item.scheduled_for}
              />
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
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {account.platform === 'instagram' && <Instagram className="h-5 w-5 text-pink-600" />}
                  {account.platform === 'facebook' && <Facebook className="h-5 w-5 text-blue-600" />}
                  {account.platform === 'twitter' && <Twitter className="h-5 w-5 text-blue-400" />}
                  {account.platform === 'linkedin' && <Linkedin className="h-5 w-5 text-blue-700" />}
                  <div>
                    <p className="font-medium capitalize">{account.platform}</p>
                    <p className="text-sm text-muted-foreground">{account.account_name}</p>
                  </div>
                </div>
                <Badge variant={account.is_connected ? "secondary" : "outline"}>
                  {account.is_connected ? "Connected" : "Not Connected"}
                </Badge>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                No social media accounts configured yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};