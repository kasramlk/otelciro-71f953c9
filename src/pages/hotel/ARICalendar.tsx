import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  DollarSign, 
  Building2, 
  TrendingUp,
  Settings,
  Wand2,
  Copy,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Save,
  RotateCcw
} from "lucide-react";
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface RateCalendarData {
  date: string;
  roomTypeId: string;
  roomTypeName: string;
  rate: number;
  availability: number;
  minStay: number;
  closedToArrival: boolean;
  closedToDeparture: boolean;
  stopSell: boolean;
}

const ARICalendar = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedRoomType, setSelectedRoomType] = useState("all");
  const [bulkUpdateData, setBulkUpdateData] = useState({
    roomType: "",
    startDate: "",
    endDate: "",
    rate: "",
    availability: "",
    minStay: "",
    restrictions: {
      closedToArrival: false,
      closedToDeparture: false,
      stopSell: false
    }
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch room types
  const { data: roomTypes } = useQuery({
    queryKey: ['room-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch ARI data for the selected month
  const { data: ariData, isLoading } = useQuery({
    queryKey: ['ari-calendar', selectedMonth, selectedRoomType],
    queryFn: async () => {
      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);
      const dates = eachDayOfInterval({ start: startDate, end: endDate });

      // Get daily rates
      const { data: rates } = await supabase
        .from('daily_rates')
        .select(`
          *,
          room_types (name),
          rate_plans (name)
        `)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      // Get inventory data
      const { data: inventory } = await supabase
        .from('inventory')
        .select(`
          *,
          room_types (name)
        `)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      // Combine data into calendar format
      const calendarData: RateCalendarData[] = [];
      
      roomTypes?.forEach(roomType => {
        if (selectedRoomType !== "all" && roomType.id !== selectedRoomType) return;
        
        dates.forEach(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const rateData = rates?.find(r => r.date === dateStr && r.room_type_id === roomType.id);
          const inventoryData = inventory?.find(i => i.date === dateStr && i.room_type_id === roomType.id);
          
          calendarData.push({
            date: dateStr,
            roomTypeId: roomType.id,
            roomTypeName: roomType.name,
            rate: rateData?.rate || 100, // Default rate
            availability: inventoryData?.allotment || 10, // Default availability
            minStay: 1, // TODO: Add to schema
            closedToArrival: inventoryData?.stop_sell || false,
            closedToDeparture: false, // TODO: Add to schema
            stopSell: inventoryData?.stop_sell || false
          });
        });
      });

      return calendarData;
    }
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const dates = eachDayOfInterval({ start: startDate, end: endDate });

      for (const date of dates) {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Update rates if provided
        if (data.rate) {
          await supabase
            .from('daily_rates')
            .upsert({
              room_type_id: data.roomType,
              date: dateStr,
              rate: parseFloat(data.rate),
              rate_plan_id: 'default-rate-plan-id', // TODO: Get from context
              hotel_id: 'current-hotel-id' // TODO: Get from context
            });
        }

        // Update inventory if provided
        if (data.availability) {
          await supabase
            .from('inventory')
            .upsert({
              room_type_id: data.roomType,
              date: dateStr,
              allotment: parseInt(data.availability),
              stop_sell: data.restrictions.stopSell,
              hotel_id: 'current-hotel-id' // TODO: Get from context
            });
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Rates and inventory updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['ari-calendar'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update rates and inventory",
        variant: "destructive",
      });
    }
  });

  const handleBulkUpdate = () => {
    if (!bulkUpdateData.roomType || !bulkUpdateData.startDate || !bulkUpdateData.endDate) {
      toast({
        title: "Missing Data",
        description: "Please fill in room type and date range",
        variant: "destructive",
      });
      return;
    }
    bulkUpdateMutation.mutate(bulkUpdateData);
  };

  // Get unique dates for the calendar header
  const calendarDates = ariData ? 
    [...new Set(ariData.map(item => item.date))].sort() : [];

  // Group data by room type
  const groupedData = ariData?.reduce((acc, item) => {
    if (!acc[item.roomTypeName]) {
      acc[item.roomTypeName] = [];
    }
    acc[item.roomTypeName].push(item);
    return acc;
  }, {} as Record<string, RateCalendarData[]>) || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ARI Calendar</h1>
          <p className="text-muted-foreground">Manage Availability, Rates & Inventory across all channels</p>
        </div>
        
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Wand2 className="h-4 w-4" />
                Bulk Update
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Update Rates & Inventory</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="roomType">Room Type</Label>
                    <Select value={bulkUpdateData.roomType} onValueChange={(value) => 
                      setBulkUpdateData(prev => ({ ...prev, roomType: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes?.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rate">Rate (USD)</Label>
                    <Input
                      id="rate"
                      type="number"
                      placeholder="120.00"
                      value={bulkUpdateData.rate}
                      onChange={(e) => setBulkUpdateData(prev => ({ ...prev, rate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={bulkUpdateData.startDate}
                      onChange={(e) => setBulkUpdateData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={bulkUpdateData.endDate}
                      onChange={(e) => setBulkUpdateData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="availability">Availability</Label>
                    <Input
                      id="availability"
                      type="number"
                      placeholder="10"
                      value={bulkUpdateData.availability}
                      onChange={(e) => setBulkUpdateData(prev => ({ ...prev, availability: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minStay">Min Stay</Label>
                    <Input
                      id="minStay"
                      type="number"
                      placeholder="1"
                      value={bulkUpdateData.minStay}
                      onChange={(e) => setBulkUpdateData(prev => ({ ...prev, minStay: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Restrictions</Label>
                    <div className="space-y-1">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={bulkUpdateData.restrictions.stopSell}
                          onChange={(e) => setBulkUpdateData(prev => ({
                            ...prev,
                            restrictions: { ...prev.restrictions, stopSell: e.target.checked }
                          }))}
                        />
                        <span className="text-sm">Stop Sell</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleBulkUpdate} disabled={bulkUpdateMutation.isPending} className="w-full">
                  {bulkUpdateMutation.isPending ? "Updating..." : "Apply Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 gap-2">
            <TrendingUp className="h-4 w-4" />
            AI Optimize
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="month">Month</Label>
                <Input
                  id="month"
                  type="month"
                  value={format(selectedMonth, 'yyyy-MM')}
                  onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                  className="w-40"
                />
              </div>
              
              <div>
                <Label htmlFor="roomType">Room Type</Label>
                <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All room types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Room Types</SelectItem>
                    {roomTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copy Previous Month
              </Button>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ARI Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Rate & Inventory Grid
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading calendar data...</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[1200px]">
                {/* Calendar Header */}
                <div className="grid grid-cols-[200px_repeat(31,minmax(100px,1fr))] gap-1 mb-4">
                  <div className="font-semibold p-2">Room Type</div>
                  {calendarDates.map((date) => (
                    <div key={date} className="text-center p-2 font-medium text-xs">
                      <div>{format(new Date(date), 'EEE')}</div>
                      <div>{format(new Date(date), 'dd')}</div>
                    </div>
                  ))}
                </div>

                {/* Calendar Body */}
                <div className="space-y-4">
                  {Object.entries(groupedData).map(([roomTypeName, roomTypeData]) => (
                    <motion.div
                      key={roomTypeName}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-2"
                    >
                      <div className="grid grid-cols-[200px_repeat(31,minmax(100px,1fr))] gap-1">
                        <div className="font-medium p-2 bg-muted rounded flex items-center">
                          {roomTypeName}
                        </div>
                        
                        {roomTypeData.map((dayData) => (
                          <div
                            key={`${roomTypeName}-${dayData.date}`}
                            className={`p-1 text-xs border rounded cursor-pointer transition-colors ${
                              dayData.stopSell ? 'bg-red-100 border-red-200' :
                              dayData.closedToArrival ? 'bg-yellow-100 border-yellow-200' :
                              'bg-background hover:bg-muted'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="font-semibold text-green-600">
                                ${dayData.rate}
                              </div>
                              <div className="text-blue-600">
                                Avail: {dayData.availability}
                              </div>
                              {dayData.minStay > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  Min {dayData.minStay}n
                                </Badge>
                              )}
                              <div className="flex gap-1">
                                {dayData.stopSell && <Lock className="w-3 h-3 text-red-500" />}
                                {dayData.closedToArrival && <EyeOff className="w-3 h-3 text-yellow-500" />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            AI Revenue Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">Weekend Rate Optimization</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Increase Friday-Sunday rates by 20% for next month. Market demand is 35% higher than average.
                  </p>
                  <div className="mt-2">
                    <Button size="sm" variant="outline" className="border-blue-200 text-blue-700">
                      Apply Suggestion
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-green-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 dark:text-green-100">Inventory Optimization</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Open 2 additional Standard rooms for Dec 15-20. Booking pace is 40% above forecast.
                  </p>
                  <div className="mt-2">
                    <Button size="sm" variant="outline" className="border-green-200 text-green-700">
                      Apply Suggestion
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ARICalendar;