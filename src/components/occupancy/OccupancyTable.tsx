import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Calendar,
  Star,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, addDays, subDays, parseISO } from "date-fns";

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
  trend?: 'up' | 'down' | 'stable';
}

interface OccupancyTableProps {
  viewType: 'daily' | 'monthly';
}

// Mock data generator
const generateMockData = (startDate: Date, days: number): OccupancyData[] => {
  const data: OccupancyData[] = [];
  
  for (let i = 0; i < days; i++) {
    const currentDate = addDays(startDate, i);
    const capacity = 120; // Total rooms
    const baseOccupancy = 65 + Math.random() * 30; // 65-95% range
    const occupiedRooms = Math.floor(capacity * (baseOccupancy / 100));
    const unoccupiedRooms = capacity - occupiedRooms;
    const dailyRevenue = occupiedRooms * (150 + Math.random() * 100); // $150-250 ADR range
    const dailyADR = occupiedRooms > 0 ? dailyRevenue / occupiedRooms : 0;
    
    // Determine if it's a special day (weekend, holiday, etc.)
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isSpecialDay = isWeekend || Math.random() < 0.1; // 10% chance of special events
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (i > 0) {
      const prevOccupancy = data[i - 1].occupancyPercent;
      if (baseOccupancy > prevOccupancy + 2) trend = 'up';
      else if (baseOccupancy < prevOccupancy - 2) trend = 'down';
    }
    
    data.push({
      date: format(currentDate, 'yyyy-MM-dd'),
      isSpecialDay,
      specialDayType: isSpecialDay ? (isWeekend ? 'Weekend' : 'Holiday') : undefined,
      capacity,
      unoccupiedRooms,
      occupiedRooms,
      occupancyPercent: Math.round(baseOccupancy * 10) / 10,
      dailyRevenue: Math.round(dailyRevenue),
      dailyADR: Math.round(dailyADR * 100) / 100,
      trend
    });
  }
  
  return data;
};

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
  
  // Generate mock data for the next 60 days
  const allData = useMemo(() => {
    return generateMockData(new Date(), 60);
  }, []);
  
  // Paginate data
  const paginatedData = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return allData.slice(start, end);
  }, [allData, currentPage]);
  
  const totalPages = Math.ceil(allData.length / itemsPerPage);
  
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Activity className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-primary" />
            {viewType === 'daily' ? 'Daily Occupancy Data' : 'Monthly Aggregated Data'}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="border-border"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="border-border"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold text-center">Special</TableHead>
                <TableHead className="font-semibold text-right">Capacity</TableHead>
                <TableHead className="font-semibold text-right">Unoccupied</TableHead>
                <TableHead className="font-semibold text-right">Occupied</TableHead>
                <TableHead className="font-semibold text-right">Occupancy %</TableHead>
                <TableHead className="font-semibold text-right">Revenue</TableHead>
                <TableHead className="font-semibold text-right">ADR</TableHead>
                <TableHead className="font-semibold text-center">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, index) => (
                <motion.tr
                  key={row.date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className={`${getOccupancyRowClass(row.occupancyPercent)} hover:bg-muted/50 transition-colors`}
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{format(parseISO(row.date), 'MMM dd, yyyy')}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(row.date), 'EEEE')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {row.isSpecialDay && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="mr-1 h-3 w-3" />
                        {row.specialDayType}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">{row.capacity}</TableCell>
                  <TableCell className="text-right font-mono">{row.unoccupiedRooms}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{row.occupiedRooms}</TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant={getOccupancyBadgeVariant(row.occupancyPercent)}
                      className="font-mono"
                    >
                      {row.occupancyPercent}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-green-700 dark:text-green-400">
                    ${row.dailyRevenue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${row.dailyADR.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getTrendIcon(row.trend)}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Color Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-muted-foreground">Occupancy Color Guide:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <span>95-100% (Critical)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
            <span>80-94% (High)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span>60-79% (Good)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <span>Under 60% (Low)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};