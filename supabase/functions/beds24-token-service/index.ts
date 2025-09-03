import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BEDS24_BASE_URL = "https://api.beds24.com/v2";

class TokenService {
  private supabase;
  private tokenCache = new Map();

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async getAccessToken(hotelId: string, forWrite = false): Promise<string> {
    const cacheKey = `${hotelId}_${forWrite ? 'write' : 'read'}`;
    
    // Check cache first
    const cached = this.tokenCache.get(cacheKey);
    if (cached && cached.expires > new Date()) {
      console.log('Using cached access token');
      return cached.token;
    }

    // Get connection with secrets
    const { data: connection } = await this.supabase
      .from('beds24_connections')
      .select(`
        *,
        beds24_connection_secrets!inner(
          refresh_token_read,
          refresh_token_write
        )
      `)
      .eq('hotel_id', hotelId)
      .eq('status', 'active')
      .single();

    if (!connection) {
      throw new Error('No active Beds24 connection found for hotel');
    }

    // Check if we have cached access token in DB
    if (connection.access_token_cache && connection.access_expires_at) {
      const expiresAt = new Date(connection.access_expires_at);
      if (expiresAt > new Date(Date.now() + 60000)) { // 1 minute buffer
        console.log('Using DB cached access token');
        this.tokenCache.set(cacheKey, {
          token: connection.access_token_cache,
          expires: expiresAt
        });
        return connection.access_token_cache;
      }
    }

    // Get the actual refresh token
    const secrets = connection.beds24_connection_secrets;
    const refreshToken = forWrite && secrets.refresh_token_write ? 
      secrets.refresh_token_write : secrets.refresh_token_read;

    if (!refreshToken) {
      throw new Error(`No refresh token available for ${forWrite ? 'write' : 'read'} operations`);
    }

    console.log('Using real refresh token for API call');

    const tokenResponse = await fetch(`${BEDS24_BASE_URL}/authentication/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to mint access token:', errorText);
      throw new Error(`Failed to mint access token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Update DB cache
    await this.supabase
      .from('beds24_connections')
      .update({
        access_token_cache: tokenData.access_token,
        access_expires_at: expiresAt.toISOString(),
        last_token_use_at: new Date().toISOString()
      })
      .eq('id', connection.id);

    // Update memory cache
    this.tokenCache.set(cacheKey, {
      token: tokenData.access_token,
      expires: expiresAt
    });

    console.log('Minted new access token successfully');
    return tokenData.access_token;
  }

  async keepAlive(hotelId: string) {
    try {
      await this.getAccessToken(hotelId);
      console.log(`Keep-alive successful for hotel ${hotelId}`);
    } catch (error) {
      console.error(`Keep-alive failed for hotel ${hotelId}:`, error);
      
      // Mark connection as error
      await this.supabase
        .from('beds24_connections')
        .update({ status: 'error' })
        .eq('hotel_id', hotelId);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const tokenService = new TokenService(supabase);
    const { action, hotelId, forWrite } = await req.json();

    switch (action) {
      case 'getAccessToken':
        const token = await tokenService.getAccessToken(hotelId, forWrite);
        return new Response(JSON.stringify({ token }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'keepAlive':
        await tokenService.keepAlive(hotelId);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'keepAliveAll':
        // Keep all active connections alive
        const { data: connections } = await supabase
          .from('beds24_connections')
          .select('hotel_id')
          .eq('status', 'active');

        for (const conn of connections || []) {
          await tokenService.keepAlive(conn.hotel_id);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          processed: connections?.length || 0 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('Error in beds24-token-service:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
