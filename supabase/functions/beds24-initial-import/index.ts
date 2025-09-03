import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import timeout settings
const IMPORT_TIMEOUT_MS = 180000; // 3 minutes
const STEP_TIMEOUT_MS = 60000; // 1 minute per step

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

    // Setup timeout for entire operation
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, IMPORT_TIMEOUT_MS);

    // Statistics tracking
    const stats = {
      properties: 0,
      roomTypes: 0,
      bookings: 0,
      messages: 0,
      calendarEntries: 0,
      errors: []
    };

    // Helper function to call API client with timeout
    const callAPI = async (action: string, params: any = {}, stepName?: string) => {
      if (controller.signal.aborted) {
        throw new Error('Import operation was cancelled or timed out');
      }

      const stepController = new AbortController();
      const stepTimeout = setTimeout(() => {
        stepController.abort();
      }, STEP_TIMEOUT_MS);

      try {
        console.log(`Starting step: ${stepName || action}`);
        
        const response = await Promise.race([
          supabase.functions.invoke('beds24-api-client', {
            body: { action, hotelId, propertyId: beds24PropertyId, ...params }
          }),
          new Promise((_, reject) => {
            stepController.signal.addEventListener('abort', () => {
              reject(new Error(`Step timeout: ${stepName || action} took longer than ${STEP_TIMEOUT_MS / 1000} seconds`));
            });
          })
        ]);
        
        clearTimeout(stepTimeout);
        
        // Better error handling for function invocation
        if (response.error) {
          console.error(`Function invocation error for ${action}:`, response.error);
          throw new Error(`Function invocation failed for ${action}: ${response.error.message || JSON.stringify(response.error)}`);
        }

        if (!response.data) {
          throw new Error(`No data returned from ${action}`);
        }
        
        console.log(`Completed step: ${stepName || action}`);
        return response.data;
      } catch (error) {
        clearTimeout(stepTimeout);
        console.error(`Error in step ${stepName || action}:`, error);
        stats.errors.push(`${stepName || action}: ${error.message}`);
        throw error;
      }
    };

    try {
      // 1. Import property details
      console.log('Step 1/5: Importing property details...');
      const property = await callAPI('getProperty', {}, 'Property Details');
      
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
      stats.properties = 1;
      console.log('✅ Property details imported successfully');

      // 2. Import room types
      console.log('Step 2/5: Importing room types...');
      const roomTypes = await callAPI('getRoomTypes', {}, 'Room Types');
      
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
      stats.roomTypes = roomTypes?.length || 0;
      console.log(`✅ Imported ${stats.roomTypes} room types`);

      // 3. Import calendar data (365 days)
      console.log('Step 3/5: Importing calendar data...');
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 365);

      try {
        const calendar = await callAPI('getInventory', {
          params: {
            dateFrom: startDate.toISOString().split('T')[0],
            dateTo: endDate.toISOString().split('T')[0]
          }
        }, 'Calendar Data');

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
        stats.calendarEntries = calendar?.length || 0;
        console.log(`✅ Imported ${stats.calendarEntries} calendar entries`);
      } catch (error) {
        console.error('❌ Calendar import failed:', error);
        stats.errors.push(`Calendar: ${error.message}`);
      }

      // 4. Import bookings (last 12 months)
      console.log('Step 4/5: Importing bookings...');
      const bookingsStartDate = new Date();
      bookingsStartDate.setMonth(bookingsStartDate.getMonth() - 12);

      try {
        const bookings = await callAPI('getBookings', {
          params: {
            modifiedFrom: bookingsStartDate.toISOString(),
            includeInvoices: true
          }
        }, 'Bookings');

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
        stats.bookings = bookings?.length || 0;
        console.log(`✅ Imported ${stats.bookings} bookings`);
      } catch (error) {
        console.error('❌ Bookings import failed:', error);
        stats.errors.push(`Bookings: ${error.message}`);
      }

      // 5. Import messages (last 30 days)
      console.log('Step 5/5: Importing messages...');
      const messagesStartDate = new Date();
      messagesStartDate.setDate(messagesStartDate.getDate() - 30);

      try {
        const messages = await callAPI('getMessages', {
          params: {
            modifiedFrom: messagesStartDate.toISOString()
          }
        }, 'Messages');

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
        stats.messages = messages?.length || 0;
        console.log(`✅ Imported ${stats.messages} messages`);
      } catch (error) {
        console.error('❌ Messages import failed:', error);
        stats.errors.push(`Messages: ${error.message}`);
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

      console.log(`✅ Initial import completed successfully for hotel ${hotelId}`);
      console.log(`📊 Final Statistics:`, stats);

      // Clear timeout since we completed successfully
      clearTimeout(timeout);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Initial import completed successfully',
        statistics: stats,
        importedAt: new Date().toISOString(),
        hasErrors: stats.errors.length > 0,
        errors: stats.errors
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (stepError) {
      console.error('❌ Import step failed:', stepError);
      clearTimeout(timeout);
      
      return new Response(JSON.stringify({ 
        success: false,
        error: stepError.message,
        statistics: stats,
        hasErrors: true,
        errors: [...stats.errors, stepError.message],
        partialImport: true
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('❌ Fatal error in beds24-initial-import:', error);
    
    // Determine if this was a timeout
    const isTimeout = error.name === 'AbortError' || error.message.includes('timeout');
    
    return new Response(JSON.stringify({ 
      success: false,
      error: isTimeout ? 
        `Import timed out after ${IMPORT_TIMEOUT_MS / 1000} seconds. Please try again or contact support.` :
        error.message,
      isTimeout,
      timestamp: new Date().toISOString()
    }), {
      status: isTimeout ? 408 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});