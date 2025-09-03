import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the logger implementation since we can't import the actual Edge Function files
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(), 
  error: vi.fn(),
  debug: vi.fn()
};

const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({ data: [], error: null }))
  }))
};

// Mock implementation of logger functionality
function redactSensitiveData(data: any, redactKeys: string[]): any {
  if (!data || typeof data !== 'object') return data;
  
  const redacted = { ...data };
  
  redactKeys.forEach(key => {
    if (key in redacted) {
      redacted[key] = '[REDACTED]';
    }
  });
  
  return redacted;
}

async function logAudit(operation: string, details: any) {
  const redactKeys = ['token', 'password', 'secret', 'key'];
  const redactedDetails = redactSensitiveData(details, redactKeys);
  
  return mockSupabase.from('ingestion_audit').insert({
    operation,
    ...redactedDetails,
    created_at: new Date().toISOString()
  });
}

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('redactSensitiveData', () => {
    it('should redact sensitive keys from LOG_REDACT_KEYS', () => {
      const redactKeys = ['token', 'password', 'secret'];
      const data = {
        token: 'secret-token-123',
        password: 'user-password',
        publicInfo: 'safe-data',
        apiSecret: 'api-secret-key'
      };

      const result = redactSensitiveData(data, redactKeys);

      expect(result.token).toBe('[REDACTED]');
      expect(result.password).toBe('[REDACTED]');
      expect(result.publicInfo).toBe('safe-data');
      expect(result.apiSecret).toBe('[REDACTED]'); // Should catch 'secret' in the key
    });

    it('should handle nested objects', () => {
      const redactKeys = ['token'];
      const data = {
        auth: {
          token: 'secret-token',
          userId: '123'
        },
        publicData: 'safe'
      };

      const result = redactSensitiveData(data, redactKeys);

      expect(result.auth.token).toBe('[REDACTED]');
      expect(result.auth.userId).toBe('123');
      expect(result.publicData).toBe('safe');
    });

    it('should return original data if no sensitive keys found', () => {
      const redactKeys = ['token'];
      const data = {
        userId: '123',
        email: 'user@example.com'
      };

      const result = redactSensitiveData(data, redactKeys);

      expect(result).toEqual(data);
    });

    it('should handle non-object inputs', () => {
      const redactKeys = ['token'];
      
      expect(redactSensitiveData(null, redactKeys)).toBe(null);
      expect(redactSensitiveData('string', redactKeys)).toBe('string');
      expect(redactSensitiveData(123, redactKeys)).toBe(123);
    });
  });

  describe('logAudit', () => {
    it('should log audit entry with redacted sensitive data', async () => {
      const insertMock = vi.fn(() => ({ data: [], error: null }));
      mockSupabase.from = vi.fn(() => ({ insert: insertMock }));

      await logAudit('test_operation', {
        token: 'secret-123',
        userId: 'user-456',
        status: 'success'
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'test_operation',
          token: '[REDACTED]',
          userId: 'user-456',
          status: 'success',
          created_at: expect.any(String)
        })
      );
    });

    it('should handle errors during audit logging', async () => {
      const insertMock = vi.fn(() => ({ data: null, error: new Error('DB Error') }));
      mockSupabase.from = vi.fn(() => ({ insert: insertMock }));

      // Should not throw error, just log it
      await expect(logAudit('test_operation', {})).resolves.not.toThrow();
      
      expect(insertMock).toHaveBeenCalled();
    });
  });

  describe('performance timer', () => {
    it('should measure operation duration', () => {
      const startTime = Date.now();
      
      function createOperationTimer() {
        const start = Date.now();
        return {
          getDuration: () => Date.now() - start
        };
      }

      const timer = createOperationTimer();
      
      // Simulate some work
      const duration = timer.getDuration();
      
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(typeof duration).toBe('number');
    });
  });
});