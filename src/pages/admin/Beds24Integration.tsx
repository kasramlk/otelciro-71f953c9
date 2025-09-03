import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { checkSocialMediaAccess } from '@/lib/config';
import Beds24IntegrationManager from '@/components/admin/Beds24IntegrationManager';

export default function Beds24Integration() {
  const { user, isAdmin } = useAuth();

  // Only admins can access this page
  if (!user || !isAdmin()) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto py-8">
      <Beds24IntegrationManager />
    </div>
  );
}