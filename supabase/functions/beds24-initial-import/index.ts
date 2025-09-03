import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { hotelId, beds24PropertyId } = await req.json();
    console.log(`Starting initial import for hotel ${hotelId}, property ${beds24PropertyId}`);

    // Helper function to call API client
    const callAPI = async (action: string, params: any = {}) => {
      const response = await supabase.functions.invoke('beds24-api-client', {
        body: { action, hotelId, propertyId: beds24PropertyId, ...params }
      });
      
      if (response.error) {
        throw new Error(`API call ${action} failed: ${response.error}`);
      }
      
      return response.data;
    };

    // 1. Import property details
    console.log('Importing property details...');
    const property = await callAPI('getProperty');
    
    await supabase.from('beds24_properties').upsert({
      hotel_id: hotelId,
      beds24_property_id: beds24PropertyId,
      name: property.name || 'Imported Property',
      address: property.address,
      city: property.city,
      country: property.country,
      currency: property.currency || 'USD',
      timezone: property.timezone || 'UTC',
      property_data: property,
      last_sync_at: new Date().toISOString()
    }, {
      onConflict: 'hotel_id,beds24_property_id'
    });

    // 2. Import room types
    console.log('Importing room types...');
    const roomTypes = await callAPI('getRoomTypes');
    
    for (const room of roomTypes || []) {
      await supabase.from('beds24_room_types').upsert({
        hotel_id: hotelId,
        beds24_property_id: beds24PropertyId,
        beds24_room_id: room.id.toString(),
        name: room.name || `Room ${room.id}`,
        max_occupancy: room.maxOccupancy || 2,
        room_data: room
      }, {
        onConflict: 'hotel_id,beds24_room_id'
      });

      // Add to ID mapping
      await supabase.from('beds24_id_map').upsert({
        hotel_id: hotelId,
        entity: 'room',
        remote_id: room.id.toString(),
        local_id: crypto.randomUUID() // Generate UUID for PMS mapping
      }, {
        onConflict: 'hotel_id,entity,remote_id'
      });
    }

    // 3. Import calendar data (365 days)
    console.log('Importing calendar data...');
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 365);

    try {
      const calendar = await callAPI('getInventory', {
        params: {
          dateFrom: startDate.toISOString().split('T')[0],
          dateTo: endDate.toISOString().split('T')[0]
        }
      });

      for (const item of calendar || []) {
        await supabase.from('beds24_calendar').upsert({
          hotel_id: hotelId,
          beds24_property_id: beds24PropertyId,
          beds24_room_id: item.roomId?.toString() || '0',
          date: item.date,
          available: item.available || 0,
          rate: item.price,
          min_stay: item.minStay || 1,
          max_stay: item.maxStay,
          arrival_allowed: item.arrivalAllowed !== false,
          departure_allowed: item.departureAllowed !== false,
          closed_arrival: item.closedArrival === true,
          closed_departure: item.closedDeparture === true,
          stop_sell: item.stopSell === true,
          calendar_data: item
        }, {
          onConflict: 'hotel_id,beds24_room_id,date'
        });
      }
    } catch (error) {
      console.error('Calendar import failed:', error);
    }

    // 4. Import bookings (last 12 months)
    console.log('Importing bookings...');
    const bookingsStartDate = new Date();
    bookingsStartDate.setMonth(bookingsStartDate.getMonth() - 12);

    try {
      const bookings = await callAPI('getBookings', {
        params: {
          modifiedFrom: bookingsStartDate.toISOString(),
          includeInvoices: true
        }
      });

      for (const booking of bookings || []) {
        await supabase.from('beds24_bookings').upsert({
          hotel_id: hotelId,
          beds24_property_id: beds24PropertyId,
          beds24_booking_id: booking.id?.toString() || booking.bookId?.toString(),
          check_in: booking.arrival || booking.checkIn,
          check_out: booking.departure || booking.checkOut,
          guest_name: booking.guestName || booking.firstName + ' ' + booking.lastName,
          guest_email: booking.guestEmail || booking.email,
          guest_phone: booking.guestPhone || booking.phone,
          adults: booking.numAdult || 1,
          children: booking.numChild || 0,
          status: booking.status || 'confirmed',
          total_amount: booking.price || booking.totalPrice,
          currency: booking.currency || 'USD',
          booking_source: booking.source,
          booking_data: booking
        }, {
          onConflict: 'hotel_id,beds24_booking_id'
        });

        // Add to ID mapping
        await supabase.from('beds24_id_map').upsert({
          hotel_id: hotelId,
          entity: 'booking',
          remote_id: (booking.id || booking.bookId)?.toString(),
          local_id: crypto.randomUUID()
        }, {
          onConflict: 'hotel_id,entity,remote_id'
        });
      }
    } catch (error) {
      console.error('Bookings import failed:', error);
    }

    // 5. Import messages (last 30 days)
    console.log('Importing messages...');
    const messagesStartDate = new Date();
    messagesStartDate.setDate(messagesStartDate.getDate() - 30);

    try {
      const messages = await callAPI('getMessages', {
        params: {
          modifiedFrom: messagesStartDate.toISOString()
        }
      });

      for (const message of messages || []) {
        await supabase.from('beds24_messages').upsert({
          hotel_id: hotelId,
          beds24_property_id: beds24PropertyId,
          beds24_message_id: message.id?.toString(),
          beds24_booking_id: message.bookId?.toString(),
          message_type: message.type || 'guest',
          sender: message.sender,
          recipient: message.recipient,
          subject: message.subject,
          content: message.message || message.content,
          sent_at: message.created || message.sentAt,
          message_data: message
        }, {
          onConflict: 'hotel_id,beds24_message_id'
        });

        // Add to ID mapping
        await supabase.from('beds24_id_map').upsert({
          hotel_id: hotelId,
          entity: 'message',
          remote_id: message.id?.toString(),
          local_id: crypto.randomUUID()
        }, {
          onConflict: 'hotel_id,entity,remote_id'
        });
      }
    } catch (error) {
      console.error('Messages import failed:', error);
    }

    // Update sync state
    await supabase.from('beds24_sync_state').upsert({
      hotel_id: hotelId,
      beds24_property_id: beds24PropertyId,
      bookings_modified_from: new Date().toISOString(),
      last_calendar_full_refresh: new Date().toISOString().split('T')[0],
      last_properties_refresh: new Date().toISOString()
    }, {
      onConflict: 'hotel_id,beds24_property_id'
    });

    console.log(`Initial import completed for hotel ${hotelId}`);

    // Calculate import statistics
    const { data: properties } = await supabase
      .from('beds24_properties')
      .select('*')
      .eq('hotel_id', hotelId);
    
    const { data: roomTypesCount } = await supabase
      .from('beds24_room_types')
      .select('*')
      .eq('hotel_id', hotelId);
    
    const { data: bookingsCount } = await supabase
      .from('beds24_bookings')
      .select('*')
      .eq('hotel_id', hotelId);
    
    const { data: messagesCount } = await supabase
      .from('beds24_messages')
      .select('*')
      .eq('hotel_id', hotelId);
    
    const { data: calendarCount } = await supabase
      .from('beds24_calendar')
      .select('*')
      .eq('hotel_id', hotelId);

    const statistics = {
      properties: properties?.length || 0,
      roomTypes: roomTypesCount?.length || 0,
      bookings: bookingsCount?.length || 0,
      messages: messagesCount?.length || 0,
      calendarEntries: calendarCount?.length || 0
    };

    console.log(`Import statistics:`, statistics);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Initial import completed successfully',
      statistics,
      importedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in beds24-initial-import:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});