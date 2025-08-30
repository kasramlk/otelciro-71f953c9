import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BEDS24_API_URL = Deno.env.get('BEDS24_API_URL') || 'https://api.beds24.com/v2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ReservationsPullRequest {
  connectionId: string;
  dateRange?: { from: string; to: string };
  syncType: string;
  syncDirection: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { connectionId, dateRange, syncType, syncDirection }: ReservationsPullRequest = await req.json();

    console.log(`Pulling reservations for connection: ${connectionId}`);

    // Create sync log
    const syncLogId = await createSyncLog(connectionId, undefined, syncType, syncDirection);

    try {
      const result = await pullReservationsFromBeds24(connectionId, dateRange);
      
      // Update sync log with success
      await updateSyncLog(syncLogId, {
        status: 'completed',
        records_processed: result.data?.length || 0,
        records_succeeded: result.data?.length || 0,
        sync_data: { reservations_pulled: result.data?.length || 0 },
      });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // Update sync log with error
      await updateSyncLog(syncLogId, {
        status: 'failed',
        records_failed: 1,
        error_details: [{ error: error instanceof Error ? error.message : 'Unknown error' }]
      });
      
      throw error;
    }

  } catch (error) {
    console.error('Error in beds24-reservations-pull function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function getValidAccessToken(connectionId: string): Promise<string> {
  // Get connection from database
  const { data: connection, error } = await supabase
    .from('beds24_connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (error || !connection) {
    throw new Error('Connection not found');
  }

  // Check if token needs refresh
  let accessToken = connection.access_token;
  const tokenExpiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
  const now = new Date();

  if (!accessToken || !tokenExpiresAt || tokenExpiresAt <= now) {
    console.log('Token expired, refreshing...');
    
    // Refresh token
    const refreshResponse = await fetch(`${BEDS24_API_URL}/authentication/token`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'refreshToken': connection.refresh_token,
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
        connection_status: 'active'
      })
      .eq('id', connectionId);
  }

  return accessToken;
}

async function pullReservationsFromBeds24(connectionId: string, dateRange?: { from: string; to: string }) {
  console.log('Pulling reservations from Beds24...');

  const accessToken = await getValidAccessToken(connectionId);

  // Get connection details for hotel mapping
  const { data: connection } = await supabase
    .from('beds24_connections')
    .select('hotel_id')
    .eq('id', connectionId)
    .single();

  if (!connection) {
    throw new Error('Connection not found');
  }

  // Prepare query parameters
  const params = new URLSearchParams();
  if (dateRange) {
    params.append('checkIn', dateRange.from);
    params.append('checkOut', dateRange.to);
  } else {
    // Default to last 30 days if no range specified
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    params.append('checkIn', thirtyDaysAgo.toISOString().split('T')[0]);
    params.append('checkOut', tomorrow.toISOString().split('T')[0]);
  }

  // Pull reservations from Beds24
  const response = await fetch(`${BEDS24_API_URL}/bookings?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'token': accessToken,
    },
  });

  const creditsUsed = response.headers.get('x-request-cost');
  const creditsRemaining = response.headers.get('x-five-min-limit-remaining');

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to pull reservations:', response.status, errorText);
    throw new Error(`Failed to pull reservations: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const reservations = data.data || [];

  console.log(`Found ${reservations.length} reservations`);

  // Process and import reservations
  const importedReservations = [];
  
  for (const booking of reservations) {
    try {
      const importedReservation = await importReservation(connection.hotel_id, booking);
      if (importedReservation) {
        importedReservations.push(importedReservation);
      }
    } catch (error) {
      console.error(`Failed to import reservation ${booking.id}:`, error);
    }
  }

  // Update API credits in connection
  if (creditsRemaining) {
    await supabase
      .from('beds24_connections')
      .update({ 
        api_credits_remaining: parseInt(creditsRemaining),
        last_sync_at: new Date().toISOString()
      })
      .eq('id', connectionId);
  }

  console.log(`Successfully imported ${importedReservations.length} reservations`);

  return {
    success: true,
    data: importedReservations,
    total_found: reservations.length,
    total_imported: importedReservations.length,
    credits_used: creditsUsed ? parseInt(creditsUsed) : 0,
    credits_remaining: creditsRemaining ? parseInt(creditsRemaining) : 0,
  };
}

async function importReservation(hotelId: string, booking: any) {
  console.log(`Importing reservation ${booking.id}`);

  // Check if reservation already exists
  const { data: existingReservation } = await supabase
    .from('reservations')
    .select('id')
    .eq('beds24_booking_id', booking.id)
    .single();

  if (existingReservation) {
    console.log(`Reservation ${booking.id} already exists, skipping`);
    return null;
  }

  // Create or find guest
  let guestId = await findOrCreateGuest(hotelId, booking.guest);

  // Find room type (this would need proper mapping)
  const { data: roomTypes } = await supabase
    .from('room_types')
    .select('id')
    .eq('hotel_id', hotelId)
    .limit(1);

  if (!roomTypes || roomTypes.length === 0) {
    throw new Error('No room types found for hotel');
  }

  // Prepare reservation data
  const reservationData = {
    hotel_id: hotelId,
    guest_id: guestId,
    room_type_id: roomTypes[0].id,
    check_in: booking.checkIn,
    check_out: booking.checkOut,
    adults: booking.adults || 1,
    children: booking.children || 0,
    total_amount: booking.totalAmount || 0,
    currency: booking.currency || 'USD',
    status: mapBookingStatus(booking.status),
    channel: booking.channel || 'OTA',
    special_requests: booking.specialRequests,
    beds24_booking_id: booking.id,
    api_source_id: booking.apiSourceId,
    channel_source: booking.channel,
    beds24_sync_status: 'synced',
    beds24_last_sync: new Date().toISOString(),
  };

  // Generate reservation code
  const code = `RES${Date.now()}`;
  reservationData.code = code;

  // Insert reservation
  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert(reservationData)
    .select()
    .single();

  if (error) {
    console.error(`Failed to insert reservation:`, error);
    throw error;
  }

  console.log(`Successfully imported reservation ${booking.id} as ${reservation.id}`);
  return reservation;
}

async function findOrCreateGuest(hotelId: string, guestData: any): Promise<string> {
  if (!guestData) {
    throw new Error('Guest data is required');
  }

  // Try to find existing guest by email
  if (guestData.email) {
    const { data: existingGuest } = await supabase
      .from('guests')
      .select('id')
      .eq('hotel_id', hotelId)
      .eq('email', guestData.email)
      .single();

    if (existingGuest) {
      return existingGuest.id;
    }
  }

  // Create new guest
  const { data: newGuest, error } = await supabase
    .from('guests')
    .insert({
      hotel_id: hotelId,
      first_name: guestData.firstName || guestData.name?.split(' ')[0] || 'Unknown',
      last_name: guestData.lastName || guestData.name?.split(' ').slice(1).join(' ') || '',
      email: guestData.email,
      phone: guestData.phone,
      nationality: guestData.nationality,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create guest:', error);
    throw error;
  }

  return newGuest.id;
}

function mapBookingStatus(beds24Status: string): string {
  const statusMapping: { [key: string]: string } = {
    'confirmed': 'confirmed',
    'cancelled': 'cancelled',
    'checked_in': 'checked_in',
    'checked_out': 'checked_out',
    'no_show': 'no_show',
  };

  return statusMapping[beds24Status?.toLowerCase()] || 'confirmed';
}

async function createSyncLog(connectionId: string, propertyId: string | undefined, syncType: string, syncDirection: string): Promise<string> {
  const { data, error } = await supabase
    .from('beds24_sync_logs')
    .insert({
      connection_id: connectionId,
      beds24_property_id: propertyId,
      sync_type: syncType,
      sync_direction: syncDirection,
      status: 'running',
      records_processed: 0,
      records_succeeded: 0,
      records_failed: 0,
      api_credits_used: 0,
      sync_data: {},
      error_details: [],
      performance_metrics: {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create sync log:', error);
    throw new Error('Failed to create sync log');
  }

  return data.id;
}

async function updateSyncLog(syncLogId: string, updates: any): Promise<void> {
  const updateData = {
    ...updates,
    ...(updates.status === 'completed' || updates.status === 'failed' ? 
      { completed_at: new Date().toISOString() } : {})
  };

  const { error } = await supabase
    .from('beds24_sync_logs')
    .update(updateData)
    .eq('id', syncLogId);

  if (error) {
    console.error('Failed to update sync log:', error);
  }
}