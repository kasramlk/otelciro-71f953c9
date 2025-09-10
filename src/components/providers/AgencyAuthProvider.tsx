import { ReactNode } from 'react';
import { AgencyAuthContext, useAgencyAuthData } from '@/hooks/use-agency-auth';
import { useAuth } from '@/hooks/use-auth';

interface AgencyAuthProviderProps {
  children: ReactNode;
}

export const AgencyAuthProvider = ({ children }: AgencyAuthProviderProps) => {
  const { user } = useAuth();
  const agencyAuthData = useAgencyAuthData({ userId: user?.id || null });

  return (
    <AgencyAuthContext.Provider value={agencyAuthData}>
      {children}
    </AgencyAuthContext.Provider>
  );
};