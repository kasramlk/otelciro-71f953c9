import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Filter, 
  Calendar as CalendarIcon,
  RotateCcw,
  Search,
  Download,
  Trash2,
  Mail,
  Phone,
  CheckCircle
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface ReservationFiltersProps {
  onBulkAction: (action: string, selectedIds: string[]) => void;
}

export const ReservationFilters = ({ onBulkAction }: ReservationFiltersProps) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: addDays(new Date(), 30)
  });
  
  const [filters, setFilters] = useState({
    status: 'all',
    source: 'all',
    roomType: 'all',
    guestName: '',
    reservationNo: '',
    confirmationNo: '',
    company: 'all',
    channel: 'all',
    paymentStatus: 'all'
  });

  const [selectedReservations, setSelectedReservations] = useState<string[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const resetFilters = () => {
    setDateRange({
      from: subDays(new Date(), 7),
      to: addDays(new Date(), 30)
    });
    setFilters({
      status: 'all',
      source: 'all',
      roomType: 'all',
      guestName: '',
      reservationNo: '',
      confirmationNo: '',
      company: 'all',
      channel: 'all',
      paymentStatus: 'all'
    });
  };

  const bulkActions = [
    { 
      key: 'confirm', 
      label: 'Confirm Selected', 
      icon: CheckCircle, 
      color: 'bg-green-600 hover:bg-green-700' 
    },
    { 
      key: 'email', 
      label: 'Send Email', 
      icon: Mail, 
      color: 'bg-blue-600 hover:bg-blue-700' 
    },
    { 
      key: 'sms', 
      label: 'Send SMS', 
      icon: Phone, 
      color: 'bg-purple-600 hover:bg-purple-700' 
    },
    { 
      key: 'export', 
      label: 'Export Selected', 
      icon: Download, 
      color: 'bg-gray-600 hover:bg-gray-700' 
    },
    { 
      key: 'cancel', 
      label: 'Cancel Selected', 
      icon: Trash2, 
      color: 'bg-red-600 hover:bg-red-700' 
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center">
              <Filter className="mr-2 h-5 w-5 text-primary" />
              Advanced Filters
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="border-border hover:bg-accent"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-border",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="checked-in">Checked In</SelectItem>
                  <SelectItem value="checked-out">Checked Out</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={filters.source} onValueChange={(value) => setFilters({...filters, source: value})}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="booking">Booking.com</SelectItem>
                  <SelectItem value="expedia">Expedia</SelectItem>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="agency">Travel Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select value={filters.roomType} onValueChange={(value) => setFilters({...filters, roomType: value})}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="All Room Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Room Types</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="deluxe">Deluxe</SelectItem>
                  <SelectItem value="suite">Suite</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Company</Label>
              <Select value={filters.company} onValueChange={(value) => setFilters({...filters, company: value})}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  <SelectItem value="none">Individual</SelectItem>
                  <SelectItem value="acme-corp">ACME Corporation</SelectItem>
                  <SelectItem value="tech-solutions">Tech Solutions Ltd</SelectItem>
                  <SelectItem value="global-enterprises">Global Enterprises</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={filters.paymentStatus} onValueChange={(value) => setFilters({...filters, paymentStatus: value})}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="All Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="pending">Pending Payment</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Guest Name</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by guest name..."
                  value={filters.guestName}
                  onChange={(e) => setFilters({...filters, guestName: e.target.value})}
                  className="pl-10 border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reservation Number</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reservation..."
                  value={filters.reservationNo}
                  onChange={(e) => setFilters({...filters, reservationNo: e.target.value})}
                  className="pl-10 border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confirmation Number</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search confirmation..."
                  value={filters.confirmationNo}
                  onChange={(e) => setFilters({...filters, confirmationNo: e.target.value})}
                  className="pl-10 border-border"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedReservations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full"
        >
          <Card className="shadow-sm border-border/50 bg-accent/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {selectedReservations.length} reservation(s) selected
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {bulkActions.map((action) => (
                    <Button
                      key={action.key}
                      size="sm"
                      className={`text-white ${action.color}`}
                      onClick={() => onBulkAction(action.key, selectedReservations)}
                    >
                      <action.icon className="mr-2 h-4 w-4" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};