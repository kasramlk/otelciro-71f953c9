import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

interface TokenCache {
  token: string
  expiresAt: number
}

// In-memory cache for the current isolate
const tokenCache = new Map<string, TokenCache>()

// Create supabase client for internal operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export async function getReadToken(): Promise<string> {
  // Try multiple token sources in order of preference
  const directToken = Deno.env.get('BEDS24_READ_TOKEN');
  const apiToken = Deno.env.get('BEDS24_API_TOKEN');
  
  if (directToken) {
    console.log('Using BEDS24_READ_TOKEN');
    return directToken;
  }
  
  if (apiToken) {
    console.log('Using BEDS24_API_TOKEN as read token');
    return apiToken;
  }

  // Fallback to token manager function
  try {
    const response = await supabase.functions.invoke('beds24-token-manager', {
      body: { action: 'get_token', tokenType: 'read' }
    });
    
    if (response.data && response.data.token) {
      console.log('Using token from manager');
      return response.data.token;
    }
  } catch (error) {
    console.warn('Failed to get token from token manager:', error);
  }
  
  throw new Error('No read token available - please configure BEDS24_API_TOKEN or BEDS24_READ_TOKEN');
}

export async function getWriteAccessToken(): Promise<string> {
  const cacheKey = 'write_access_token'
  const cached = tokenCache.get(cacheKey)
  
  // Return cached token if it's still valid (with 5-minute buffer)
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cached.token
  }

  // Try to get from token manager first
  try {
    const response = await supabase.functions.invoke('beds24-token-manager', {
      body: { action: 'get_token', tokenType: 'write' }
    });
    
    if (response.data && response.data.token) {
      // Cache the token (assuming 1 hour expiry if not specified)
      const expiresAt = Date.now() + (60 * 60 * 1000);
      tokenCache.set(cacheKey, {
        token: response.data.token,
        expiresAt
      });
      return response.data.token;
    }
  } catch (error) {
    console.warn('Failed to get write token from token manager:', error);
  }

  // Fallback to refresh token approach
  const refreshToken = Deno.env.get('BEDS24_WRITE_REFRESH_TOKEN')
  if (!refreshToken) {
    throw new Error('BEDS24_WRITE_REFRESH_TOKEN not configured and no valid token in token manager')
  }

  const baseUrl = Deno.env.get('BEDS24_BASE_URL') || 'https://api.beds24.com/v2'
  
  try {
    const response = await fetch(`${baseUrl}/authentication/token`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'refreshToken': refreshToken,
      },
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.token || !data.expiresIn) {
      throw new Error('Invalid token response from Beds24')
    }

    // Cache the token and store in token manager
    const expiresAt = Date.now() + (data.expiresIn * 1000)
    tokenCache.set(cacheKey, {
      token: data.token,
      expiresAt
    })

    // Try to store in token manager for future use
    try {
      await supabase.functions.invoke('beds24-token-manager', {
        body: { 
          action: 'store_token', 
          tokenType: 'write',
          tokenData: {
            token: data.token,
            expires_at: new Date(expiresAt).toISOString(),
            scopes: ['write:inventory', 'write:bookings-messages', 'write:channels'],
            properties_access: []
          }
        }
      });
    } catch (storeError) {
      console.warn('Failed to store token in token manager:', storeError);
    }

    return data.token
  } catch (error) {
    console.error('Error refreshing Beds24 write token:', error)
    throw new Error(`Failed to refresh write access token: ${error.message}`)
  }
}

// Helper to get appropriate token based on operation type
export async function getTokenForOperation(operation: 'read' | 'write'): Promise<string> {
  return operation === 'write' ? await getWriteAccessToken() : await getReadToken()
}