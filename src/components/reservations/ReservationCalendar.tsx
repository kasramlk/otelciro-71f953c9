import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  Building,
  MapPin,
  Eye
} from "lucide-react";
import { format, addDays, startOfMonth, endOfMonth, isSameDay, parseISO, startOfWeek, endOfWeek } from "date-fns";

// Mock calendar data
const generateCalendarReservations = (startDate: Date, endDate: Date) => {
  const reservations = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    // Generate 1-3 reservations per day randomly
    const numReservations = Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numReservations; i++) {
      const checkOut = new Date(current);
      checkOut.setDate(current.getDate() + Math.floor(Math.random() * 5) + 1);
      
      reservations.push({
        id: `cal_${format(current, 'yyyy-MM-dd')}_${i}`,
        guest: {
          name: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'][Math.floor(Math.random() * 5)],
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Guest${Math.random()}`
        },
        checkIn: format(current, 'yyyy-MM-dd'),
        checkOut: format(checkOut, 'yyyy-MM-dd'),
        roomNumber: Math.floor(Math.random() * 400) + 100,
        roomType: ['Standard', 'Deluxe', 'Suite'][Math.floor(Math.random() * 3)],
        status: ['Booked', 'Confirmed', 'CheckedIn'][Math.floor(Math.random() * 3)],
        source: ['Direct', 'Booking.com', 'Expedia', 'Corporate'][Math.floor(Math.random() * 4)],
        totalAmount: Math.floor(Math.random() * 500) + 200,
        adults: Math.floor(Math.random() * 3) + 1,
        children: Math.floor(Math.random() * 3),
        isVIP: Math.random() > 0.9,
        groupBooking: Math.random() > 0.8
      });
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return reservations;
};

const getStatusColor = (status: string) => {
  const colors = {
    'Booked': 'bg-blue-500',
    'Confirmed': 'bg-green-500',
    'CheckedIn': 'bg-purple-500',
    'CheckedOut': 'bg-gray-500',
    'Cancelled': 'bg-red-500'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-500';
};

export const ReservationCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  // Generate date range based on view mode
  const { startDate, endDate, dates } = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      const dateArray = [];
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dateArray.push(new Date(d));
      }
      
      return { startDate: start, endDate: end, dates: dateArray };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const dateArray = [];
      
      // Include dates from previous month to fill the grid
      const startWeek = startOfWeek(start);
      const endWeek = endOfWeek(end);
      
      for (let d = new Date(startWeek); d <= endWeek; d.setDate(d.getDate() + 1)) {
        dateArray.push(new Date(d));
      }
      
      return { startDate: startWeek, endDate: endWeek, dates: dateArray };
    }
  }, [currentDate, viewMode]);
  
  // Generate reservations for the date range
  const reservations = useMemo(() => generateCalendarReservations(startDate, endDate), [startDate, endDate]);
  
  // Group reservations by date
  const reservationsByDate = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    
    reservations.forEach(reservation => {
      const dateKey = reservation.checkIn;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(reservation);
    });
    
    return grouped;
  }, [reservations]);
  
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };
  
  return (
    <TooltipProvider>
      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              <span>Reservations Calendar</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                >
                  Month
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                >
                  Week
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-lg font-semibold min-w-[200px] text-center">
                {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : 'MMM dd - dd, yyyy')}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Calendar Legend */}
          <div className="mb-4 flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Checked In</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>VIP Guest</span>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className={`grid gap-2 ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-semibold text-muted-foreground border-b">
                {day}
              </div>
            ))}
            
            {/* Calendar Dates */}
            {dates.map((date, index) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const dayReservations = reservationsByDate[dateKey] || [];
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = isSameDay(date, new Date());
              
              return (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.01 }}
                  className={`
                    relative min-h-[120px] p-2 border border-border rounded-lg
                    ${isCurrentMonth ? 'bg-background' : 'bg-muted/20'}
                    ${isToday ? 'ring-2 ring-primary bg-primary/5' : ''}
                    hover:bg-accent/50 transition-colors
                  `}
                >
                  {/* Date Number */}
                  <div className={`text-sm font-medium mb-2 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {format(date, 'd')}
                  </div>
                  
                  {/* Reservations */}
                  <div className="space-y-1">
                    {dayReservations.slice(0, 3).map((reservation, idx) => (
                      <Tooltip key={reservation.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={`
                              ${getStatusColor(reservation.status)} text-white text-xs p-1 rounded cursor-pointer
                              hover:opacity-80 transition-opacity truncate
                              ${reservation.isVIP ? 'ring-1 ring-yellow-400' : ''}
                            `}
                          >
                            <div className="flex items-center space-x-1">
                              <Avatar className="h-3 w-3">
                                <AvatarImage src={reservation.guest.avatar} />
                                <AvatarFallback className="text-[8px]">
                                  {reservation.guest.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{reservation.guest.name}</span>
                              {reservation.groupBooking && (
                                <Users className="h-2 w-2" />
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-popover border border-border">
                          <div className="space-y-2 p-2">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={reservation.guest.avatar} />
                                <AvatarFallback className="text-xs">
                                  {reservation.guest.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">{reservation.guest.name}</div>
                                {reservation.isVIP && (
                                  <Badge variant="outline" className="text-xs">VIP</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-xs space-y-1">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{format(parseISO(reservation.checkIn), 'MMM dd')} - {format(parseISO(reservation.checkOut), 'MMM dd')}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Building className="h-3 w-3" />
                                <span>{reservation.roomType} - Room {reservation.roomNumber}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{reservation.adults} adults{reservation.children > 0 && `, ${reservation.children} children`}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{reservation.source}</span>
                              </div>
                              <div className="font-medium">
                                ${reservation.totalAmount.toLocaleString()}
                              </div>
                            </div>
                            
                            <Button size="sm" variant="outline" className="w-full mt-2">
                              <Eye className="mr-2 h-3 w-3" />
                              View Details
                            </Button>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    
                    {/* Show overflow indicator */}
                    {dayReservations.length > 3 && (
                      <div className="text-xs text-muted-foreground bg-muted p-1 rounded text-center">
                        +{dayReservations.length - 3} more
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};