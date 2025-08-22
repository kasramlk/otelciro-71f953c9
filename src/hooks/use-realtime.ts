// Real-time Features Hook with Presence and Notifications
import { useEffect, useState, useCallback } from 'react';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export interface UserPresence {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  status: 'online' | 'away' | 'busy';
  last_seen: string;
  current_page?: string;
}

export interface NotificationData {
  id: string;
  type: 'reservation' | 'payment' | 'maintenance' | 'system';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  data?: any;
}

export function useRealtime(channelName = 'hotel-dashboard') {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [presenceState, setPresenceState] = useState<RealtimePresenceState>({});
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize real-time connection
  useEffect(() => {
    if (!user || !profile) return;

    const realtimeChannel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id
        }
      }
    });

    // Presence tracking
    realtimeChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = realtimeChannel.presenceState();
        setPresenceState(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const joinedUser = newPresences[0];
        if (joinedUser && 'user_id' in joinedUser && joinedUser.user_id !== user.id) {
          const userPresence = joinedUser as unknown as UserPresence;
          toast({
            title: "User joined",
            description: `${userPresence.display_name} is now online`,
            duration: 3000
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const leftUser = leftPresences[0];
        if (leftUser && 'user_id' in leftUser && leftUser.user_id !== user.id) {
          const userPresence = leftUser as unknown as UserPresence;
          toast({
            title: "User left",
            description: `${userPresence.display_name} went offline`,
            duration: 3000
          });
        }
      });

    // Database changes subscription
    realtimeChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservations'
        },
        (payload) => {
          toast({
            title: "New Reservation",
            description: `Reservation ${payload.new.code} has been created`,
            duration: 5000
          });
          
          // Invalidate reservations query to refresh data
          queryClient.invalidateQueries({ queryKey: ['reservations'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservations'
        },
        (payload) => {
          if (payload.old.status !== payload.new.status) {
            toast({
              title: "Reservation Updated",
              description: `Reservation ${payload.new.code} status changed to ${payload.new.status}`,
              duration: 4000
            });
            
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments'
        },
        (payload) => {
          toast({
            title: "Payment Received",
            description: `Payment of $${payload.new.amount} received`,
            duration: 5000
          });
          
          queryClient.invalidateQueries({ queryKey: ['payments'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'maintenance_requests'
        },
        (payload) => {
          toast({
            title: "Maintenance Request",
            description: `New maintenance request: ${payload.new.title}`,
            variant: "destructive",
            duration: 6000
          });
          
          queryClient.invalidateQueries({ queryKey: ['maintenance'] });
        }
      );

    // Subscribe and track presence
    realtimeChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        
        const userPresence: UserPresence = {
          user_id: user.id,
          display_name: profile.display_name || `${profile.first_name} ${profile.last_name}`,
          avatar_url: profile.avatar_url,
          status: 'online',
          last_seen: new Date().toISOString(),
          current_page: window.location.pathname
        };

        await realtimeChannel.track(userPresence);
      } else {
        setIsConnected(false);
      }
    });

    setChannel(realtimeChannel);

    // Update presence when page changes
    const handlePageChange = () => {
      if (realtimeChannel) {
        realtimeChannel.track({
          user_id: user.id,
          display_name: profile.display_name || `${profile.first_name} ${profile.last_name}`,
          avatar_url: profile.avatar_url,
          status: 'online',
          last_seen: new Date().toISOString(),
          current_page: window.location.pathname
        });
      }
    };

    // Track page visibility
    const handleVisibilityChange = () => {
      if (realtimeChannel) {
        const status = document.hidden ? 'away' : 'online';
        realtimeChannel.track({
          user_id: user.id,
          display_name: profile.display_name || `${profile.first_name} ${profile.last_name}`,
          avatar_url: profile.avatar_url,
          status,
          last_seen: new Date().toISOString(),
          current_page: window.location.pathname
        });
      }
    };

    window.addEventListener('popstate', handlePageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      realtimeChannel.unsubscribe();
    };
  }, [user, profile, channelName, queryClient]);

  // Get online users
  const getOnlineUsers = useCallback((): UserPresence[] => {
    const users: UserPresence[] = [];
    Object.values(presenceState).forEach(presences => {
      presences.forEach(presence => {
        if (presence && typeof presence === 'object' && 'user_id' in presence) {
          users.push(presence as unknown as UserPresence);
        }
      });
    });
    return users;
  }, [presenceState]);

  // Send custom notification
  const sendNotification = useCallback((notification: Omit<NotificationData, 'id' | 'created_at'>) => {
    if (!channel) return;

    const fullNotification: NotificationData = {
      ...notification,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    channel.send({
      type: 'broadcast',
      event: 'notification',
      payload: fullNotification
    });

    setNotifications(prev => [fullNotification, ...prev].slice(0, 50)); // Keep last 50
  }, [channel]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update user status
  const updateStatus = useCallback(async (status: 'online' | 'away' | 'busy') => {
    if (!channel || !user || !profile) return;

    await channel.track({
      user_id: user.id,
      display_name: profile.display_name || `${profile.first_name} ${profile.last_name}`,
      avatar_url: profile.avatar_url,
      status,
      last_seen: new Date().toISOString(),
      current_page: window.location.pathname
    });
  }, [channel, user, profile]);

  return {
    // Connection state
    isConnected,
    channel,
    
    // Presence
    onlineUsers: getOnlineUsers(),
    updateStatus,
    
    // Notifications
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    sendNotification,
    markAsRead,
    clearNotifications
  };
}