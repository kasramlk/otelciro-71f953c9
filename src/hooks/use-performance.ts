// Performance Optimization Hook
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useIntersectionObserver } from './use-intersection-observer';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  networkRequests: number;
  errorCount: number;
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>(
  items: T[], 
  itemHeight: number, 
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 1, items.length);
    
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      offsetY: (visibleRange.start + index) * itemHeight
    }));
  }, [items, visibleRange, itemHeight]);
  
  const totalHeight = items.length * itemHeight;
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  return {
    visibleItems,
    totalHeight,
    handleScroll,
    containerProps: {
      style: { height: containerHeight, overflow: 'auto' },
      onScroll: handleScroll
    }
  };
}

// Debounced value hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttled callback hook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [lastCall, setLastCall] = useState(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      setLastCall(now);
      return callback(...args);
    }
  }, [callback, delay, lastCall]) as T;
}

// Lazy loading hook
export function useLazyLoad<T>(
  loadFn: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  const load = useCallback(async () => {
    if (loading || data) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await loadFn();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [loadFn, loading, data]);
  
  useEffect(() => {
    if (isIntersecting) {
      load();
    }
  }, [isIntersecting, load]);
  
  return { ref, data, loading, error, reload: load };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    networkRequests: 0,
    errorCount: 0
  });
  
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        renderTime
      }));
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render time:`, renderTime, 'ms');
      }
    };
  }, [componentName]);
  
  const incrementNetworkRequests = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      networkRequests: prev.networkRequests + 1
    }));
  }, []);
  
  const incrementErrors = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1
    }));
  }, []);
  
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize / 1024 / 1024, // MB
        total: memory.totalJSHeapSize / 1024 / 1024, // MB
        limit: memory.jsHeapSizeLimit / 1024 / 1024 // MB
      };
    }
    return null;
  }, []);
  
  return {
    metrics,
    incrementNetworkRequests,
    incrementErrors,
    getMemoryUsage
  };
}

// Image optimization hook
export function useOptimizedImage(src: string, options?: {
  placeholder?: string;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
}) {
  const [imageSrc, setImageSrc] = useState(options?.placeholder || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setLoading(false);
      setError(false);
    };
    
    img.onerror = () => {
      setLoading(false);
      setError(true);
      if (options?.placeholder) {
        setImageSrc(options.placeholder);
      }
    };
    
    img.src = src;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, options?.placeholder]);
  
  return { src: imageSrc, loading, error };
}

// Batch operations hook
export function useBatchUpdates<T>(delay = 100) {
  const [batch, setBatch] = useState<T[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<T[]>([]);
  
  useEffect(() => {
    if (pendingUpdates.length === 0) return;
    
    const timer = setTimeout(() => {
      setBatch(current => [...current, ...pendingUpdates]);
      setPendingUpdates([]);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [pendingUpdates, delay]);
  
  const addToBatch = useCallback((item: T) => {
    setPendingUpdates(current => [...current, item]);
  }, []);
  
  const clearBatch = useCallback(() => {
    setBatch([]);
  }, []);
  
  return { batch, addToBatch, clearBatch };
}