import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import Beds24Page from '@/pages/admin/Beds24Page';

export default function Beds24Integration() {
  const { user, isAdmin } = useAuth();

  // Show access denied message with user ID for non-admin users
  if (!user || !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 border border-border rounded-lg bg-card">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You need admin access to view this page.</p>
          <p className="text-sm text-muted-foreground">
            User ID: <code className="bg-muted px-2 py-1 rounded font-mono">{user?.id || 'Not logged in'}</code>
          </p>
        </div>
      </div>
    );
  }

  return <Beds24Page />;
}