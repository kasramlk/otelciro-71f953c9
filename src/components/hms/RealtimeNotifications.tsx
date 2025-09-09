import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, Users, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface RealtimeNotification {
  id: string;
  type: 'new_reservation' | 'reservation_update' | 'check_in' | 'check_out';
  reservationId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  source: string;
  timestamp: string;
  read: boolean;
}

interface RealtimeNotificationsProps {
  hotelId: string;
}

export const RealtimeNotifications = ({ hotelId }: RealtimeNotificationsProps) => {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!hotelId) return;

    // Subscribe to real-time hotel updates
    const channel = supabase
      .channel(`hotel-${hotelId}`)
      .on('broadcast', { event: 'new_reservation' }, (payload) => {
        console.log('New reservation notification:', payload);
        
        const notification: RealtimeNotification = {
          id: `notif-${Date.now()}`,
          type: 'new_reservation',
          reservationId: payload.payload.reservationId,
          guestName: payload.payload.guestName,
          checkIn: payload.payload.checkIn,
          checkOut: payload.payload.checkOut,
          source: payload.payload.source,
          timestamp: payload.payload.timestamp,
          read: false
        };

        setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep last 20
        setUnreadCount(prev => prev + 1);

        // Show toast notification
        toast({
          title: "New Reservation!",
          description: `${notification.guestName} booked via ${notification.source}`,
          action: (
            <Button variant="outline" size="sm">
              View Reservation
            </Button>
          )
        });
      })
      .on('broadcast', { event: 'reservation_update' }, (payload) => {
        console.log('Reservation update notification:', payload);
        // Handle reservation updates
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId, toast]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: RealtimeNotification['type']) => {
    switch (type) {
      case 'new_reservation':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'check_in':
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case 'check_out':
        return <Users className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Live Updates</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      notification.read 
                        ? 'bg-muted/30' 
                        : 'bg-primary/5 border border-primary/20'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {notification.type === 'new_reservation' && 'New Reservation'}
                            {notification.type === 'check_in' && 'Guest Check-In'}
                            {notification.type === 'check_out' && 'Guest Check-Out'}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.timestamp), 'HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>{notification.guestName}</strong> via {notification.source}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notification.checkIn), 'MMM dd')} - {format(new Date(notification.checkOut), 'MMM dd')}
                        </p>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator className="mt-3" />}
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};