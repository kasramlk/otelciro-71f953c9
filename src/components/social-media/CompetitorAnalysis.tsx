import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageCircle, 
  Heart, 
  Share,
  Plus,
  RefreshCw,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Competitor {
  id: string;
  name: string;
  handle: string;
  platform: string;
  avatar: string;
  followers: number;
  followersGrowth: number;
  engagement: number;
  engagementGrowth: number;
  postsPerWeek: number;
  averageLikes: number;
  averageComments: number;
  topHashtags: string[];
  contentTypes: {
    photos: number;
    videos: number;
    stories: number;
    reels: number;
  };
  postingTimes: {
    time: string;
    frequency: number;
  }[];
  isTracking: boolean;
}

const mockCompetitors: Competitor[] = [
  {
    id: '1',
    name: 'Luxury Resort Co',
    handle: '@luxuryresortco',
    platform: 'instagram',
    avatar: '/api/placeholder/40/40',
    followers: 125000,
    followersGrowth: 8.2,
    engagement: 4.8,
    engagementGrowth: -2.1,
    postsPerWeek: 14,
    averageLikes: 3200,
    averageComments: 180,
    topHashtags: ['#luxury', '#resort', '#vacation', '#travel', '#spa'],
    contentTypes: {
      photos: 45,
      videos: 25,
      stories: 20,
      reels: 10
    },
    postingTimes: [
      { time: '6AM', frequency: 5 },
      { time: '12PM', frequency: 15 },
      { time: '6PM', frequency: 30 },
      { time: '9PM', frequency: 25 }
    ],
    isTracking: true
  },
  {
    id: '2',
    name: 'Grand Hotel Chain',
    handle: '@grandhotelchain',
    platform: 'instagram',
    avatar: '/api/placeholder/40/40',
    followers: 89000,
    followersGrowth: 12.5,
    engagement: 6.2,
    engagementGrowth: 5.8,
    postsPerWeek: 10,
    averageLikes: 2800,
    averageComments: 220,
    topHashtags: ['#grandhotel', '#hospitality', '#luxury', '#dining', '#service'],
    contentTypes: {
      photos: 35,
      videos: 30,
      stories: 25,
      reels: 10
    },
    postingTimes: [
      { time: '8AM', frequency: 10 },
      { time: '2PM', frequency: 20 },
      { time: '7PM', frequency: 35 },
      { time: '10PM', frequency: 15 }
    ],
    isTracking: true
  },
  {
    id: '3',
    name: 'Boutique Stays',
    handle: '@boutiquestays',
    platform: 'instagram',
    avatar: '/api/placeholder/40/40',
    followers: 45000,
    followersGrowth: 15.3,
    engagement: 7.8,
    engagementGrowth: 12.4,
    postsPerWeek: 8,
    averageLikes: 1500,
    averageComments: 95,
    topHashtags: ['#boutique', '#unique', '#design', '#experience', '#local'],
    contentTypes: {
      photos: 50,
      videos: 20,
      stories: 15,
      reels: 15
    },
    postingTimes: [
      { time: '7AM', frequency: 8 },
      { time: '1PM', frequency: 12 },
      { time: '5PM', frequency: 25 },
      { time: '8PM', frequency: 20 }
    ],
    isTracking: false
  }
];

const competitorTrends = [
  { month: 'Jan', us: 4.2, competitor1: 4.8, competitor2: 6.2, competitor3: 7.8 },
  { month: 'Feb', us: 4.5, competitor1: 4.6, competitor2: 6.5, competitor3: 8.1 },
  { month: 'Mar', us: 4.8, competitor1: 4.7, competitor2: 6.8, competitor3: 8.3 },
  { month: 'Apr', us: 5.1, competitor1: 4.9, competitor2: 7.1, competitor3: 8.0 },
  { month: 'May', us: 5.3, competitor1: 4.8, competitor2: 7.3, competitor3: 7.9 },
  { month: 'Jun', us: 5.6, competitor1: 4.8, competitor2: 7.2, competitor3: 7.8 }
];

export const CompetitorAnalysis: React.FC = () => {
  const { toast } = useToast();
  const [competitors, setCompetitors] = useState<Competitor[]>(mockCompetitors);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleAddCompetitor = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    // Simulate API search
    setTimeout(() => {
      toast({
        title: "Competitor Added",
        description: `Started tracking ${searchQuery}`,
      });
      setSearchQuery('');
      setIsSearching(false);
    }, 2000);
  };

  const handleToggleTracking = (id: string) => {
    setCompetitors(prev => prev.map(comp => 
      comp.id === id ? { ...comp, isTracking: !comp.isTracking } : comp
    ));
    
    const competitor = competitors.find(c => c.id === id);
    toast({
      title: `Tracking ${competitor?.isTracking ? 'Disabled' : 'Enabled'}`,
      description: `${competitor?.name} tracking has been ${competitor?.isTracking ? 'disabled' : 'enabled'}`,
    });
  };

  const radarData = [
    { subject: 'Engagement', us: 85, competitor1: 75, competitor2: 95, competitor3: 92 },
    { subject: 'Followers', us: 70, competitor1: 85, competitor2: 65, competitor3: 45 },
    { subject: 'Content Quality', us: 90, competitor1: 80, competitor2: 88, competitor3: 95 },
    { subject: 'Posting Frequency', us: 75, competitor1: 90, competitor2: 70, competitor3: 60 },
    { subject: 'Hashtag Usage', us: 80, competitor1: 70, competitor2: 85, competitor3: 88 },
    { subject: 'Story Usage', us: 65, competitor1: 60, competitor2: 75, competitor3: 45 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competitor Analysis</h1>
          <p className="text-muted-foreground">
            Monitor and analyze your competitors' social media performance
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            <Input
              placeholder="Add competitor (@handle)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Button 
              onClick={handleAddCompetitor}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tracked Competitors</p>
                <p className="text-2xl font-bold">{competitors.filter(c => c.isTracking).length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Rank</p>
                <p className="text-2xl font-bold">#2</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Market Share</p>
                <p className="text-2xl font-bold">23%</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Opportunities</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Rate Trends</CardTitle>
            <CardDescription>Monthly engagement comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={competitorTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="us" stroke="#8884d8" strokeWidth={3} name="Your Hotel" />
                <Line type="monotone" dataKey="competitor1" stroke="#82ca9d" strokeWidth={2} name="Luxury Resort Co" />
                <Line type="monotone" dataKey="competitor2" stroke="#ffc658" strokeWidth={2} name="Grand Hotel Chain" />
                <Line type="monotone" dataKey="competitor3" stroke="#ff7300" strokeWidth={2} name="Boutique Stays" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competitive Radar</CardTitle>
            <CardDescription>Multi-dimensional performance comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis />
                <Radar name="Your Hotel" dataKey="us" stroke="#8884d8" fill="#8884d8" fillOpacity={0.1} />
                <Radar name="Best Competitor" dataKey="competitor3" stroke="#ff7300" fill="#ff7300" fillOpacity={0.1} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Competitor List */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Overview</CardTitle>
          <CardDescription>Detailed competitor metrics and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence>
              {competitors.map((competitor, index) => (
                <motion.div
                  key={competitor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border rounded-lg p-4 ${competitor.isTracking ? 'bg-blue-50/50 border-blue-200' : 'bg-gray-50/50'}`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    <div className="lg:col-span-3 flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={competitor.avatar} />
                        <AvatarFallback>{competitor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{competitor.name}</h4>
                        <p className="text-sm text-muted-foreground">{competitor.handle}</p>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="text-sm">
                        <span className="font-medium">{(competitor.followers / 1000).toFixed(0)}K</span>
                        <span className="text-muted-foreground"> followers</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {competitor.followersGrowth > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={competitor.followersGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                          {Math.abs(competitor.followersGrowth)}%
                        </span>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="text-sm">
                        <span className="font-medium">{competitor.engagement}%</span>
                        <span className="text-muted-foreground"> engagement</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {competitor.engagementGrowth > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={competitor.engagementGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                          {Math.abs(competitor.engagementGrowth)}%
                        </span>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="text-sm">
                        <span className="font-medium">{competitor.postsPerWeek}</span>
                        <span className="text-muted-foreground"> posts/week</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {competitor.averageLikes} avg likes
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="flex flex-wrap gap-1">
                        {competitor.topHashtags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-1 flex justify-end">
                      <Button
                        variant={competitor.isTracking ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleTracking(competitor.id)}
                      >
                        {competitor.isTracking ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Tracking
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Track
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};