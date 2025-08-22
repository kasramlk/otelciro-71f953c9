// Protected Route Component with Role-Based Access Control
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, AlertCircle } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | string[];
  fallbackPath?: string;
  showUnauthorized?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackPath = '/auth',
  showUnauthorized = true 
}: ProtectedRouteProps) {
  const { user, loading, hasRole, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
              />
            </div>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Please wait while we verify your access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = roles.some(role => hasRole(role)) || isAdmin();

    if (!hasRequiredRole) {
      if (!showUnauthorized) {
        return <Navigate to="/unauthorized" replace />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <CardTitle className="text-red-600 dark:text-red-400">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access this page.
                {Array.isArray(requiredRole) 
                  ? ` Required roles: ${requiredRole.join(', ')}`
                  : ` Required role: ${requiredRole}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Contact your administrator if you believe this is an error.
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.history.back()}
                >
                  Go Back
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => window.location.href = '/'}
                >
                  Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

// HOC for role-based components
export function withRoleAccess<T extends object>(
  Component: React.ComponentType<T>,
  requiredRole: string | string[]
) {
  return function ProtectedComponent(props: T) {
    return (
      <ProtectedRoute requiredRole={requiredRole} showUnauthorized={false}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Role-based visibility hook
export function useRoleAccess() {
  const { hasRole, isAdmin } = useAuth();

  const canAccess = (role: string | string[]) => {
    if (isAdmin()) return true;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.some(r => hasRole(r));
  };

  return { canAccess };
}