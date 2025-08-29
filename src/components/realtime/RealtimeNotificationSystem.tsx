import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRealtime } from '@/hooks/use-realtime';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  source: 'reservation' | 'payment' | 'maintenance' | 'system';
}

export const RealtimeNotificationSystem = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected, onlineUsers, sendNotification } = useRealtime();
  const { toast } = useToast();

  // Mock real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 10 seconds
        const notificationTypes = ['success', 'warning', 'info', 'error'] as const;
        const sources = ['reservation', 'payment', 'maintenance', 'system'] as const;
        const priorities = ['low', 'medium', 'high'] as const;
        
        const mockNotifications = [
          { title: 'New Reservation', message: 'Booking received from Booking.com', type: 'success' as const, source: 'reservation' as const },
          { title: 'Payment Processed', message: 'Payment of €250 confirmed', type: 'success' as const, source: 'payment' as const },
          { title: 'Maintenance Alert', message: 'Room 205 AC needs attention', type: 'warning' as const, source: 'maintenance' as const },
          { title: 'System Update', message: 'System backup completed', type: 'info' as const, source: 'system' as const },
          { title: 'Check-in Complete', message: 'Guest Smith checked into Room 301', type: 'success' as const, source: 'reservation' as const }
        ];

        const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
        
        const newNotification: Notification = {
          id: `notif-${Date.now()}`,
          title: randomNotification.title,
          message: randomNotification.message,
          type: randomNotification.type,
          timestamp: new Date(),
          read: false,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          source: randomNotification.source
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50

        // Show toast for high priority notifications
        if (newNotification.priority === 'high') {
          toast({
            title: newNotification.title,
            description: newNotification.message,
            variant: newNotification.type === 'error' ? 'destructive' : 'default'
          });
        }

        // Send real-time notification to other users
        sendNotification({
          type: 'system',
          title: newNotification.title,
          message: newNotification.message,
          read: false
        });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [sendNotification, toast]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'info': 
      default: return <Info className="h-4 w-4 text-info" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-destructive bg-destructive/5';
      case 'medium': return 'border-l-warning bg-warning/5';
      case 'low': 
      default: return 'border-l-info bg-info/5';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-12 w-96 z-50"
          >
            <Card className="border shadow-lg">
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      <h3 className="font-semibold">Notifications</h3>
                      <Badge variant="secondary">{notifications.length}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'}`} />
                      <span className="text-xs text-muted-foreground">
                        {onlineUsers.length} online
                      </span>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="mt-2"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark all as read
                    </Button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`p-4 border-l-2 hover:bg-muted/50 cursor-pointer transition-colors ${
                            getPriorityColor(notification.priority)
                          } ${!notification.read ? 'bg-primary/5' : ''}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            {getIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium truncate">
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <div className="h-2 w-2 bg-primary rounded-full" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {notification.source}
                                </Badge>
                                <Badge variant={notification.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                                  {notification.priority}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(notification.timestamp, 'HH:mm')}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};