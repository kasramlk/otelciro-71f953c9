import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface PropertiesSyncRequest {
  connectionId: string;
}

// Test if a token is valid by making a simple API call
async function testTokenValidity(token: string): Promise<boolean> {
  try {
    const BEDS24_API_URL = Deno.env.get('BEDS24_API_URL') || 'https://api.beds24.com/v2';
    const BEDS24_ORGANIZATION = Deno.env.get('BEDS24_ORGANIZATION') || 'otelciro';
    
    console.log('Testing token validity...');
    const testResponse = await fetch(`${BEDS24_API_URL}/authentication/test`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'organization': BEDS24_ORGANIZATION,
        'token': token,
      }
    });
    
    console.log('Token test response status:', testResponse.status);
    const isValid = testResponse.ok;
    
    if (!isValid) {
      const errorText = await testResponse.text();
      console.log('Token test failed:', errorText);
    }
    
    return isValid;
  } catch (error) {
    console.error('Token test error:', error);
    return false;
  }
}

// Enhanced token refresh with multiple strategies
async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number } | null> {
  const BEDS24_API_URL = Deno.env.get('BEDS24_API_URL') || 'https://api.beds24.com/v2';
  const BEDS24_ORGANIZATION = Deno.env.get('BEDS24_ORGANIZATION') || 'otelciro';
  
  console.log('=== TOKEN REFRESH ATTEMPT ===');
  console.log('API URL:', BEDS24_API_URL);
  console.log('Organization:', BEDS24_ORGANIZATION);
  console.log('Refresh token present:', !!refreshToken);
  console.log('Refresh token length:', refreshToken?.length || 0);
  
  // Try different refresh strategies
  const strategies = [
    // Strategy 1: Header-based refresh (current approach)
    async () => {
      console.log('Trying strategy 1: header-based refresh');
      const response = await fetch(`${BEDS24_API_URL}/authentication/token`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'organization': BEDS24_ORGANIZATION,
          'refresh': refreshToken,
        },
      });
      return { response, strategy: 'header-based' };
    },
    
    // Strategy 2: Query parameter refresh
    async () => {
      console.log('Trying strategy 2: query parameter refresh');
      const response = await fetch(`${BEDS24_API_URL}/authentication/token?refreshToken=${encodeURIComponent(refreshToken)}&organization=${encodeURIComponent(BEDS24_ORGANIZATION)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return { response, strategy: 'query-parameter' };
    },
    
    // Strategy 3: POST body refresh
    async () => {
      console.log('Trying strategy 3: POST body refresh');
      const response = await fetch(`${BEDS24_API_URL}/authentication/token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'organization': BEDS24_ORGANIZATION,
        },
        body: JSON.stringify({
          refreshToken: refreshToken,
          organization: BEDS24_ORGANIZATION
        }),
      });
      return { response, strategy: 'POST-body' };
    }
  ];
  
  for (const strategy of strategies) {
    try {
      const { response, strategy: strategyName } = await strategy();
      
      console.log(`Strategy ${strategyName} response:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      const responseText = await response.text();
      console.log(`Strategy ${strategyName} response body:`, responseText);
      
      if (response.ok) {
        let refreshData;
        try {
          refreshData = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`Strategy ${strategyName} JSON parse error:`, parseError);
          continue;
        }
        
        console.log(`Strategy ${strategyName} parsed data:`, refreshData);
        
        // Handle different response formats
        let accessToken, expiresIn;
        
        if (refreshData.success && refreshData.data) {
          accessToken = refreshData.data.accessToken || refreshData.data.token;
          expiresIn = refreshData.data.expiresIn || 3600;
        } else if (refreshData.token) {
          accessToken = refreshData.token;
          expiresIn = refreshData.expiresIn || 3600;
        } else if (refreshData.accessToken) {
          accessToken = refreshData.accessToken;
          expiresIn = refreshData.expiresIn || 3600;
        }
        
        if (accessToken) {
          console.log(`Strategy ${strategyName} SUCCESS! Token obtained.`);
          return { accessToken, expiresIn };
        } else {
          console.log(`Strategy ${strategyName} failed: No access token in response`);
        }
      } else {
        console.log(`Strategy ${strategyName} failed with status:`, response.status);
      }
    } catch (error) {
      console.error(`Strategy ${strategyName} error:`, error);
    }
  }
  
  console.log('All refresh strategies failed');
  return null;
}

serve(async (req) => {
  console.log('=== BEDS24 PROPERTIES SYNC STARTED ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let connectionId: string = '';
  
  try {
    const requestBody = await req.json();
    connectionId = requestBody.connectionId;
    
    console.log('Sync request:', { connectionId });
    
    if (!connectionId) {
      throw new Error('Connection ID is required');
    }

    // Get connection details with comprehensive logging
    console.log('Fetching connection details...');
    const { data: connection, error: connError } = await supabase
      .from('beds24_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connError || !connection) {
      console.error('Connection fetch error:', connError);
      throw new Error('Connection not found or database error');
    }

    console.log('Connection details:', {
      id: connection.id,
      hotel_id: connection.hotel_id,
      account_id: connection.account_id,
      account_name: connection.account_name,
      is_active: connection.is_active,
      has_access_token: !!connection.access_token,
      access_token_length: connection.access_token?.length || 0,
      has_refresh_token: !!connection.refresh_token,
      refresh_token_length: connection.refresh_token?.length || 0,
      token_expires_at: connection.token_expires_at,
      created_at: connection.created_at,
      updated_at: connection.updated_at
    });

    // Enhanced token validation
    let accessToken = connection.access_token;
    const tokenExpiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
    const now = new Date();
    
    console.log('Token analysis:', {
      hasToken: !!accessToken,
      tokenLength: accessToken?.length || 0,
      expiresAt: tokenExpiresAt?.toISOString() || 'no expiry set',
      currentTime: now.toISOString(),
      isExpired: tokenExpiresAt ? now >= tokenExpiresAt : 'cannot determine',
      minutesUntilExpiry: tokenExpiresAt ? Math.round((tokenExpiresAt.getTime() - now.getTime()) / 60000) : 'N/A'
    });

    // Test current token if it exists and hasn't expired
    let isCurrentTokenValid = false;
    if (accessToken && (!tokenExpiresAt || tokenExpiresAt > now)) {
      console.log('Testing current token validity...');
      isCurrentTokenValid = await testTokenValidity(accessToken);
      console.log('Current token is valid:', isCurrentTokenValid);
    }

    // Refresh token if needed
    if (!accessToken || (tokenExpiresAt && now >= tokenExpiresAt) || !isCurrentTokenValid) {
      console.log('Token refresh required. Reasons:', {
        noToken: !accessToken,
        tokenExpired: tokenExpiresAt && now >= tokenExpiresAt,
        tokenInvalid: accessToken && !isCurrentTokenValid
      });
      
      if (!connection.refresh_token) {
        throw new Error('No refresh token available. Please re-authenticate the Beds24 connection.');
      }
      
      const refreshResult = await refreshAccessToken(connection.refresh_token);
      
      if (!refreshResult) {
        throw new Error('All token refresh strategies failed. Please re-authenticate the Beds24 connection.');
      }
      
      accessToken = refreshResult.accessToken;
      const newExpiresAt = new Date(now.getTime() + (refreshResult.expiresIn * 1000));
      
      console.log('Token refreshed successfully:', {
        newTokenLength: accessToken.length,
        expiresInSeconds: refreshResult.expiresIn,
        newExpiresAt: newExpiresAt.toISOString()
      });
      
      // Update token in database
      const { error: updateError } = await supabase
        .from('beds24_connections')
        .update({
          access_token: accessToken,
          token_expires_at: newExpiresAt.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', connectionId);
      
      if (updateError) {
        console.error('Failed to update token in database:', updateError);
        // Continue anyway as we have the token in memory
      } else {
        console.log('Token updated in database successfully');
      }
    }

    // Final validation before API call
    if (!accessToken) {
      throw new Error('No valid access token available');
    }

    // Test the token one more time before using it
    console.log('Final token validation before API call...');
    const isFinalTokenValid = await testTokenValidity(accessToken);
    if (!isFinalTokenValid) {
      throw new Error('Token is still invalid after refresh. Authentication may be broken.');
    }

    // Fetch properties from Beds24 with enhanced debugging
    console.log('=== MAKING BEDS24 API CALL ===');
    const BEDS24_API_URL = Deno.env.get('BEDS24_API_URL') || 'https://api.beds24.com/v2';
    const BEDS24_ORGANIZATION = Deno.env.get('BEDS24_ORGANIZATION') || 'otelciro';
    
    const apiUrl = `${BEDS24_API_URL}/properties?includeAllRooms=true`;
    const apiHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'organization': BEDS24_ORGANIZATION,
      'token': accessToken,
    };
    
    console.log('API call details:', {
      url: apiUrl,
      organization: BEDS24_ORGANIZATION,
      tokenLength: accessToken.length,
      tokenPreview: accessToken.substring(0, 20) + '...',
      headers: Object.keys(apiHeaders)
    });
    
    const propertiesResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: apiHeaders,
    });

    console.log('Properties API response:', {
      status: propertiesResponse.status,
      statusText: propertiesResponse.statusText,
      ok: propertiesResponse.ok,
      headers: Object.fromEntries(propertiesResponse.headers.entries())
    });

    const responseText = await propertiesResponse.text();
    console.log('Raw response body (first 1000 chars):', responseText.substring(0, 1000));

    if (!propertiesResponse.ok) {
      console.error('Properties fetch failed:', {
        status: propertiesResponse.status,
        statusText: propertiesResponse.statusText,
        body: responseText
      });
      throw new Error(`Failed to fetch properties: ${propertiesResponse.status} - ${responseText}`);
    }

    let propertiesData;
    try {
      propertiesData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid JSON response from Beds24 properties API');
    }

    console.log('Parsed properties data structure:', {
      hasSuccess: 'success' in propertiesData,
      success: propertiesData.success,
      hasData: 'data' in propertiesData,
      dataType: Array.isArray(propertiesData.data) ? 'array' : typeof propertiesData.data,
      dataLength: propertiesData.data?.length || 0,
      isDirectArray: Array.isArray(propertiesData),
      keys: Object.keys(propertiesData)
    });
    
    // Handle different response formats from Beds24 API
    let properties = [];
    if (propertiesData.success && propertiesData.data && Array.isArray(propertiesData.data)) {
      properties = propertiesData.data;
    } else if (Array.isArray(propertiesData.data)) {
      properties = propertiesData.data;
    } else if (Array.isArray(propertiesData)) {
      properties = propertiesData;
    } else {
      console.error('Unexpected properties response format:', propertiesData);
      throw new Error('Unexpected properties response format from Beds24');
    }
    
    console.log(`Found ${properties.length} properties to process`);

    if (properties.length === 0) {
      console.log('No properties found in response. This might indicate an authentication or permission issue.');
    }

    // Process and store properties
    const processedProperties = [];
    const processedRooms = [];

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      console.log(`Processing property ${i + 1}/${properties.length}:`, {
        id: property.id,
        name: property.name,
        currency: property.currency,
        hasRoomTypes: !!property.roomTypes,
        roomTypesCount: property.roomTypes?.length || 0
      });
      
      try {
        // Insert/update property using upsert
        const { data: upsertedProperty, error: upsertError } = await supabase
          .from('beds24_properties')
          .upsert({
            connection_id: connectionId,
            hotel_id: connection.hotel_id,
            beds24_property_id: property.id,
            property_name: property.name,
            property_code: property.code || null,
            property_status: property.status || 'active',
            currency: property.currency || 'USD',
            sync_enabled: true,
            sync_settings: {
              sync_rates: true,
              sync_bookings: true,
              sync_inventory: true,
              sync_restrictions: true
            },
            last_rates_sync: now.toISOString(),
            updated_at: now.toISOString()
          }, {
            onConflict: 'connection_id,beds24_property_id'
          })
          .select('*')
          .single();
        
        if (upsertError) {
          console.error('Property upsert error:', upsertError);
          continue;
        }

        console.log('Property processed successfully:', upsertedProperty.id);
        processedProperties.push(upsertedProperty);

        // Process room types for this property
        if (property.roomTypes && Array.isArray(property.roomTypes)) {
          console.log(`Processing ${property.roomTypes.length} room types for property ${property.name}`);
          
          for (let j = 0; j < property.roomTypes.length; j++) {
            const room = property.roomTypes[j];
            console.log(`Processing room ${j + 1}/${property.roomTypes.length}:`, {
              id: room.id,
              name: room.name,
              type: room.roomType,
              maxPeople: room.maxPeople
            });
            
            try {
              const { data: upsertedRoom, error: roomUpsertError } = await supabase
                .from('beds24_rooms')
                .upsert({
                  beds24_property_id: upsertedProperty.id,
                  hotel_id: connection.hotel_id,
                  beds24_room_id: room.id,
                  room_name: room.name,
                  room_code: room.code || room.name,
                  max_occupancy: room.maxPeople || 2,
                  sync_enabled: true,
                  room_settings: {
                    room_type: room.roomType || 'standard',
                    qty: room.qty || 1,
                    min_price: room.minPrice || 0,
                    max_adult: room.maxAdult || room.maxPeople || 2,
                    max_children: room.maxChildren || 0,
                    original_data: room
                  },
                  updated_at: now.toISOString()
                }, {
                  onConflict: 'beds24_property_id,beds24_room_id'
                })
                .select('*')
                .single();
              
              if (roomUpsertError) {
                console.error('Room upsert error:', roomUpsertError);
                continue;
              }

              console.log('Room processed successfully:', upsertedRoom.id);
              processedRooms.push(upsertedRoom);
            } catch (roomError) {
              console.error(`Error processing room ${room.name}:`, roomError);
            }
          }
        } else {
          console.log(`No room types found for property ${property.name}`);
        }
      } catch (propertyError) {
        console.error(`Error processing property ${property.name}:`, propertyError);
      }
    }

    // Log successful API usage
    try {
      await supabase
        .from('beds24_api_logs')
        .insert({
          connection_id: connectionId,
          endpoint: '/properties',
          method: 'GET',
          success: true,
          response_status: propertiesResponse.status,
          response_body: { 
            count: properties.length,
            processed_properties: processedProperties.length,
            processed_rooms: processedRooms.length
          },
          credits_used: 1,
          created_at: now.toISOString()
        });
    } catch (logError) {
      console.error('Failed to log API usage:', logError);
    }

    const successMessage = `Successfully synced ${processedProperties.length} properties and ${processedRooms.length} rooms from Beds24`;
    console.log('=== SYNC COMPLETED SUCCESSFULLY ===');
    console.log(successMessage);

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage,
        data: {
          properties: processedProperties,
          rooms: processedRooms,
          synced_at: now.toISOString(),
          counts: {
            properties: processedProperties.length,
            rooms: processedRooms.length
          }
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('=== SYNC FAILED ===');
    console.error('Error in properties sync:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error.constructor.name);
    console.error('Error stack:', error.stack);
    
    // Log failed API usage
    try {
      if (connectionId) {
        await supabase
          .from('beds24_api_logs')
          .insert({
            connection_id: connectionId,
            endpoint: '/properties',
            method: 'GET',
            success: false,
            error_message: error instanceof Error ? error.message : String(error),
            response_body: { 
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            },
            credits_used: 1,
            created_at: new Date().toISOString()
          });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});