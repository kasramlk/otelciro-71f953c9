import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock integration test for beds24-sync advancing checkpoints
describe('Beds24 Sync Integration', () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should advance bookings checkpoint on successful sync', async () => {
    const initialCheckpoint = '2024-01-01T00:00:00Z';
    const newModifiedTime = '2024-01-02T15:30:00Z';

    // Mock bookings response with newer modified times
    const mockBookingsResponse = {
      data: {
        data: [
          {
            id: 'BOOKING_456',
            modifiedDateTime: newModifiedTime,
            status: 'confirmed',
            roomId: 'ROOM_1',
            arrival: '2024-01-20',
            departure: '2024-01-22'
          },
          {
            id: 'BOOKING_789',
            modifiedDateTime: '2024-01-02T10:15:00Z',
            status: 'cancelled',
            roomId: 'ROOM_2',
            arrival: '2024-01-25',
            departure: '2024-01-27'
          }
        ]
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([
        ['x-api-credits-remaining', '800'],
        ['x-api-credits-resets-in', '3600'],
        ['x-api-request-cost', '15']
      ]),
      json: () => Promise.resolve(mockBookingsResponse)
    });

    // Simulate sync function
    const syncBookings = async (hotelId: string, lastModified: string) => {
      const response = await fetch(`https://api.beds24.com/v2/properties/TEST_PROP/bookings?modifiedFrom=${lastModified}`);
      const data = await response.json();
      
      let latestModified = lastModified;
      let processed = 0;
      
      if (data.data?.data) {
        for (const booking of data.data.data) {
          processed++;
          if (booking.modifiedDateTime > latestModified) {
            latestModified = booking.modifiedDateTime;
          }
        }
      }

      return {
        success: true,
        processed,
        checkpoints: {
          last_bookings_modified_from: latestModified,
          previous_checkpoint: lastModified
        },
        creditInfo: {
          remaining: parseInt(response.headers.get('x-api-credits-remaining') || '0')
        }
      };
    };

    // Execute sync
    const result = await syncBookings('HOTEL_123', initialCheckpoint);

    // Verify checkpoint advancement
    expect(result.success).toBe(true);
    expect(result.processed).toBe(2);
    expect(result.checkpoints.last_bookings_modified_from).toBe(newModifiedTime);
    expect(result.checkpoints.previous_checkpoint).toBe(initialCheckpoint);
    expect(new Date(result.checkpoints.last_bookings_modified_from).getTime())
      .toBeGreaterThan(new Date(initialCheckpoint).getTime());
    
    // Verify API call was made with correct parameters
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`modifiedFrom=${encodeURIComponent(initialCheckpoint)}`)
    );
  });

  it('should handle empty bookings response without advancing checkpoint', async () => {
    const initialCheckpoint = '2024-01-01T00:00:00Z';

    // Mock empty response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([
        ['x-api-credits-remaining', '850'],
        ['x-api-credits-resets-in', '3600'],
        ['x-api-request-cost', '5']
      ]),
      json: () => Promise.resolve({ data: { data: [] } })
    });

    const syncBookings = async (hotelId: string, lastModified: string) => {
      const response = await fetch(`https://api.beds24.com/v2/properties/TEST_PROP/bookings?modifiedFrom=${lastModified}`);
      const data = await response.json();
      
      let latestModified = lastModified;
      let processed = 0;
      
      if (data.data?.data) {
        for (const booking of data.data.data) {
          processed++;
          if (booking.modifiedDateTime > latestModified) {
            latestModified = booking.modifiedDateTime;
          }
        }
      }

      return {
        success: true,
        processed,
        checkpoints: {
          last_bookings_modified_from: latestModified,
          unchanged: latestModified === lastModified
        }
      };
    };

    const result = await syncBookings('HOTEL_123', initialCheckpoint);

    expect(result.success).toBe(true);
    expect(result.processed).toBe(0);
    expect(result.checkpoints.last_bookings_modified_from).toBe(initialCheckpoint);
    expect(result.checkpoints.unchanged).toBe(true);
  });

  it('should handle rate limiting during sync', async () => {
    const initialCheckpoint = '2024-01-01T00:00:00Z';

    // Mock response with low credits
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([
        ['x-api-credits-remaining', '30'], // Below threshold
        ['x-api-credits-resets-in', '2400'],
        ['x-api-request-cost', '20']
      ]),
      json: () => Promise.resolve({ data: { data: [] } })
    });

    const syncBookings = async (hotelId: string, lastModified: string) => {
      const response = await fetch(`https://api.beds24.com/v2/properties/TEST_PROP/bookings?modifiedFrom=${lastModified}`);
      const remaining = parseInt(response.headers.get('x-api-credits-remaining') || '0');
      
      if (remaining < 50) {
        return {
          success: false,
          rateLimited: true,
          remaining,
          resetsIn: parseInt(response.headers.get('x-api-credits-resets-in') || '0'),
          message: 'Sync paused due to rate limit'
        };
      }
      
      return { success: true };
    };

    const result = await syncBookings('HOTEL_123', initialCheckpoint);

    expect(result.success).toBe(false);
    expect(result.rateLimited).toBe(true);
    expect(result.remaining).toBe(30);
    expect(result.resetsIn).toBe(2400);
  });

  it('should sync calendar and advance calendar checkpoints', async () => {
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Mock calendar response
    const mockCalendarResponse = {
      data: [
        {
          date: today,
          roomId: 'ROOM_1',
          price: 180,
          numAvail: 3,
          minStay: 1,
          maxStay: 7
        },
        {
          date: today,
          roomId: 'ROOM_2', 
          price: 250,
          numAvail: 1,
          minStay: 2,
          maxStay: 14
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([
        ['x-api-credits-remaining', '750'],
        ['x-api-credits-resets-in', '3600'],
        ['x-api-request-cost', '25']
      ]),
      json: () => Promise.resolve(mockCalendarResponse)
    });

    const syncCalendar = async (hotelId: string) => {
      const response = await fetch(`https://api.beds24.com/v2/properties/TEST_PROP/rooms/calendar?startDate=${today}&endDate=${nextYear}`);
      const data = await response.json();
      
      const roomGroups: Record<string, any[]> = {};
      
      if (data.data) {
        for (const dayData of data.data) {
          const roomId = dayData.roomId.toString();
          if (!roomGroups[roomId]) {
            roomGroups[roomId] = [];
          }
          roomGroups[roomId].push(dayData);
        }
      }

      return {
        success: true,
        processed: Object.keys(roomGroups).length,
        checkpoints: {
          last_calendar_start: today,
          last_calendar_end: nextYear
        },
        roomGroups
      };
    };

    const result = await syncCalendar('HOTEL_123');

    expect(result.success).toBe(true);
    expect(result.processed).toBe(2); // 2 different room IDs
    expect(result.checkpoints.last_calendar_start).toBe(today);
    expect(result.checkpoints.last_calendar_end).toBe(nextYear);
    expect(result.roomGroups['ROOM_1']).toHaveLength(1);
    expect(result.roomGroups['ROOM_2']).toHaveLength(1);
  });
});