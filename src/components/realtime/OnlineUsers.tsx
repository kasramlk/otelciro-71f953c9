// Online Users Presence Component
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Circle, 
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { useRealtime, UserPresence } from '@/hooks/use-realtime';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

const StatusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500'
};

const StatusLabels = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy'
};

const getPageName = (path: string) => {
  const pathMap: Record<string, string> = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/reservations': 'Reservations',
    '/guests': 'Guests',
    '/room-plan': 'Room Plan',
    '/housekeeping': 'Housekeeping',
    '/front-office': 'Front Office',
    '/analytics': 'Analytics',
    '/reports': 'Reports',
    '/settings': 'Settings',
    '/profile': 'Profile'
  };
  
  return pathMap[path] || path.replace('/', '').replace('-', ' ').replace(/^\w/, c => c.toUpperCase());
};

interface UserPresenceItemProps {
  user: UserPresence;
  isCompact?: boolean;
}

function UserPresenceItem({ user, isCompact = false }: UserPresenceItemProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isCompact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url || ''} />
              <AvatarFallback className="text-xs">
                {getInitials(user.display_name)}
              </AvatarFallback>
            </Avatar>
            <div 
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-background ${StatusColors[user.status]}`}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{user.display_name}</p>
            <p className="text-muted-foreground">
              {StatusLabels[user.status]} • {getPageName(user.current_page || '/')}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors"
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar_url || ''} />
          <AvatarFallback>
            {getInitials(user.display_name)}
          </AvatarFallback>
        </Avatar>
        <div 
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-background ${StatusColors[user.status]}`}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium truncate">{user.display_name}</p>
          <Badge variant="secondary" className="text-xs">
            {StatusLabels[user.status]}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
          <MapPin className="h-3 w-3" />
          <span>{getPageName(user.current_page || '/')}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Active {formatDistanceToNow(new Date(user.last_seen), { addSuffix: true })}</span>
        </div>
      </div>
    </motion.div>
  );
}

interface OnlineUsersProps {
  compact?: boolean;
  maxVisible?: number;
}

export function OnlineUsers({ compact = false, maxVisible = 5 }: OnlineUsersProps) {
  const { onlineUsers, isConnected } = useRealtime();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const sortedUsers = onlineUsers.sort((a, b) => {
    // Sort by status priority, then by last seen
    const statusPriority = { online: 0, busy: 1, away: 2 };
    const aPriority = statusPriority[a.status];
    const bPriority = statusPriority[b.status];
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime();
  });

  const visibleUsers = isExpanded ? sortedUsers : sortedUsers.slice(0, maxVisible);
  const hiddenCount = sortedUsers.length - maxVisible;

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex -space-x-2">
          {visibleUsers.map((user) => (
            <UserPresenceItem key={user.user_id} user={user} isCompact />
          ))}
        </div>
        
        {hiddenCount > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-xs">
                +{hiddenCount}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-2">
                <h4 className="font-medium">All Online Users ({onlineUsers.length})</h4>
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {sortedUsers.map((user) => (
                      <UserPresenceItem key={user.user_id} user={user} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <CardTitle className="text-lg">Online Users</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {onlineUsers.length}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Circle 
                className={`h-2 w-2 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`}
              />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
        
        <CardDescription>
          Team members currently active in the system
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-1">
        <AnimatePresence>
          {visibleUsers.map((user) => (
            <UserPresenceItem key={user.user_id} user={user} />
          ))}
        </AnimatePresence>
        
        {hiddenCount > 0 && (
          <>
            <Separator />
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full justify-between"
            >
              <span>
                {isExpanded ? 'Show less' : `Show ${hiddenCount} more`}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </>
        )}
        
        {onlineUsers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No users online</p>
            <p className="text-sm">Check back later</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}