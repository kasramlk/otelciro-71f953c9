import { supabase } from '@/integrations/supabase/client';

// Airbnb API interfaces
export interface AirbnbListing {
  id: string;
  name: string;
  propertyType: string;
  roomType: string;
  accommodates: number;
  bedrooms: number;
  bathrooms: number;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  amenities: string[];
  photos: string[];
  pricing: {
    basePrice: number;
    currency: string;
    weeklyDiscount?: number;
    monthlyDiscount?: number;
  };
  availability: {
    minimumStay: number;
    maximumStay: number;
    advanceNotice: number;
    preparationTime: number;
  };
  rules: {
    checkInTime: string;
    checkOutTime: string;
    smokingAllowed: boolean;
    petsAllowed: boolean;
    partiesAllowed: boolean;
  };
}

export interface AirbnbReservation {
  id: string;
  listingId: string;
  guestId: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  currency: string;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AirbnbCalendar {
  listingId: string;
  date: string;
  available: boolean;
  price?: number;
  minimumNights?: number;
  maximumNights?: number;
}

export interface AirbnbConnection {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  accountId: string;
  accountName: string;
}

class AirbnbService {
  private baseURL = 'https://api.airbnb.com/v1';

  constructor() {
    // Service now uses Supabase backend instead of localStorage
  }

  // Start OAuth flow
  startOAuthFlow(hotelId: string): string {
    const state = `airbnb_auth_${Date.now()}_${hotelId}`;
    const clientId = '32b224761b3a9b3ba365c3bd81855e11'; // Your Airbnb API key
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/airbnb/callback`);
    
    const authUrl = `https://www.airbnb.com/oauth/authorize` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${redirectUri}` +
      `&state=${state}` +
      `&scope=read_write`;
    
    // Store state for validation
    localStorage.setItem('airbnb_oauth_state', state);
    
    return authUrl;
  }

  // Handle OAuth callback
  async handleOAuthCallback(code: string, state: string, hotelId: string): Promise<AirbnbConnection> {
    // Validate state
    const storedState = localStorage.getItem('airbnb_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }

    try {
      const { data, error } = await supabase.functions.invoke('airbnb-oauth-token', {
        body: { code, state, hotelId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      localStorage.removeItem('airbnb_oauth_state');

      return {
        accessToken: 'stored_in_backend',
        refreshToken: 'stored_in_backend',
        expiresAt: new Date(Date.now() + 3600000),
        accountId: data.connectionId,
        accountName: data.accountName
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw new Error('Failed to complete OAuth flow');
    }
  }

  // Get connection status for a hotel
  async getConnectionStatus(hotelId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('airbnb_connections')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching connection status:', error);
      return null;
    }
  }

  // Get Airbnb listings for a hotel
  async getListings(hotelId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('airbnb_listings')
        .select(`
          *,
          airbnb_connections!inner (
            hotel_id,
            is_active
          )
        `)
        .eq('airbnb_connections.hotel_id', hotelId)
        .eq('airbnb_connections.is_active', true);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching listings:', error);
      return [];
    }
  }

  // Sync listings from Airbnb
  async syncListings(connectionId: string): Promise<{ success: boolean; processed: number; failed: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('airbnb-sync', {
        body: {
          connectionId,
          syncType: 'listings',
          direction: 'pull'
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error syncing listings:', error);
      throw new Error('Failed to sync listings from Airbnb');
    }
  }

  // Sync rates to Airbnb
  async syncRates(connectionId: string, startDate: string, endDate: string): Promise<{ success: boolean; processed: number; failed: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('airbnb-sync', {
        body: {
          connectionId,
          syncType: 'rates',
          direction: 'push',
          startDate,
          endDate
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error syncing rates:', error);
      throw new Error('Failed to sync rates to Airbnb');
    }
  }

  // Sync availability to Airbnb
  async syncAvailability(connectionId: string, startDate: string, endDate: string): Promise<{ success: boolean; processed: number; failed: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('airbnb-sync', {
        body: {
          connectionId,
          syncType: 'availability',
          direction: 'push',
          startDate,
          endDate
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error syncing availability:', error);
      throw new Error('Failed to sync availability to Airbnb');
    }
  }

  // Import reservations from Airbnb
  async importReservations(connectionId: string): Promise<{ success: boolean; imported: number; skipped: number; errors: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('airbnb-reservations', {
        body: {
          connectionId,
          action: 'import'
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error importing reservations:', error);
      throw new Error('Failed to import reservations from Airbnb');
    }
  }

  // Get sync logs for a connection
  async getSyncLogs(connectionId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('airbnb_sync_logs')
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

  // Update listing mapping (room type association)
  async updateListingMapping(listingId: string, roomTypeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('airbnb_listings')
        .update({
          room_type_id: roomTypeId,
          is_active: roomTypeId !== '00000000-0000-0000-0000-000000000000'
        })
        .eq('id', listingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating listing mapping:', error);
      return false;
    }
  }

  // Update sync settings for a listing
  async updateSyncSettings(listingId: string, settings: {
    sync_rates?: boolean;
    sync_availability?: boolean;
    sync_restrictions?: boolean;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('airbnb_listings')
        .update(settings)
        .eq('id', listingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating sync settings:', error);
      return false;
    }
  }

  // Disconnect Airbnb integration
  async disconnect(connectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('airbnb_connections')
        .update({
          is_active: false,
          sync_status: 'disconnected'
        })
        .eq('id', connectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error disconnecting Airbnb:', error);
      return false;
    }
  }

  // Get imported Airbnb reservations
  async getAirbnbReservations(connectionId: string, limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('airbnb_reservations')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching Airbnb reservations:', error);
      return [];
    }
  }
}

export const airbnbService = new AirbnbService();