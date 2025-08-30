import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BEDS24_API_URL = 'https://api.beds24.com/v2';
const BEDS24_ORGANIZATION = 'otelciro';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

    // Get connection details
    const { data: connection, error: connError } = await supabase
      .from('beds24_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connError || !connection) {
      throw new Error('Connection not found');
    }

    // Ensure we have a valid token
    let accessToken = connection.access_token;
    const tokenExpiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
    const now = new Date();

    if (!accessToken || !tokenExpiresAt || tokenExpiresAt <= now) {
      console.log('Token expired, refreshing...');
      
      const refreshResponse = await fetch(`${BEDS24_API_URL}/authentication/token`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'organization': BEDS24_ORGANIZATION,
          'refresh': connection.refresh_token,
        },
      });

      if (!refreshResponse.ok) {
        throw new Error(`Failed to refresh token: ${refreshResponse.status}`);
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.token;

      // Update connection with new token
      const expiresAt = new Date(now.getTime() + (refreshData.expiresIn * 1000));
      await supabase
        .from('beds24_connections')
        .update({ 
          access_token: accessToken,
          token_expires_at: expiresAt.toISOString(),
        })
        .eq('id', connectionId);
    }

    // Fetch properties with all rooms
    console.log('Fetching properties from Beds24...');
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
      throw new Error(`Failed to fetch properties: ${propertiesResponse.status} ${errorText}`);
    }

    const propertiesData = await propertiesResponse.json();
    console.log(`Fetched ${propertiesData.length || 0} properties`);

    // Process and store properties
    const processedProperties = [];
    const processedRooms = [];

    for (const property of propertiesData) {
      // Insert/update property
      const { data: existingProperty } = await supabase
        .from('beds24_properties')
        .select('id')
        .eq('connection_id', connectionId)
        .eq('beds24_property_id', property.propId)
        .single();

      let propertyId;
      if (existingProperty) {
        const { data: updatedProperty } = await supabase
          .from('beds24_properties')
          .update({
            property_name: property.propName,
            property_code: property.propCode || null,
            property_status: property.status || 'active',
            last_rates_sync: now.toISOString(),
          })
          .eq('id', existingProperty.id)
          .select('id')
          .single();
        propertyId = updatedProperty?.id;
      } else {
        const { data: newProperty } = await supabase
          .from('beds24_properties')
          .insert({
            connection_id: connectionId,
            hotel_id: connection.hotel_id,
            beds24_property_id: property.propId,
            property_name: property.propName,
            property_code: property.propCode || null,
            property_status: property.status || 'active',
            last_rates_sync: now.toISOString(),
          })
          .select('id')
          .single();
        propertyId = newProperty?.id;
      }

      if (propertyId) {
        processedProperties.push({
          id: propertyId,
          beds24_property_id: property.propId,
          name: property.propName,
        });

        // Process rooms for this property
        if (property.rooms && Array.isArray(property.rooms)) {
          for (const room of property.rooms) {
            // Insert/update room
            const { data: existingRoom } = await supabase
              .from('beds24_rooms')
              .select('id')
              .eq('beds24_property_id', propertyId)
              .eq('beds24_room_id', room.roomId)
              .single();

            if (existingRoom) {
              await supabase
                .from('beds24_rooms')
                .update({
                  room_name: room.roomName,
                  room_code: room.roomCode || null,
                  max_occupancy: room.maxOccupancy || 2,
                  room_settings: room.settings || {},
                })
                .eq('id', existingRoom.id);
            } else {
              const { data: newRoom } = await supabase
                .from('beds24_rooms')
                .insert({
                  beds24_property_id: propertyId,
                  hotel_id: connection.hotel_id,
                  beds24_room_id: room.roomId,
                  room_name: room.roomName,
                  room_code: room.roomCode || null,
                  max_occupancy: room.maxOccupancy || 2,
                  room_settings: room.settings || {},
                })
                .select('*')
                .single();
              
              if (newRoom) {
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

    console.log(`Processed ${processedProperties.length} properties and ${processedRooms.length} rooms`);

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
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});