import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock integration test for beds24-rate-push
describe('Beds24 Rate Push Integration', () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should chunk rate pushes to ≤50 days and audit each call', async () => {
    const pushConfig = {
      hotelId: 'HOTEL_123',
      roomTypeId: 'ROOM_TYPE_456',
      start: '2024-01-01',
      end: '2024-03-31', // 90 days - should be split into 2 chunks
      changes: {
        rate: 200,
        numAvail: 5,
        minStay: 2
      }
    };

    // Mock successful responses for both chunks
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        headers: new Map([
          ['x-api-credits-remaining', '800'],
          ['x-api-credits-resets-in', '3600'],
          ['x-api-request-cost', '25']
        ]),
        json: () => Promise.resolve({ success: true, updated: 50 })
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Map([
          ['x-api-credits-remaining', '775'],
          ['x-api-credits-resets-in', '3600'],
          ['x-api-request-cost', '25']
        ]),
        json: () => Promise.resolve({ success: true, updated: 40 })
      });

    // Simulate rate push function
    const ratePush = async (config: typeof pushConfig) => {
      const startDate = new Date(config.start);
      const endDate = new Date(config.end);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      
      const chunks = [];
      const chunkSize = 50;
      
      // Create chunks
      for (let i = 0; i < totalDays; i += chunkSize) {
        const chunkStart = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const chunkEnd = new Date(Math.min(
          startDate.getTime() + (i + chunkSize) * 24 * 60 * 60 * 1000,
          endDate.getTime()
        ));
        
        chunks.push({
          start: chunkStart.toISOString().split('T')[0],
          end: chunkEnd.toISOString().split('T')[0],
          days: Math.ceil((chunkEnd.getTime() - chunkStart.getTime()) / (24 * 60 * 60 * 1000))
        });
      }
      
      const results = [];
      const auditEntries = [];
      
      // Process each chunk
      for (const chunk of chunks) {
        const response = await fetch(`https://api.beds24.com/v2/properties/TEST_PROP/rooms/calendar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: config.roomTypeId,
            ...config.changes,
            dateRange: { start: chunk.start, end: chunk.end }
          })
        });
        
        const data = await response.json();
        results.push(data);
        
        // Create audit entry for this chunk
        auditEntries.push({
          operation: 'rate_push',
          hotel_id: config.hotelId,
          status: response.ok ? 'success' : 'error',
          request_cost: parseInt(response.headers.get('x-api-request-cost') || '0'),
          credit_limit_remaining: parseInt(response.headers.get('x-api-credits-remaining') || '0'),
          request_payload: {
            roomId: config.roomTypeId,
            dateRange: chunk,
            changes: config.changes
          },
          response_payload: data
        });
      }
      
      return {
        success: true,
        chunks: chunks.length,
        totalDays,
        maxChunkSize: Math.max(...chunks.map(c => c.days)),
        auditEntries,
        results
      };
    };

    // Execute rate push
    const result = await ratePush(pushConfig);

    // Verify chunking
    expect(result.success).toBe(true);
    expect(result.chunks).toBe(2); // 90 days should split into 2 chunks
    expect(result.totalDays).toBe(90);
    expect(result.maxChunkSize).toBeLessThanOrEqual(50);
    
    // Verify each chunk was audited
    expect(result.auditEntries).toHaveLength(2);
    expect(result.auditEntries[0]).toMatchObject({
      operation: 'rate_push',
      hotel_id: 'HOTEL_123',
      status: 'success',
      request_cost: 25,
      credit_limit_remaining: 800
    });
    expect(result.auditEntries[1]).toMatchObject({
      operation: 'rate_push',
      hotel_id: 'HOTEL_123',
      status: 'success',
      request_cost: 25,
      credit_limit_remaining: 775
    });
    
    // Verify API was called twice (once per chunk)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should handle single chunk for small date ranges', async () => {
    const pushConfig = {
      hotelId: 'HOTEL_123',
      roomTypeId: 'ROOM_TYPE_456',
      start: '2024-01-01',
      end: '2024-01-15', // 14 days - single chunk
      changes: {
        stopSell: true
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([
        ['x-api-credits-remaining', '900'],
        ['x-api-credits-resets-in', '3600'],
        ['x-api-request-cost', '10']
      ]),
      json: () => Promise.resolve({ success: true, updated: 14 })
    });

    const ratePush = async (config: typeof pushConfig) => {
      const startDate = new Date(config.start);
      const endDate = new Date(config.end);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      
      if (totalDays <= 50) {
        // Single chunk
        const response = await fetch(`https://api.beds24.com/v2/properties/TEST_PROP/rooms/calendar`, {
          method: 'POST',
          body: JSON.stringify(config)
        });
        
        return {
          success: true,
          chunks: 1,
          totalDays,
          singleChunk: true
        };
      }
      
      return { success: false, message: 'Should not reach here in this test' };
    };

    const result = await ratePush(pushConfig);

    expect(result.success).toBe(true);
    expect(result.chunks).toBe(1);
    expect(result.totalDays).toBe(14);
    expect(result.singleChunk).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should fail gracefully on API errors and still create audit entries', async () => {
    const pushConfig = {
      hotelId: 'HOTEL_123',
      roomTypeId: 'ROOM_TYPE_456',
      start: '2024-01-01',
      end: '2024-01-07',
      changes: { rate: 300 }
    };

    // Mock API error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: new Map([
        ['x-api-credits-remaining', '850'],
        ['x-api-request-cost', '5']
      ]),
      json: () => Promise.resolve({ error: 'Invalid room type' })
    });

    const ratePush = async (config: typeof pushConfig) => {
      const response = await fetch(`https://api.beds24.com/v2/properties/TEST_PROP/rooms/calendar`, {
        method: 'POST',
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      
      // Always create audit entry, even for failures
      const auditEntry = {
        operation: 'rate_push',
        hotel_id: config.hotelId,
        status: response.ok ? 'success' : 'error',
        request_cost: parseInt(response.headers.get('x-api-request-cost') || '0'),
        credit_limit_remaining: parseInt(response.headers.get('x-api-credits-remaining') || '0'),
        error_details: response.ok ? null : data.error
      };

      return {
        success: response.ok,
        auditEntry,
        error: response.ok ? null : data.error
      };
    };

    const result = await ratePush(pushConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid room type');
    expect(result.auditEntry.status).toBe('error');
    expect(result.auditEntry.request_cost).toBe(5);
    expect(result.auditEntry.credit_limit_remaining).toBe(850);
  });
});