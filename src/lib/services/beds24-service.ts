import { supabase } from "@/integrations/supabase/client";

export interface Beds24Connection {
  id: string;
  hotel_id: string;
  account_id: string;
  account_email: string;
  refresh_token: string;
  access_token?: string;
  token_expires_at?: string;
  api_credits_remaining: number;
  api_credits_reset_at: string;
  connection_status: string;
  last_sync_at?: string;
  sync_errors: any;
  scopes: string[];
  allow_linked_properties: boolean;
  ip_whitelist?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Beds24Property {
  id: string;
  hotel_id: string;
  connection_id: string;
  beds24_property_id: number;
  property_name: string;
  property_code?: string;
  property_status: string;
  sync_enabled: boolean;
  last_inventory_sync?: string;
  last_rates_sync?: string;
  last_bookings_sync?: string;
  sync_settings: any;
  created_at: string;
  updated_at: string;
}

export interface Beds24Channel {
  id: string;
  beds24_property_id: string;
  channel_name: string;
  channel_type: string;
  beds24_channel_id?: number;
  channel_code?: string;
  commission_rate: number;
  is_active: boolean;
  sync_status: string;
  last_sync_at?: string;
  sync_errors: any;
  channel_settings: any;
  mapping_config: any;
  created_at: string;
  updated_at: string;
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

export interface Beds24SyncLog {
  id: string;
  connection_id: string;
  beds24_property_id?: string;
  sync_type: string;
  sync_direction: string;
  status: string;
  started_at: string;
  completed_at?: string;
  records_processed: number;
  records_succeeded: number;
  records_failed: number;
  sync_data: any;
  error_details: any;
  performance_metrics: any;
  created_at: string;
}

interface Beds24ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  credits_used?: number;
  credits_remaining?: number;
}

export class Beds24Service {
  private baseUrl = 'https://api.beds24.com/v2';
  
// Updated service methods to work with new OAuth2 schema
  async exchangeInviteCode(invitationToken: string, hotelId: string): Promise<Beds24ApiResponse<{ connectionId: string; accountId: number }>> {
    try {
      const response = await supabase.functions.invoke('beds24-auth', {
        body: { action: 'exchange_invitation', invitationToken, hotelId }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error exchanging invitation token:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async refreshToken(refreshToken: string): Promise<Beds24ApiResponse<{ accessToken: string; expiresIn: number }>> {
    try {
      const response = await supabase.functions.invoke('beds24-auth', {
        body: { action: 'refresh_token', refreshToken }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
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
      return data || [];
    } catch (error) {
      console.error('Error fetching Beds24 connections:', error);
      return [];
    }
  }

  async updateConnectionStatus(connectionId: string, status: string, errors?: any[]): Promise<boolean> {
    try {
      const updateData: any = { 
        connection_status: status,
        updated_at: new Date().toISOString()
      };
      
      if (errors) {
        updateData.sync_errors = errors;
      }

      const { error } = await supabase
        .from('beds24_connections')
        .update(updateData)
        .eq('id', connectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating connection status:', error);
      return false;
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
      const response = await supabase.functions.invoke('beds24-sync', {
        body: { 
          action: 'sync_properties', 
          connectionId,
          syncType: 'properties',
          syncDirection: 'pull'
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error syncing properties:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Channel Management - Updated to work with inventory table
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

  async syncInventory(propertyId: string, dateRange: { from: string; to: string }): Promise<Beds24ApiResponse<Beds24Inventory[]>> {
    try {
      const response = await supabase.functions.invoke('beds24-inventory-pull', {
        body: { 
          propertyId,
          dateRange,
          syncType: 'inventory',
          syncDirection: 'pull'
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error syncing inventory:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Inventory Management
  async pushInventory(propertyId: string, inventoryData: {
    roomTypeId: string;
    dateRange: { from: string; to: string };
    availability?: number;
    rates?: { [key: string]: number };
    restrictions?: any;
  }): Promise<Beds24ApiResponse<any>> {
    try {
      const response = await supabase.functions.invoke('beds24-inventory-push', {
        body: { 
          propertyId,
          inventoryData,
          syncType: 'inventory',
          syncDirection: 'push'
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error pushing inventory:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Booking Management
  async pullBookings(connectionId: string, dateRange?: { from: string; to: string }): Promise<Beds24ApiResponse<any[]>> {
    try {
      const response = await supabase.functions.invoke('beds24-reservations-pull', {
        body: { 
          connectionId,
          dateRange,
          syncType: 'bookings',
          syncDirection: 'pull'
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error pulling bookings:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Sync Logging
  async createSyncLog(syncData: {
    connection_id: string;
    beds24_property_id?: string;
    sync_type: string;
    sync_direction: string;
    status?: string;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('beds24_sync_logs')
        .insert({
          ...syncData,
          status: syncData.status || 'pending',
          records_processed: 0,
          records_succeeded: 0,
          records_failed: 0,
          api_credits_used: 0,
          sync_data: {},
          error_details: [],
          performance_metrics: {}
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating sync log:', error);
      return null;
    }
  }

  async updateSyncLog(syncLogId: string, updates: Partial<Beds24SyncLog>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('beds24_sync_logs')
        .update({
          ...updates,
          ...(updates.status === 'completed' || updates.status === 'failed' ? 
            { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', syncLogId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating sync log:', error);
      return false;
    }
  }

  async getSyncLogs(connectionId: string, limit: number = 50): Promise<Beds24SyncLog[]> {
    try {
      const { data, error } = await supabase
        .from('beds24_sync_logs')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sync logs:', error);
      return [];
    }
  }

  // API Logs - New table for API monitoring
  async getApiLogs(connectionId: string, limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('beds24_api_logs')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching API logs:', error);
      return [];
    }
  }

  // Health Check
  async testConnection(connectionId: string): Promise<Beds24ApiResponse<{ status: string; credits_remaining: number }>> {
    try {
      const response = await supabase.functions.invoke('beds24-auth', {
        body: { action: 'test_connection', connectionId }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error testing connection:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const beds24Service = new Beds24Service();