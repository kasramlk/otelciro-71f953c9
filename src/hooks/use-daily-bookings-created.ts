import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DailyBookingsData {
  total: number;
  direct: number;
  channels: number;
  trend: number; // percentage change from previous 24h
  sourceBreakdown: Array<{
    source: string;
    count: number;
  }>;
}

export const useDailyBookingsCreated = (hotelId: string) => {
  const { toast } = useToast();

  const { data: bookingsData, refetch } = useQuery({
    queryKey: ['daily-bookings-created', hotelId],
    queryFn: async (): Promise<DailyBookingsData> => {
      if (!hotelId) return { total: 0, direct: 0, channels: 0, trend: 0, sourceBreakdown: [] };

      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const previous24h = new Date(last24h.getTime() - 24 * 60 * 60 * 1000);

      // Get reservations created in last 24 hours
      const { data: currentReservations, error: currentError } = await supabase
        .from('reservations')
        .select('id, source')
        .eq('hotel_id', hotelId)
        .gte('created_at', last24h.toISOString())
        .lte('created_at', now.toISOString());

      if (currentError) throw currentError;

      // Get reservations created in previous 24 hours for trend
      const { data: previousReservations, error: previousError } = await supabase
        .from('reservations')
        .select('source')
        .eq('hotel_id', hotelId)
        .gte('created_at', previous24h.toISOString())
        .lt('created_at', last24h.toISOString());

      if (previousError) throw previousError;

      // Process current reservations
      const sourceBreakdown: Array<{ source: string; count: number }> = [];
      const sourceCounts: Record<string, number> = {};
      
      let direct = 0;
      let channels = 0;

      currentReservations?.forEach((reservation, index) => {
        const originalSource = reservation.source;
        const source = reservation.source || 'Direct';
        
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;

        // Fix the logic: remove the !source check since source is never falsy here
        if (source === 'Direct' || source === 'Walk-in' || source === 'direct') {
          direct++;
        } else {
          channels++;
        }
      });

      // Convert to breakdown array
      Object.entries(sourceCounts).forEach(([source, count]) => {
        sourceBreakdown.push({ source, count });
      });

      const total = currentReservations?.length || 0;
      const previousTotal = previousReservations?.length || 0;
      
      // Calculate trend percentage
      const trend = previousTotal > 0 
        ? ((total - previousTotal) / previousTotal) * 100 
        : total > 0 ? 100 : 0;

      return {
        total,
        direct,
        channels,
        trend: Math.round(trend),
        sourceBreakdown
      };
    },
    enabled: !!hotelId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Real-time subscription for new reservations
  useEffect(() => {
    if (!hotelId) return;

    const channel = supabase
      .channel('daily-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservations',
          filter: `hotel_id=eq.${hotelId}`,
        },
        (payload) => {
          refetch();
          toast({
            title: 'New Reservation',
            description: `A new booking was just created from ${payload.new.source || 'Direct'}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId, refetch, toast]);

  return bookingsData || { total: 0, direct: 0, channels: 0, trend: 0, sourceBreakdown: [] };
};