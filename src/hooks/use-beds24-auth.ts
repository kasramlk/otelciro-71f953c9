import { useState, useCallback, useEffect } from 'react';
import { 
  beds24Fetch, 
  setupBeds24Integration, 
  getBeds24AuthDetails,
  Beds24AuthError,
  Beds24RateLimitError 
} from '@/lib/services/beds24-auth-client';
import { toast } from 'sonner';

interface UseBeds24AuthOptions {
  organizationId: string;
}

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  rateLimits?: {
    fiveMinRemaining?: number;
    fiveMinResetsIn?: number;
    requestCost?: number;
  };
}

/**
 * React hook for Beds24 authentication and API calls
 * 
 * @example
 * ```typescript
 * const { setupIntegration, makeApiCall, authState } = useBeds24Auth({
 *   organizationId: 'org-123'
 * });
 * 
 * // Setup integration
 * await setupIntegration('invite-code-123', 'My Device');
 * 
 * // Make API calls
 * const properties = await makeApiCall('/properties');
 * ```
 */
export function useBeds24Auth({ organizationId }: UseBeds24AuthOptions) {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Auto-check authentication status on mount and periodically refresh
  useEffect(() => {
    let mounted = true;
    let refreshInterval: NodeJS.Timeout;

    const checkAuthStatus = async () => {
      if (!mounted) return;
      
      try {
        const details = await getBeds24AuthDetails(organizationId);
        if (mounted) {
          setAuthState(prev => ({ 
            ...prev, 
            isLoading: false,
            isAuthenticated: true,
            rateLimits: details.rateLimits,
            error: null 
          }));
        }
      } catch (error) {
        if (mounted) {
          setAuthState(prev => ({ 
            ...prev, 
            isLoading: false, 
            isAuthenticated: false,
            error: error instanceof Beds24AuthError ? error.message : null
          }));
        }
      }
    };

    // Initial check
    checkAuthStatus();

    // Set up periodic token refresh (every 20 minutes)
    refreshInterval = setInterval(checkAuthStatus, 20 * 60 * 1000);

    return () => {
      mounted = false;
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [organizationId]);

  /**
   * Setup Beds24 integration with invite code
   */
  const setupIntegration = useCallback(async (
    inviteCode: string,
    deviceName?: string
  ): Promise<boolean> => {
    console.log('🎯 Hook setupIntegration called with:', { inviteCode: inviteCode?.length, deviceName, organizationId });
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('🎯 Calling setupBeds24Integration...');
      const result = await setupBeds24Integration({
        organizationId,
        inviteCode,
        deviceName,
      });
      
      console.log('🎯 Setup result:', result);
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isAuthenticated: true,
        error: null 
      }));
      
      toast.success('Beds24 integration setup successfully');
      return true;
      
    } catch (error) {
      console.error('🎯 Setup error in hook:', error);
      const errorMessage = error instanceof Beds24AuthError 
        ? error.message 
        : 'Failed to setup integration';
        
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      
      toast.error(errorMessage);
      return false;
    }
  }, [organizationId]);

  /**
   * Make authenticated API call to Beds24
   */
  const makeApiCall = useCallback(async <T = any>(
    path: string,
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      body?: any;
      headers?: Record<string, string>;
    }
  ): Promise<T | null> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await beds24Fetch<T>(path, {
        organizationId,
        ...options,
      });
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        rateLimits: result.rateLimits,
        error: null,
        isAuthenticated: true
      }));
      
      return result.data;
      
    } catch (error) {
      let errorMessage = 'API call failed';
      
      if (error instanceof Beds24AuthError) {
        errorMessage = error.message;
        if (error.status === 401) {
          // Authentication failed - try to refresh auth details
          setAuthState(prev => ({ ...prev, isAuthenticated: false }));
          try {
            await getBeds24AuthDetails(organizationId);
            // If successful, retry the original call
            const retryResult = await beds24Fetch<T>(path, { organizationId, ...options });
            setAuthState(prev => ({ 
              ...prev, 
              isLoading: false,
              isAuthenticated: true,
              rateLimits: retryResult.rateLimits,
              error: null 
            }));
            return retryResult.data;
          } catch (retryError) {
            // Re-authentication failed
            setAuthState(prev => ({ ...prev, isAuthenticated: false }));
          }
        }
      } else if (error instanceof Beds24RateLimitError) {
        errorMessage = `Rate limit exceeded. Retry in ${error.retryAfter} seconds`;
      }
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      
      toast.error(errorMessage);
      return null;
    }
  }, [organizationId]);

  /**
   * Get authentication details and status
   */
  const getAuthDetails = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const details = await getBeds24AuthDetails(organizationId);
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        isAuthenticated: true,
        rateLimits: details.rateLimits,
        error: null 
      }));
      
      return details;
      
    } catch (error) {
      const errorMessage = error instanceof Beds24AuthError 
        ? error.message 
        : 'Failed to get auth details';
        
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isAuthenticated: false,
        error: errorMessage 
      }));
      
      return null;
    }
  }, [organizationId]);

  /**
   * Clear authentication state
   */
  const clearAuth = useCallback(() => {
    setAuthState({
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, []);

  return {
    authState,
    setupIntegration,
    makeApiCall,
    getAuthDetails,
    clearAuth,
  };
}

/**
 * Simple wrapper for one-off API calls without state management
 * 
 * @example
 * ```typescript
 * const properties = await useBeds24ApiCall('/properties', 'org-123');
 * ```
 */
export async function useBeds24ApiCall<T = any>(
  path: string,
  organizationId: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<T | null> {
  try {
    const result = await beds24Fetch<T>(path, {
      organizationId,
      ...options,
    });
    
    return result.data;
    
  } catch (error) {
    console.error('Beds24 API call failed:', error);
    
    if (error instanceof Beds24AuthError) {
      toast.error(error.message);
    } else if (error instanceof Beds24RateLimitError) {
      toast.error(`Rate limit exceeded. Retry in ${error.retryAfter} seconds`);
    } else {
      toast.error('API call failed');
    }
    
    return null;
  }
}