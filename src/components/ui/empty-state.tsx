import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Card, CardContent } from './card';
import { 
  FileX, 
  Users, 
  Calendar, 
  Search, 
  Plus, 
  Database,
  Wifi,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  size = 'md'
}: EmptyStateProps) => {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  };

  const iconSizes = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}
    >
      <div className={`${iconSizes[size]} text-muted-foreground/60 mb-4`}>
        {icon || <FileX className="w-full h-full" />}
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className="min-w-[120px]"
          >
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant="outline"
            className="min-w-[120px]"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// Specific empty states for different contexts
export const NoReservationsEmptyState = ({ onCreateReservation }: { onCreateReservation: () => void }) => (
  <EmptyState
    icon={<Calendar className="w-full h-full" />}
    title="No reservations found"
    description="No reservations match your current filters. Create a new reservation to get started."
    action={{
      label: 'Create Reservation',
      onClick: onCreateReservation,
    }}
    secondaryAction={{
      label: 'Clear Filters',
      onClick: () => window.location.reload(),
    }}
  />
);

export const NoGuestsEmptyState = ({ onAddGuest }: { onAddGuest: () => void }) => (
  <EmptyState
    icon={<Users className="w-full h-full" />}
    title="No guests found"
    description="Your guest database is empty. Add your first guest to start building your guest list."
    action={{
      label: 'Add Guest',
      onClick: onAddGuest,
    }}
  />
);

export const NoSearchResultsEmptyState = ({ onClearSearch }: { onClearSearch: () => void }) => (
  <EmptyState
    icon={<Search className="w-full h-full" />}
    title="No results found"
    description="We couldn't find anything matching your search criteria. Try adjusting your filters or search terms."
    action={{
      label: 'Clear Search',
      onClick: onClearSearch,
    }}
    size="sm"
  />
);

export const DatabaseErrorEmptyState = ({ onRetry }: { onRetry: () => void }) => (
  <EmptyState
    icon={<Database className="w-full h-full text-destructive" />}
    title="Unable to load data"
    description="We're having trouble connecting to the database. Please check your connection and try again."
    action={{
      label: 'Retry',
      onClick: onRetry,
    }}
  />
);

export const OfflineEmptyState = ({ onRetry }: { onRetry: () => void }) => (
  <EmptyState
    icon={<Wifi className="w-full h-full text-amber-500" />}
    title="You're offline"
    description="Check your internet connection and try again. Some features may not be available while offline."
    action={{
      label: 'Retry',
      onClick: onRetry,
    }}
  />
);

export const LoadingErrorEmptyState = ({ 
  onRetry, 
  error 
}: { 
  onRetry: () => void;
  error?: string;
}) => (
  <EmptyState
    icon={<AlertCircle className="w-full h-full text-destructive" />}
    title="Something went wrong"
    description={error || "We encountered an error while loading your data. Please try again."}
    action={{
      label: 'Try Again',
      onClick: onRetry,
    }}
  />
);

// Card-wrapped empty states
export const EmptyStateCard = (props: EmptyStateProps) => (
  <Card className="border-dashed">
    <CardContent className="p-0">
      <EmptyState {...props} />
    </CardContent>
  </Card>
);

// Hook for managing empty states
export const useEmptyState = () => {
  const [isEmpty, setIsEmpty] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDataLoad = (data: any[], loading: boolean, errorMessage?: string) => {
    setIsLoading(loading);
    setIsEmpty(!loading && (!data || data.length === 0));
    setError(errorMessage || null);
  };

  return {
    isEmpty,
    isLoading,
    error,
    handleDataLoad,
  };
};