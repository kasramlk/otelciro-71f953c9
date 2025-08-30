import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received Beds24 webhook');

    const payload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Determine webhook type based on payload
    const webhookType = determineWebhookType(payload);
    
    // Store webhook for processing
    const { data: webhook, error } = await supabase
      .from('beds24_webhooks')
      .insert({
        connection_id: await findConnectionByPayload(payload),
        webhook_type: webhookType,
        beds24_property_id: payload.propertyId || null,
        beds24_booking_id: payload.bookingId || payload.booking?.id || null,
        event_type: payload.eventType || payload.action || 'unknown',
        payload: payload,
        processed: false,
        retry_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to store webhook:', error);
      throw error;
    }

    console.log(`Stored webhook ${webhook.id}`);

    // Process webhook immediately
    try {
      await processWebhook(webhook);
      
      // Mark as processed
      await supabase
        .from('beds24_webhooks')
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString() 
        })
        .eq('id', webhook.id);

      console.log(`Successfully processed webhook ${webhook.id}`);

    } catch (processingError) {
      console.error(`Failed to process webhook ${webhook.id}:`, processingError);
      
      // Update error details
      await supabase
        .from('beds24_webhooks')
        .update({ 
          processing_errors: [{ 
            error: processingError instanceof Error ? processingError.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }],
          retry_count: 1
        })
        .eq('id', webhook.id);
    }

    return new Response(
      JSON.stringify({ success: true, webhookId: webhook.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in beds24-webhook function:', error);
    
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

function determineWebhookType(payload: any): string {
  if (payload.booking || payload.bookingId) {
    return 'booking';
  }
  if (payload.inventory || payload.calendar) {
    return 'inventory';
  }
  if (payload.rate || payload.rates) {
    return 'rate';
  }
  if (payload.message) {
    return 'message';
  }
  if (payload.payment) {
    return 'payment';
  }
  if (payload.property || payload.propertyId) {
    return 'property';
  }
  
  return 'unknown';
}

async function findConnectionByPayload(payload: any): Promise<string | null> {
  // Try to find connection by property ID if available
  if (payload.propertyId) {
    const { data: property } = await supabase
      .from('beds24_properties')
      .select('connection_id')
      .eq('beds24_property_id', payload.propertyId)
      .single();
    
    if (property) {
      return property.connection_id;
    }
  }

  // Try to find by booking ID
  if (payload.bookingId || payload.booking?.id) {
    const bookingId = payload.bookingId || payload.booking.id;
    
    const { data: reservation } = await supabase
      .from('reservations')
      .select('hotel_id')
      .eq('beds24_booking_id', bookingId)
      .single();
    
    if (reservation) {
      const { data: connection } = await supabase
        .from('beds24_connections')
        .select('id')
        .eq('hotel_id', reservation.hotel_id)
        .single();
      
      if (connection) {
        return connection.id;
      }
    }
  }

  // Return null if no connection found - webhook will be stored but not processed
  console.warn('Could not find connection for webhook payload');
  return null;
}

async function processWebhook(webhook: any) {
  console.log(`Processing webhook ${webhook.id} of type ${webhook.webhook_type}`);

  switch (webhook.webhook_type) {
    case 'booking':
      await processBookingWebhook(webhook);
      break;
      
    case 'inventory':
      await processInventoryWebhook(webhook);
      break;
      
    case 'rate':
      await processRateWebhook(webhook);
      break;
      
    case 'message':
      await processMessageWebhook(webhook);
      break;
      
    case 'payment':
      await processPaymentWebhook(webhook);
      break;
      
    case 'property':
      await processPropertyWebhook(webhook);
      break;
      
    default:
      console.log(`Unknown webhook type: ${webhook.webhook_type}`);
  }
}

async function processBookingWebhook(webhook: any) {
  const payload = webhook.payload;
  const booking = payload.booking || payload;
  
  console.log(`Processing booking webhook for booking ${booking.id}`);

  // Find the hotel for this connection
  const { data: connection } = await supabase
    .from('beds24_connections')
    .select('hotel_id')
    .eq('id', webhook.connection_id)
    .single();

  if (!connection) {
    throw new Error('Connection not found');
  }

  // Check if reservation already exists
  const { data: existingReservation } = await supabase
    .from('reservations')
    .select('id, status')
    .eq('beds24_booking_id', booking.id)
    .single();

  if (existingReservation) {
    // Update existing reservation
    const updates: any = {
      beds24_last_sync: new Date().toISOString(),
      beds24_sync_status: 'synced',
    };

    // Update status if changed
    if (booking.status) {
      const newStatus = mapBookingStatus(booking.status);
      if (newStatus !== existingReservation.status) {
        updates.status = newStatus;
        console.log(`Updating reservation ${existingReservation.id} status to ${newStatus}`);
      }
    }

    await supabase
      .from('reservations')
      .update(updates)
      .eq('id', existingReservation.id);

  } else {
    // Create new reservation - call the reservations pull function to handle this
    console.log('New booking received, importing...');
    
    // This would normally trigger a full reservation import
    // For now, we'll just log it
    console.log(`New booking ${booking.id} needs to be imported`);
  }
}

async function processInventoryWebhook(webhook: any) {
  console.log('Processing inventory webhook');
  
  // For inventory updates, we might want to:
  // 1. Update local inventory cache
  // 2. Trigger notifications to staff
  // 3. Update dashboard in real-time
  
  // This is a placeholder - real implementation would depend on specific needs
  console.log('Inventory webhook processed (placeholder)');
}

async function processRateWebhook(webhook: any) {
  console.log('Processing rate webhook');
  
  // For rate updates, we might want to:
  // 1. Update local rate cache
  // 2. Trigger pricing alerts
  // 3. Update analytics
  
  console.log('Rate webhook processed (placeholder)');
}

async function processMessageWebhook(webhook: any) {
  console.log('Processing message webhook');
  
  // For message updates, we might want to:
  // 1. Store guest messages
  // 2. Send notifications to staff
  // 3. Update communication logs
  
  console.log('Message webhook processed (placeholder)');
}

async function processPaymentWebhook(webhook: any) {
  console.log('Processing payment webhook');
  
  // For payment updates, we might want to:
  // 1. Update payment status
  // 2. Reconcile accounts
  // 3. Send payment confirmations
  
  console.log('Payment webhook processed (placeholder)');
}

async function processPropertyWebhook(webhook: any) {
  console.log('Processing property webhook');
  
  // For property updates, we might want to:
  // 1. Update property settings
  // 2. Sync room configurations
  // 3. Update channel mappings
  
  console.log('Property webhook processed (placeholder)');
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