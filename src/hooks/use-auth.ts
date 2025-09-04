// Enhanced Authentication Hook with User Profiles
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  organization?: string;
  department?: string;
  timezone?: string;
  language?: string;
  theme?: string;
  preferences?: any;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'guest';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Get user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Handle "no profile found" gracefully - don't throw error
      if (error && error.code !== 'PGRST116') throw error;
      return data as UserProfile || null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Get user roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user?.id) throw new Error('No user logged in');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', user?.id], data);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Auth initialization
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Defer profile loading to avoid auth callback deadlock
        if (session?.user) {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['profile', session.user.id] });
            queryClient.invalidateQueries({ queryKey: ['user-roles', session.user.id] });
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Auth functions
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      queryClient.clear();
    }
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?type=recovery`,
    });
    return { error };
  };

  // Role checking utilities
  const hasRole = (role: string) => {
    return roles?.some(r => r.role === role) || false;
  };

  const isPrimaryRole = (role: string) => {
    const roleHierarchy = ['owner', 'admin', 'manager', 'staff', 'guest'];
    const userRoles = roles?.map(r => r.role) || [];
    const primaryRole = userRoles.sort((a, b) => 
      roleHierarchy.indexOf(a) - roleHierarchy.indexOf(b)
    )[0];
    return primaryRole === role;
  };

  const isAdmin = () => hasRole('admin') || hasRole('owner');
  const isManager = () => hasRole('manager') || isAdmin();

  return {
    // Auth state
    user,
    session,
    profile,
    roles,
    loading: loading || profileLoading || rolesLoading,
    
    // Auth functions
    signIn,
    signUp,
    signOut,
    resetPassword,
    
    // Profile management
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    
    // Role utilities
    hasRole,
    isPrimaryRole,
    isAdmin,
    isManager,
    
    // Refresh functions
    refreshProfile: () => queryClient.invalidateQueries({ queryKey: ['profile', user?.id] }),
    refreshRoles: () => queryClient.invalidateQueries({ queryKey: ['user-roles', user?.id] })
  };
}