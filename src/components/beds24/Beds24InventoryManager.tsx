import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, CalendarIcon, Upload, Download, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { beds24Service } from '@/lib/services/beds24-service';
import { useBeds24Properties } from '@/hooks/use-beds24';
import { useToast } from '@/hooks/use-toast';

interface InventoryManagerProps {
  connectionId: string;
  hotelId?: string;
}

export function Beds24InventoryManager({ connectionId, hotelId }: InventoryManagerProps) {
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pushData, setPushData] = useState({
    roomId: '',
    availability: '',
    price: '',
    minStay: '',
    maxStay: '',
    closedToArrival: false,
    closedToDeparture: false
  });

  const { data: properties } = useBeds24Properties(connectionId);
  const { toast } = useToast();

  const fetchInventory = async (propertyId: string) => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Date Range Required",
        description: "Please select a date range to fetch inventory data.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Mock inventory data since the table doesn't exist yet in Supabase types
      console.log('Fetching inventory for property:', propertyId);
      const mockInventory = [
        {
          id: '1',
          beds24_room_id: 101,
          date: '2025-09-01',
          available: 3,
          price: 120.00,
          min_stay: 2,
          max_stay: 7,
          closed_to_arrival: false,
          closed_to_departure: false
        },
        {
          id: '2', 
          beds24_room_id: 102,
          date: '2025-09-01',
          available: 0,
          price: 150.00,
          min_stay: 1,
          max_stay: 5,
          closed_to_arrival: false,
          closed_to_departure: false
        }
      ];
      setInventory(mockInventory);
      toast({
        title: "Success",
        description: `Fetched ${mockInventory.length} inventory records`
      });
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const syncInventory = async () => {
    if (!selectedProperty || !dateRange?.from || !dateRange?.to) {
      toast({
        title: "Missing Information",
        description: "Please select a property and date range.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await beds24Service.syncInventory(selectedProperty.id, {
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd')
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Inventory synchronized successfully"
        });
        // Refresh inventory data
        fetchInventory(selectedProperty.id);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to sync inventory:', error);
      toast({
        title: "Error",
        description: "Failed to sync inventory",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pushInventoryUpdate = async () => {
    if (!selectedProperty || !dateRange?.from || !dateRange?.to) {
      toast({
        title: "Missing Information",
        description: "Please select a property and date range.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await beds24Service.pushInventory(selectedProperty.id, {
        roomTypeId: pushData.roomId,
        dateRange: {
          from: format(dateRange.from, 'yyyy-MM-dd'),
          to: format(dateRange.to, 'yyyy-MM-dd')
        },
        availability: pushData.availability ? parseInt(pushData.availability) : undefined,
        rates: pushData.price ? { base: parseFloat(pushData.price) } : undefined,
        restrictions: {
          minStay: pushData.minStay ? parseInt(pushData.minStay) : undefined,
          maxStay: pushData.maxStay ? parseInt(pushData.maxStay) : undefined,
          closedToArrival: pushData.closedToArrival,
          closedToDeparture: pushData.closedToDeparture
        }
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Inventory update pushed successfully"
        });
        // Reset form
        setPushData({
          roomId: '',
          availability: '',
          price: '',
          minStay: '',
          maxStay: '',
          closedToArrival: false,
          closedToDeparture: false
        });
        // Refresh inventory data
        fetchInventory(selectedProperty.id);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to push inventory:', error);
      toast({
        title: "Error",
        description: "Failed to push inventory update",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityBadge = (available: number | null) => {
    if (available === null || available === undefined) {
      return <Badge variant="outline">Unknown</Badge>;
    }
    if (available === 0) {
      return <Badge variant="destructive">Sold Out</Badge>;
    }
    if (available <= 2) {
      return <Badge variant="secondary">Low ({available})</Badge>;
    }
    return <Badge variant="default">Available ({available})</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Inventory Management</h3>
        <div className="flex gap-2">
          <Button onClick={syncInventory} disabled={loading} size="sm">
            {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            <Download className="mr-2 h-4 w-4" />
            Sync from Beds24
          </Button>
        </div>
      </div>

      {/* Property and Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Property</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedProperty?.id || ''}
                onChange={(e) => {
                  const property = properties?.find(p => p.id === e.target.value);
                  setSelectedProperty(property);
                }}
              >
                <option value="">Select a property</option>
                {properties?.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.property_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
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
                    defaultMonth={dateRange?.from}
                    selected={dateRange ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {selectedProperty && (
            <div className="flex gap-2">
              <Button 
                onClick={() => fetchInventory(selectedProperty.id)}
                disabled={loading || !dateRange?.from || !dateRange?.to}
                variant="outline"
                size="sm"
              >
                {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Fetch Inventory
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="view" className="w-full">
        <TabsList>
          <TabsTrigger value="view">View Inventory</TabsTrigger>
          <TabsTrigger value="push">Push Updates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {inventory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="mx-auto h-12 w-12 mb-4" />
                    <p>No inventory data available</p>
                    <p className="text-sm">Select a property and date range to fetch data</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inventory.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium">Room {item.beds24_room_id}</span>
                            <span className="ml-2 text-muted-foreground">
                              {format(new Date(item.date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          {getAvailabilityBadge(item.available)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Price:</span>
                            <span className="ml-1 font-medium">
                              {item.price ? `$${item.price}` : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Min Stay:</span>
                            <span className="ml-1 font-medium">{item.min_stay || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max Stay:</span>
                            <span className="ml-1 font-medium">{item.max_stay || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Restrictions:</span>
                            <div className="flex gap-1 mt-1">
                              {item.closed_to_arrival && (
                                <Badge variant="outline" className="text-xs">No Arrival</Badge>
                              )}
                              {item.closed_to_departure && (
                                <Badge variant="outline" className="text-xs">No Departure</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="push" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Push Inventory Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="roomId">Room ID</Label>
                  <Input
                    id="roomId"
                    placeholder="Enter room ID"
                    value={pushData.roomId}
                    onChange={(e) => setPushData(prev => ({ ...prev, roomId: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <Input
                    id="availability"
                    type="number"
                    placeholder="Number of available rooms"
                    value={pushData.availability}
                    onChange={(e) => setPushData(prev => ({ ...prev, availability: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="Room rate"
                    value={pushData.price}
                    onChange={(e) => setPushData(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="minStay">Minimum Stay</Label>
                  <Input
                    id="minStay"
                    type="number"
                    placeholder="Minimum nights"
                    value={pushData.minStay}
                    onChange={(e) => setPushData(prev => ({ ...prev, minStay: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={pushData.closedToArrival}
                    onChange={(e) => setPushData(prev => ({ ...prev, closedToArrival: e.target.checked }))}
                  />
                  <span>Closed to Arrival</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={pushData.closedToDeparture}
                    onChange={(e) => setPushData(prev => ({ ...prev, closedToDeparture: e.target.checked }))}
                  />
                  <span>Closed to Departure</span>
                </label>
              </div>

              <Button 
                onClick={pushInventoryUpdate}
                disabled={loading || !selectedProperty || !dateRange?.from || !dateRange?.to}
                className="w-full"
              >
                {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Push Updates to Beds24
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Occupancy Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventory.length > 0
                    ? Math.round(
                        (inventory.filter(item => item.available === 0).length / inventory.length) * 100
                      )
                    : 0}%
                </div>
                <p className="text-muted-foreground">Sold out dates</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {inventory.length > 0 && inventory.some(item => item.price)
                    ? Math.round(
                        inventory
                          .filter(item => item.price)
                          .reduce((acc, item) => acc + parseFloat(item.price), 0) /
                        inventory.filter(item => item.price).length
                      )
                    : 0}
                </div>
                <p className="text-muted-foreground">Per night</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Restriction Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventory.length > 0
                    ? Math.round(
                        (inventory.filter(item => 
                          item.closed_to_arrival || item.closed_to_departure
                        ).length / inventory.length) * 100
                      )
                    : 0}%
                </div>
                <p className="text-muted-foreground">With restrictions</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}