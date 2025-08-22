// Feature flags and configuration
export const features = {
  socialMedia: true, // Set to false to disable social media module
  analytics: true,
  guestExperience: true,
  revenueAI: true
};

// Role-based access control
export const rolePermissions = {
  socialMedia: ['admin', 'hotel_manager', 'marketing_manager', 'agency'],
  analytics: ['admin', 'hotel_manager', 'marketing_manager'],
  revenueAI: ['admin', 'hotel_manager'],
  guestExperience: ['admin', 'hotel_manager', 'front_office'],
  settings: ['admin', 'hotel_manager']
};

export const hasFeatureAccess = (feature: keyof typeof features, userRole?: string) => {
  if (!features[feature]) return false;
  if (!userRole) return false;
  
  const allowedRoles = rolePermissions[feature as keyof typeof rolePermissions];
  return allowedRoles?.includes(userRole) || false;
};

export const checkSocialMediaAccess = (userRole?: string) => {
  return hasFeatureAccess('socialMedia', userRole);
};