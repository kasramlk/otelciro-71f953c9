// Test utilities for shared Beds24 libraries
import { expect, vi } from 'vitest';

// Mock logger
export function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  };
}

// Mock Supabase client
export function createMockSupabase() {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
      insert: vi.fn(() => ({ data: [], error: null })),
      update: vi.fn(() => ({ data: [], error: null })),
      upsert: vi.fn(() => ({ data: [], error: null })),
      delete: vi.fn(() => ({ data: [], error: null })),
      eq: vi.fn(() => ({ data: [], error: null })),
      order: vi.fn(() => ({ data: [], error: null })),
      limit: vi.fn(() => ({ data: [], error: null }))
    }))
  };
}

// Mock HTTP response
export function createMockResponse(data: any, headers: Record<string, string> = {}) {
  return {
    ok: true,
    status: 200,
    headers: new Map(Object.entries({
      'x-api-credits-remaining': '1000',
      'x-api-credits-resets-in': '3600',
      'x-api-request-cost': '1',
      ...headers
    })),
    json: vi.fn().mockResolvedValue(data)
  };
}

// Test data factories
export const testData = {
  hotelProperty: {
    id: 'TEST_PROP_123',
    name: 'Test Hotel',
    rooms: [
      {
        id: 'ROOM_1',
        name: 'Standard Room',
        roomQty: 10
      }
    ]
  },
  
  booking: {
    id: 'BOOKING_123',
    modifiedDateTime: '2024-01-01T12:00:00Z',
    status: 'confirmed',
    guests: [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      }
    ],
    invoiceItems: [
      {
        description: 'Room charge',
        amount: 100,
        qty: 1
      }
    ]
  },

  calendarDay: {
    date: '2024-01-01',
    roomId: 'ROOM_1',
    price: 150,
    numAvail: 5,
    minStay: 1,
    maxStay: 7,
    stopSell: false
  },

  token: {
    token: 'test_token_12345',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    scopes: ['read', 'write'],
    properties_access: ['TEST_PROP_123']
  }
};

// Assertion helpers
export function expectAuditLog(mockInsert: any, expectedFields: Partial<any>) {
  expect(mockInsert).toHaveBeenCalledWith(
    expect.objectContaining(expectedFields)
  );
}

export function expectUpsertCall(mockUpsert: any, expectedData: any) {
  expect(mockUpsert).toHaveBeenCalledWith(
    expectedData,
    expect.any(Object)
  );
}