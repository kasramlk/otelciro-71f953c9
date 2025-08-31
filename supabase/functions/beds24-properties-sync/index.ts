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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Properties sync function called');
    const { connectionId }: PropertiesSyncRequest = await req.json();
    
    if (!connectionId) {
      throw new Error('Connection ID is required');
    }

    console.log('Syncing properties for connection:', connectionId);

    // Get connection details
    const { data: connection, error: connError } = await supabase
      .from('beds24_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connError || !connection) {
      console.error('Connection error:', connError);
      throw new Error('Connection not found');
    }

    console.log('Connection found, checking token validity...');

    // Ensure we have a valid token
    let accessToken = connection.access_token;
    const tokenExpiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
    const now = new Date();

    if (!accessToken || !tokenExpiresAt || tokenExpiresAt <= now) {
      console.log('Token expired or missing, refreshing...');
      
      const BEDS24_API_URL = Deno.env.get('BEDS24_API_URL') || 'https://api.beds24.com/v2';
      const BEDS24_ORGANIZATION = Deno.env.get('BEDS24_ORGANIZATION') || 'otelciro';
      
      const refreshResponse = await fetch(`${BEDS24_API_URL}/authentication/token`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'organization': BEDS24_ORGANIZATION,
          'refresh': connection.refresh_token,
        },
      });

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        console.error('Token refresh failed:', refreshResponse.status, errorText);
        throw new Error(`Failed to refresh token: ${refreshResponse.status} - ${errorText}`);
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.token;

      // Update connection with new token
      const expiresAt = new Date(now.getTime() + (refreshData.expiresIn * 1000));
      const { error: updateError } = await supabase
        .from('beds24_connections')
        .update({ 
          access_token: accessToken,
          token_expires_at: expiresAt.toISOString(),
        })
        .eq('id', connectionId);

      if (updateError) {
        console.error('Failed to update token:', updateError);
        throw new Error('Failed to update token in database');
      }

      console.log('Token refreshed successfully');
    }

    // Fetch properties from Beds24
    console.log('Fetching properties from Beds24...');
    const BEDS24_API_URL = Deno.env.get('BEDS24_API_URL') || 'https://api.beds24.com/v2';
    const BEDS24_ORGANIZATION = Deno.env.get('BEDS24_ORGANIZATION') || 'otelciro';
    
    const propertiesResponse = await fetch(`${BEDS24_API_URL}/properties?includeAllRooms=true`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'organization': BEDS24_ORGANIZATION,
        'token': accessToken,
      },
    });

    if (!propertiesResponse.ok) {
      const errorText = await propertiesResponse.text();
      console.error('Failed to fetch properties:', propertiesResponse.status, errorText);
      throw new Error(`Failed to fetch properties: ${propertiesResponse.status} - ${errorText}`);
    }

    const propertiesData = await propertiesResponse.json();
    console.log('Raw properties response:', JSON.stringify(propertiesData, null, 2));
    
    // Handle different response formats from Beds24 API
    let properties = [];
    if (propertiesData.data && Array.isArray(propertiesData.data)) {
      properties = propertiesData.data;
    } else if (Array.isArray(propertiesData)) {
      properties = propertiesData;
    } else {
      console.log('Unexpected properties response format:', propertiesData);
    }
    
    console.log(`Found ${properties.length} properties to sync`);

    // Process and store properties
    const processedProperties = [];
    const processedRooms = [];

    for (const property of properties) {
      console.log('Processing property:', property.id, property.name);
      
      // Insert/update property
      const { data: existingProperty } = await supabase
        .from('beds24_properties')
        .select('id')
        .eq('connection_id', connectionId)
        .eq('beds24_property_id', property.id)
        .single();

      let propertyId;
      if (existingProperty) {
        console.log('Updating existing property:', existingProperty.id);
        const { data: updatedProperty, error: updateError } = await supabase
          .from('beds24_properties')
          .update({
            property_name: property.name,
            property_code: property.code || null,
            property_status: property.status || 'active',
            last_rates_sync: now.toISOString(),
          })
          .eq('id', existingProperty.id)
          .select('id')
          .single();
        
        if (updateError) {
          console.error('Error updating property:', updateError);
          continue;
        }
        propertyId = updatedProperty?.id;
      } else {
        console.log('Creating new property:', property.name);
        const { data: newProperty, error: insertError } = await supabase
          .from('beds24_properties')
          .insert({
            connection_id: connectionId,
            hotel_id: connection.hotel_id,
            beds24_property_id: property.id,
            property_name: property.name,
            property_code: property.code || null,
            property_status: property.status || 'active',
            last_rates_sync: now.toISOString(),
          })
          .select('id')
          .single();
        
        if (insertError) {
          console.error('Error inserting property:', insertError);
          continue;
        }
        propertyId = newProperty?.id;
      }

      if (propertyId) {
        processedProperties.push({
          id: propertyId,
          beds24_property_id: property.id,
          name: property.name,
        });

        // Process room types for this property
        if (property.roomTypes && Array.isArray(property.roomTypes)) {
          console.log(`Processing ${property.roomTypes.length} room types for property ${property.name}`);
          
          for (const room of property.roomTypes) {
            console.log('Processing room:', room.id, room.name);
            
            // Insert/update room
            const { data: existingRoom } = await supabase
              .from('beds24_rooms')
              .select('id')
              .eq('beds24_property_id', propertyId)
              .eq('beds24_room_id', room.id)
              .single();

            if (existingRoom) {
              const { error: roomUpdateError } = await supabase
                .from('beds24_rooms')
                .update({
                  room_name: room.name,
                  room_code: room.code || null,
                  max_occupancy: room.maxPeople || 2,
                  room_settings: room || {},
                })
                .eq('id', existingRoom.id);
              
              if (roomUpdateError) {
                console.error('Error updating room:', roomUpdateError);
              }
            } else {
              const { data: newRoom, error: roomInsertError } = await supabase
                .from('beds24_rooms')
                .insert({
                  beds24_property_id: propertyId,
                  hotel_id: connection.hotel_id,
                  beds24_room_id: room.id,
                  room_name: room.name,
                  room_code: room.code || null,
                  max_occupancy: room.maxPeople || 2,
                  room_settings: room || {},
                })
                .select('*')
                .single();
              
              if (roomInsertError) {
                console.error('Error inserting room:', roomInsertError);
              } else if (newRoom) {
                processedRooms.push(newRoom);
              }
            }
          }
        }
      }
    }

    // Log API usage
    await supabase
      .from('beds24_api_usage')
      .insert({
        connection_id: connectionId,
        endpoint: '/properties',
        method: 'GET',
        success: true,
      });

    console.log(`Successfully processed ${processedProperties.length} properties and ${processedRooms.length} rooms`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          properties: processedProperties,
          rooms: processedRooms,
          synced_at: now.toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in properties sync:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});