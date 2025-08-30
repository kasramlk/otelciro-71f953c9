import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Beds24 API v2 Configuration - Following OAuth2 specification
const BEDS24_API_URL = 'https://api.beds24.com/v2'

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface AuthRequest {
  action: 'exchange_invitation' | 'refresh_token' | 'test_connection'
  invitationToken?: string
  refreshToken?: string
  connectionId?: string
  hotelId?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, invitationToken, refreshToken, connectionId, hotelId }: AuthRequest = await req.json()
    
    console.log(`Beds24 Auth: ${action}`, { invitationToken: invitationToken ? '[PROVIDED]' : '[MISSING]' })

    switch (action) {
      case 'exchange_invitation':
        return await handleExchangeInvitation(invitationToken!, hotelId!)
      
      case 'refresh_token':
        return await handleRefreshToken(refreshToken!)
      
      case 'test_connection':
        return await handleTestConnection(connectionId!)
      
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
 * Exchange invitation token for refresh token (OAuth2 Step 1)
 * This happens once when setting up the connection
 */
async function handleExchangeInvitation(invitationToken: string, hotelId: string) {
  console.log('Exchanging invitation token for refresh token')
  
  try {
    // Step 1: Exchange invitation token for refresh token with Beds24
    const response = await fetch(`${BEDS24_API_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: "invitation",
        invitation: invitationToken
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Beds24 invitation exchange failed:', errorData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Beds24 API Error: ${response.status} - ${errorData}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const authData = await response.json()
    console.log('Beds24 authentication response:', authData)

    // Handle different possible response formats from Beds24
    const refreshToken = authData.refresh_token || authData.refreshToken
    const accessToken = authData.access_token || authData.accessToken  
    const expiresIn = authData.expires_in || authData.expiresIn || 3600
    const accountId = authData.account_id || authData.accountId
    const accountName = authData.account_name || authData.accountName || ''
    const accountEmail = authData.account_email || authData.accountEmail || ''

    if (!refreshToken || !accessToken) {
      console.error('Missing required tokens in response:', authData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid response from Beds24: missing tokens' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 2: Store the connection in our database
    const { data: connection, error: dbError } = await supabase
      .from('beds24_connections')
      .insert({
        hotel_id: hotelId,
        invitation_token: invitationToken,
        refresh_token: refreshToken,
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + (expiresIn * 1000)).toISOString(),
        account_id: accountId,
        account_name: accountName,
        account_email: accountEmail,
        connection_status: 'active',
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

    // Step 3: Fetch and store properties for this connection
    await syncProperties(connection.id, accessToken)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          connectionId: connection.id,
          accountId: accountId,
          accountName: accountName,
          message: 'Connection established successfully'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Exchange invitation error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Exchange failed' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

/**
 * Refresh access token using refresh token (OAuth2 Step 2)
 * This happens automatically when access token expires
 */
async function handleRefreshToken(refreshToken: string) {
  console.log('Refreshing access token')
  
  try {
    const refreshResponse = await fetch(`${BEDS24_API_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken
      })
    })

    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.text()
      console.error('Token refresh failed:', errorData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Token refresh failed: ${refreshResponse.status} - ${errorData}` 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokenData = await refreshResponse.json()
    console.log('Beds24 refresh token response:', tokenData)
    
    // Handle different possible response formats
    const accessToken = tokenData.access_token || tokenData.accessToken
    const expiresIn = tokenData.expires_in || tokenData.expiresIn || 3600
    
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
 * Test existing connection by refreshing token and making a test API call
 */
async function handleTestConnection(connectionId: string) {
  console.log('Testing connection:', connectionId)
  
  try {
    // Get connection details from database
    const { data: connection, error: fetchError } = await supabase
      .from('beds24_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (fetchError || !connection) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Connection not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get valid access token (refresh if needed)
    const accessToken = await getValidAccessToken(connectionId)
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to get valid access token' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Test API call to accounts endpoint using Bearer token
    const testResponse = await fetch(`${BEDS24_API_URL}/accounts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!testResponse.ok) {
      const errorData = await testResponse.text()
      console.error('Test API call failed:', errorData)
      
      // Update connection status
      await supabase
        .from('beds24_connections')
        .update({ 
          connection_status: 'error',
          sync_errors: [{ error: `API test failed: ${errorData}`, timestamp: new Date().toISOString() }]
        })
        .eq('id', connectionId)

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `API test failed: ${testResponse.status} - ${errorData}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const accountData = await testResponse.json()
    
    // Update connection status
    await supabase
      .from('beds24_connections')
      .update({ 
        connection_status: 'active',
        last_sync_at: new Date().toISOString(),
        sync_errors: []
      })
      .eq('id', connectionId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          connectionId,
          status: 'active',
          accounts: accountData,
          message: 'Connection test successful'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Test connection error:', error)
    
    // Update connection status to error
    await supabase
      .from('beds24_connections')
      .update({ 
        connection_status: 'error',
        sync_errors: [{ error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date().toISOString() }]
      })
      .eq('id', connectionId)

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

/**
 * Get a valid access token for a connection (refresh if expired)
 */
async function getValidAccessToken(connectionId: string): Promise<string | null> {
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

    // Token expired, refresh it using proper OAuth2 flow
    console.log('Access token expired, refreshing...')
    const refreshResponse = await fetch(`${BEDS24_API_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: connection.refresh_token
      })
    })

    if (!refreshResponse.ok) {
      console.error('Token refresh failed:', await refreshResponse.text())
      return null
    }

    const tokenData = await refreshResponse.json()
    console.log('Token refresh response:', tokenData)
    
    // Handle different possible response formats
    const accessToken = tokenData.access_token || tokenData.accessToken
    const expiresIn = tokenData.expires_in || tokenData.expiresIn || 3600
    
    // Update the database with new token
    const { error: updateError } = await supabase
      .from('beds24_connections')
      .update({
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + (expiresIn * 1000)).toISOString()
      })
      .eq('id', connectionId)

    if (updateError) {
      console.error('Failed to update token in database:', updateError)
      return null
    }

    return accessToken

  } catch (error) {
    console.error('Error getting valid access token:', error)
    return null
  }
}

/**
 * Sync properties for a connection after successful authentication
 */
async function syncProperties(connectionId: string, accessToken: string) {
  try {
    console.log('Syncing properties for connection:', connectionId)
    
    // Get connection details
    const { data: connection } = await supabase
      .from('beds24_connections')
      .select('hotel_id')
      .eq('id', connectionId)
      .single()

    if (!connection) return

    // Fetch properties from Beds24 using Bearer token
    const response = await fetch(`${BEDS24_API_URL}/properties`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Failed to fetch properties:', await response.text())
      return
    }

    const properties = await response.json()
    console.log('Fetched properties:', properties.length)

    // Insert/update properties in database
    for (const property of properties) {
      const { error } = await supabase
        .from('beds24_properties')
        .upsert({
          connection_id: connectionId,
          hotel_id: connection.hotel_id,
          beds24_property_id: property.propertyId,
          property_name: property.name || `Property ${property.propertyId}`,
          property_code: property.code,
          currency: property.currency || 'USD',
          property_status: 'active'
        }, {
          onConflict: 'connection_id, beds24_property_id'
        })

      if (error) {
        console.error('Error upserting property:', error)
      }
    }

  } catch (error) {
    console.error('Error syncing properties:', error)
  }
}