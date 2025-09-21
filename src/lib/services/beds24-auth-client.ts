import { supabase } from "@/integrations/supabase/client";

interface Beds24FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  organizationId: string;
}

interface RateLimitInfo {
  fiveMinRemaining?: number;
  fiveMinResetsIn?: number;
  requestCost?: number;
}

interface Beds24Response<T = any> {
  data: T;
  rateLimits?: RateLimitInfo;
}

class Beds24AuthError extends Error {
  constructor(message: string, public status: number, public details?: any) {
    super(message);
    this.name = 'Beds24AuthError';
  }
}

class Beds24RateLimitError extends Error {
  constructor(message: string, public retryAfter: number) {
    super(message);
    this.name = 'Beds24RateLimitError';
  }
}

/**
 * Beds24 authenticated client with automatic token management
 * 
 * @example
 * ```typescript
 * import { beds24Fetch } from '@/lib/services/beds24-auth-client';
 * 
 * // Get properties
 * const properties = await beds24Fetch('/properties', {
 *   organizationId: 'org-123'
 * });
 * 
 * // Create booking
 * const booking = await beds24Fetch('/bookings', {
 *   method: 'POST',
 *   organizationId: 'org-123',
 *   body: bookingData
 * });
 * ```
 */
export async function beds24Fetch<T = any>(
  path: string,
  options: Beds24FetchOptions
): Promise<Beds24Response<T>> {
  const { method = 'GET', headers = {}, body, organizationId } = options;
  
  // Don't inject token for authentication endpoints
  const isAuthEndpoint = path.startsWith('/authentication');
  let authToken = '';
  
  if (!isAuthEndpoint) {
    // Get current token
    const tokenResponse = await supabase.functions.invoke('beds24-auth-token', {
      body: { organizationId }
    });
    
    if (tokenResponse.error || !tokenResponse.data?.token) {
      throw new Beds24AuthError(
        'Failed to get authentication token',
        401,
        tokenResponse.error
      );
    }
    
    authToken = tokenResponse.data.token;
  }
  
  const beds24BaseUrl = 'https://api.beds24.com/v2';
  const url = `${beds24BaseUrl}${path}`;
  
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  
  if (authToken) {
    requestHeaders['token'] = authToken;
  }
  
  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  
  let attempt = 0;
  const maxRetries = 3;
  
  while (attempt < maxRetries) {
    try {
      console.log(`Beds24 API call: ${method} ${path} (attempt ${attempt + 1})`);
      
      const response = await fetch(url, fetchOptions);
      
      // Extract rate limit headers
      const rateLimits: RateLimitInfo = {
        fiveMinRemaining: response.headers.get('x-five-min-limit-remaining') 
          ? parseInt(response.headers.get('x-five-min-limit-remaining')!) 
          : undefined,
        fiveMinResetsIn: response.headers.get('x-five-min-limit-resets-in')
          ? parseInt(response.headers.get('x-five-min-limit-resets-in')!)
          : undefined,
        requestCost: response.headers.get('x-request-cost')
          ? parseInt(response.headers.get('x-request-cost')!)
          : undefined,
      };
      
      // Store usage data
      if (rateLimits.fiveMinRemaining !== undefined || rateLimits.requestCost !== undefined) {
        try {
          // Store in background, don't await
          storeUsageData(organizationId, rateLimits);
        } catch (error) {
          console.warn('Failed to store usage data:', error);
        }
      }
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = rateLimits.fiveMinResetsIn || 60; // Default to 60 seconds
        
        if (attempt === maxRetries - 1) {
          throw new Beds24RateLimitError(
            `Rate limit exceeded. Retry after ${retryAfter} seconds`,
            retryAfter
          );
        }
        
        // Exponential backoff with jitter
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), retryAfter * 1000) + Math.random() * 1000;
        console.log(`Rate limited, backing off for ${backoffMs}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        attempt++;
        continue;
      }
      
      // Handle authentication errors with one retry
      if (response.status === 401 && !isAuthEndpoint && attempt === 0) {
        console.log('Authentication failed, refreshing token and retrying');
        
        // Force token refresh by calling token endpoint again
        const refreshResponse = await supabase.functions.invoke('beds24-auth-token', {
          body: { organizationId }
        });
        
        if (refreshResponse.data?.token) {
          requestHeaders['token'] = refreshResponse.data.token;
          fetchOptions.headers = requestHeaders;
          attempt++;
          continue;
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        throw new Beds24AuthError(
          `Beds24 API error: ${response.status}`,
          response.status,
          errorData
        );
      }
      
      const data = await response.json();
      
      return {
        data,
        rateLimits,
      };
      
    } catch (error) {
      if (error instanceof Beds24AuthError || error instanceof Beds24RateLimitError) {
        throw error;
      }
      
      if (attempt === maxRetries - 1) {
        throw new Beds24AuthError(
          `Network error: ${error.message}`,
          0,
          error
        );
      }
      
      // Exponential backoff for network errors
      const backoffMs = 1000 * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Network error, backing off for ${backoffMs}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      attempt++;
    }
  }
  
  throw new Beds24AuthError('Max retries exceeded', 0);
}

/**
 * Store usage data in the background
 */
async function storeUsageData(organizationId: string, rateLimits: RateLimitInfo): Promise<void> {
  try {
    // Get integration ID
    const { data: integration } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('provider', 'beds24')
      .single();
    
    if (integration) {
      await supabase
        .from('integration_usage')
        .insert({
          integration_id: integration.id,
          x_five_min_remaining: rateLimits.fiveMinRemaining || null,
          x_five_min_resets_in: rateLimits.fiveMinResetsIn || null,
          x_request_cost: rateLimits.requestCost || null,
        });
    }
  } catch (error) {
    console.warn('Failed to store usage data:', error);
  }
}

/**
 * Setup Beds24 integration with invite code
 * 
 * @example
 * ```typescript
 * import { setupBeds24Integration } from '@/lib/services/beds24-auth-client';
 * 
 * const result = await setupBeds24Integration({
 *   organizationId: 'org-123',
 *   inviteCode: 'abc123',
 *   deviceName: 'OtelCiro Production'
 * });
 * ```
 */
export async function setupBeds24Integration(params: {
  organizationId: string;
  inviteCode: string;
  deviceName?: string;
}): Promise<{ success: boolean; integrationId: string; expiresAt: string }> {
  console.log('🔧 Setting up Beds24 integration with params:', { 
    organizationId: params.organizationId, 
    deviceName: params.deviceName,
    inviteCodeLength: params.inviteCode?.length 
  });
  
  try {
    const response = await supabase.functions.invoke('beds24-auth-setup', {
      body: params
    });
    
    console.log('🔧 Supabase function response:', { 
      data: response.data, 
      error: response.error 
    });
    
    if (response.error) {
      console.error('🔧 Setup integration error:', response.error);
      throw new Beds24AuthError(
        'Failed to setup Beds24 integration',
        500,
        response.error
      );
    }
    
    console.log('🔧 Setup integration success:', response.data);
    return response.data;
  } catch (error) {
    console.error('🔧 Setup integration exception:', error);
    throw error;
  }
}

/**
 * Get Beds24 authentication details
 * 
 * @example
 * ```typescript
 * import { getBeds24AuthDetails } from '@/lib/services/beds24-auth-client';
 * 
 * const details = await getBeds24AuthDetails('org-123');
 * console.log('Rate limits:', details.rateLimits);
 * ```
 */
export async function getBeds24AuthDetails(organizationId: string): Promise<any> {
  const response = await supabase.functions.invoke('beds24-auth-details', {
    body: { organizationId }
  });
  
  if (response.error) {
    throw new Beds24AuthError(
      'Failed to get auth details',
      500,
      response.error
    );
  }
  
  return response.data;
}

// Export error classes for error handling
export { Beds24AuthError, Beds24RateLimitError };