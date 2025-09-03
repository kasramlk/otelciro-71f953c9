interface TokenCache {
  token: string
  expiresAt: number
}

// In-memory cache for the current isolate
const tokenCache = new Map<string, TokenCache>()

export async function getReadToken(): Promise<string> {
  const token = Deno.env.get('BEDS24_READ_TOKEN')
  if (!token) {
    throw new Error('BEDS24_READ_TOKEN not configured')
  }
  return token
}

export async function getWriteAccessToken(): Promise<string> {
  const cacheKey = 'write_access_token'
  const cached = tokenCache.get(cacheKey)
  
  // Return cached token if it's still valid (with 5-minute buffer)
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cached.token
  }

  const refreshToken = Deno.env.get('BEDS24_WRITE_REFRESH_TOKEN')
  if (!refreshToken) {
    throw new Error('BEDS24_WRITE_REFRESH_TOKEN not configured')
  }

  const baseUrl = Deno.env.get('BEDS24_BASE_URL') || 'https://api.beds24.com/v2'
  
  try {
    const response = await fetch(`${baseUrl}/authentication/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.access_token || !data.expires_in) {
      throw new Error('Invalid token response from Beds24')
    }

    // Cache the token
    const expiresAt = Date.now() + (data.expires_in * 1000)
    tokenCache.set(cacheKey, {
      token: data.access_token,
      expiresAt
    })

    return data.access_token
  } catch (error) {
    console.error('Error refreshing Beds24 write token:', error)
    throw new Error(`Failed to refresh write access token: ${error.message}`)
  }
}

// Helper to get appropriate token based on operation type
export async function getTokenForOperation(operation: 'read' | 'write'): Promise<string> {
  return operation === 'write' ? await getWriteAccessToken() : await getReadToken()
}