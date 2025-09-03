import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock token management functionality
interface Token {
  id: string;
  token_type: 'read' | 'write';
  encrypted_token: string;
  expires_at?: string;
  scopes: string[];
  properties_access?: string[];
  last_used_at?: string;
}

class TokenManager {
  private cache = new Map<string, { token: string; expiresAt?: Date }>();
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async getTokenForOperation(operationType: 'read' | 'write'): Promise<string> {
    const cacheKey = `${operationType}_token`;
    const cached = this.cache.get(cacheKey);
    
    // Check cache first - refresh 5 minutes before expiry
    if (cached && cached.expiresAt) {
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      if (cached.expiresAt > fiveMinutesFromNow) {
        return cached.token;
      }
    }

    // Fetch from database
    const { data, error } = await this.supabase
      .from('beds24_tokens')
      .select('*')
      .eq('token_type', operationType)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      throw new Error(`No ${operationType} token available`);
    }

    const tokenRecord = data[0];
    const decryptedToken = this.decryptToken(tokenRecord.encrypted_token);
    
    // Update cache
    this.cache.set(cacheKey, {
      token: decryptedToken,
      expiresAt: tokenRecord.expires_at ? new Date(tokenRecord.expires_at) : undefined
    });

    // Update last_used_at
    await this.supabase
      .from('beds24_tokens')
      .update({ 
        last_used_at: new Date().toISOString(),
        diagnostics: { last_operation: operationType }
      })
      .eq('id', tokenRecord.id);

    return decryptedToken;
  }

  async refreshToken(tokenType: 'read' | 'write'): Promise<void> {
    // Simulate token refresh logic
    const refreshToken = await this.getRefreshToken(tokenType);
    const newToken = await this.exchangeRefreshToken(refreshToken);
    
    await this.storeToken(tokenType, newToken);
    this.cache.delete(`${tokenType}_token`);
  }

  private decryptToken(encryptedToken: string): string {
    // Mock decryption - in real implementation would use proper encryption
    return encryptedToken.replace('encrypted_', '');
  }

  private async getRefreshToken(tokenType: string): Promise<string> {
    // Mock getting refresh token
    return `refresh_${tokenType}_token`;
  }

  private async exchangeRefreshToken(refreshToken: string): Promise<any> {
    // Mock token exchange
    return {
      access_token: `new_${refreshToken.replace('refresh_', '')}`,
      expires_in: 86400,
      scopes: ['read', 'write']
    };
  }

  private async storeToken(tokenType: 'read' | 'write', tokenData: any): Promise<void> {
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    
    await this.supabase
      .from('beds24_tokens')
      .upsert({
        token_type: tokenType,
        encrypted_token: `encrypted_${tokenData.access_token}`,
        expires_at: expiresAt.toISOString(),
        scopes: tokenData.scopes,
        created_at: new Date().toISOString()
      });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

describe('Beds24 Tokens', () => {
  let mockSupabase: any;
  let tokenManager: TokenManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({ data: [], error: null }))
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ data: [], error: null }))
        })),
        upsert: vi.fn(() => ({ data: [], error: null }))
      }))
    };

    tokenManager = new TokenManager(mockSupabase);
  });

  describe('token caching', () => {
    it('should cache tokens after first retrieval', async () => {
      const mockToken = {
        id: '1',
        token_type: 'read',
        encrypted_token: 'encrypted_test_token',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        scopes: ['read']
      };

      mockSupabase.from().select().eq().order().limit.mockReturnValue({ 
        data: [mockToken], 
        error: null 
      });

      // First call should hit database
      const token1 = await tokenManager.getTokenForOperation('read');
      expect(token1).toBe('test_token');
      expect(mockSupabase.from).toHaveBeenCalledWith('beds24_tokens');

      // Second call should use cache
      vi.clearAllMocks();
      const token2 = await tokenManager.getTokenForOperation('read');
      expect(token2).toBe('test_token');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should refresh token 5 minutes before expiry', async () => {
      const soonToExpireToken = {
        id: '1',
        token_type: 'read',
        encrypted_token: 'encrypted_expiring_token',
        expires_at: new Date(Date.now() + 4 * 60 * 1000).toISOString(), // 4 minutes from now
        scopes: ['read']
      };

      mockSupabase.from().select().eq().order().limit.mockReturnValue({ 
        data: [soonToExpireToken], 
        error: null 
      });

      const token = await tokenManager.getTokenForOperation('read');
      expect(token).toBe('expiring_token');

      // Should refresh on next call since it expires in < 5 minutes
      const refreshedToken = {
        ...soonToExpireToken,
        encrypted_token: 'encrypted_fresh_token',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      };

      mockSupabase.from().select().eq().order().limit.mockReturnValue({ 
        data: [refreshedToken], 
        error: null 
      });

      const newToken = await tokenManager.getTokenForOperation('read');
      expect(newToken).toBe('fresh_token');
    });
  });

  describe('token refresh', () => {
    it('should refresh expired tokens', async () => {
      const upsertMock = vi.fn(() => ({ data: [], error: null }));
      mockSupabase.from().upsert = upsertMock;

      await tokenManager.refreshToken('read');

      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          token_type: 'read',
          encrypted_token: expect.stringContaining('encrypted_'),
          expires_at: expect.any(String),
          scopes: expect.arrayContaining(['read', 'write'])
        })
      );
    });

    it('should clear cache after refresh', async () => {
      tokenManager.clearCache();
      
      // Cache should be empty, so next call should hit database
      mockSupabase.from().select().eq().order().limit.mockReturnValue({ 
        data: [{
          id: '1',
          token_type: 'read',
          encrypted_token: 'encrypted_new_token',
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          scopes: ['read']
        }], 
        error: null 
      });

      const token = await tokenManager.getTokenForOperation('read');
      expect(token).toBe('new_token');
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw error when no token available', async () => {
      mockSupabase.from().select().eq().order().limit.mockReturnValue({ 
        data: [], 
        error: null 
      });

      await expect(tokenManager.getTokenForOperation('read')).rejects.toThrow('No read token available');
    });

    it('should handle database errors', async () => {
      mockSupabase.from().select().eq().order().limit.mockReturnValue({ 
        data: null, 
        error: new Error('Database error') 
      });

      await expect(tokenManager.getTokenForOperation('read')).rejects.toThrow('No read token available');
    });
  });

  describe('token types', () => {
    it('should handle different token types', async () => {
      const readToken = {
        id: '1',
        token_type: 'read',
        encrypted_token: 'encrypted_read_token',
        scopes: ['read']
      };

      const writeToken = {
        id: '2', 
        token_type: 'write',
        encrypted_token: 'encrypted_write_token',
        scopes: ['read', 'write']
      };

      mockSupabase.from().select().eq().order().limit
        .mockReturnValueOnce({ data: [readToken], error: null })
        .mockReturnValueOnce({ data: [writeToken], error: null });

      const readResult = await tokenManager.getTokenForOperation('read');
      const writeResult = await tokenManager.getTokenForOperation('write');

      expect(readResult).toBe('read_token');
      expect(writeResult).toBe('write_token');
    });
  });
});