import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  DollarSign,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Clock,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

interface PMSSuggestion {
  id: string;
  type: 'occupancy' | 'promotion' | 'event' | 'seasonal' | 'revenue';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  suggestedContent: string;
  platform: string[];
  dueDate?: string;
  metadata: {
    occupancyRate?: number;
    availableRooms?: number;
    eventDate?: string;
    promotionEnd?: string;
    revenueImpact?: string;
  };
}

const mockSuggestions: PMSSuggestion[] = [
  {
    id: '1',
    type: 'occupancy',
    title: 'Low Occupancy Alert',
    description: 'Occupancy dropped to 45% for this weekend. Promote last-minute deals.',
    priority: 'high',
    suggestedContent: 'Last-minute weekend getaway! 30% off all rooms this Friday-Sunday. Book now and escape to luxury! 🏨✨',
    platform: ['instagram', 'facebook'],
    dueDate: '2024-01-19T18:00:00Z',
    metadata: {
      occupancyRate: 45,
      availableRooms: 28
    }
  },
  {
    id: '2',
    type: 'event',
    title: 'Upcoming Conference',
    description: 'Tech conference starts Monday. Highlight business amenities.',
    priority: 'medium',
    suggestedContent: 'Ready for the TechInnovate Conference? Our business center, high-speed WiFi, and meeting rooms ensure you stay productive! 💼',
    platform: ['linkedin', 'twitter'],
    metadata: {
      eventDate: '2024-01-22T09:00:00Z'
    }
  },
  {
    id: '3',
    type: 'seasonal',
    title: 'Valentine\'s Day Approach',
    description: 'Valentine\'s Day is in 3 weeks. Create romantic package content.',
    priority: 'medium',
    suggestedContent: 'Love is in the air! 💕 Book our Valentine\'s Romance Package - champagne, roses, and breathtaking city views await.',
    platform: ['instagram', 'facebook'],
    metadata: {
      eventDate: '2024-02-14T00:00:00Z'
    }
  },
  {
    id: '4',
    type: 'revenue',
    title: 'High-Value Guest Segment',
    description: 'Spa services showing 25% revenue increase. Promote wellness packages.',
    priority: 'low',
    suggestedContent: 'Discover ultimate relaxation at our award-winning spa. Book a wellness package and rejuvenate your mind, body, and soul. 🧘‍♀️',
    platform: ['instagram'],
    metadata: {
      revenueImpact: '+25%'
    }
  },
  {
    id: '5',
    type: 'promotion',
    title: 'Flash Sale Ending Soon',
    description: 'Early bird summer rates end in 48 hours. Create urgency content.',
    priority: 'high',
    suggestedContent: 'Only 48 hours left! ⏰ Secure your summer vacation with our early bird rates. Don\'t miss out on 40% savings!',
    platform: ['twitter', 'facebook'],
    dueDate: '2024-01-21T23:59:00Z',
    metadata: {
      promotionEnd: '2024-01-21T23:59:00Z'
    }
  }
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'medium':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'low':
      return 'bg-green-50 text-green-700 border-green-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'occupancy':
      return Users;
    case 'promotion':
      return Target;
    case 'event':
      return Calendar;
    case 'seasonal':
      return Clock;
    case 'revenue':
      return DollarSign;
    default:
      return TrendingUp;
  }
};

const formatTimeRemaining = (dateString?: string) => {
  if (!dateString) return null;
  
  const targetDate = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours <= 0) return 'Expired';
  if (diffInHours <= 24) return `${diffInHours}h remaining`;
  
  const days = Math.ceil(diffInHours / 24);
  return `${days}d remaining`;
};

export const PMSContentSuggestions: React.FC = () => {
  const { toast } = useToast();
  const [suggestions] = useState<PMSSuggestion[]>(mockSuggestions);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleUseContent = async (suggestion: PMSSuggestion) => {
    setLoadingStates(prev => ({ ...prev, [suggestion.id]: true }));
    
    try {
      // Simulate AI content generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Content Generated!",
        description: `${suggestion.title} content has been created and saved to drafts`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate content",
        variant: "destructive"
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [suggestion.id]: false }));
    }
  };

  const handleDismiss = (suggestionId: string) => {
    // In a real app, this would update the backend
    toast({
      title: "Suggestion Dismissed",
      description: "We won't show this suggestion again",
    });
  };

  const prioritySuggestions = suggestions.filter(s => s.priority === 'high');
  const otherSuggestions = suggestions.filter(s => s.priority !== 'high');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">PMS-Driven Content Suggestions</h2>
        <p className="text-sm text-muted-foreground">
          AI-powered content ideas based on your hotel's real-time data
        </p>
      </div>

      {/* High Priority Suggestions */}
      {prioritySuggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <h3 className="font-medium text-red-600">Urgent Suggestions</h3>
          </div>
          
          {prioritySuggestions.map((suggestion, index) => {
            const TypeIcon = getTypeIcon(suggestion.type);
            const timeRemaining = formatTimeRemaining(suggestion.dueDate);
            const isLoading = loadingStates[suggestion.id];
            
            return (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-red-200 bg-red-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-red-600" />
                        <h4 className="font-medium text-red-900">{suggestion.title}</h4>
                        {timeRemaining && (
                          <Badge variant="outline" className="bg-white border-red-300 text-red-700">
                            {timeRemaining}
                          </Badge>
                        )}
                      </div>
                      <Badge className={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-red-800 mb-3">{suggestion.description}</p>
                    
                    <div className="bg-white border border-red-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700 italic">"{suggestion.suggestedContent}"</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {suggestion.platform.map(platform => (
                          <Badge key={platform} variant="secondary" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDismiss(suggestion.id)}
                        >
                          Dismiss
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleUseContent(suggestion)}
                          disabled={isLoading}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isLoading ? (
                            <>
                              <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 mr-1" />
                              Use Content
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Other Suggestions */}
      {otherSuggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-muted-foreground">Additional Suggestions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherSuggestions.map((suggestion, index) => {
              const TypeIcon = getTypeIcon(suggestion.type);
              const isLoading = loadingStates[suggestion.id];
              
              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-primary" />
                          <h4 className="font-medium">{suggestion.title}</h4>
                        </div>
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                      
                      <div className="bg-muted/50 rounded-lg p-2 mb-3">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          "{suggestion.suggestedContent}"
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {suggestion.platform.slice(0, 2).map(platform => (
                            <Badge key={platform} variant="outline" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                          {suggestion.platform.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{suggestion.platform.length - 2}
                            </span>
                          )}
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUseContent(suggestion)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Sparkles className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Use
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {suggestions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No Suggestions Available</h3>
            <p className="text-sm text-muted-foreground">
              We'll analyze your PMS data and provide content suggestions when opportunities arise.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
