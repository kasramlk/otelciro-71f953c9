// Advanced Cache Management System
import { useCallback, useEffect, useState, useMemo } from 'react';
import { usePerformanceMonitor } from '@/hooks/use-performance';

interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  strategy: 'lru' | 'fifo' | 'lfu';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100,
      ttl: 5 * 60 * 1000, // 5 minutes
      strategy: 'lru',
      ...config
    };
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access statistics
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    
    return entry.data;
  }

  set(key: string, data: T): void {
    // Remove expired entries first
    this.cleanup();
    
    // Check if we need to evict
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    };
    
    this.cache.set(key, entry);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }

  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private evict(): void {
    if (this.cache.size === 0) return;
    
    let keyToEvict: string;
    
    switch (this.config.strategy) {
      case 'lru':
        keyToEvict = this.findLRU();
        break;
      case 'lfu':
        keyToEvict = this.findLFU();
        break;
      case 'fifo':
      default:
        keyToEvict = this.cache.keys().next().value;
        break;
    }
    
    this.cache.delete(keyToEvict);
  }

  private findLRU(): string {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  private findLFU(): string {
    let leastUsedKey = '';
    let leastUsedCount = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastUsedCount) {
        leastUsedCount = entry.accessCount;
        leastUsedKey = key;
      }
    }
    
    return leastUsedKey;
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      totalAccesses: entries.reduce((sum, entry) => sum + entry.accessCount, 0),
      averageAge: entries.length > 0 
        ? entries.reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0) / entries.length 
        : 0
    };
  }
}

// Global cache instances
const dataCache = new MemoryCache({ maxSize: 50, ttl: 10 * 60 * 1000 }); // 10 minutes
const uiCache = new MemoryCache({ maxSize: 100, ttl: 30 * 60 * 1000 }); // 30 minutes

// Hook for using cached data
export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    cacheType?: 'data' | 'ui';
    dependencies?: any[];
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { incrementNetworkRequests } = usePerformanceMonitor('CachedData');
  
  const cache = options?.cacheType === 'ui' ? uiCache : dataCache;
  const enabled = options?.enabled ?? true;
  const deps = options?.dependencies ?? [];

  const cacheKey = useMemo(() => {
    return `${key}-${JSON.stringify(deps)}`;
  }, [key, ...deps]);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      setData(cached as T);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      incrementNetworkRequests();
      const result = await fetchFn();
      cache.set(cacheKey, result);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchFn, enabled, incrementNetworkRequests]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invalidate = useCallback(() => {
    cache.delete(cacheKey);
    fetchData();
  }, [cacheKey, fetchData]);

  const updateCache = useCallback((newData: T) => {
    cache.set(cacheKey, newData);
    setData(newData);
  }, [cacheKey, cache]);

  return {
    data,
    loading,
    error,
    invalidate,
    updateCache,
    refetch: fetchData
  };
}

// Cache management component
export function CacheManager() {
  const [stats, setStats] = useState<any>({});
  
  useEffect(() => {
    const updateStats = () => {
      setStats({
        data: dataCache.getStats(),
        ui: uiCache.getStats()
      });
    };
    
    updateStats();
    const interval = setInterval(updateStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const clearCache = (type: 'data' | 'ui' | 'all') => {
    switch (type) {
      case 'data':
        dataCache.clear();
        break;
      case 'ui':
        uiCache.clear();
        break;
      case 'all':
        dataCache.clear();
        uiCache.clear();
        break;
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Cache Statistics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium">Data Cache</h4>
          <div className="text-sm space-y-1">
            <p>Size: {stats.data?.size || 0}/{stats.data?.maxSize || 0}</p>
            <p>Total Accesses: {stats.data?.totalAccesses || 0}</p>
            <p>Avg Age: {Math.round((stats.data?.averageAge || 0) / 1000)}s</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium">UI Cache</h4>
          <div className="text-sm space-y-1">
            <p>Size: {stats.ui?.size || 0}/{stats.ui?.maxSize || 0}</p>
            <p>Total Accesses: {stats.ui?.totalAccesses || 0}</p>
            <p>Avg Age: {Math.round((stats.ui?.averageAge || 0) / 1000)}s</p>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 pt-2">
        <button 
          onClick={() => clearCache('data')}
          className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded"
        >
          Clear Data Cache
        </button>
        <button 
          onClick={() => clearCache('ui')}
          className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 rounded"
        >
          Clear UI Cache
        </button>
        <button 
          onClick={() => clearCache('all')}
          className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 rounded"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}