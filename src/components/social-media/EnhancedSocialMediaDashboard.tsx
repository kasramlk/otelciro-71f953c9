import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Heart, 
  Share2, 
  Calendar,
  Zap,
  Target,
  BarChart3,
  Settings,
  Plus,
  Bell
} from 'lucide-react';
import { RealtimeNotificationSystem } from '@/components/realtime/RealtimeNotificationSystem';
import { OnlineUsers } from '@/components/realtime/OnlineUsers';
import { EnhancedExportSystem } from '@/components/export/EnhancedExportSystem';
import { SocialCalendar } from './SocialCalendar';
import { AIContentGenerator } from './AIContentGenerator';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { AutomationRules } from './AutomationRules';
import { BrandKit } from './BrandKit';
import { TeamCollaboration } from './TeamCollaboration';
import { ContentWorkflow } from './ContentWorkflow';
import { useToast } from '@/hooks/use-toast';

export const EnhancedSocialMediaDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAutomationActive, setIsAutomationActive] = useState(true);
  const { toast } = useToast();

  // Mock social media metrics
  const metrics = {
    followers: {
      total: 12845,
      growth: 8.2,
      platforms: {
        instagram: 5420,
        facebook: 4230,
        twitter: 2195,
        linkedin: 1000
      }
    },
    engagement: {
      rate: 4.7,
      likes: 1250,
      comments: 320,
      shares: 180,
      growth: 12.3
    },
    content: {
      scheduled: 24,
      published: 18,
      draft: 6,
      pending: 3
    },
    performance: {
      reach: 45620,
      impressions: 128340,
      clicks: 2340,
      ctr: 1.8
    }
  };

  const recentActivity = [
    {
      id: 1,
      type: 'post_published',
      content: 'New wellness package content went live on Instagram',
      platform: 'instagram',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      metrics: { likes: 45, comments: 12 }
    },
    {
      id: 2,
      type: 'comment_replied',
      content: 'Responded to guest inquiry about spa services',
      platform: 'facebook',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      metrics: null
    },
    {
      id: 3,
      type: 'content_scheduled',
      content: 'Weekend dining special scheduled for tomorrow',
      platform: 'multiple',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      metrics: null
    }
  ];

  const getPlatformIcon = (platform: string) => {
    const icons = {
      instagram: '📷',
      facebook: '👥',
      twitter: '🐦',
      linkedin: '💼',
      multiple: '🌐'
    };
    return icons[platform as keyof typeof icons] || '📱';
  };

  const handleAutomationToggle = () => {
    setIsAutomationActive(!isAutomationActive);
    toast({
      title: isAutomationActive ? 'Automation Paused' : 'Automation Activated',
      description: isAutomationActive 
        ? 'Content automation has been paused' 
        : 'Content automation is now active'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
                Social Media Command Center
              </h1>
              <p className="text-muted-foreground">
                AI-powered social media management with real-time collaboration
              </p>
            </motion.div>

            <div className="flex items-center gap-4 flex-wrap">
              <Badge 
                variant={isAutomationActive ? "default" : "secondary"}
                className="flex items-center gap-2 px-3 py-1"
              >
                <Zap className="h-4 w-4" />
                Automation {isAutomationActive ? 'Active' : 'Paused'}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {metrics.content.scheduled} Scheduled
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {metrics.content.pending} Pending Approval
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <OnlineUsers compact maxVisible={3} />
            <Button 
              onClick={handleAutomationToggle}
              variant={isAutomationActive ? "secondary" : "default"}
              size="sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isAutomationActive ? 'Pause' : 'Start'} Automation
            </Button>
            <RealtimeNotificationSystem />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Followers</p>
                    <p className="text-2xl font-bold">{metrics.followers.total.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-sm text-success">+{metrics.followers.growth}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Engagement Rate</p>
                    <p className="text-2xl font-bold">{metrics.engagement.rate}%</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-sm text-success">+{metrics.engagement.growth}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reach</p>
                    <p className="text-2xl font-bold">{metrics.performance.reach.toLocaleString()}</p>
                  </div>
                  <Target className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Click Rate</p>
                    <p className="text-2xl font-bold">{metrics.performance.ctr}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Export System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <EnhancedExportSystem
            dataType="social-media"
            title="Social Media Data"
            onExport={async (format) => {
              await new Promise(resolve => setTimeout(resolve, 1000));
              toast({ title: `Social media analytics exported as ${format.toUpperCase()}` });
            }}
          />
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="ai-generator">AI Content</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="brand">Brand Kit</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <span className="text-2xl">{getPlatformIcon(activity.platform)}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.content}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.timestamp.toLocaleTimeString()} • {activity.platform}
                            </p>
                            {activity.metrics && (
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {activity.metrics.likes}
                                </span>
                                <span className="text-xs flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {activity.metrics.comments}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Team Collaboration */}
                <TeamCollaboration />
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <SocialCalendar />
            </TabsContent>

            <TabsContent value="ai-generator" className="mt-6">
              <AIContentGenerator />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <AdvancedAnalytics />
            </TabsContent>

            <TabsContent value="automation" className="mt-6">
              <AutomationRules />
            </TabsContent>

            <TabsContent value="brand" className="mt-6">
              <BrandKit />
            </TabsContent>

            <TabsContent value="workflow" className="mt-6">
              <ContentWorkflow />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};