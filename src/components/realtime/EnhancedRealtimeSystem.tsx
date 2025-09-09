import React, { useEffect } from 'react';
import { useHotelContext } from '@/hooks/use-hotel-context';
import { useRealtimeSubscriptions } from '@/hooks/use-real-time-subscriptions';
import { useRealtime } from '@/hooks/use-realtime';
import { NotificationCenter } from './NotificationCenter';
import { OnlineUsers } from './OnlineUsers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Wifi, WifiOff } from 'lucide-react';

export const EnhancedRealtimeSystem: React.FC = () => {
  const { selectedHotelId } = useHotelContext();
  const { isConnected, onlineUsers } = useRealtime();
  
  // Set up real-time subscriptions for the selected hotel
  useRealtimeSubscriptions(selectedHotelId || '');

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-success" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
            Real-time Status
            <Badge variant={isConnected ? "default" : "destructive"} className="ml-auto">
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{onlineUsers.length} users online</span>
            </div>
            <div className="text-muted-foreground">
              Hotel: {selectedHotelId ? 'Connected' : 'No hotel selected'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Online Users */}
      <OnlineUsers />
      
      {/* Notification Center */}
      <div className="flex justify-end">
        <NotificationCenter />
      </div>
    </div>
  );
};