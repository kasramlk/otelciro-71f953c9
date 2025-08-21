import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, Save, X, Check } from 'lucide-react';
import { Button } from './button';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default' | 'success';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const ConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon,
  loading = false,
}: ConfirmationDialogProps) => {
  const getIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'destructive':
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
      case 'success':
        return <Check className="h-6 w-6 text-green-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-amber-600" />;
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'destructive':
        return 'destructive';
      case 'success':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            {getIcon()}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={getButtonVariant() === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Specific confirmation dialogs for common actions
export const DeleteConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemName: string;
  loading?: boolean;
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    onConfirm={onConfirm}
    title="Delete Confirmation"
    description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
    confirmText="Delete"
    variant="destructive"
    icon={<Trash2 className="h-6 w-6 text-destructive" />}
    loading={loading}
  />
);

export const SaveConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  changes,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  changes: string[];
  loading?: boolean;
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    onConfirm={onConfirm}
    title="Save Changes"
    description={
      changes.length > 0
        ? `The following changes will be saved:\n\n${changes.map(change => `• ${change}`).join('\n')}`
        : 'Are you sure you want to save these changes?'
    }
    confirmText="Save Changes"
    variant="success"
    icon={<Save className="h-6 w-6 text-green-600" />}
    loading={loading}
  />
);

export const CancelReservationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  reservationNumber,
  guestName,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  reservationNumber: string;
  guestName: string;
  loading?: boolean;
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    onConfirm={onConfirm}
    title="Cancel Reservation"
    description={`Are you sure you want to cancel reservation ${reservationNumber} for ${guestName}? This will:

• Mark the reservation as cancelled
• Release the room inventory
• Trigger cancellation notifications
• Apply cancellation policies if applicable

This action cannot be undone.`}
    confirmText="Cancel Reservation"
    variant="destructive"
    icon={<X className="h-6 w-6 text-destructive" />}
    loading={loading}
  />
);

// Hook for managing confirmation dialogs
export const useConfirmation = () => {
  const [confirmationState, setConfirmationState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'destructive' | 'default' | 'success';
    confirmText?: string;
    loading?: boolean;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const showConfirmation = (config: {
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'destructive' | 'default' | 'success';
    confirmText?: string;
  }) => {
    setConfirmationState({
      ...config,
      open: true,
      loading: false,
    });
  };

  const hideConfirmation = () => {
    setConfirmationState(prev => ({ ...prev, open: false }));
  };

  const setLoading = (loading: boolean) => {
    setConfirmationState(prev => ({ ...prev, loading }));
  };

  const ConfirmationComponent = () => (
    <ConfirmationDialog
      {...confirmationState}
      onOpenChange={hideConfirmation}
      onConfirm={() => {
        setLoading(true);
        confirmationState.onConfirm();
      }}
    />
  );

  return {
    showConfirmation,
    hideConfirmation,
    setLoading,
    ConfirmationComponent,
  };
};