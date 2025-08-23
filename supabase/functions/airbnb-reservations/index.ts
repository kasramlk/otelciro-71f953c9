import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { connectionId, action = 'import' } = await req.json();
    console.log(`Starting reservation ${action} for connection: ${connectionId}`);

    // Get connection details
    const { data: connection, error: connectionError } = await supabaseClient
      .from('airbnb_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection) {
      throw new Error('Connection not found');
    }

    // Check token validity
    const now = new Date();
    const tokenExpiry = new Date(connection.token_expires_at || 0);
    
    let accessToken = connection.access_token;
    
    if (tokenExpiry <= now && connection.refresh_token) {
      console.log('Token expired, refreshing...');
      accessToken = await refreshToken(connection, supabaseClient);
    }

    if (action === 'import') {
      const result = await importReservations(connection, accessToken, supabaseClient);
      
      return new Response(JSON.stringify({ 
        success: true,
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error(`Unsupported action: ${action}`);
    }

  } catch (error) {
    console.error('Error in airbnb-reservations:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function refreshToken(connection: any, supabaseClient: any): Promise<string> {
  const apiKey = Deno.env.get('AIRBNB_API_KEY');
  const apiSecret = Deno.env.get('AIRBNB_API_SECRET');

  const response = await fetch('https://api.airbnb.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${apiKey}:${apiSecret}`)}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: connection.refresh_token
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const tokenData = await response.json();

  // Update connection with new token
  await supabaseClient
    .from('airbnb_connections')
    .update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || connection.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    })
    .eq('id', connection.id);

  return tokenData.access_token;
}

async function importReservations(connection: any, accessToken: string, supabaseClient: any) {
  console.log('Importing reservations from Airbnb...');
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Get active listings for this connection
    const { data: listings } = await supabaseClient
      .from('airbnb_listings')
      .select('*')
      .eq('connection_id', connection.id)
      .eq('is_active', true);

    if (!listings || listings.length === 0) {
      console.log('No active listings found for connection');
      return { imported, skipped, errors };
    }

    // Import reservations for each listing
    for (const listing of listings) {
      try {
        console.log(`Fetching reservations for listing: ${listing.airbnb_listing_id}`);
        
        const response = await fetch(`https://api.airbnb.com/v1/listings/${listing.airbnb_listing_id}/reservations`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error(`Failed to fetch reservations for listing ${listing.airbnb_listing_id}: ${response.status}`);
          errors++;
          continue;
        }

        const data = await response.json();
        const reservations = data.reservations || [];

        console.log(`Found ${reservations.length} reservations for listing ${listing.airbnb_listing_id}`);

        for (const reservation of reservations) {
          try {
            // Check if reservation already exists
            const { data: existingReservation } = await supabaseClient
              .from('airbnb_reservations')
              .select('*')
              .eq('connection_id', connection.id)
              .eq('airbnb_reservation_id', reservation.id.toString())
              .single();

            if (existingReservation) {
              // Update existing reservation
              await supabaseClient
                .from('airbnb_reservations')
                .update({
                  status: mapReservationStatus(reservation.status),
                  airbnb_status: reservation.status,
                  total_amount: reservation.total_price?.amount || 0,
                  currency: reservation.total_price?.currency || 'USD',
                  reservation_data: reservation
                })
                .eq('id', existingReservation.id);
              
              skipped++;
            } else {
              // Create new reservation record
              const reservationData = {
                connection_id: connection.id,
                airbnb_reservation_id: reservation.id.toString(),
                airbnb_listing_id: listing.airbnb_listing_id,
                guest_name: `${reservation.guest?.first_name || ''} ${reservation.guest?.last_name || ''}`.trim(),
                guest_email: reservation.guest?.email,
                guest_phone: reservation.guest?.phone,
                check_in: reservation.check_in,
                check_out: reservation.check_out,
                adults: reservation.guest_details?.adults || 1,
                children: reservation.guest_details?.children || 0,
                total_amount: reservation.total_price?.amount || 0,
                currency: reservation.total_price?.currency || 'USD',
                status: mapReservationStatus(reservation.status),
                airbnb_status: reservation.status,
                special_requests: reservation.special_requests,
                reservation_data: reservation
              };

              const { error: insertError } = await supabaseClient
                .from('airbnb_reservations')
                .insert(reservationData);

              if (insertError) {
                console.error(`Failed to insert reservation ${reservation.id}:`, insertError);
                errors++;
              } else {
                imported++;

                // Optionally create a PMS reservation
                if (listing.room_type_id && listing.room_type_id !== '00000000-0000-0000-0000-000000000000') {
                  await createPMSReservation(reservationData, listing, supabaseClient);
                }
              }
            }
          } catch (error) {
            console.error(`Error processing reservation ${reservation.id}:`, error);
            errors++;
          }
        }
      } catch (error) {
        console.error(`Error fetching reservations for listing ${listing.airbnb_listing_id}:`, error);
        errors++;
      }
    }

  } catch (error) {
    console.error('Error importing reservations:', error);
    throw error;
  }

  return { imported, skipped, errors };
}

function mapReservationStatus(airbnbStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'accepted': 'confirmed',
    'pending': 'pending',
    'declined': 'cancelled',
    'cancelled': 'cancelled',
    'expired': 'cancelled',
    'at_checkpoint': 'confirmed'
  };
  
  return statusMap[airbnbStatus] || 'pending';
}

async function createPMSReservation(airbnbReservation: any, listing: any, supabaseClient: any) {
  try {
    // First, create or get guest record
    let guestId = null;
    
    if (airbnbReservation.guest_email) {
      const { data: existingGuest } = await supabaseClient
        .from('guests')
        .select('*')
        .eq('hotel_id', listing.hotel_id)
        .eq('email', airbnbReservation.guest_email)
        .single();

      if (existingGuest) {
        guestId = existingGuest.id;
      } else {
        // Create new guest
        const guestNames = airbnbReservation.guest_name.split(' ');
        const { data: newGuest, error: guestError } = await supabaseClient
          .from('guests')
          .insert({
            hotel_id: listing.hotel_id,
            first_name: guestNames[0] || 'Airbnb',
            last_name: guestNames.slice(1).join(' ') || 'Guest',
            email: airbnbReservation.guest_email,
            phone: airbnbReservation.guest_phone
          })
          .select()
          .single();

        if (!guestError && newGuest) {
          guestId = newGuest.id;
        }
      }
    }

    // Create PMS reservation
    if (guestId) {
      const { error: reservationError } = await supabaseClient
        .from('reservations')
        .insert({
          hotel_id: listing.hotel_id,
          guest_id: guestId,
          room_type_id: listing.room_type_id,
          check_in: airbnbReservation.check_in,
          check_out: airbnbReservation.check_out,
          adults: airbnbReservation.adults,
          children: airbnbReservation.children,
          status: airbnbReservation.status,
          booking_source: 'Airbnb',
          total_amount: airbnbReservation.total_amount,
          currency: airbnbReservation.currency,
          special_requests: airbnbReservation.special_requests,
          external_booking_id: airbnbReservation.airbnb_reservation_id
        });

      if (reservationError) {
        console.error('Failed to create PMS reservation:', reservationError);
      } else {
        console.log(`Created PMS reservation for Airbnb booking ${airbnbReservation.airbnb_reservation_id}`);
      }
    }
  } catch (error) {
    console.error('Error creating PMS reservation:', error);
  }
}