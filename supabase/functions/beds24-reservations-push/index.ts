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

interface ReservationPushRequest {
  connectionId: string;
  reservations: Array<{
    propertyId: number;
    roomId: number;
    arrival: string;
    departure: string;
    numAdult: number;
    numChild?: number;
    firstName: string;
    lastName: string;
    email: string;
    mobile?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    status?: string;
    comment?: string;
    amounts?: {
      total?: number;
      deposit?: number;
      tax?: number;
    };
    invoiceItems?: Array<{
      code: string;
      description: string;
      price: number;
      qty?: number;
    }>;
    infoItems?: Array<{
      code: string;
      text?: string;
    }>;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Reservations push function called');
    const { connectionId, reservations }: ReservationPushRequest = await req.json();
    
    if (!connectionId || !reservations || !Array.isArray(reservations)) {
      throw new Error('Connection ID and reservations array are required');
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

    // Push reservations to Beds24
    console.log(`Pushing ${reservations.length} reservations to Beds24...`);
    const pushResponse = await fetch(`${BEDS24_API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'organization': BEDS24_ORGANIZATION,
        'token': accessToken,
      },
      body: JSON.stringify(reservations),
    });

    if (!pushResponse.ok) {
      const errorText = await pushResponse.text();
      throw new Error(`Failed to push reservations: ${pushResponse.status} ${errorText}`);
    }

    const responseData = await pushResponse.json();
    console.log('Reservations pushed successfully:', responseData);

    // Process the response and update our local records
    const results = [];
    if (Array.isArray(responseData)) {
      for (let i = 0; i < responseData.length; i++) {
        const result = responseData[i];
        const originalReservation = reservations[i];
        
        if (result.success && result.bookingId) {
          // Get the property UUID from our database
          const { data: property } = await supabase
            .from('beds24_properties')
            .select('id, hotel_id')
            .eq('connection_id', connectionId)
            .eq('beds24_property_id', originalReservation.propertyId)
            .single();

          if (property) {
            // Store the booking record
            const { data: booking } = await supabase
              .from('beds24_bookings')
              .insert({
                connection_id: connectionId,
                beds24_property_id: property.id,
                beds24_booking_id: result.bookingId,
                hotel_id: property.hotel_id,
                beds24_room_id: originalReservation.roomId,
                arrival: originalReservation.arrival,
                departure: originalReservation.departure,
                num_adult: originalReservation.numAdult,
                num_child: originalReservation.numChild || 0,
                status: originalReservation.status || 'confirmed',
                guest_info: {
                  firstName: originalReservation.firstName,
                  lastName: originalReservation.lastName,
                  email: originalReservation.email,
                  mobile: originalReservation.mobile,
                  address1: originalReservation.address1,
                  address2: originalReservation.address2,
                  city: originalReservation.city,
                  state: originalReservation.state,
                  postcode: originalReservation.postcode,
                  country: originalReservation.country,
                },
                amounts: originalReservation.amounts || {},
                invoice_items: originalReservation.invoiceItems || [],
                booking_data: {
                  comment: originalReservation.comment,
                  infoItems: originalReservation.infoItems || [],
                },
                imported_at: now.toISOString(),
              })
              .select('*')
              .single();

            results.push({
              success: true,
              beds24_booking_id: result.bookingId,
              local_booking_id: booking?.id,
              original_data: originalReservation,
            });
          } else {
            results.push({
              success: false,
              error: `Property not found for ID: ${originalReservation.propertyId}`,
              original_data: originalReservation,
            });
          }
        } else {
          results.push({
            success: false,
            error: result.error || 'Unknown error from Beds24',
            original_data: originalReservation,
          });
        }
      }
    }

    // Log API usage
    await supabase
      .from('beds24_api_usage')
      .insert({
        connection_id: connectionId,
        endpoint: '/bookings',
        method: 'POST',
        success: true,
      });

    const successCount = results.filter(r => r.success).length;
    console.log(`Successfully pushed ${successCount}/${reservations.length} reservations`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          total_reservations: reservations.length,
          successful_pushes: successCount,
          results: results,
          pushed_at: now.toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in reservations push:', error);
    
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