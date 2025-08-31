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

    // Get connection details
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
      token_expires_at: connection.token_expires_at,
      created_at: connection.created_at,
      updated_at: connection.updated_at
    });

    // Use stored access token directly (no complex refresh logic)
    const accessToken = connection.access_token;
    
    if (!accessToken) {
      throw new Error('No access token available. Please update the token manually in Token Management.');
    }

    const tokenExpiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
    const now = new Date();
    
    if (tokenExpiresAt && now >= tokenExpiresAt) {
      throw new Error('Access token has expired. Please update the token manually in Token Management.');
    }

    // Make API call to Beds24
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
    });
    
    const propertiesResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: apiHeaders,
    });

    console.log('Properties API response:', {
      status: propertiesResponse.status,
      statusText: propertiesResponse.statusText,
      ok: propertiesResponse.ok,
    });

    const responseText = await propertiesResponse.text();
    console.log('Raw response body (first 500 chars):', responseText.substring(0, 500));

    if (!propertiesResponse.ok) {
      if (propertiesResponse.status === 401) {
        throw new Error('Token is invalid or expired. Please update the token manually in Token Management.');
      }
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
      console.log('No properties found in response.');
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
            propertiesCount: properties.length,
            processedProperties: processedProperties.length,
            processedRooms: processedRooms.length
          },
          response_time_ms: 0, // We don't track this in simplified version
          credits_used: 1,
          created_at: now.toISOString()
        });
    } catch (logError) {
      console.error('Failed to log API usage:', logError);
    }

    // Update last sync time
    try {
      await supabase
        .from('beds24_properties')
        .update({ last_rates_sync: now.toISOString() })
        .eq('connection_id', connectionId);
    } catch (updateError) {
      console.error('Failed to update last sync time:', updateError);
    }

    console.log('=== SYNC COMPLETED SUCCESSFULLY ===');
    console.log('Summary:', {
      propertiesProcessed: processedProperties.length,
      roomsProcessed: processedRooms.length,
      totalApiCalls: 1,
      syncTime: now.toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        properties: processedProperties,
        rooms: processedRooms,
        summary: {
          propertiesProcessed: processedProperties.length,
          roomsProcessed: processedRooms.length,
          syncTime: now.toISOString()
        }
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== SYNC FAILED ===');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error in properties sync:', error);
    console.error('Error stack:', error?.stack);

    // Log failed API usage
    if (connectionId) {
      try {
        await supabase
          .from('beds24_api_logs')
          .insert({
            connection_id: connectionId,
            endpoint: '/properties',
            method: 'GET',
            success: false,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            response_status: null,
            response_body: { error: error instanceof Error ? error.message : 'Unknown error' },
            created_at: new Date().toISOString()
          });
      } catch (logError) {
        console.error('Failed to log API error:', logError);
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: {
        type: error?.constructor?.name || 'Unknown',
        message: error instanceof Error ? error.message : String(error)
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});