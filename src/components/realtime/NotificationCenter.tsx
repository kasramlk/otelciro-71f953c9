// Real-time Notification Center Component
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellRing, 
  X, 
  Calendar, 
  CreditCard, 
  Wrench, 
  AlertTriangle,
  Check,
  Trash2,
  Settings
} from 'lucide-react';

import { useRealtime, NotificationData } from '@/hooks/use-realtime';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';

const NotificationIcons = {
  reservation: Calendar,
  payment: CreditCard,
  maintenance: Wrench,
  system: AlertTriangle
};

const NotificationColors = {
  reservation: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  payment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  system: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

interface NotificationItemProps {
  notification: NotificationData;
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const IconComponent = NotificationIcons[notification.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-4 border rounded-lg transition-all hover:shadow-md ${
        notification.read ? 'opacity-60' : 'bg-accent/10'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-full ${NotificationColors[notification.type]}`}>
          <IconComponent className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium truncate">{notification.title}</p>
            <div className="flex items-center space-x-1">
              {!notification.read && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="h-6 w-6 p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(notification.id)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, clearNotifications } = useRealtime();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    reservations: true,
    payments: true,
    maintenance: true,
    system: true,
    sound: true,
    desktop: true
  });

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show desktop notifications for new notifications
  useEffect(() => {
    if (!settings.desktop || Notification.permission !== 'granted') return;

    const latestNotification = notifications[0];
    if (latestNotification && !latestNotification.read) {
      new Notification(latestNotification.title, {
        body: latestNotification.message,
        icon: '/favicon.ico',
        tag: latestNotification.id
      });
    }
  }, [notifications, settings.desktop]);

  const handleMarkAllAsRead = () => {
    notifications.filter(n => !n.read).forEach(n => markAsRead(n.id));
  };

  const filteredNotifications = notifications.filter(n => 
    settings[n.type as keyof typeof settings]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {unreadCount > 0 && (
              <CardDescription>
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </CardDescription>
            )}
          </CardHeader>

          <Tabs defaultValue="all" className="w-full">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread
                  {unreadCount > 0 && (
                    <Badge className="ml-2 h-4 w-4 p-0 text-xs bg-red-500">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="m-0">
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  {filteredNotifications.length > 0 ? (
                    <div className="p-4 space-y-3">
                      <AnimatePresence>
                        {filteredNotifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={markAsRead}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No notifications yet</p>
                      <p className="text-sm">You're all caught up!</p>
                    </div>
                  )}
                </ScrollArea>
                
                {notifications.length > 0 && (
                  <>
                    <Separator />
                    <div className="p-4">
                      <Button
                        variant="outline"
                        onClick={clearNotifications}
                        className="w-full"
                      >
                        Clear all notifications
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="unread" className="m-0">
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  {filteredNotifications.filter(n => !n.read).length > 0 ? (
                    <div className="p-4 space-y-3">
                      <AnimatePresence>
                        {filteredNotifications
                          .filter(n => !n.read)
                          .map((notification) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
                              onMarkAsRead={markAsRead}
                            />
                          ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Check className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No unread notifications</p>
                      <p className="text-sm">Great job staying on top of things!</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </TabsContent>

            <TabsContent value="settings" className="m-0">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Notification Types</h4>
                  <div className="space-y-3">
                    {Object.entries({
                      reservations: 'Reservations',
                      payments: 'Payments',
                      maintenance: 'Maintenance',
                      system: 'System Alerts'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={key}>{label}</Label>
                        <Switch
                          id={key}
                          checked={settings[key as keyof typeof settings] as boolean}
                          onCheckedChange={(checked) =>
                            setSettings(prev => ({ ...prev, [key]: checked }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Preferences</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sound">Sound notifications</Label>
                      <Switch
                        id="sound"
                        checked={settings.sound}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({ ...prev, sound: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="desktop">Desktop notifications</Label>
                      <Switch
                        id="desktop"
                        checked={settings.desktop}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({ ...prev, desktop: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </PopoverContent>
    </Popover>
  );
}