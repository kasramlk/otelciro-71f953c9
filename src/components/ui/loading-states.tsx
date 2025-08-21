import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from './card';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner = ({ size = 'md', className, text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton = ({ rows = 5, columns = 6 }: TableSkeletonProps) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-3">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

interface CardSkeletonProps {
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

export const CardSkeleton = ({ showHeader = true, showFooter = false, className }: CardSkeletonProps) => (
  <Card className={className}>
    {showHeader && (
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
    )}
    <CardContent>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </CardContent>
    {showFooter && (
      <div className="p-6 pt-0">
        <Skeleton className="h-10 w-24" />
      </div>
    )}
  </Card>
);

interface DashboardSkeletonProps {
  kpiCards?: number;
  charts?: number;
}

export const DashboardSkeleton = ({ kpiCards = 4, charts = 2 }: DashboardSkeletonProps) => (
  <div className="space-y-8">
    {/* KPI Cards Skeleton */}
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(kpiCards, 4)} gap-6`}>
      {Array.from({ length: kpiCards }).map((_, i) => (
        <CardSkeleton key={i} showHeader={false} />
      ))}
    </div>
    
    {/* Charts Skeleton */}
    <div className={`grid grid-cols-1 lg:grid-cols-${charts} gap-6`}>
      {Array.from({ length: charts }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
}

export const ListSkeleton = ({ items = 6, showAvatar = true }: ListSkeletonProps) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
        {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    ))}
  </div>
);

interface PageSkeletonProps {
  type: 'dashboard' | 'list' | 'form' | 'details';
}

export const PageSkeleton = ({ type }: PageSkeletonProps) => {
  switch (type) {
    case 'dashboard':
      return <DashboardSkeleton />;
    
    case 'list':
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <ListSkeleton />
        </div>
      );
    
    case 'form':
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <div className="flex justify-end space-x-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      );
    
    case 'details':
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardSkeleton showHeader />
            <CardSkeleton showHeader />
          </div>
          <CardSkeleton showHeader showFooter />
        </div>
      );
    
    default:
      return <div>Loading...</div>;
  }
};

// Hook for managing loading states
export const useLoadingState = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const withLoading = async <T,>(
    asyncFn: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFn();
      return result;
    } catch (err) {
      setError(errorMessage || (err instanceof Error ? err.message : 'An error occurred'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setLoading,
    setError,
    withLoading,
  };
};