import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Users, AlertTriangle, Eye } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { OccupancyFilters } from './OccupancyFilters';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHMSStore } from '@/stores/hms-store';

interface OccupancyTableProps {
  viewType?: 'daily' | 'weekly' | 'monthly';
}

interface OccupancyData {
  date: string;
  isSpecialDay?: boolean;
  specialDayType?: string;
  capacity: number;
  unoccupiedRooms: number;
  occupiedRooms: number;
  occupancyPercent: number;
  dailyRevenue: number;
  dailyADR: number;
  trend: 'up' | 'down' | 'stable';
}

const getOccupancyRowClass = (occupancy: number): string => {
  if (occupancy >= 95) return "bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500";
  if (occupancy >= 80) return "bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500";
  if (occupancy >= 60) return "bg-green-50 dark:bg-green-950/20 border-l-4 border-l-green-500";
  return "bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500";
};

const getOccupancyBadgeVariant = (occupancy: number): "default" | "secondary" | "destructive" | "outline" => {
  if (occupancy >= 95) return "destructive";
  if (occupancy >= 80) return "default"; 
  if (occupancy >= 60) return "secondary";
  return "outline";
};

export const OccupancyTable = ({ viewType }: OccupancyTableProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 15;
  const { selectedHotelId } = useHMSStore();
  
  // Fetch real occupancy data from database
  const { data: occupancyData = [], isLoading } = useQuery({
    queryKey: ['occupancy-data', selectedHotelId],
    queryFn: async () => {
      if (!selectedHotelId) return [];
      
      // Get hotel capacity
      const { data: hotelData } = await supabase
        .from('hotels')
        .select('id')
        .eq('id', selectedHotelId)
        .single();
      
      if (!hotelData) return [];
      
      // Get room count
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('id')
        .eq('hotel_id', selectedHotelId);
      
      const totalRooms = roomsData?.length || 0;
      
      // Generate data for next 60 days using reservations
      const data: OccupancyData[] = [];
      const today = new Date();
      
      for (let i = 0; i < 60; i++) {
        const currentDate = addDays(today, i);
        
        // Get reservations for this date
        const { data: reservations } = await supabase
          .from('reservations')
          .select('id, total_amount, adults')
          .eq('hotel_id', selectedHotelId)
          .lte('check_in', format(currentDate, 'yyyy-MM-dd'))
          .gte('check_out', format(currentDate, 'yyyy-MM-dd'));
        
        const occupiedRooms = reservations?.length || 0;
        const unoccupiedRooms = totalRooms - occupiedRooms;
        const occupancyPercent = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
        const dailyRevenue = reservations?.reduce((sum, res) => sum + (res.total_amount || 0), 0) || 0;
        const dailyADR = occupiedRooms > 0 ? dailyRevenue / occupiedRooms : 0;
        
        // Determine trend (simplified)
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (i > 0 && data[i - 1]) {
          const prevOccupancy = data[i - 1].occupancyPercent;
          if (occupancyPercent > prevOccupancy + 2) trend = 'up';
          else if (occupancyPercent < prevOccupancy - 2) trend = 'down';
        }
        
        // Check if special day
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        data.push({
          date: format(currentDate, 'yyyy-MM-dd'),
          isSpecialDay: isWeekend,
          specialDayType: isWeekend ? 'Weekend' : undefined,
          capacity: totalRooms,
          unoccupiedRooms,
          occupiedRooms,
          occupancyPercent: Math.round(occupancyPercent * 10) / 10,
          dailyRevenue: Math.round(dailyRevenue),
          dailyADR: Math.round(dailyADR * 100) / 100,
          trend
        });
      }
      
      return data;
    },
    enabled: !!selectedHotelId
  });
  
  // Paginate data
  const paginatedData = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return occupancyData.slice(start, end);
  }, [occupancyData, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(occupancyData.length / itemsPerPage);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Occupancy Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading occupancy data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Occupancy Overview
          </CardTitle>
          <OccupancyFilters />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead className="text-right">Occupied</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Occupancy %</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">ADR</TableHead>
                  <TableHead className="w-[100px]">Trend</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <motion.tr
                    key={row.date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`${getOccupancyRowClass(row.occupancyPercent)} hover:bg-muted/50 transition-colors duration-200`}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{format(new Date(row.date), 'MMM dd')}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(row.date), 'EEE')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.isSpecialDay && (
                        <Badge variant="outline" className="text-xs">
                          {row.specialDayType}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.capacity}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {row.occupiedRooms}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.unoccupiedRooms}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getOccupancyBadgeVariant(row.occupancyPercent)}>
                        {row.occupancyPercent.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {row.dailyRevenue.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            ${row.dailyADR.toFixed(2)}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Average Daily Rate</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {row.trend === 'up' && (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        )}
                        {row.trend === 'down' && (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        {row.trend === 'stable' && (
                          <div className="h-1 w-4 bg-gray-400 rounded" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Occupancy Details - {format(new Date(row.date), 'MMM dd, yyyy')}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Occupancy Rate</p>
                                <p className="text-2xl font-bold">{row.occupancyPercent.toFixed(1)}%</p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Revenue</p>
                                <p className="text-2xl font-bold">${row.dailyRevenue.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Occupied Rooms</p>
                                <p className="text-lg">{row.occupiedRooms} / {row.capacity}</p>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Average Daily Rate</p>
                                <p className="text-lg">${row.dailyADR.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, occupancyData.length)} of {occupancyData.length} entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage + 1} of {Math.max(1, totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};