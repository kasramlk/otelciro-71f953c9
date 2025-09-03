import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Link as LinkIcon, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Plus,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Webhook,
  Database,
  Cloud,
  Zap,
  Key,
  Globe,
  Users,
  Calendar,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Integration {
  id: string;
  name: string;
  type: 'social' | 'api' | 'webhook' | 'pms';
  icon: React.ReactNode;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  features: string[];
  config?: Record<string, any>;
  lastSync?: string;
  permissions?: string[];
  isConnecting?: boolean;
  accountInfo?: {
    username?: string;
    followers?: number;
    posts?: number;
  };
}

const availableIntegrations: Integration[] = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    type: 'pms',
    icon: <Home className="h-5 w-5 text-red-500" />,
    description: 'Connect your Airbnb listings to sync rates, availability, and restrictions',
    status: 'disconnected',
    features: ['Rate Sync', 'Availability Sync', 'Booking Import', 'Restriction Sync', 'Analytics'],
    permissions: ['read:listings', 'read:reservations', 'write:availability', 'write:pricing']
  },
  {
    id: 'instagram',
    name: 'Instagram',
    type: 'social',
    icon: <Instagram className="h-5 w-5 text-pink-600" />,
    description: 'Connect your Instagram business account for posting and analytics',
    status: 'connected',
    features: ['Posts', 'Stories', 'Reels', 'Analytics', 'Comments'],
    lastSync: '2024-01-16T10:30:00Z',
    accountInfo: {
      username: '@yourhotel',
      followers: 12400,
      posts: 245
    },
    permissions: ['publish_content', 'read_insights', 'manage_comments']
  },
  {
    id: 'facebook',
    name: 'Facebook',
    type: 'social',
    icon: <Facebook className="h-5 w-5 text-blue-600" />,
    description: 'Manage your Facebook page posts and engagement',
    status: 'connected',
    features: ['Posts', 'Events', 'Reviews', 'Ads', 'Insights'],
    lastSync: '2024-01-16T10:25:00Z',
    accountInfo: {
      username: 'Your Hotel Page',
      followers: 8900,
      posts: 189
    },
    permissions: ['manage_pages', 'publish_pages', 'read_insights']
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    type: 'social',
    icon: <Twitter className="h-5 w-5 text-blue-400" />,
    description: 'Share updates and engage with your Twitter audience',
    status: 'disconnected',
    features: ['Tweets', 'Replies', 'DMs', 'Analytics', 'Threads'],
    permissions: ['tweet', 'read', 'write']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    type: 'social',
    icon: <Linkedin className="h-5 w-5 text-blue-700" />,
    description: 'Professional networking and B2B content sharing',
    status: 'disconnected',
    features: ['Posts', 'Articles', 'Company Updates', 'Analytics'],
    permissions: ['w_member_social', 'r_liteprofile']
  },
  {
    id: 'pms-sync',
    name: 'PMS Integration',
    type: 'pms',
    icon: <Database className="h-5 w-5 text-green-600" />,
    description: 'Sync occupancy, events, and booking data from your PMS',
    status: 'connected',
    features: ['Occupancy Data', 'Events Sync', 'Guest Data', 'Revenue Metrics'],
    lastSync: '2024-01-16T10:35:00Z'
  },
  {
    id: 'webhooks',
    name: 'Custom Webhooks',
    type: 'webhook',
    icon: <Webhook className="h-5 w-5 text-purple-600" />,
    description: 'Configure custom webhooks for external integrations',
    status: 'connected',
    features: ['Real-time Events', 'Custom Payloads', 'Retry Logic', 'Monitoring'],
    config: {
      endpoints: 3,
      totalCalls: 1247
    }
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    type: 'api',
    icon: <Globe className="h-5 w-5 text-orange-600" />,
    description: 'Track social media traffic and conversions',
    status: 'disconnected',
    features: ['Traffic Analysis', 'Conversion Tracking', 'Attribution', 'Reports']
  }
];

export const IntegrationHub: React.FC = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>(availableIntegrations);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const handleConnect = async (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, isConnecting: true, status: 'pending' }
        : integration
    ));

    // Simulate connection process
    setTimeout(() => {
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { 
              ...integration, 
              isConnecting: false, 
              status: 'connected',
              lastSync: new Date().toISOString()
            }
          : integration
      ));
      
      toast({
        title: "Integration Connected",
        description: `Successfully connected to ${integrations.find(i => i.id === integrationId)?.name}`,
      });
    }, 2000);
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, status: 'disconnected', lastSync: undefined }
        : integration
    ));
    
    toast({
      title: "Integration Disconnected",
      description: `Disconnected from ${integrations.find(i => i.id === integrationId)?.name}`,
      variant: "destructive"
    });
  };

  const handleSync = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;

    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, lastSync: new Date().toISOString() }
        : integration
    ));
    
    toast({
      title: "Sync Complete",
      description: `${integration.name} data has been synchronized`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const totalIntegrations = integrations.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integration Hub</h1>
          <p className="text-muted-foreground">
            Connect and manage all your social media platforms and external services
          </p>
        </div>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Integration
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold">{connectedCount}/{totalIntegrations}</p>
              </div>
              <LinkIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Progress value={(connectedCount / totalIntegrations) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reach</p>
                <p className="text-2xl font-bold">21.3K</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Across all platforms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Calls</p>
                <p className="text-2xl font-bold">1.2K</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Last 24 hours
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Sync</p>
                <p className="text-2xl font-bold">2m</p>
              </div>
              <RefreshCw className="h-8 w-8 text-orange-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              All systems up to date
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Categories */}
      <Tabs defaultValue="social" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="pms">PMS & Data</TabsTrigger>
          <TabsTrigger value="api">APIs & Services</TabsTrigger>
          <TabsTrigger value="webhook">Webhooks</TabsTrigger>
        </TabsList>
        
        
        <TabsContent value="social" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {integrations.filter(i => i.type === 'social').map((integration, index) => (
                <motion.div
                  key={integration.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-all">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {integration.icon}
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <Badge className={getStatusColor(integration.status)}>
                              {getStatusIcon(integration.status)}
                              <span className="ml-1 capitalize">{integration.status}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <CardDescription>{integration.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {integration.status === 'connected' && integration.accountInfo && (
                        <div className="bg-muted/50 rounded p-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Account:</span>
                            <span className="font-medium">{integration.accountInfo.username}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Followers:</span>
                            <span className="font-medium">{integration.accountInfo.followers?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Posts:</span>
                            <span className="font-medium">{integration.accountInfo.posts}</span>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">FEATURES</Label>
                        <div className="flex flex-wrap gap-1">
                          {integration.features.map(feature => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {integration.lastSync && (
                        <div className="text-xs text-muted-foreground">
                          Last synced: {new Date(integration.lastSync).toLocaleString()}
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        {integration.status === 'connected' ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSync(integration.id)}
                              className="flex-1"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Sync
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedIntegration(integration)}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDisconnect(integration.id)}
                            >
                              Disconnect
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => handleConnect(integration.id)}
                            disabled={integration.isConnecting}
                            className="w-full"
                          >
                            {integration.isConnecting ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <LinkIcon className="h-3 w-3 mr-2" />
                                Connect
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>
        
        <TabsContent value="pms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.filter(i => i.type === 'pms').map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {integration.icon}
                      <div>
                        <CardTitle>{integration.name}</CardTitle>
                        <Badge className={getStatusColor(integration.status)}>
                          {getStatusIcon(integration.status)}
                          <span className="ml-1 capitalize">{integration.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {integration.features.map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    
                    {integration.lastSync && (
                      <div className="text-xs text-muted-foreground">
                        Last synced: {new Date(integration.lastSync).toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="api" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.filter(i => i.type === 'api').map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {integration.icon}
                      <div>
                        <CardTitle>{integration.name}</CardTitle>
                        <Badge className={getStatusColor(integration.status)}>
                          {getStatusIcon(integration.status)}
                          <span className="ml-1 capitalize">{integration.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {integration.features.map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => handleConnect(integration.id)}
                      className="w-full"
                      variant="outline"
                    >
                      <LinkIcon className="h-3 w-3 mr-2" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="webhook" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.filter(i => i.type === 'webhook').map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {integration.icon}
                      <div>
                        <CardTitle>{integration.name}</CardTitle>
                        <Badge className={getStatusColor(integration.status)}>
                          {getStatusIcon(integration.status)}
                          <span className="ml-1 capitalize">{integration.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {integration.config && (
                      <div className="bg-muted/50 rounded p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Active Endpoints:</span>
                          <span className="font-medium">{integration.config.endpoints}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Calls:</span>
                          <span className="font-medium">{integration.config.totalCalls?.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      {integration.features.map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button variant="outline" className="w-full">
                      <Settings className="h-3 w-3 mr-2" />
                      Configure Webhooks
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};