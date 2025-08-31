import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BEDS24_API_URL = 'https://api.beds24.com/v2'

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface AuthRequest {
  action: 'setup' | 'refresh'
  invitationCode?: string
  refreshToken?: string
  hotelId?: string
  deviceName?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, invitationCode, refreshToken, hotelId, deviceName }: AuthRequest = await req.json()
    
    console.log(`Beds24 Auth: ${action}`)

    switch (action) {
      case 'setup':
        return await handleSetup(invitationCode!, hotelId!, deviceName || 'OtelCiro-PMS')
      
      case 'refresh':
        return await handleRefresh(refreshToken!)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Beds24 Auth Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/**
 * Exchange invitation code for refresh token using GET /authentication/setup
 */
async function handleSetup(invitationCode: string, hotelId: string, deviceName: string) {
  console.log('Setting up Beds24 connection with invitation code')
  console.log('Invitation code:', invitationCode.substring(0, 20) + '...')
  console.log('Device name:', deviceName)
  
  try {
    // Use GET request with headers as per Beds24 API documentation
    const url = `${BEDS24_API_URL}/authentication/setup`
    console.log('Making request to:', url)
    
    const headers = {
      'code': invitationCode,
      'deviceName': deviceName,
      'Accept': 'application/json',
    }
    console.log('Request headers:', { ...headers, code: headers.code.substring(0, 20) + '...' })
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Setup failed with status:', response.status)
      console.error('Error response:', errorData)
      
      // Try to parse the error as JSON for better debugging
      try {
        const parsedError = JSON.parse(errorData)
        console.error('Parsed error:', parsedError)
      } catch (e) {
        console.error('Could not parse error as JSON')
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Setup failed: ${errorData}`,
          debug: {
            status: response.status,
            url: url,
            invitationCodeLength: invitationCode.length
          }
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const authData = await response.json()
    console.log('Beds24 setup response:', authData)
    
    const { token: accessToken, expiresIn, refreshToken } = authData

    if (!refreshToken || !accessToken) {
      console.error('Missing required tokens in response:', authData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing tokens in response' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Store the connection in database with simplified schema
    const { data: connection, error: dbError } = await supabase
      .from('beds24_connections')
      .insert({
        hotel_id: hotelId,
        refresh_token: refreshToken,
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + (expiresIn * 1000)).toISOString(),
        account_id: 0, // Will be updated later when we get account details
        is_active: true
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error storing connection:', dbError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Database error: ${dbError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Connection stored successfully:', connection.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          connectionId: connection.id,
          refreshToken: refreshToken,
          accessToken: accessToken,
          expiresIn: expiresIn
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Setup error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Setup failed'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

/**
 * Refresh access token using GET /authentication/token
 */
async function handleRefresh(refreshToken: string) {
  console.log('Refreshing access token')
  console.log('Using refresh token:', refreshToken.substring(0, 20) + '...')
  
  try {
    const url = `${BEDS24_API_URL}/authentication/token`
    console.log('Making token refresh request to:', url)
    
    const headers = {
      'refreshToken': refreshToken,
      'Accept': 'application/json',
    }
    console.log('Refresh request headers:', { ...headers, refreshToken: headers.refreshToken.substring(0, 20) + '...' })
    
    // Use GET request with refreshToken in header as per Beds24 API documentation
    const response = await fetch(url, {
      method: 'GET',
      headers
    })

    console.log('Refresh response status:', response.status)
    console.log('Refresh response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Token refresh failed with status:', response.status)
      console.error('Refresh error response:', errorData)
      
      // Try to parse the error as JSON for better debugging
      try {
        const parsedError = JSON.parse(errorData)
        console.error('Parsed refresh error:', parsedError)
      } catch (e) {
        console.error('Could not parse refresh error as JSON')
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Token refresh failed: ${errorData}`,
          debug: {
            status: response.status,
            url: url,
            refreshTokenLength: refreshToken.length
          }
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokenData = await response.json()
    console.log('Beds24 refresh token response:', tokenData)
    
    const { token: accessToken, expiresIn } = tokenData
    
    if (!accessToken || !expiresIn) {
      console.error('Missing required fields in refresh response:', tokenData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing tokens in refresh response' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          accessToken: accessToken,
          expiresIn: expiresIn,
          expiresAt: new Date(Date.now() + (expiresIn * 1000)).toISOString()
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Refresh token error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Token refresh failed' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

/**
 * Get a valid access token for making API calls (auto-refresh if needed)
 */
export async function getValidAccessToken(connectionId: string): Promise<string | null> {
  try {
    // Get current connection data
    const { data: connection, error } = await supabase
      .from('beds24_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (error || !connection) {
      console.error('Failed to fetch connection:', error)
      return null
    }

    // Check if current access token is still valid
    const now = new Date()
    const expiresAt = new Date(connection.token_expires_at)
    
    if (connection.access_token && expiresAt > now) {
      // Token is still valid
      return connection.access_token
    }

    // Token expired, refresh it
    console.log('Access token expired, refreshing...')
    const refreshResponse = await fetch(`${BEDS24_API_URL}/authentication/token`, {
      method: 'GET',
      headers: {
        'refreshToken': connection.refresh_token,
        'Accept': 'application/json',
      }
    })

    if (!refreshResponse.ok) {
      console.error('Token refresh failed:', await refreshResponse.text())
      return null
    }

    const tokenData = await refreshResponse.json()
    const { token: accessToken, expiresIn } = tokenData
    
    // Update database with new token
    await supabase
      .from('beds24_connections')
      .update({
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + (expiresIn * 1000)).toISOString()
      })
      .eq('id', connectionId)

    return accessToken

  } catch (error) {
    console.error('Error getting valid access token:', error)
    return null
  }
}