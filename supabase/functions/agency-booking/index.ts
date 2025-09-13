import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgencyBookingRequest {
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;
  rateQuoted: number;
  currency?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user from request
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const bookingData: AgencyBookingRequest = await req.json();
    
    console.log('Processing agency booking:', bookingData);

    // Validate essential booking data
    if (!bookingData.hotelId || !bookingData.roomTypeId || !bookingData.checkIn || 
        !bookingData.checkOut || !bookingData.guestName || !bookingData.rateQuoted) {
      return new Response(
        JSON.stringify({ error: 'Missing required booking data' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get or create user's primary agency
    let userAgency;
    const { data: existingAgency, error: checkError } = await supabase
      .from('agency_users')
      .select('agency_id, role, agencies(*)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('role', { ascending: true })
      .limit(1)
      .single();

    if (checkError || !existingAgency) {
      console.log('No agency found for user, creating default agency');
      
      // Create default agency for user
      const { data: newAgency, error: newAgencyError } = await supabase
        .from('agencies')
        .insert({
          name: 'My Travel Agency',
          type: 'OTA',
          org_id: '550e8400-e29b-41d4-a716-446655440000',
        })
        .select()
        .single();

      if (newAgencyError) {
        console.error('Error creating agency:', newAgencyError);
        return new Response(
          JSON.stringify({ error: 'Failed to create agency' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Create agency user relationship
      const { error: membershipError } = await supabase
        .from('agency_users')
        .insert({
          user_id: user.id,
          agency_id: newAgency.id,
          role: 'owner',
          joined_at: new Date().toISOString(),
        });

      if (membershipError) {
        console.error('Error creating agency membership:', membershipError);
        return new Response(
          JSON.stringify({ error: 'Failed to create agency membership' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      userAgency = { agency_id: newAgency.id, role: 'owner' };
    } else {
      userAgency = existingAgency;
    }

    // Create guest information
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .insert({
        hotel_id: bookingData.hotelId,
        first_name: bookingData.guestName.split(' ')[0] || bookingData.guestName,
        last_name: bookingData.guestName.split(' ').slice(1).join(' ') || '',
        email: bookingData.guestEmail,
        phone: bookingData.guestPhone,
      })
      .select()
      .single();

    if (guestError) {
      console.error('Error creating guest:', guestError);
      return new Response(
        JSON.stringify({ error: 'Failed to process guest information' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get or create default rate plan for the hotel
    let { data: ratePlan } = await supabase
      .from('rate_plans')
      .select('*')
      .eq('hotel_id', bookingData.hotelId)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!ratePlan) {
      const { data: newRatePlan, error: ratePlanError } = await supabase
        .from('rate_plans')
        .insert({
          hotel_id: bookingData.hotelId,
          name: 'Standard Rate',
          is_active: true,
        })
        .select()
        .single();

      if (ratePlanError) {
        console.error('Error creating rate plan:', ratePlanError);
        return new Response(
          JSON.stringify({ error: 'Failed to create rate plan' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      ratePlan = newRatePlan;
    }

    // Generate reservation and confirmation codes
    const reservationCode = `AG${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const confirmationCode = `CNF${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create reservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        hotel_id: bookingData.hotelId,
        guest_id: guest.id,
        room_type_id: bookingData.roomTypeId,
        rate_plan_id: ratePlan.id,
        check_in: bookingData.checkIn,
        check_out: bookingData.checkOut,
        adults: bookingData.adults,
        children: bookingData.children,
        status: 'confirmed',
        source: 'agency',
        code: reservationCode,
        confirmation_code: confirmationCode,
        rate: bookingData.rateQuoted,
        currency: bookingData.currency || 'USD',
        special_requests: bookingData.specialRequests,
        agency_id: userAgency.agency_id,
        booked_by: user.id,
      })
      .select()
      .single();

    if (reservationError) {
      console.error('Error creating reservation:', reservationError);
      return new Response(
        JSON.stringify({ error: 'Failed to create reservation' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check inventory availability before confirming
    const { data: inventoryCheck } = await supabase
      .from('inventory')
      .select('allotment, stop_sell')
      .eq('hotel_id', bookingData.hotelId)
      .eq('room_type_id', bookingData.roomTypeId)
      .gte('date', bookingData.checkIn)
      .lt('date', bookingData.checkOut);

    // Verify we have inventory for all nights
    if (inventoryCheck) {
      for (const inv of inventoryCheck) {
        if (inv.stop_sell || inv.allotment < 1) {
          return new Response(
            JSON.stringify({ error: 'No availability for selected dates' }), 
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
    }

    // Try to find and assign an available room
    const { data: availableRooms } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', bookingData.hotelId)
      .eq('room_type_id', bookingData.roomTypeId)
      .eq('housekeeping_status', 'Clean')
      .limit(1);

    if (availableRooms && availableRooms.length > 0) {
      await supabase
        .from('reservations')
        .update({ room_id: availableRooms[0].id })
        .eq('id', reservation.id);
    }

    // Send real-time notification to hotel
    const channel = supabase.channel(`hotel:${bookingData.hotelId}`);
    await channel.send({
      type: 'broadcast',
      event: 'new_reservation',
      payload: {
        reservation_id: reservation.id,
        guest_name: bookingData.guestName,
        check_in: bookingData.checkIn,
        check_out: bookingData.checkOut,
        source: 'agency',
        agency_id: userAgency.agency_id,
      }
    });

    console.log('Agency booking created successfully:', reservation.id);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        reservation: {
          id: reservation.id,
          code: reservationCode,
          confirmationCode: confirmationCode,
          status: reservation.status,
        }
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error processing agency booking:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});