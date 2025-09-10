import { useState, useEffect, createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import type { Database } from '@/integrations/supabase/types';

type Agency = Database['public']['Tables']['agencies']['Row'];
type AgencyUser = Database['public']['Tables']['agency_users']['Row'];

interface AgencyAuthContextType {
  currentAgency: Agency | null;
  userAgencies: AgencyUser[];
  isLoadingAgencies: boolean;
  switchAgency: (agencyId: string) => void;
  createAgency: (agencyData: Partial<Agency>) => Promise<void>;
  inviteUser: (email: string, role: string) => Promise<void>;
  userRole: string | null;
  hasRole: (role: string) => boolean;
  refreshAgencies: () => void;
}

export const AgencyAuthContext = createContext<AgencyAuthContextType | null>(null);

export const useAgencyAuth = () => {
  const context = useContext(AgencyAuthContext);
  if (!context) {
    throw new Error('useAgencyAuth must be used within an AgencyAuthProvider');
  }
  return context;
};

interface UseAgencyAuthDataProps {
  userId: string | null;
}

export const useAgencyAuthData = ({ userId }: UseAgencyAuthDataProps) => {
  const [currentAgencyId, setCurrentAgencyId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch user's agency memberships
  const { data: userAgencies = [], isLoading: isLoadingAgencies } = useQuery({
    queryKey: ['agency-memberships', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('agency_users')
        .select(`
          *,
          agency:agencies(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('role', { ascending: true }); // Owner first, then admin, etc.

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Set initial agency (highest role, earliest joined)
  useEffect(() => {
    if (userAgencies.length > 0 && !currentAgencyId) {
      setCurrentAgencyId(userAgencies[0].agency_id);
    }
  }, [userAgencies, currentAgencyId]);

  // Fetch current agency details
  const { data: currentAgency } = useQuery({
    queryKey: ['current-agency', currentAgencyId],
    queryFn: async () => {
      if (!currentAgencyId) return null;
      
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', currentAgencyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentAgencyId,
  });

  // Create agency mutation
  const createAgencyMutation = useMutation({
    mutationFn: async (agencyData: Partial<Agency>) => {
      if (!userId) throw new Error('User not authenticated');

      // Create agency
      const { data: agency, error: agencyError } = await supabase
        .from('agencies')
        .insert({
          name: agencyData.name!,
          type: agencyData.type || 'OTA',
          contact_email: agencyData.contact_email,
          contact_phone: agencyData.contact_phone,
          address: agencyData.address,
          city: agencyData.city,
          country: agencyData.country,
          org_id: '550e8400-e29b-41d4-a716-446655440000', // Default org
        })
        .select()
        .single();

      if (agencyError) throw agencyError;

      // Create agency user record for owner
      const { error: userError } = await supabase
        .from('agency_users')
        .insert({
          user_id: userId,
          agency_id: agency.id,
          role: 'owner',
          joined_at: new Date().toISOString(),
        });

      if (userError) throw userError;

      return agency;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-memberships', userId] });
    },
  });

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!currentAgencyId) throw new Error('No agency selected');

      // This would typically send an email invitation
      // For now, we'll create a pending agency_user record
      const { error } = await supabase
        .from('agency_users')
        .insert({
          user_id: userId!, // This would be the invited user's ID after they accept
          agency_id: currentAgencyId,
          role,
          invited_by: userId!,
          is_active: false, // Pending acceptance
        });

      if (error) throw error;
    },
  });

  const switchAgency = (agencyId: string) => {
    setCurrentAgencyId(agencyId);
  };

  const createAgency = async (agencyData: Partial<Agency>) => {
    await createAgencyMutation.mutateAsync(agencyData);
  };

  const inviteUser = async (email: string, role: string) => {
    await inviteUserMutation.mutateAsync({ email, role });
  };

  const refreshAgencies = () => {
    queryClient.invalidateQueries({ queryKey: ['agency-memberships', userId] });
  };

  // Get current user's role in current agency
  const currentAgencyUser = userAgencies.find(au => au.agency_id === currentAgencyId);
  const userRole = currentAgencyUser?.role || null;

  const hasRole = (role: string) => {
    if (!userRole) return false;
    
    const roleHierarchy = ['agent', 'manager', 'admin', 'owner'];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(role);
    
    return userRoleIndex >= requiredRoleIndex;
  };

  return {
    currentAgency,
    userAgencies,
    isLoadingAgencies,
    switchAgency,
    createAgency,
    inviteUser,
    userRole,
    hasRole,
    refreshAgencies,
  };
};