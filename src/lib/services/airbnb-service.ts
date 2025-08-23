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

  // Start OAuth flow - DEMO VERSION for testing
  startOAuthFlow(hotelId: string): string {
    // For demo purposes, we'll simulate the OAuth flow without redirecting to real Airbnb
    console.log('Demo: Starting Airbnb OAuth flow for hotel:', hotelId);
    
    // In a real implementation, this would redirect to Airbnb
    // For demo, we'll just return a mock auth URL and simulate success
    const state = `airbnb_auth_${Date.now()}_${hotelId}`;
    
    // Store state for validation
    localStorage.setItem('airbnb_oauth_state', state);
    
    // Simulate successful OAuth by directly calling the callback after a short delay
    setTimeout(() => {
      // Simulate OAuth callback with mock data
      const mockConnectionData = {
        id: 'mock-connection-id',
        hotel_id: hotelId,
        account_id: 'demo-account-123',
        account_name: 'Demo Airbnb Account',
        access_token: 'mock-access-token',
        is_active: true,
        sync_status: 'connected',
        created_at: new Date().toISOString(),
        last_sync: new Date().toISOString()
      };
      
      // Store in localStorage for demo purposes
      localStorage.setItem(`airbnb_connection_${hotelId}`, JSON.stringify(mockConnectionData));
      
      // Trigger a page reload to show the connection status
      window.location.reload();
    }, 1000);
    
    return 'demo-oauth-flow-initiated'; // Return placeholder instead of real URL
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
      // First try to get from database
      const { data, error } = await supabase
        .from('airbnb_connections')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('is_active', true)
        .single();

      if (data) {
        return data;
      }

      // If no database connection, check for demo data in localStorage
      const demoData = localStorage.getItem(`airbnb_connection_${hotelId}`);
      if (demoData) {
        return JSON.parse(demoData);
      }

      return null;
    } catch (error) {
      console.error('Error fetching connection status:', error);
      
      // Fall back to demo data if database fails
      const demoData = localStorage.getItem(`airbnb_connection_${hotelId}`);
      if (demoData) {
        return JSON.parse(demoData);
      }
      
      return null;
    }
  }

  // Get Airbnb listings for a hotel
  async getListings(hotelId: string): Promise<any[]> {
    try {
      // First try to get from database
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

      if (data && data.length > 0) {
        return data;
      }

      // If no database listings, return demo data
      return [
        {
          id: 'demo-listing-1',
          airbnb_listing_id: '12345678',
          airbnb_listing_name: 'Luxury Suite - Ocean View',
          room_type_id: 'room-type-1',
          sync_rates: true,
          sync_availability: true,
          sync_restrictions: true,
          is_active: true
        },
        {
          id: 'demo-listing-2',
          airbnb_listing_id: '87654321',
          airbnb_listing_name: 'Standard Room - City View',
          room_type_id: 'room-type-2',
          sync_rates: true,
          sync_availability: false,
          sync_restrictions: true,
          is_active: true
        },
        {
          id: 'demo-listing-3',
          airbnb_listing_id: '13579246',
          airbnb_listing_name: 'Deluxe Double Room',
          room_type_id: 'room-type-3',
          sync_rates: false,
          sync_availability: true,
          sync_restrictions: false,
          is_active: true
        }
      ];
    } catch (error) {
      console.error('Error fetching listings:', error);
      
      // Fall back to demo data if database fails
      return [
        {
          id: 'demo-listing-1',
          airbnb_listing_id: '12345678',
          airbnb_listing_name: 'Demo Luxury Suite',
          room_type_id: 'room-type-1',
          sync_rates: true,
          sync_availability: true,
          sync_restrictions: true,
          is_active: true
        }
      ];
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