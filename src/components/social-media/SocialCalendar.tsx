import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Clock,
  Users,
  TrendingUp,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from 'date-fns';

interface ScheduledPost {
  id: string;
  title: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin';
  scheduledFor: Date;
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
  thumbnail?: string;
  contentType: 'post' | 'story' | 'reel' | 'carousel';
}

interface OptimalTime {
  platform: string;
  time: string;
  engagement: number;
  audience: number;
}

const mockScheduledPosts: ScheduledPost[] = [
  {
    id: '1',
    title: 'Sunset from our rooftop terrace 🌅',
    platform: 'instagram',
    scheduledFor: new Date(2024, 0, 22, 18, 0),
    status: 'scheduled',
    contentType: 'post'
  },
  {
    id: '2',
    title: 'Special weekend offer - 20% off luxury suites',
    platform: 'facebook',
    scheduledFor: new Date(2024, 0, 22, 14, 30),
    status: 'scheduled',
    contentType: 'post'
  },
  {
    id: '3',
    title: 'Welcome our new guests from Germany! 🇩🇪',
    platform: 'twitter',
    scheduledFor: new Date(2024, 0, 23, 10, 15),
    status: 'scheduled',
    contentType: 'post'
  },
  {
    id: '4',
    title: 'Behind the scenes: Chef preparing tonight\'s special',
    platform: 'instagram',
    scheduledFor: new Date(2024, 0, 24, 16, 0),
    status: 'scheduled',
    contentType: 'reel'
  },
  {
    id: '5',
    title: 'Business travelers love our executive lounge',
    platform: 'linkedin',
    scheduledFor: new Date(2024, 0, 25, 9, 0),
    status: 'scheduled',
    contentType: 'post'
  }
];

const mockOptimalTimes: OptimalTime[] = [
  { platform: 'Instagram', time: '6:00 PM', engagement: 92, audience: 1240 },
  { platform: 'Facebook', time: '2:30 PM', engagement: 87, audience: 980 },
  { platform: 'Twitter', time: '10:15 AM', engagement: 78, audience: 650 },
  { platform: 'LinkedIn', time: '9:00 AM', engagement: 85, audience: 420 }
];

const PLATFORMS = {
  instagram: { icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
  facebook: { icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
  twitter: { icon: Twitter, color: 'text-blue-400', bg: 'bg-sky-50' },
  linkedin: { icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50' }
};

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-800'
};

export const SocialCalendar: React.FC = () => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(mockScheduledPosts);
  const [draggedPost, setDraggedPost] = useState<ScheduledPost | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter(post => 
      isSameDay(post.scheduledFor, date)
    );
  };

  const handleDragStart = (post: ScheduledPost) => {
    setDraggedPost(post);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (!draggedPost) return;

    const newTime = new Date(date);
    newTime.setHours(draggedPost.scheduledFor.getHours());
    newTime.setMinutes(draggedPost.scheduledFor.getMinutes());

    setScheduledPosts(prev => 
      prev.map(post => 
        post.id === draggedPost.id 
          ? { ...post, scheduledFor: newTime }
          : post
      )
    );

    toast({
      title: "Post Rescheduled",
      description: `Moved to ${format(newTime, 'MMMM d, yyyy')}`,
    });

    setDraggedPost(null);
  };

  const handlePostAction = (action: string, post: ScheduledPost) => {
    switch (action) {
      case 'edit':
        toast({
          title: "Edit Post",
          description: "Opening post editor...",
        });
        break;
      case 'duplicate':
        const duplicatedPost = {
          ...post,
          id: `${post.id}-copy`,
          title: `${post.title} (Copy)`,
          scheduledFor: new Date(post.scheduledFor.getTime() + 24 * 60 * 60 * 1000)
        };
        setScheduledPosts(prev => [...prev, duplicatedPost]);
        toast({
          title: "Post Duplicated",
          description: "Post copied for tomorrow",
        });
        break;
      case 'delete':
        setScheduledPosts(prev => prev.filter(p => p.id !== post.id));
        toast({
          title: "Post Deleted",
          description: "Scheduled post has been removed",
        });
        break;
      case 'publish':
        setScheduledPosts(prev => 
          prev.map(p => 
            p.id === post.id 
              ? { ...p, status: 'published' as const }
              : p
          )
        );
        toast({
          title: "Post Published",
          description: "Content has been published to social media",
        });
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Media Calendar</h1>
          <p className="text-muted-foreground">
            Schedule and manage your social media content across all platforms
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Post
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {format(currentDate, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 min-h-[600px]">
                {calendarDays.map((date, index) => {
                  const postsForDate = getPostsForDate(date);
                  const isCurrentMonth = isSameMonth(date, currentDate);
                  const isToday = isSameDay(date, new Date());
                  const isSelected = selectedDate && isSameDay(date, selectedDate);

                  return (
                    <div
                      key={index}
                      className={`
                        border-r border-b last:border-r-0 p-2 min-h-[120px] cursor-pointer transition-colors
                        ${!isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : ''}
                        ${isToday ? 'bg-primary/5' : ''}
                        ${isSelected ? 'bg-primary/10' : ''}
                        hover:bg-muted/50
                      `}
                      onClick={() => setSelectedDate(date)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, date)}
                    >
                      <div className={`text-sm font-medium mb-2 ${isToday ? 'text-primary' : ''}`}>
                        {format(date, 'd')}
                      </div>
                      
                      <div className="space-y-1">
                        <AnimatePresence>
                          {postsForDate.slice(0, 3).map((post, postIndex) => {
                            const platform = PLATFORMS[post.platform];
                            return (
                              <motion.div
                                key={post.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: postIndex * 0.05 }}
                                draggable
                                onDragStart={() => handleDragStart(post)}
                                className={`
                                  ${platform.bg} border border-gray-200 rounded p-1 cursor-move
                                  hover:shadow-sm transition-shadow text-xs
                                `}
                              >
                                <div className="flex items-center gap-1">
                                  <platform.icon className={`h-3 w-3 ${platform.color}`} />
                                  <span className="truncate flex-1 text-gray-700">
                                    {post.title.slice(0, 20)}...
                                  </span>
                                  <Badge className={`text-xs ${STATUS_COLORS[post.status]} scale-75`}>
                                    {post.status}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {format(post.scheduledFor, 'HH:mm')}
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                        
                        {postsForDate.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center py-1">
                            +{postsForDate.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Optimal Posting Times */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-4 w-4" />
                Optimal Times
              </CardTitle>
              <CardDescription>
                AI-recommended posting times based on your audience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockOptimalTimes.map((time, index) => (
                <motion.div
                  key={time.platform}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div>
                      <div className="font-medium text-sm">{time.platform}</div>
                      <div className="text-xs text-muted-foreground">{time.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{time.engagement}%</div>
                    <div className="text-xs text-muted-foreground">{time.audience} users</div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </CardTitle>
                <CardDescription>
                  {getPostsForDate(selectedDate).length} posts scheduled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {getPostsForDate(selectedDate).map((post, index) => {
                  const platform = PLATFORMS[post.platform];
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <platform.icon className={`h-4 w-4 ${platform.color}`} />
                          <Badge className={STATUS_COLORS[post.status]}>
                            {post.status}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePostAction('edit', post)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePostAction('duplicate', post)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePostAction('publish', post)}>
                              <Send className="h-4 w-4 mr-2" />
                              Publish Now
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handlePostAction('delete', post)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm">{post.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {format(post.scheduledFor, 'h:mm a')}
                          <Badge variant="outline" className="scale-75">
                            {post.contentType}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                {getPostsForDate(selectedDate).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No posts scheduled for this date</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Post
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};