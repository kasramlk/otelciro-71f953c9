import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RealtimeNotificationSystem } from '@/components/realtime/RealtimeNotificationSystem';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { AdvancedFilters } from '@/components/advanced/AdvancedFilters';
import { EnhancedExportSystem } from '@/components/export/EnhancedExportSystem';
import { OnlineUsers } from '@/components/realtime/OnlineUsers';
import { HMSDashboard } from '@/components/hms/HMSDashboard';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const dashboardFilters = [
  {
    key: 'dateRange',
    label: 'Date Range',
    type: 'dateRange' as const,
    placeholder: 'Select date range'
  },
  {
    key: 'status',
    label: 'Reservation Status',
    type: 'multiSelect' as const,
    options: [
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'checked-in', label: 'Checked In' },
      { value: 'checked-out', label: 'Checked Out' },
      { value: 'cancelled', label: 'Cancelled' }
    ]
  },
  {
    key: 'roomType',
    label: 'Room Type',
    type: 'select' as const,
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'deluxe', label: 'Deluxe' },
      { value: 'suite', label: 'Suite' }
    ]
  },
  {
    key: 'source',
    label: 'Booking Source',
    type: 'multiSelect' as const,
    options: [
      { value: 'direct', label: 'Direct' },
      { value: 'booking.com', label: 'Booking.com' },
      { value: 'expedia', label: 'Expedia' }
    ]
  },
  {
    key: 'minAmount',
    label: 'Minimum Amount',
    type: 'number' as const,
    placeholder: 'Enter minimum amount'
  },
  {
    key: 'hasBalance',
    label: 'Has Outstanding Balance',
    type: 'checkbox' as const
  }
];

export const EnhancedHMSDashboard = () => {
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    // In a real app, this would trigger data refetch with filters
    console.log('Applied filters:', newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
    toast({ title: 'Filters cleared' });
  };

  const handleNavigation = (type: string, id: string) => {
    switch (type) {
      case 'reservation':
        navigate(`/reservations/${id}`);
        break;
      case 'guest':
        navigate(`/guests/${id}`);
        break;
      case 'room':
        navigate(`/room-plan?room=${id}`);
        break;
      default:
        navigate(`/${type}s/${id}`);
    }
    toast({ title: `Navigating to ${type} ${id}` });
  };

  const handleExport = async (format: string) => {
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: `Dashboard exported as ${format.toUpperCase()}` });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
                Hotel Management Dashboard
              </h1>
              <p className="text-muted-foreground">
                Comprehensive overview with real-time updates and advanced analytics
              </p>
            </motion.div>

            {/* Global Search */}
            <GlobalSearch
              onNavigate={handleNavigation}
              className="max-w-2xl"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Online Users */}
            <OnlineUsers compact maxVisible={3} />
            
            {/* Notifications */}
            <RealtimeNotificationSystem />
          </div>
        </div>

        {/* Advanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <AdvancedFilters
            filters={dashboardFilters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
            title="Dashboard Filters"
          />
        </motion.div>

        {/* Export System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <EnhancedExportSystem
            dataType="dashboard"
            title="Dashboard Data"
            onExport={handleExport}
          />
        </motion.div>

        {/* Main Dashboard Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <HMSDashboard />
        </motion.div>

        {/* Real-time Status Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <Card className="inline-block">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                  <span>Real-time updates active</span>
                </div>
                <div className="flex items-center gap-2">
                  <OnlineUsers compact maxVisible={1} />
                  <span>Multi-user environment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Last updated: {new Date().toLocaleTimeString()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};