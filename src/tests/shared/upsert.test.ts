import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock upsert functionality
interface UpsertOptions {
  identifierFields: string[];
  timestampField?: string;
  modifiedTimeField?: string;
}

class UpsertManager {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async upsertRecords(
    tableName: string,
    records: any[],
    options: UpsertOptions
  ): Promise<any[]> {
    if (!records || records.length === 0) return [];

    // Add timestamps
    const now = new Date().toISOString();
    const processedRecords = records.map(record => ({
      ...record,
      updated_at: now,
      created_at: record.created_at || now
    }));

    // Perform upsert with conflict resolution
    const conflictColumns = options.identifierFields.join(',');
    
    const { data, error } = await this.supabase
      .from(tableName)
      .upsert(processedRecords, {
        onConflict: conflictColumns,
        ignoreDuplicates: false
      })
      .select();

    if (error) throw error;
    return data;
  }

  async smartUpsert(
    tableName: string,
    records: any[],
    options: UpsertOptions & { 
      modifiedTimeField?: string;
      skipUnchanged?: boolean;
    }
  ): Promise<{ created: any[]; updated: any[]; skipped: any[] }> {
    if (!records || records.length === 0) {
      return { created: [], updated: [], skipped: [] };
    }

    const results = { created: [], updated: [], skipped: [] };

    for (const record of records) {
      const existing = await this.findExisting(tableName, record, options.identifierFields);
      
      if (!existing) {
        // New record
        const newRecord = {
          ...record,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await this.supabase
          .from(tableName)
          .insert(newRecord)
          .select()
          .single();

        if (error) throw error;
        results.created.push(data);
      } else {
        // Check if update is needed based on modified time
        if (options.modifiedTimeField && options.skipUnchanged) {
          const recordModified = new Date(record[options.modifiedTimeField]);
          const existingModified = new Date(existing[options.modifiedTimeField] || 0);
          
          if (recordModified <= existingModified) {
            results.skipped.push(existing);
            continue;
          }
        }

        // Update existing record
        const updatedRecord = {
          ...record,
          updated_at: new Date().toISOString(),
          created_at: existing.created_at // Preserve original creation time
        };

        // Build where clause
        const whereClause = options.identifierFields.reduce((acc, field) => {
          acc[field] = record[field];
          return acc;
        }, {} as any);

        let query = this.supabase.from(tableName).update(updatedRecord);
        
        // Apply where conditions
        Object.entries(whereClause).forEach(([field, value]) => {
          query = query.eq(field, value);
        });

        const { data, error } = await query.select().single();

        if (error) throw error;
        results.updated.push(data);
      }
    }

    return results;
  }

  private async findExisting(tableName: string, record: any, identifierFields: string[]): Promise<any | null> {
    let query = this.supabase.from(tableName).select('*');
    
    identifierFields.forEach(field => {
      query = query.eq(field, record[field]);
    });

    const { data, error } = await query.single();
    
    if (error) return null;
    return data;
  }

  async batchUpsert(
    tableName: string,
    records: any[],
    options: UpsertOptions,
    batchSize = 50
  ): Promise<any[]> {
    const results = [];
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchResults = await this.upsertRecords(tableName, batch, options);
      results.push(...batchResults);
    }

    return results;
  }
}

describe('Upsert Functionality', () => {
  let mockSupabase: any;
  let upsertManager: UpsertManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase = {
      from: vi.fn(() => ({
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({ data: [], error: null }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: {}, error: null }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({ data: {}, error: null }))
            }))
          }))
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: { message: 'Not found' } }))
          }))
        }))
      }))
    };

    upsertManager = new UpsertManager(mockSupabase);
  });

  describe('upsertRecords', () => {
    it('should upsert records with proper timestamps', async () => {
      const records = [
        { id: '1', name: 'Test Hotel', code: 'TEST' },
        { id: '2', name: 'Another Hotel', code: 'ANOTHER' }
      ];

      const upsertedRecords = records.map(r => ({
        ...r,
        created_at: expect.any(String),
        updated_at: expect.any(String)
      }));

      mockSupabase.from().upsert().select.mockReturnValue({
        data: upsertedRecords,
        error: null
      });

      const result = await upsertManager.upsertRecords('hotels', records, {
        identifierFields: ['id']
      });

      expect(result).toEqual(upsertedRecords);
      expect(mockSupabase.from).toHaveBeenCalledWith('hotels');
      expect(mockSupabase.from().upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            name: 'Test Hotel',
            updated_at: expect.any(String)
          })
        ]),
        expect.objectContaining({ onConflict: 'id' })
      );
    });

    it('should handle empty records array', async () => {
      const result = await upsertManager.upsertRecords('hotels', [], {
        identifierFields: ['id']
      });

      expect(result).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('smartUpsert', () => {
    it('should create new records when they dont exist', async () => {
      const records = [
        { external_id: 'EXT_1', name: 'New Hotel', modifiedDateTime: '2024-01-01T12:00:00Z' }
      ];

      // Mock finding no existing record
      mockSupabase.from().select().eq().single.mockReturnValue({
        data: null,
        error: { message: 'Not found' }
      });

      // Mock successful insert
      mockSupabase.from().insert().select().single.mockReturnValue({
        data: { id: '1', ...records[0], created_at: '2024-01-01T12:00:00Z' },
        error: null
      });

      const result = await upsertManager.smartUpsert('hotels', records, {
        identifierFields: ['external_id'],
        modifiedTimeField: 'modifiedDateTime'
      });

      expect(result.created).toHaveLength(1);
      expect(result.updated).toHaveLength(0);
      expect(result.skipped).toHaveLength(0);
    });

    it('should update existing records when newer', async () => {
      const records = [
        { external_id: 'EXT_1', name: 'Updated Hotel', modifiedDateTime: '2024-01-02T12:00:00Z' }
      ];

      const existingRecord = {
        id: '1',
        external_id: 'EXT_1', 
        name: 'Old Hotel',
        modifiedDateTime: '2024-01-01T12:00:00Z',
        created_at: '2024-01-01T10:00:00Z'
      };

      // Mock finding existing record
      mockSupabase.from().select().eq().single.mockReturnValue({
        data: existingRecord,
        error: null
      });

      // Mock successful update
      mockSupabase.from().update().eq().select().single.mockReturnValue({
        data: { ...existingRecord, ...records[0], updated_at: '2024-01-02T12:00:00Z' },
        error: null
      });

      const result = await upsertManager.smartUpsert('hotels', records, {
        identifierFields: ['external_id'],
        modifiedTimeField: 'modifiedDateTime',
        skipUnchanged: true
      });

      expect(result.created).toHaveLength(0);
      expect(result.updated).toHaveLength(1);
      expect(result.skipped).toHaveLength(0);
    });

    it('should skip records that havent been modified', async () => {
      const records = [
        { external_id: 'EXT_1', name: 'Hotel', modifiedDateTime: '2024-01-01T12:00:00Z' }
      ];

      const existingRecord = {
        id: '1',
        external_id: 'EXT_1',
        name: 'Hotel',
        modifiedDateTime: '2024-01-02T12:00:00Z', // Newer than incoming record
        created_at: '2024-01-01T10:00:00Z'
      };

      // Mock finding existing record
      mockSupabase.from().select().eq().single.mockReturnValue({
        data: existingRecord,
        error: null
      });

      const result = await upsertManager.smartUpsert('hotels', records, {
        identifierFields: ['external_id'],
        modifiedTimeField: 'modifiedDateTime',
        skipUnchanged: true
      });

      expect(result.created).toHaveLength(0);
      expect(result.updated).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0]).toEqual(existingRecord);
    });
  });

  describe('batchUpsert', () => {
    it('should process records in batches', async () => {
      const records = Array.from({ length: 125 }, (_, i) => ({
        id: String(i + 1),
        name: `Hotel ${i + 1}`
      }));

      mockSupabase.from().upsert().select.mockReturnValue({
        data: records.slice(0, 50), // Mock first batch
        error: null
      });

      const result = await upsertManager.batchUpsert('hotels', records, {
        identifierFields: ['id']
      }, 50);

      // Should make 3 batch calls (50, 50, 25)
      expect(mockSupabase.from().upsert).toHaveBeenCalledTimes(3);
    });

    it('should handle batch processing errors', async () => {
      const records = [
        { id: '1', name: 'Hotel 1' },
        { id: '2', name: 'Hotel 2' }
      ];

      mockSupabase.from().upsert().select.mockReturnValue({
        data: null,
        error: new Error('Batch failed')
      });

      await expect(upsertManager.batchUpsert('hotels', records, {
        identifierFields: ['id']
      })).rejects.toThrow('Batch failed');
    });
  });

  describe('no duplicates on repeated imports', () => {
    it('should handle repeated imports without creating duplicates', async () => {
      const importData = [
        { external_id: 'EXT_1', name: 'Hotel 1', modifiedDateTime: '2024-01-01T12:00:00Z' },
        { external_id: 'EXT_2', name: 'Hotel 2', modifiedDateTime: '2024-01-01T12:00:00Z' }
      ];

      // First import - should create records
      mockSupabase.from().select().eq().single.mockReturnValue({
        data: null,
        error: { message: 'Not found' }
      });

      mockSupabase.from().insert().select().single
        .mockReturnValueOnce({ data: { id: '1', ...importData[0] }, error: null })
        .mockReturnValueOnce({ data: { id: '2', ...importData[1] }, error: null });

      const firstImport = await upsertManager.smartUpsert('hotels', importData, {
        identifierFields: ['external_id'],
        modifiedTimeField: 'modifiedDateTime',
        skipUnchanged: true
      });

      expect(firstImport.created).toHaveLength(2);

      // Second import - should skip unchanged records
      const existingRecords = [
        { id: '1', ...importData[0], created_at: '2024-01-01T10:00:00Z' },
        { id: '2', ...importData[1], created_at: '2024-01-01T10:00:00Z' }
      ];

      mockSupabase.from().select().eq().single
        .mockReturnValueOnce({ data: existingRecords[0], error: null })
        .mockReturnValueOnce({ data: existingRecords[1], error: null });

      const secondImport = await upsertManager.smartUpsert('hotels', importData, {
        identifierFields: ['external_id'],
        modifiedTimeField: 'modifiedDateTime',
        skipUnchanged: true
      });

      expect(secondImport.created).toHaveLength(0);
      expect(secondImport.updated).toHaveLength(0);
      expect(secondImport.skipped).toHaveLength(2);
    });
  });
});
