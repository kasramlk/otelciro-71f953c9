import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Upload, Download, TrendingUp, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InventoryManagerProps {
  connectionId: string;
  hotelId: string;
}

export function Beds24InventoryManager({ connectionId, hotelId }: InventoryManagerProps) {
  const [properties, setProperties] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [cachedData, setCachedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const { toast } = useToast();

  // Load properties and rooms
  useEffect(() => {
    loadPropertiesAndRooms();
    loadCachedInventory();
  }, [connectionId]);

  const loadPropertiesAndRooms = async () => {
    try {
      const { data: propertiesData } = await supabase
        .from('beds24_properties')
        .select('*')
        .eq('connection_id', connectionId)
        .eq('hotel_id', hotelId);

      setProperties(propertiesData || []);

      const { data: roomsData } = await supabase
        .from('beds24_rooms')
        .select('*')
        .eq('hotel_id', hotelId);

      setRooms(roomsData || []);
    } catch (error) {
      console.error('Error loading properties and rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load properties and rooms",
        variant: "destructive",
      });
    }
  };

  const loadCachedInventory = async () => {
    try {
      const { data: cacheData } = await supabase
        .from('beds24_calendar_cache')
        .select(`
          *,
          beds24_properties!inner(property_name),
          beds24_rooms!inner(room_name)
        `)
        .gte('expires_at', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(100);

      setCachedData(cacheData || []);
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const handlePullInventory = async () => {
    if (!selectedProperty) {
      toast({
        title: "Error",
        description: "Please select a property first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('beds24-inventory-pull', {
        body: {
          connectionId,
          propertyId: selectedProperty,
          roomId: selectedRoom || undefined,
          startDate: dateRange.from,
          endDate: dateRange.to,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Pulled inventory data for ${data.data?.records_cached || 0} records`,
      });

      loadCachedInventory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to pull inventory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePushInventory = async () => {
    if (!selectedRoom) {
      toast({
        title: "Error", 
        description: "Please select a room first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('beds24-inventory-push', {
        body: {
          connectionId,
          updates: [{
            roomId: parseInt(selectedRoom),
            calendar: [{
              from: dateRange.from,
              to: dateRange.to,
              price1: 120, // Demo values - in real app, get from form
              numAvail: 2,
              minStay: 1,
            }]
          }]
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Pushed inventory updates for ${data.data?.updates_processed || 0} rooms`,
      });

      loadCachedInventory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to push inventory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('beds24-properties-sync', {
        body: { connectionId },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Synced ${data.data?.properties?.length || 0} properties and ${data.data?.rooms?.length || 0} rooms`,
      });

      loadPropertiesAndRooms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sync properties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Beds24 Inventory Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{properties.length}</div>
                <p className="text-sm text-muted-foreground">Properties</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{rooms.length}</div>
                <p className="text-sm text-muted-foreground">Rooms</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{cachedData.length}</div>
                <p className="text-sm text-muted-foreground">Cached Records</p>
              </CardContent>
            </Card>
          </div>

          <Button onClick={handleSyncProperties} disabled={loading} className="mb-6">
            Sync Properties & Rooms
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventory Operations</TabsTrigger>
          <TabsTrigger value="cache">Cached Data</TabsTrigger>
          <TabsTrigger value="rooms">Room Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Sync Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Property</Label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                  >
                    <option value="">Select Property</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.beds24_property_id}>
                        {prop.property_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Room (Optional)</Label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                  >
                    <option value="">All Rooms</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.beds24_room_id}>
                        {room.room_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={handlePullInventory}
                  disabled={loading}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Pull from Beds24
                </Button>
                <Button 
                  onClick={handlePushInventory}
                  disabled={loading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Push to Beds24
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Cached Inventory Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cachedData.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No cached inventory data available. Pull data from Beds24 to populate the cache.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-2 max-h-96 overflow-y-auto">
                    {cachedData.map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{item.beds24_properties?.property_name}</div>
                            <div className="text-sm text-muted-foreground">
                              Room: {item.beds24_rooms?.room_name} | Date: {item.date}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${item.price1 || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">
                              Avail: {item.num_avail || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-1">
                          {item.min_stay && (
                            <Badge variant="secondary">
                              Min Stay: {item.min_stay}
                            </Badge>
                          )}
                          <Badge variant="outline">
                            Expires: {new Date(item.expires_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Room Mappings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rooms.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No room mappings found. Sync properties first to import room data from Beds24.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-2">
                    {rooms.map((room) => (
                      <div key={room.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{room.room_name}</div>
                            <div className="text-sm text-muted-foreground">
                              Beds24 ID: {room.beds24_room_id} | Code: {room.room_code || 'N/A'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={room.sync_enabled ? "default" : "secondary"}>
                              {room.sync_enabled ? 'Sync Enabled' : 'Sync Disabled'}
                            </Badge>
                            <Badge variant="outline">
                              Max: {room.max_occupancy} guests
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}