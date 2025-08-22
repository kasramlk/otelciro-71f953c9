// Lazy Component Loader with Suspense and Error Boundaries
import React, { Suspense, lazy } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LazyComponentLoaderProps {
  importFn: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  retryable?: boolean;
  componentProps?: Record<string, any>;
  loadingHeight?: number;
}

interface LazyErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  retryable?: boolean;
}

function LazyErrorFallback({ error, resetErrorBoundary, retryable = true }: LazyErrorFallbackProps) {
  return (
    <Alert variant="destructive" className="m-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-medium">Failed to load component</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
        {retryable && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetErrorBoundary}
            className="ml-4"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

function DefaultLoadingFallback({ height = 200 }: { height?: number }) {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className={`h-${Math.floor(height / 16)} w-full`} />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

export function LazyComponentLoader({
  importFn,
  fallback,
  errorFallback,
  retryable = true,
  componentProps = {},
  loadingHeight = 200
}: LazyComponentLoaderProps) {
  const LazyComponent = lazy(importFn);

  const loadingFallback = fallback || <DefaultLoadingFallback height={loadingHeight} />;

  return (
    <ErrorBoundary 
      fallback={
        <LazyErrorFallback 
          error={new Error('Component failed to load')} 
          resetErrorBoundary={() => window.location.reload()}
          retryable={retryable}
        />
      }
    >
      <Suspense fallback={loadingFallback}>
        <LazyComponent {...componentProps} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Pre-configured lazy loaders for common components
export const LazyDashboard = () => (
  <LazyComponentLoader
    importFn={() => import('@/pages/Dashboard')}
    loadingHeight={400}
  />
);

export const LazyReservations = () => (
  <LazyComponentLoader
    importFn={() => import('@/pages/Reservations')}
    loadingHeight={600}
  />
);

export const LazyAnalytics = () => (
  <LazyComponentLoader
    importFn={() => import('@/pages/Analytics')}
    loadingHeight={500}
  />
);

export const LazyReports = () => (
  <LazyComponentLoader
    importFn={() => import('@/pages/Reports')}
    loadingHeight={400}
  />
);

// Hook for creating custom lazy components
export function useLazyComponent<T = any>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  options?: Partial<LazyComponentLoaderProps>
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: T) {
    return (
      <LazyComponentLoader
        importFn={importFn}
        componentProps={props}
        {...options}
      />
    );
  };
}