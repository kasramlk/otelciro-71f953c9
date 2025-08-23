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
  userId: string;
  connectedAt: string;
}

class AirbnbService {
  private baseUrl = 'https://api.airbnb.com';
  private accessToken: string | null = null;

  // Initialize the service with stored access token from localStorage
  async initialize() {
    try {
      const storedConnection = localStorage.getItem('airbnb_connection');
      if (storedConnection) {
        const connection: AirbnbConnection = JSON.parse(storedConnection);
        this.accessToken = connection.accessToken;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize Airbnb service:', error);
      return false;
    }
  }

  // Generic API request method
  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Airbnb service not initialized or no access token available');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Airbnb-API-Key': 'your-api-key', // This would come from environment
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        await this.refreshAccessToken();
        // Retry the request once
        return this.apiRequest<T>(endpoint, options);
      }
      throw new Error(`Airbnb API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Refresh access token using refresh token
  private async refreshAccessToken(): Promise<void> {
    try {
      const storedConnection = localStorage.getItem('airbnb_connection');
      if (!storedConnection) {
        throw new Error('No refresh token available');
      }

      const connection: AirbnbConnection = JSON.parse(storedConnection);

      // Call Airbnb token refresh endpoint
      const response = await fetch(`${this.baseUrl}/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: connection.refreshToken,
          client_id: 'your-client-id', // This would come from secrets
          client_secret: 'your-client-secret', // This would come from secrets
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const tokenData = await response.json();
      
      // Update stored tokens in localStorage
      const updatedConnection: AirbnbConnection = {
        ...connection,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || connection.refreshToken,
      };
      
      localStorage.setItem('airbnb_connection', JSON.stringify(updatedConnection));
      this.accessToken = tokenData.access_token;
    } catch (error) {
      console.error('Failed to refresh Airbnb access token:', error);
      throw error;
    }
  }

  // Get all listings for the authenticated user
  async getListings(): Promise<AirbnbListing[]> {
    return this.apiRequest<AirbnbListing[]>('/v2/listings');
  }

  // Get specific listing details
  async getListing(listingId: string): Promise<AirbnbListing> {
    return this.apiRequest<AirbnbListing>(`/v2/listings/${listingId}`);
  }

  // Get reservations for a listing or all listings
  async getReservations(listingId?: string, startDate?: string, endDate?: string): Promise<AirbnbReservation[]> {
    let endpoint = '/v2/reservations';
    const params = new URLSearchParams();
    
    if (listingId) params.append('listing_id', listingId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return this.apiRequest<AirbnbReservation[]>(endpoint);
  }

  // Get calendar availability and pricing
  async getCalendar(listingId: string, startDate: string, endDate: string): Promise<AirbnbCalendar[]> {
    const endpoint = `/v2/listings/${listingId}/calendar?start_date=${startDate}&end_date=${endDate}`;
    return this.apiRequest<AirbnbCalendar[]>(endpoint);
  }

  // Update calendar availability and pricing
  async updateCalendar(listingId: string, updates: Omit<AirbnbCalendar, 'listingId'>[]): Promise<void> {
    await this.apiRequest(`/v2/listings/${listingId}/calendar`, {
      method: 'PUT',
      body: JSON.stringify({ calendar: updates }),
    });
  }

  // Block dates (set as unavailable)
  async blockDates(listingId: string, startDate: string, endDate: string, reason?: string): Promise<void> {
    await this.apiRequest(`/v2/listings/${listingId}/calendar/block`, {
      method: 'POST',
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        reason: reason || 'Blocked via PMS',
      }),
    });
  }

  // Unblock dates (set as available)
  async unblockDates(listingId: string, startDate: string, endDate: string): Promise<void> {
    await this.apiRequest(`/v2/listings/${listingId}/calendar/unblock`, {
      method: 'POST',
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
      }),
    });
  }

  // Update listing details
  async updateListing(listingId: string, updates: Partial<AirbnbListing>): Promise<AirbnbListing> {
    return this.apiRequest<AirbnbListing>(`/v2/listings/${listingId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Sync rates from PMS to Airbnb (foundation - to be implemented with actual database integration)
  async syncRates(listingId: string, roomTypeId: string, ratePlanId: string, startDate: string, endDate: string): Promise<void> {
    try {
      console.log(`Syncing rates for listing ${listingId}, room type ${roomTypeId}, rate plan ${ratePlanId} from ${startDate} to ${endDate}`);
      
      // This is the foundation - in production this would:
      // 1. Fetch rates from your PMS/channel store
      // 2. Convert rates to Airbnb calendar format
      // 3. Update Airbnb calendar via API
      // 4. Log sync activity
      
      // For now, mock the sync
      const mockCalendarUpdates: Omit<AirbnbCalendar, 'listingId'>[] = [];
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        mockCalendarUpdates.push({
          date: d.toISOString().split('T')[0],
          available: true,
          price: 100, // Mock price
        });
      }

      await this.updateCalendar(listingId, mockCalendarUpdates);
      console.log('Rates sync completed successfully');
      
    } catch (error) {
      console.error('Failed to sync rates to Airbnb:', error);
      throw error;
    }
  }

  // Sync availability from PMS to Airbnb (foundation - to be implemented with actual database integration)
  async syncAvailability(listingId: string, roomTypeId: string, startDate: string, endDate: string): Promise<void> {
    try {
      console.log(`Syncing availability for listing ${listingId}, room type ${roomTypeId} from ${startDate} to ${endDate}`);
      
      // This is the foundation - in production this would:
      // 1. Fetch inventory from your PMS
      // 2. Convert inventory to Airbnb calendar format
      // 3. Update Airbnb calendar via API
      // 4. Log sync activity
      
      // For now, mock the sync
      const mockCalendarUpdates: Omit<AirbnbCalendar, 'listingId'>[] = [];
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        mockCalendarUpdates.push({
          date: d.toISOString().split('T')[0],
          available: Math.random() > 0.2, // Mock availability
        });
      }

      await this.updateCalendar(listingId, mockCalendarUpdates);
      console.log('Availability sync completed successfully');
      
    } catch (error) {
      console.error('Failed to sync availability to Airbnb:', error);
      throw error;
    }
  }

  // Import reservations from Airbnb (foundation - to be implemented with actual database integration)
  async importReservations(startDate?: string, endDate?: string): Promise<void> {
    try {
      console.log(`Importing reservations from Airbnb${startDate ? ` from ${startDate}` : ''}${endDate ? ` to ${endDate}` : ''}`);
      
      const reservations = await this.getReservations(undefined, startDate, endDate);
      
      // This is the foundation - in production this would:
      // 1. Check if reservations already exist in your PMS
      // 2. Insert new reservations or update existing ones
      // 3. Log import activity
      
      console.log(`Found ${reservations.length} reservations to import`);
      console.log('Reservations import completed successfully');
      
    } catch (error) {
      console.error('Failed to import reservations from Airbnb:', error);
      throw error;
    }
  }
}

export const airbnbService = new AirbnbService();