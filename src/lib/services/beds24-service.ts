import { supabase } from "@/integrations/supabase/client";

// Simplified Beds24 Data Structures
export interface Beds24Connection {
  id: string
  hotel_id: string
  refresh_token: string
  access_token?: string
  token_expires_at?: string
  account_id: number
  account_name?: string
  account_email?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Beds24Property {
  id: string
  connection_id: string
  hotel_id: string
  beds24_property_id: number
  property_name: string
  property_code?: string
  currency: string
  sync_enabled: boolean
  sync_settings: any
  last_bookings_sync?: string
  last_inventory_sync?: string
  last_rates_sync?: string
  property_status: string
  created_at: string
  updated_at: string
}

export interface Beds24Room {
  id: string
  beds24_property_id: string
  hotel_id: string
  room_type_id?: string
  beds24_room_id: number
  room_name: string
  room_code?: string
  max_occupancy: number
  room_settings: any
  sync_enabled: boolean
  created_at: string
  updated_at: string
}

export interface Beds24Booking {
  id: string
  connection_id: string
  beds24_property_id: string
  hotel_id: string
  reservation_id?: string
  beds24_booking_id: number
  beds24_room_id: number
  status: string
  arrival: string
  departure: string
  num_adult: number
  num_child: number
  guest_info: any
  amounts: any
  currency: string
  booking_data: any
  last_modified?: string
  imported_at: string
  created_at: string
  updated_at: string
}

export interface Beds24Inventory {
  id: string
  beds24_property_id: string
  beds24_room_id: number
  date: string
  available?: number
  price?: number
  min_stay?: number
  max_stay?: number
  closed_to_arrival: boolean
  closed_to_departure: boolean
  restrictions: any
  last_updated: string
  synced_from_beds24: boolean
  expires_at: string
}

interface Beds24ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class Beds24Service {
  private baseUrl = 'https://api.beds24.com/v2';
  
  /**
   * Setup new Beds24 connection using invitation code
   */
  async setupConnection(invitationCode: string, hotelId: string): Promise<Beds24ApiResponse<{ connectionId: string }>> {
    try {
      console.log('Setting up Beds24 connection for hotel:', hotelId)
      
      const { data, error } = await supabase.functions.invoke('beds24-auth', {
        body: { 
          action: 'setup', 
          invitationCode, 
          hotelId,
          deviceName: 'OtelCiro-PMS'
        }
      });

      if (error) {
        console.error('Edge function error:', error)
        return { success: false, error: error.message };
      }

      return data || { success: false, error: 'No response data' };
    } catch (error) {
      console.error('Error setting up connection:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get valid access token (auto-refresh if needed)
   */
  async getValidAccessToken(connectionId: string): Promise<string | null> {
    try {
      // Get current connection data
      const { data: connection, error } = await supabase
        .from('beds24_connections')
        .select('*')
        .eq('id', connectionId)
        .single()

      if (error || !connection) {
        console.error('Failed to fetch connection:', error)
        return null
      }

      // Check if current access token is still valid (add 5 minute buffer)
      const now = new Date()
      const expiresAt = new Date(connection.token_expires_at)
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      if (connection.access_token && expiresAt.getTime() > (now.getTime() + bufferTime)) {
        // Token is still valid
        return connection.access_token
      }

      // Token expired or about to expire, refresh it
      console.log('Access token expired or about to expire, refreshing...')
      const { data, error: refreshError } = await supabase.functions.invoke('beds24-auth', {
        body: { 
          action: 'refresh', 
          refreshToken: connection.refresh_token
        }
      });

      if (refreshError || !data?.success) {
        console.error('Token refresh failed:', refreshError || data?.error)
        return null
      }

      // Update database with new token
      await supabase
        .from('beds24_connections')
        .update({
          access_token: data.data.accessToken,
          token_expires_at: data.data.expiresAt
        })
        .eq('id', connectionId)

      return data.data.accessToken

    } catch (error) {
      console.error('Error getting valid access token:', error)
      return null
    }
  }

  /**
   * Make authenticated API call to Beds24
   */
  async makeApiCall(connectionId: string, endpoint: string, options: RequestInit = {}): Promise<any> {
    const accessToken = await this.getValidAccessToken(connectionId)
    
    if (!accessToken) {
      throw new Error('Failed to get valid access token')
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`API call failed: ${response.status} - ${errorData}`)
    }

    return await response.json()
  }

  // Connection Management
  async getConnections(hotelId: string): Promise<Beds24Connection[]> {
    try {
      const { data, error } = await supabase
        .from('beds24_connections')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Beds24Connection[];
    } catch (error) {
      console.error('Error fetching Beds24 connections:', error);
      return [];
    }
  }

  // Property Management
  async getProperties(connectionId: string): Promise<Beds24Property[]> {
    try {
      const { data, error } = await supabase
        .from('beds24_properties')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching Beds24 properties:', error);
      return [];
    }
  }

  async syncProperties(connectionId: string): Promise<Beds24ApiResponse<Beds24Property[]>> {
    try {
      console.log('Syncing properties for connection:', connectionId);
      
      // Call the Supabase Edge Function for properties sync
      const { data: functionResult, error: functionError } = await supabase.functions.invoke('beds24-properties-sync', {
        body: { connectionId }
      });

      console.log('Edge function response:', { functionResult, functionError });

      if (functionError) {
        console.error('Edge function error details:', functionError);
        throw new Error(`Edge function error: ${functionError.message}`);
      }

      if (!functionResult) {
        throw new Error('No response from edge function');
      }

      if (!functionResult.success) {
        console.error('Edge function returned error:', functionResult.error);
        throw new Error(functionResult.error || 'Properties sync failed');
      }

      console.log('Properties sync successful:', functionResult.data);
      
      // Return the synced properties
      return { 
        success: true, 
        data: functionResult.data?.properties || [] 
      };
    } catch (error) {
      console.error('Error syncing properties:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Inventory Management
  async getInventory(propertyId: string, dateRange?: { from: string; to: string }): Promise<Beds24Inventory[]> {
    try {
      let query = supabase
        .from('beds24_inventory')
        .select('*')
        .eq('beds24_property_id', propertyId);

      if (dateRange) {
        query = query
          .gte('date', dateRange.from)
          .lte('date', dateRange.to);
      }

      const { data, error } = await query.order('date');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching Beds24 inventory:', error);
      return [];
    }
  }

  async syncInventory(connectionId: string, propertyId: string, dateRange: { from: string; to: string }): Promise<Beds24ApiResponse<Beds24Inventory[]>> {
    try {
      const inventoryData = await this.makeApiCall(
        connectionId, 
        `/properties/${propertyId}/inventory?from=${dateRange.from}&to=${dateRange.to}`
      );
      
      // Process and store inventory in database
      // Implementation details depend on Beds24 API response structure
      
      return { success: true, data: [] };
    } catch (error) {
      console.error('Error syncing inventory:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async pushInventory(connectionId: string, propertyId: string, inventoryData: {
    roomTypeId: string;
    dateRange: { from: string; to: string };
    availability?: number;
    rates?: { [key: string]: number };
    restrictions?: any;
  }): Promise<Beds24ApiResponse<any>> {
    try {
      const result = await this.makeApiCall(
        connectionId,
        `/properties/${propertyId}/inventory`,
        {
          method: 'POST',
          body: JSON.stringify(inventoryData)
        }
      );
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error pushing inventory:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Booking Management
  async pullBookings(connectionId: string, dateRange?: { from: string; to: string }): Promise<Beds24ApiResponse<Beds24Booking[]>> {
    try {
      let endpoint = '/bookings';
      if (dateRange) {
        endpoint += `?from=${dateRange.from}&to=${dateRange.to}`;
      }
      
      const bookingsData = await this.makeApiCall(connectionId, endpoint);
      
      // Process and store bookings in database
      // Implementation details depend on Beds24 API response structure
      
      return { success: true, data: [] };
    } catch (error) {
      console.error('Error pulling bookings:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Health Check
  async testConnection(connectionId: string): Promise<Beds24ApiResponse<{ status: string }>> {
    try {
      const result = await this.makeApiCall(connectionId, '/authentication/details');
      
      return { 
        success: true, 
        data: { 
          status: result.validToken ? 'active' : 'invalid'
        }
      };
    } catch (error) {
      console.error('Error testing connection:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const beds24Service = new Beds24Service();