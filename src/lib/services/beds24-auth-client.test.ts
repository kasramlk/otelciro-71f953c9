import { describe, it, expect, vi, beforeEach } from 'vitest';
import { beds24Fetch, setupBeds24Integration, Beds24AuthError } from './beds24-auth-client';

// Mock supabase client
const mockSupabase = {
  functions: {
    invoke: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    insert: vi.fn(),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock fetch
global.fetch = vi.fn();

describe('beds24Fetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should make authenticated API calls with token injection', async () => {
    // Mock token response
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: { token: 'test-token-123' },
      error: null,
    });

    // Mock API response
    const mockApiResponse = {
      ok: true,
      status: 200,
      headers: new Map([
        ['x-five-min-limit-remaining', '100'],
        ['x-request-cost', '1'],
      ]),
      json: () => Promise.resolve({ properties: [] }),
    };
    
    (global.fetch as any).mockResolvedValueOnce(mockApiResponse);

    const result = await beds24Fetch('/properties', {
      organizationId: 'org-123',
    });

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('beds24-auth-token', {
      body: { organizationId: 'org-123' },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.beds24.com/v2/properties',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'token': 'test-token-123',
        },
      }
    );

    expect(result.data).toEqual({ properties: [] });
    expect(result.rateLimits?.fiveMinRemaining).toBe(100);
    expect(result.rateLimits?.requestCost).toBe(1);
  });

  it('should not inject token for authentication endpoints', async () => {
    const mockApiResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve({ success: true }),
    };
    
    (global.fetch as any).mockResolvedValueOnce(mockApiResponse);

    await beds24Fetch('/authentication/details', {
      organizationId: 'org-123',
    });

    expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.beds24.com/v2/authentication/details',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  });

  it('should retry on 401 authentication errors', async () => {
    // Mock initial token response
    mockSupabase.functions.invoke
      .mockResolvedValueOnce({
        data: { token: 'expired-token' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { token: 'fresh-token' },
        error: null,
      });

    // Mock first request (401) then successful request
    const mockFailedResponse = {
      ok: false,
      status: 401,
      headers: new Map(),
    };
    
    const mockSuccessResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve({ success: true }),
    };
    
    (global.fetch as any)
      .mockResolvedValueOnce(mockFailedResponse)
      .mockResolvedValueOnce(mockSuccessResponse);

    const result = await beds24Fetch('/properties', {
      organizationId: 'org-123',
    });

    expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual({ success: true });
  });

  it('should handle rate limiting with exponential backoff', async () => {
    vi.useFakeTimers();
    
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { token: 'test-token' },
      error: null,
    });

    // Mock rate limited response then success
    const mockRateLimitedResponse = {
      ok: false,
      status: 429,
      headers: new Map([['x-five-min-limit-resets-in', '60']]),
    };
    
    const mockSuccessResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve({ success: true }),
    };
    
    (global.fetch as any)
      .mockResolvedValueOnce(mockRateLimitedResponse)
      .mockResolvedValueOnce(mockSuccessResponse);

    const fetchPromise = beds24Fetch('/properties', {
      organizationId: 'org-123',
    });

    // Fast-forward timers to simulate backoff
    vi.advanceTimersByTime(2000);
    
    const result = await fetchPromise;
    
    expect(result.data).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    
    vi.useRealTimers();
  });

  it('should throw Beds24AuthError on API errors', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { token: 'test-token' },
      error: null,
    });

    const mockErrorResponse = {
      ok: false,
      status: 400,
      headers: new Map(),
      text: () => Promise.resolve('{"message": "Bad request"}'),
    };
    
    (global.fetch as any).mockResolvedValueOnce(mockErrorResponse);

    await expect(
      beds24Fetch('/properties', { organizationId: 'org-123' })
    ).rejects.toThrow(Beds24AuthError);
  });
});

describe('setupBeds24Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should setup integration successfully', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: {
        success: true,
        integrationId: 'int-123',
        expiresAt: '2024-01-01T12:00:00Z',
      },
      error: null,
    });

    const result = await setupBeds24Integration({
      organizationId: 'org-123',
      inviteCode: 'invite-123',
      deviceName: 'Test Device',
    });

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('beds24-auth-setup', {
      body: {
        organizationId: 'org-123',
        inviteCode: 'invite-123',
        deviceName: 'Test Device',
      },
    });

    expect(result).toEqual({
      success: true,
      integrationId: 'int-123',
      expiresAt: '2024-01-01T12:00:00Z',
    });
  });

  it('should handle setup errors', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid invite code' },
    });

    await expect(
      setupBeds24Integration({
        organizationId: 'org-123',
        inviteCode: 'invalid-code',
      })
    ).rejects.toThrow(Beds24AuthError);
  });
});

// Test idempotent token writes
describe('Token Management', () => {
  it('should handle concurrent token refresh requests idempotently', async () => {
    const tokenEndpoint = vi.fn()
      .mockResolvedValueOnce({
        data: { token: 'token-1', expiresAt: '2024-01-01T12:00:00Z' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { token: 'token-1', expiresAt: '2024-01-01T12:00:00Z' }, // Same token
        error: null,
      });

    mockSupabase.functions.invoke.mockImplementation(tokenEndpoint);

    const mockApiResponse = {
      ok: true,
      status: 200,
      headers: new Map(),
      json: () => Promise.resolve({ success: true }),
    };
    
    (global.fetch as any).mockResolvedValue(mockApiResponse);

    // Make concurrent requests
    const requests = [
      beds24Fetch('/properties', { organizationId: 'org-123' }),
      beds24Fetch('/bookings', { organizationId: 'org-123' }),
    ];

    const results = await Promise.all(requests);

    // Both should succeed
    expect(results[0].data).toEqual({ success: true });
    expect(results[1].data).toEqual({ success: true });
    
    // Token should be fetched for each request (in real scenario, caching would prevent this)
    expect(tokenEndpoint).toHaveBeenCalledTimes(2);
  });
});