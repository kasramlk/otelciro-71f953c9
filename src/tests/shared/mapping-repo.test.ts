import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock mapping repository functionality
interface ExternalMapping {
  id: string;
  provider: string;
  entity_type: string;
  external_id: string;
  otelciro_id: string;
  metadata?: any;
}

class MappingRepository {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async findByExternalId(provider: string, entityType: string, externalId: string): Promise<ExternalMapping | null> {
    const { data, error } = await this.supabase
      .from('v_external_ids')
      .select('*')
      .eq('provider', provider)
      .eq('entity_type', entityType)
      .eq('external_id', externalId)
      .single();

    if (error || !data) return null;
    return data;
  }

  async findByOtelciroId(provider: string, entityType: string, otelciroId: string): Promise<ExternalMapping | null> {
    const { data, error } = await this.supabase
      .from('v_external_ids')
      .select('*')
      .eq('provider', provider)
      .eq('entity_type', entityType)
      .eq('otelciro_id', otelciroId)
      .single();

    if (error || !data) return null;
    return data;
  }

  async createMapping(
    provider: string,
    entityType: string,
    externalId: string,
    otelciroId: string,
    metadata?: any
  ): Promise<ExternalMapping> {
    const mapping = {
      provider,
      entity_type: entityType,
      external_id: externalId,
      otelciro_id: otelciroId,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('external_ids')
      .upsert(mapping, {
        onConflict: 'provider,entity_type,external_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createBidirectionalMapping(
    provider: string,
    entityType: string,
    externalId: string,
    otelciroId: string,
    metadata?: any
  ): Promise<{ forward: ExternalMapping; reverse?: ExternalMapping }> {
    // Create forward mapping (external -> otelciro)
    const forward = await this.createMapping(provider, entityType, externalId, otelciroId, metadata);

    let reverse = undefined;
    
    // For certain entity types, create reverse mapping (otelciro -> external)
    if (['hotel', 'room_type', 'guest'].includes(entityType)) {
      try {
        reverse = await this.createMapping(provider, `otelciro_${entityType}`, otelciroId, externalId, metadata);
      } catch (error) {
        // Reverse mapping might fail, that's okay
        console.warn('Failed to create reverse mapping:', error);
      }
    }

    return { forward, reverse };
  }

  async bulkCreate(mappings: Array<{
    provider: string;
    entityType: string;
    externalId: string;
    otelciroId: string;
    metadata?: any;
  }>): Promise<ExternalMapping[]> {
    const mappingRecords = mappings.map(m => ({
      provider: m.provider,
      entity_type: m.entityType,
      external_id: m.externalId,
      otelciro_id: m.otelciroId,
      metadata: m.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await this.supabase
      .from('external_ids')
      .upsert(mappingRecords, {
        onConflict: 'provider,entity_type,external_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) throw error;
    return data;
  }
}

describe('Mapping Repository', () => {
  let mockSupabase: any;
  let mappingRepo: MappingRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ data: null, error: null }))
              }))
            }))
          }))
        })),
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: {}, error: null }))
          }))
        }))
      }))
    };

    mappingRepo = new MappingRepository(mockSupabase);
  });

  describe('findByExternalId', () => {
    it('should find mapping by external ID', async () => {
      const mockMapping = {
        id: '1',
        provider: 'beds24',
        entity_type: 'hotel',
        external_id: 'EXT_123',
        otelciro_id: 'HOTEL_456'
      };

      mockSupabase.from().select().eq().eq().eq().single.mockReturnValue({
        data: mockMapping,
        error: null
      });

      const result = await mappingRepo.findByExternalId('beds24', 'hotel', 'EXT_123');
      
      expect(result).toEqual(mockMapping);
      expect(mockSupabase.from).toHaveBeenCalledWith('v_external_ids');
    });

    it('should return null when mapping not found', async () => {
      mockSupabase.from().select().eq().eq().eq().single.mockReturnValue({
        data: null,
        error: { message: 'Not found' }
      });

      const result = await mappingRepo.findByExternalId('beds24', 'hotel', 'MISSING');
      
      expect(result).toBeNull();
    });
  });

  describe('findByOtelciroId', () => {
    it('should find mapping by Otelciro ID', async () => {
      const mockMapping = {
        id: '1',
        provider: 'beds24',
        entity_type: 'hotel',
        external_id: 'EXT_123',
        otelciro_id: 'HOTEL_456'
      };

      mockSupabase.from().select().eq().eq().eq().single.mockReturnValue({
        data: mockMapping,
        error: null
      });

      const result = await mappingRepo.findByOtelciroId('beds24', 'hotel', 'HOTEL_456');
      
      expect(result).toEqual(mockMapping);
    });
  });

  describe('createMapping', () => {
    it('should create new mapping idempotently', async () => {
      const mockCreated = {
        id: '1',
        provider: 'beds24',
        entity_type: 'hotel',
        external_id: 'EXT_123',
        otelciro_id: 'HOTEL_456',
        metadata: { test: true }
      };

      mockSupabase.from().upsert().select().single.mockReturnValue({
        data: mockCreated,
        error: null
      });

      const result = await mappingRepo.createMapping(
        'beds24',
        'hotel',
        'EXT_123',
        'HOTEL_456',
        { test: true }
      );

      expect(result).toEqual(mockCreated);
      expect(mockSupabase.from).toHaveBeenCalledWith('external_ids');
    });

    it('should handle upsert conflicts gracefully', async () => {
      const existingMapping = {
        id: '1',
        provider: 'beds24',
        entity_type: 'hotel',
        external_id: 'EXT_123',
        otelciro_id: 'HOTEL_456'
      };

      mockSupabase.from().upsert().select().single.mockReturnValue({
        data: existingMapping,
        error: null
      });

      // Should not throw on duplicate
      const result = await mappingRepo.createMapping('beds24', 'hotel', 'EXT_123', 'HOTEL_456');
      
      expect(result).toEqual(existingMapping);
    });
  });

  describe('createBidirectionalMapping', () => {
    it('should create both forward and reverse mappings for supported entities', async () => {
      const forwardMapping = {
        id: '1',
        provider: 'beds24',
        entity_type: 'hotel',
        external_id: 'EXT_123',
        otelciro_id: 'HOTEL_456'
      };

      const reverseMapping = {
        id: '2',
        provider: 'beds24',
        entity_type: 'otelciro_hotel',
        external_id: 'HOTEL_456',
        otelciro_id: 'EXT_123'
      };

      mockSupabase.from().upsert().select().single
        .mockReturnValueOnce({ data: forwardMapping, error: null })
        .mockReturnValueOnce({ data: reverseMapping, error: null });

      const result = await mappingRepo.createBidirectionalMapping(
        'beds24',
        'hotel',
        'EXT_123',
        'HOTEL_456'
      );

      expect(result.forward).toEqual(forwardMapping);
      expect(result.reverse).toEqual(reverseMapping);
    });

    it('should handle reverse mapping failures gracefully', async () => {
      const forwardMapping = {
        id: '1',
        provider: 'beds24',
        entity_type: 'hotel',
        external_id: 'EXT_123',
        otelciro_id: 'HOTEL_456'
      };

      mockSupabase.from().upsert().select().single
        .mockReturnValueOnce({ data: forwardMapping, error: null })
        .mockReturnValueOnce({ data: null, error: new Error('Reverse failed') });

      const result = await mappingRepo.createBidirectionalMapping(
        'beds24',
        'hotel',
        'EXT_123',
        'HOTEL_456'
      );

      expect(result.forward).toEqual(forwardMapping);
      expect(result.reverse).toBeUndefined();
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple mappings in one operation', async () => {
      const mappings = [
        { provider: 'beds24', entityType: 'hotel', externalId: 'EXT_1', otelciroId: 'HOTEL_1' },
        { provider: 'beds24', entityType: 'room_type', externalId: 'EXT_2', otelciroId: 'ROOM_2' }
      ];

      const createdMappings = mappings.map((m, i) => ({
        id: String(i + 1),
        provider: m.provider,
        entity_type: m.entityType,
        external_id: m.externalId,
        otelciro_id: m.otelciroId,
        metadata: {}
      }));

      mockSupabase.from().upsert().select.mockReturnValue({
        data: createdMappings,
        error: null
      });

      const result = await mappingRepo.bulkCreate(mappings);

      expect(result).toEqual(createdMappings);
      expect(mockSupabase.from().upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            provider: 'beds24',
            entity_type: 'hotel',
            external_id: 'EXT_1',
            otelciro_id: 'HOTEL_1'
          })
        ]),
        expect.objectContaining({ onConflict: 'provider,entity_type,external_id' })
      );
    });
  });
});