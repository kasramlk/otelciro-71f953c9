// Advanced Guest Management Hooks
// Real backend integration for Phase 2: Guest operations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { auditLogger } from '@/lib/audit-logger';

export const GUEST_MANAGEMENT_KEYS = {
  guests: (hotelId: string, filters?: any) => ['guests', hotelId, filters],
  guestProfile: (guestId: string) => ['guest-profile', guestId],
  guestCommunications: (guestId: string) => ['guest-communications', guestId],
  guestLoyalty: (guestId: string) => ['guest-loyalty', guestId],
  guestHistory: (guestId: string) => ['guest-history', guestId],
} as const;

// Enhanced Guests with profiles and relationships
export function useAdvancedGuests(hotelId: string, filters?: {
  search?: string;
  vipOnly?: boolean;
  loyaltyTier?: string;
  blacklistStatus?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: GUEST_MANAGEMENT_KEYS.guests(hotelId, filters),
    queryFn: async () => {
      let query = supabase
        .from('guests')
        .select(`
          *,
          guest_profiles(*),
          reservations(
            id,
            check_in,
            check_out,
            status,
            total_amount
          )
        `)
        .eq('hotel_id', hotelId);

      // Apply filters
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to include computed fields
      return data?.map(guest => {
        const profile = Array.isArray(guest.guest_profiles) ? guest.guest_profiles[0] : null;
        const reservations = Array.isArray(guest.reservations) ? guest.reservations : [];
        
        return {
          ...guest,
          fullName: `${guest.first_name} ${guest.last_name}`,
          vipStatus: profile?.vip_status || false,
          loyaltyTier: profile?.loyalty_tier || 'Standard',
          loyaltyPoints: profile?.loyalty_points || 0,
          blacklisted: profile?.blacklist_flag || false,
          totalStays: reservations.length || 0,
          totalSpent: reservations.reduce((sum, res) => sum + (res.total_amount || 0), 0) || 0,
          lastStay: reservations[0]?.check_out ? new Date(reservations[0].check_out) : null,
          preferences: profile?.preferences || {}
        };
      });
    },
    enabled: !!hotelId,
    staleTime: 2 * 60 * 1000
  });
}

// Guest Profile with detailed information
export function useGuestProfile(guestId: string) {
  return useQuery({
    queryKey: GUEST_MANAGEMENT_KEYS.guestProfile(guestId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select(`
          *,
          guest_profiles(*),
          reservations(
            id,
            code,
            check_in,
            check_out,
            status,
            total_amount,
            room_types(name),
            rooms(number)
          ),
          guest_communications(
            id,
            communication_type,
            subject,
            status,
            created_at
          )
        `)
        .eq('id', guestId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!guestId,
    staleTime: 5 * 60 * 1000
  });
}

// Create Guest with Profile
export function useCreateGuestWithProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (guestData: {
      hotelId: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      nationality?: string;
      idNumber?: string;
      dateOfBirth?: string;
      vipStatus?: boolean;
      loyaltyTier?: string;
      preferences?: any;
      notes?: string;
    }) => {
      // Create guest
      const { data: guest, error: guestError } = await supabase
        .from('guests')
        .insert({
          hotel_id: guestData.hotelId,
          first_name: guestData.firstName,
          last_name: guestData.lastName,
          email: guestData.email,
          phone: guestData.phone,
          nationality: guestData.nationality,
          id_number: guestData.idNumber,
          dob: guestData.dateOfBirth ? new Date(guestData.dateOfBirth).toISOString().split('T')[0] : null
        })
        .select()
        .single();

      if (guestError) throw guestError;

      // Create guest profile
      const { error: profileError } = await supabase
        .from('guest_profiles')
        .insert({
          guest_id: guest.id,
          vip_status: guestData.vipStatus || false,
          loyalty_tier: guestData.loyaltyTier || 'Standard',
          loyalty_points: 0,
          preferences: guestData.preferences || {},
          blacklist_flag: false,
          marketing_consent: true
        });

      if (profileError) throw profileError;

      return guest;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      
      auditLogger.logGuestCreated(data.id, {
        name: `${variables.firstName} ${variables.lastName}`,
        email: variables.email
      });

      toast({
        title: "Guest Created",
        description: `${variables.firstName} ${variables.lastName} has been added successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error Creating Guest",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Update Guest Profile
export function useUpdateGuestProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ guestId, updates }: {
      guestId: string;
      updates: {
        guestData?: any;
        profileData?: any;
      };
    }) => {
      // Update guest basic info
      if (updates.guestData) {
        const { error: guestError } = await supabase
          .from('guests')
          .update(updates.guestData)
          .eq('id', guestId);
        
        if (guestError) throw guestError;
      }

      // Update guest profile
      if (updates.profileData) {
        const { error: profileError } = await supabase
          .from('guest_profiles')
          .update(updates.profileData)
          .eq('guest_id', guestId);
        
        if (profileError) throw profileError;
      }

      return { guestId, updates };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guest-profile', data.guestId] });
      
      toast({
        title: "Guest Updated",
        description: "Guest profile has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error Updating Guest",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Guest Communications
export function useGuestCommunications(guestId: string) {
  return useQuery({
    queryKey: GUEST_MANAGEMENT_KEYS.guestCommunications(guestId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_communications')
        .select('*')
        .eq('guest_id', guestId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!guestId
  });
}

// Send Guest Communication
export function useSendGuestCommunication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communicationData: {
      guestId: string;
      hotelId: string;
      type: string;
      subject?: string;
      content: string;
      scheduleAt?: Date;
    }) => {
      const { data, error } = await supabase
        .from('guest_communications')
        .insert({
          guest_id: communicationData.guestId,
          hotel_id: communicationData.hotelId,
          communication_type: communicationData.type,
          subject: communicationData.subject,
          content: communicationData.content,
          scheduled_at: communicationData.scheduleAt?.toISOString(),
          status: communicationData.scheduleAt ? 'scheduled' : 'sent',
          sent_at: communicationData.scheduleAt ? null : new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: GUEST_MANAGEMENT_KEYS.guestCommunications(data.guest_id) 
      });

      toast({
        title: "Communication Sent",
        description: "Guest communication has been processed successfully."
      });
    }
  });
}

// Guest Loyalty Operations
export function useUpdateGuestLoyalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ guestId, points, transactionType, referenceId }: {
      guestId: string;
      points: number;
      transactionType: 'earn' | 'redeem';
      referenceId?: string;
    }) => {
      // Get current profile
      const { data: profile, error: profileError } = await supabase
        .from('guest_profiles')
        .select('loyalty_points, loyalty_tier')
        .eq('guest_id', guestId)
        .single();

      if (profileError) throw profileError;

      const newPoints = transactionType === 'earn' 
        ? (profile.loyalty_points || 0) + points
        : Math.max(0, (profile.loyalty_points || 0) - points);

      // Determine new tier
      let newTier = 'Standard';
      if (newPoints >= 10000) newTier = 'Gold';
      else if (newPoints >= 5000) newTier = 'Silver';

      // Update profile
      const { error: updateError } = await supabase
        .from('guest_profiles')
        .update({
          loyalty_points: newPoints,
          loyalty_tier: newTier
        })
        .eq('guest_id', guestId);

      if (updateError) throw updateError;

      return { guestId, newPoints, newTier };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guest-profile', data.guestId] });

      toast({
        title: "Loyalty Points Updated",
        description: `Guest now has ${data.newPoints} points (${data.newTier} tier).`
      });
    }
  });
}