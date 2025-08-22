import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useHMSStore } from '@/stores/hms-store';
import { format } from 'date-fns';
import { Bell, Info, CheckCircle, AlertTriangle } from 'lucide-react';

interface NotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationsModal = ({ open, onOpenChange }: NotificationsModalProps) => {
  const { auditLog } = useHMSStore();

  // Mock additional notifications
  const mockNotifications = [
    {
      id: 'notif-1',
      type: 'info' as const,
      title: 'New Booking Received',
      message: 'Booking #RES1234 from Booking.com',
      timestamp: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: 'notif-2', 
      type: 'warning' as const,
      title: 'Maintenance Required',
      message: 'Room 205 needs immediate attention',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 'notif-3',
      type: 'success' as const,
      title: 'Guest Checked In',
      message: 'Guest Smith successfully checked into Room 301',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': 
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const allNotifications = [
    ...mockNotifications,
    ...auditLog.slice(-10).map(entry => ({
      id: entry.id,
      type: 'info' as const,
      title: entry.action,
      message: entry.details,
      timestamp: entry.timestamp
    }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notifications
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-96">
          <div className="space-y-4">
            {allNotifications.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No notifications
              </p>
            ) : (
              allNotifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(notification.timestamp, 'MMM dd, HH:mm')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    New
                  </Badge>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};