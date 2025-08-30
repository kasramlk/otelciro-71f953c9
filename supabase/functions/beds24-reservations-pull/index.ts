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

interface ReservationsPullRequest {
  connectionId: string;
  propertyId?: string;
  filter?: 'arrivals' | 'departures' | 'new' | 'current';
  arrivalFrom?: string;
  arrivalTo?: string;
  modifiedFrom?: string;
  modifiedTo?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Enhanced reservations pull function called');
    const { 
      connectionId, 
      propertyId, 
      filter = 'new',
      arrivalFrom,
      arrivalTo,
      modifiedFrom,
      modifiedTo 
    }: ReservationsPullRequest = await req.json();
    
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

    // Build query parameters
    const queryParams = new URLSearchParams({
      filter,
      includeGuests: 'true',
      includeInvoiceItems: 'true',
      includeInfoItems: 'true',
      includeBookingGroup: 'true',
      status: 'confirmed,request,new',
    });

    if (propertyId) queryParams.set('propertyId', propertyId);
    if (arrivalFrom) queryParams.set('arrivalFrom', arrivalFrom);
    if (arrivalTo) queryParams.set('arrivalTo', arrivalTo);
    if (modifiedFrom) queryParams.set('modifiedFrom', modifiedFrom);
    if (modifiedTo) queryParams.set('modifiedTo', modifiedTo);

    // Pull reservations from Beds24
    console.log(`Pulling reservations with filter: ${filter}`);
    const reservationsResponse = await fetch(`${BEDS24_API_URL}/bookings?${queryParams}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'organization': BEDS24_ORGANIZATION,
        'token': accessToken,
      },
    });

    if (!reservationsResponse.ok) {
      const errorText = await reservationsResponse.text();
      throw new Error(`Failed to pull reservations: ${reservationsResponse.status} ${errorText}`);
    }

    const reservationsData = await reservationsResponse.json();
    console.log(`Received ${reservationsData.length || 0} reservations from Beds24`);

    // Process and store reservations
    const processedReservations = [];
    const updatedReservations = [];
    const errors = [];

    for (const booking of reservationsData) {
      try {
        // Get the property UUID from our database
        const { data: property } = await supabase
          .from('beds24_properties')
          .select('id, hotel_id')
          .eq('connection_id', connectionId)
          .eq('beds24_property_id', booking.propertyId)
          .single();

        if (!property) {
          errors.push({
            beds24_booking_id: booking.bookingId,
            error: `Property not found for Beds24 property ID: ${booking.propertyId}`,
          });
          continue;
        }

        // Check if booking already exists
        const { data: existingBooking } = await supabase
          .from('beds24_bookings')
          .select('*')
          .eq('beds24_booking_id', booking.bookingId)
          .single();

        const bookingRecord = {
          connection_id: connectionId,
          beds24_property_id: property.id,
          beds24_booking_id: booking.bookingId,
          hotel_id: property.hotel_id,
          beds24_room_id: booking.roomId,
          arrival: booking.arrival,
          departure: booking.departure,
          num_adult: booking.numAdult || 1,
          num_child: booking.numChild || 0,
          status: booking.status || 'confirmed',
          guest_info: {
            title: booking.title,
            firstName: booking.firstName,
            lastName: booking.lastName,
            email: booking.email,
            mobile: booking.mobile,
            phone: booking.phone,
            address1: booking.address1,
            address2: booking.address2,
            city: booking.city,
            state: booking.state,
            postcode: booking.postcode,
            country: booking.country,
            languageId: booking.languageId,
          },
          amounts: {
            balance: booking.balance,
            balancePaid: booking.balancePaid,
            deposit: booking.deposit,
            depositPaid: booking.depositPaid,
            tax: booking.tax,
            commission: booking.commission,
          },
          invoice_items: booking.invoiceItems || [],
          booking_data: {
            comment: booking.comment,
            infoItems: booking.infoItems || [],
            bookingGroup: booking.bookingGroup,
            source: booking.source,
            apiReference: booking.apiReference,
          },
          last_modified: booking.modified ? new Date(booking.modified).toISOString() : null,
        };

        if (existingBooking) {
          // Update existing booking
          const { data: updatedBooking } = await supabase
            .from('beds24_bookings')
            .update(bookingRecord)
            .eq('id', existingBooking.id)
            .select('*')
            .single();
          
          if (updatedBooking) {
            updatedReservations.push(updatedBooking);
          }
        } else {
          // Insert new booking
          const { data: newBooking } = await supabase
            .from('beds24_bookings')
            .insert({
              ...bookingRecord,
              imported_at: now.toISOString(),
            })
            .select('*')
            .single();
          
          if (newBooking) {
            processedReservations.push(newBooking);
          }
        }
      } catch (error) {
        errors.push({
          beds24_booking_id: booking.bookingId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log API usage
    await supabase
      .from('beds24_api_usage')
      .insert({
        connection_id: connectionId,
        endpoint: '/bookings',
        method: 'GET',
        success: true,
      });

    console.log(`Processed ${processedReservations.length} new and ${updatedReservations.length} updated reservations`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          total_received: reservationsData.length || 0,
          new_reservations: processedReservations.length,
          updated_reservations: updatedReservations.length,
          errors: errors.length,
          error_details: errors,
          pulled_at: now.toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in reservations pull:', error);
    
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