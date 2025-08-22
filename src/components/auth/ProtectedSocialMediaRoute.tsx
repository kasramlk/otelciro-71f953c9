import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { checkSocialMediaAccess } from '@/lib/config';
import { toast } from '@/hooks/use-toast';

interface ProtectedSocialMediaRouteProps {
  children: React.ReactNode;
}

export const ProtectedSocialMediaRoute: React.FC<ProtectedSocialMediaRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Get user role from user metadata or default to hotel_manager
  const userRole = user?.user_metadata?.role || 'hotel_manager';

  useEffect(() => {
    if (!loading && user) {
      if (!checkSocialMediaAccess(userRole)) {
        toast({
          title: "Access Restricted",
          description: "Access restricted by role. Contact your administrator for access.",
          variant: "destructive"
        });
        navigate('/dashboard');
      }
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!checkSocialMediaAccess(userRole)) {
    return null;
  }

  return <>{children}</>;
};