import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import Beds24Page from '@/pages/admin/Beds24Page';

export default function Beds24Integration() {
  const { user, isAdmin } = useAuth();

  // Only admins can access this page
  if (!user || !isAdmin()) {
    return <Navigate to="/auth" replace />;
  }

  return <Beds24Page />;
}