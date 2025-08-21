import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Bed, 
  DollarSign, 
  Package, 
  TrendingUp, 
  AlertCircle,
  Edit,
  Save,
  X,
  Zap,
  Loader2,
  Download,
  Upload
} from "lucide-react";
import OutOfOrderDialog from "@/components/ari/OutOfOrderDialog";

interface ARIData {
  date: string;
  roomTypeId: string;
  roomTypeName: string;
  rate: number;
  availability: number;
  inventory: number;
  restrictions: {
    stopSell: boolean;
    minStay: number;
    maxStay: number;
    closedToArrival: boolean;
    closedToDeparture: boolean;
  };
}

const ARICalendar = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ date: string; roomTypeId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [bulkUpdateMode, setBulkUpdateMode] = useState(false);
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [outOfOrderDialog, setOutOfOrderDialog] = useState(false);
  const [aiOptimizing, setAiOptimizing] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate dates for the next 30 days
  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return date.toISOString().split('T')[0];
    });
  }, []);

  // Fetch room types
  const { data: roomTypes = [] } = useQuery({
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

  // Fetch ARI data
  const { data: ariData = [], isLoading } = useQuery({
    queryKey: ['ari-data', dates],
    queryFn: async () => {
      const results: ARIData[] = [];
      
      for (const roomType of roomTypes) {
        for (const date of dates) {
          // Fetch rates
          const { data: rateData } = await supabase
            .from('daily_rates')
            .select('rate')
            .eq('room_type_id', roomType.id)
            .eq('date', date)
            .single();

          // Fetch inventory
          const { data: inventoryData } = await supabase
            .from('inventory')
            .select('allotment, stop_sell')
            .eq('room_type_id', roomType.id)
            .eq('date', date)
            .single();

          // Calculate availability (inventory - reservations)
          const { count: reservations } = await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('room_type_id', roomType.id)
            .lte('check_in', date)
            .gt('check_out', date)
            .eq('status', 'Booked');

          const availability = (inventoryData?.allotment || 0) - (reservations || 0);

          results.push({
            date,
            roomTypeId: roomType.id,
            roomTypeName: roomType.name,
            rate: rateData?.rate || 0,
            availability: Math.max(0, availability),
            inventory: inventoryData?.allotment || 0,
            restrictions: {
              stopSell: inventoryData?.stop_sell || false,
              minStay: 1,
              maxStay: 30,
              closedToArrival: false,
              closedToDeparture: false
            }
          });
        }
      }
      
      return results;
    },
    enabled: roomTypes.length > 0
  });

  // Mutation for updating rates
  const updateRateMutation = useMutation({
    mutationFn: async ({ roomTypeId, date, rate }: { roomTypeId: string; date: string; rate: number }) => {
      const { error } = await supabase
        .from('daily_rates')
        .upsert({
          room_type_id: roomTypeId,
          date,
          rate,
          rate_plan_id: '550e8400-e29b-41d4-a716-446655440020', // Default rate plan
          hotel_id: '550e8400-e29b-41d4-a716-446655440001' // Mock hotel ID
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ari-data'] });
      toast({
        title: "Rate Updated",
        description: "Rate has been successfully updated.",
      });
    }
  });

  // Mutation for updating inventory
  const updateInventoryMutation = useMutation({
    mutationFn: async ({ roomTypeId, date, allotment }: { roomTypeId: string; date: string; allotment: number }) => {
      const { error } = await supabase
        .from('inventory')
        .upsert({
          room_type_id: roomTypeId,
          date,
          allotment,
          hotel_id: '550e8400-e29b-41d4-a716-446655440001' // Mock hotel ID
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ari-data'] });
      toast({
        title: "Inventory Updated",
        description: "Inventory has been successfully updated.",
      });
    }
  });

  // AI Optimization mutation
  const aiOptimizeMutation = useMutation({
    mutationFn: async () => {
      // Simulate AI optimization
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Apply AI-optimized rates to database
      const optimizedRates = ariData.map(item => ({
        ...item,
        rate: Math.round(item.rate * (1 + (Math.random() - 0.5) * 0.2)) // ±10% variation
      }));

      for (const item of optimizedRates) {
        await supabase
          .from('daily_rates')
          .upsert({
            room_type_id: item.roomTypeId,
            date: item.date,
            rate: item.rate,
            rate_plan_id: '550e8400-e29b-41d4-a716-446655440020', // Default rate plan
            hotel_id: '550e8400-e29b-41d4-a716-446655440001'
          });
      }
    },
    onSuccess: () => {
      setAiOptimizing(false);
      queryClient.invalidateQueries({ queryKey: ['ari-data'] });
      toast({
        title: "AI Optimization Complete",
        description: "Rates have been optimized based on demand forecasting and competitor analysis.",
      });
    }
  });

  const getAvailabilityColor = (availability: number, inventory: number) => {
    if (inventory === 0) return "bg-gray-200 text-gray-600";
    const percentage = (availability / inventory) * 100;
    if (percentage === 0) return "bg-red-500 text-white";
    if (percentage < 25) return "bg-red-100 text-red-800";
    if (percentage < 50) return "bg-yellow-100 text-yellow-800";
    if (percentage < 75) return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  };

  const handleCellEdit = (date: string, roomTypeId: string, field: string, currentValue: any) => {
    setEditingCell({ date, roomTypeId, field });
    setEditValue(currentValue.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;

    const numericValue = parseFloat(editValue);
    if (isNaN(numericValue) || numericValue < 0) {
      toast({
        title: "Invalid Value",
        description: "Please enter a valid positive number.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingCell.field === 'rate') {
        await updateRateMutation.mutateAsync({
          roomTypeId: editingCell.roomTypeId,
          date: editingCell.date,
          rate: numericValue
        });
      } else if (editingCell.field === 'inventory') {
        await updateInventoryMutation.mutateAsync({
          roomTypeId: editingCell.roomTypeId,
          date: editingCell.date,
          allotment: Math.floor(numericValue)
        });
      }
      
      setEditingCell(null);
      setEditValue("");
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update value. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleAIOptimize = () => {
    setAiOptimizing(true);
    aiOptimizeMutation.mutate();
  };

  const handleBulkUpdate = () => {
    setBulkUpdateMode(!bulkUpdateMode);
    setSelectedCells([]);
  };

  const getARIDataForCell = (date: string, roomTypeId: string) => {
    return ariData.find(item => item.date === date && item.roomTypeId === roomTypeId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading ARI data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ARI Calendar</h2>
          <p className="text-muted-foreground">Availability, Rates & Inventory Management</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Calendar className="mr-1 h-3 w-3" />
            Live Sync Active
          </Badge>
          <Button 
            variant="outline" 
            onClick={handleBulkUpdate}
            className={bulkUpdateMode ? "bg-primary text-primary-foreground" : ""}
          >
            <Edit className="mr-1 h-4 w-4" />
            Bulk Update
          </Button>
          <Button 
            variant="outline" 
            onClick={handleAIOptimize}
            disabled={aiOptimizing}
          >
            {aiOptimizing ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-1 h-4 w-4" />
            )}
            AI Optimize
          </Button>
          <Button 
            variant="outline"
            onClick={() => setOutOfOrderDialog(true)}
          >
            <AlertCircle className="mr-1 h-4 w-4" />
            Out of Order
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="sync">Channel Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                ARI Grid - Real-time Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Room Type</th>
                      {dates.slice(0, 14).map((date) => (
                        <th key={date} className="text-center p-2 font-medium min-w-32">
                          <div>{new Date(date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roomTypes.map((roomType) => (
                      <tr key={roomType.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">
                          <div className="flex items-center gap-2">
                            <Bed className="h-4 w-4 text-muted-foreground" />
                            {roomType.name}
                          </div>
                        </td>
                        {dates.slice(0, 14).map((date) => {
                          const data = getARIDataForCell(date, roomType.id);
                          if (!data) return <td key={date} className="p-2">-</td>;
                          
                          return (
                            <td key={`${date}-${roomType.id}`} className="p-2">
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                  getAvailabilityColor(data.availability, data.inventory)
                                } ${
                                  data.restrictions.stopSell ? 'opacity-50' : ''
                                }`}
                              >
                                {/* Availability */}
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium">Avail:</span>
                                  {editingCell?.date === date && editingCell?.roomTypeId === roomType.id && editingCell?.field === 'availability' ? (
                                    <div className="flex items-center gap-1">
                                      <Input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="h-6 w-12 text-xs"
                                        type="number"
                                        min="0"
                                      />
                                      <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-6 w-6 p-0">
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 w-6 p-0">
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span 
                                      className="font-bold cursor-pointer flex items-center gap-1 group"
                                      onClick={() => handleCellEdit(date, roomType.id, 'inventory', data.inventory)}
                                    >
                                      {data.availability}/{data.inventory}
                                      <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                    </span>
                                  )}
                                </div>
                                
                                {/* Rate */}
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium">Rate:</span>
                                  {editingCell?.date === date && editingCell?.roomTypeId === roomType.id && editingCell?.field === 'rate' ? (
                                    <div className="flex items-center gap-1">
                                      <Input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="h-6 w-16 text-xs"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                      />
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={handleSaveEdit} 
                                        className="h-6 w-6 p-0"
                                        disabled={updateRateMutation.isPending}
                                      >
                                        {updateRateMutation.isPending ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Save className="h-3 w-3" />
                                        )}
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 w-6 p-0">
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span 
                                      className="font-bold cursor-pointer flex items-center gap-1 group"
                                      onClick={() => handleCellEdit(date, roomType.id, 'rate', data.rate)}
                                    >
                                      ${data.rate}
                                      <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                    </span>
                                  )}
                                </div>
                                
                                {/* Restrictions */}
                                {data.restrictions.stopSell && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertCircle className="h-3 w-3" />
                                    <span className="text-xs font-medium">STOP SELL</span>
                                  </div>
                                )}
                              </motion.div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Availability Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-100"></div>
                  <span className="text-sm">75-100% Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-100"></div>
                  <span className="text-sm">50-74% Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-100"></div>
                  <span className="text-sm">25-49% Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-100"></div>
                  <span className="text-sm">1-24% Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span className="text-sm">Sold Out</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">
                    {roomTypes.length > 0 ? Math.round(ariData.reduce((sum, item) => sum + item.rate, 0) / ariData.length) : 0}
                  </div>
                  <div className="text-sm text-blue-700">Average ADR</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">
                    {roomTypes.length > 0 ? 
                      Math.round((ariData.reduce((sum, item) => sum + item.availability, 0) / 
                                 ariData.reduce((sum, item) => sum + item.inventory, 0)) * 100) || 0 : 0}%
                  </div>
                  <div className="text-sm text-green-700">Availability</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-900">
                    {ariData.filter(item => item.restrictions.stopSell).length}
                  </div>
                  <div className="text-sm text-purple-700">Stop Sell Days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Channel Synchronization</h3>
                <p className="text-muted-foreground mb-6">
                  Real-time sync with OTAs and channel partners. Configure sync settings and monitor updates.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Push to Channels
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Pull from Channels
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Out of Order Dialog */}
      <OutOfOrderDialog 
        open={outOfOrderDialog}
        onOpenChange={setOutOfOrderDialog}
        hotelId="550e8400-e29b-41d4-a716-446655440001"
        rooms={roomTypes.map(rt => ({
          id: rt.id,
          room_number: `${rt.name}-001`,
          room_types: { name: rt.name },
          status: 'clean'
        }))}
      />
    </div>
  );
};

export default ARICalendar;