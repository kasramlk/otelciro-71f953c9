import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BEDS24_BASE_URL = "https://api.beds24.com/v2";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { hotelId, beds24PropertyId } = await req.json();
    
    console.log(`Starting direct import for hotel ${hotelId}, property ${beds24PropertyId}`);

    // Get the long-lived token
    const { data: connection, error: tokenError } = await supabase
      .from('beds24_connections')
      .select('long_lived_token')
      .eq('hotel_id', hotelId)
      .single();

    if (tokenError || !connection?.long_lived_token) {
      throw new Error('No long-lived token found for hotel');
    }

    const token = connection.long_lived_token;
    console.log('Token found, starting import...');

    // 1. Import Property Details
    console.log('Step 1: Importing property details...');
    const propertyUrl = `${BEDS24_BASE_URL}/properties?id=${beds24PropertyId}&includeLanguages=all&includeTexts=all&includePictures=true&includeOffers=true&includePriceRules=true&includeUpsellItems=true&includeAllRooms=true&includeUnitDetails=true`;
    
    const propertyResponse = await fetch(propertyUrl, {
      headers: {
        'accept': 'application/json',
        'token': token
      }
    });

    if (!propertyResponse.ok) {
      throw new Error(`Property API failed: ${propertyResponse.status}`);
    }

    const propertyData = await propertyResponse.json();
    console.log('Property data received');

    // Insert property
    if (propertyData && propertyData.length > 0) {
      const property = propertyData[0];
      await supabase.from('beds24_properties').upsert({
        hotel_id: hotelId,
        beds24_property_id: parseInt(beds24PropertyId),
        name: property.name || 'Unknown Property',
        address: property.address || null,
        city: property.city || null,
        country: property.country || null,
        currency: property.currency || 'USD',
        timezone: property.timezone || 'UTC',
        property_data: property,
        last_sync_at: new Date().toISOString()
      });
      console.log('Property inserted');
    }

    // 2. Import Room Types
    console.log('Step 2: Importing room types...');
    const roomsUrl = `${BEDS24_BASE_URL}/properties/${beds24PropertyId}/rooms`;
    
    const roomsResponse = await fetch(roomsUrl, {
      headers: {
        'accept': 'application/json',
        'token': token
      }
    });

    if (roomsResponse.ok) {
      const roomsData = await roomsResponse.json();
      console.log(`Found ${roomsData.length} room types`);

      for (const room of roomsData) {
        await supabase.from('beds24_room_types').upsert({
          hotel_id: hotelId,
          beds24_property_id: parseInt(beds24PropertyId),
          beds24_room_id: room.roomId.toString(),
          name: room.name || 'Unknown Room',
          max_occupancy: room.maxGuests || 2,
          room_data: room
        });
      }
      console.log('Room types inserted');
    }

    // 3. Import Recent Bookings
    console.log('Step 3: Importing recent bookings...');
    const bookingsUrl = `${BEDS24_BASE_URL}/properties/${beds24PropertyId}/bookings?modifiedSince=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`;
    
    const bookingsResponse = await fetch(bookingsUrl, {
      headers: {
        'accept': 'application/json',
        'token': token
      }
    });

    if (bookingsResponse.ok) {
      const bookingsData = await bookingsResponse.json();
      console.log(`Found ${bookingsData.length} bookings`);

      for (const booking of bookingsData) {
        await supabase.from('beds24_bookings').upsert({
          hotel_id: hotelId,
          beds24_property_id: parseInt(beds24PropertyId),
          beds24_booking_id: booking.bookId.toString(),
          guest_name: booking.guestName || 'Unknown Guest',
          guest_email: booking.guestEmail || null,
          guest_phone: booking.guestPhone || null,
          check_in: booking.arrival || new Date().toISOString().split('T')[0],
          check_out: booking.departure || new Date().toISOString().split('T')[0],
          adults: booking.numAdult || 1,
          children: booking.numChild || 0,
          total_amount: parseFloat(booking.price || '0'),
          currency: booking.currency || 'USD',
          status: booking.status || 'confirmed',
          booking_source: booking.source || 'beds24',
          booking_data: booking
        });
      }
      console.log('Bookings inserted');
    }

    // 4. Import Calendar Data (next 90 days)
    console.log('Step 4: Importing calendar data...');
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const inventoryUrl = `${BEDS24_BASE_URL}/properties/${beds24PropertyId}/inventory?dateStart=${startDate}&dateEnd=${endDate}`;
    
    const inventoryResponse = await fetch(inventoryUrl, {
      headers: {
        'accept': 'application/json',
        'token': token
      }
    });

    if (inventoryResponse.ok) {
      const inventoryData = await inventoryResponse.json();
      console.log(`Found ${inventoryData.length} inventory records`);

      for (const inv of inventoryData) {
        await supabase.from('beds24_calendar').upsert({
          hotel_id: hotelId,
          beds24_property_id: parseInt(beds24PropertyId),
          beds24_room_id: inv.roomId?.toString() || '0',
          date: inv.date,
          available: parseInt(inv.available || '0'),
          rate: parseFloat(inv.rate || '0'),
          min_stay: parseInt(inv.minStay || '1'),
          max_stay: parseInt(inv.maxStay || '0'),
          arrival_allowed: inv.arrivalAllowed !== false,
          departure_allowed: inv.departureAllowed !== false,
          closed_arrival: inv.closedArrival === true,
          closed_departure: inv.closedDeparture === true,
          stop_sell: inv.stopSell === true,
          calendar_data: inv
        });
      }
      console.log('Calendar data inserted');
    }

    console.log('Import completed successfully!');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Direct import completed successfully',
      imported: {
        properties: 1,
        rooms: roomsData?.length || 0,
        bookings: bookingsData?.length || 0,
        calendar: inventoryData?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Direct import error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});