import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowRightLeft,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RoomTypeMapping {
  id: string;
  channel_id: string;
  channel_name: string;
  hotel_room_type_id: string;
  hotel_room_type_name: string;
  channel_room_type_id: string;
  channel_room_type_name: string;
  is_active: boolean;
}

interface Channel {
  id: string;
  channel_name: string;
  is_active: boolean;
}

interface RoomType {
  id: string;
  name: string;
}

export const ChannelMappings: React.FC = () => {
  const [mappings, setMappings] = useState<RoomTypeMapping[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch mappings with channel info
      const { data: mappingsData, error: mappingsError } = await supabase
        .from('channel_mappings')
        .select(`
          *,
          channels (channel_name)
        `);

      if (mappingsError) throw mappingsError;

      // Fetch channels
      const { data: channelsData, error: channelsError } = await supabase
        .from('channels')
        .select('id, channel_name, is_active')
        .eq('is_active', true);

      if (channelsError) throw channelsError;

      // Fetch room types (this would come from your existing room_types table)
      const { data: roomTypesData, error: roomTypesError } = await supabase
        .from('room_types')
        .select('id, name');

      if (roomTypesError) {
        // If room_types table doesn't exist, use mock data
        setRoomTypes([
          { id: '1', name: 'Standard Room' },
          { id: '2', name: 'Deluxe Room' },
          { id: '3', name: 'Suite' }
        ]);
      } else {
        setRoomTypes(roomTypesData || []);
      }

      setMappings(mappingsData?.map(m => ({
        ...m,
        channel_name: m.channels?.channel_name || '',
        hotel_room_type_name: roomTypesData?.find(rt => rt.id === m.hotel_room_type_id)?.name || 'Unknown'
      })) || []);
      
      setChannels(channelsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch mapping data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createMapping = async (
    channelId: string, 
    hotelRoomTypeId: string, 
    channelRoomTypeId: string,
    channelRoomTypeName: string
  ) => {
    try {
      const { error } = await supabase
        .from('channel_mappings')
        .insert({
          channel_id: channelId,
          hotel_room_type_id: hotelRoomTypeId,
          channel_room_type_id: channelRoomTypeId,
          channel_room_type_name: channelRoomTypeName,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room mapping created successfully"
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create mapping",
        variant: "destructive"
      });
    }
  };

  const toggleMapping = async (mappingId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('channel_mappings')
        .update({ is_active: isActive })
        .eq('id', mappingId);

      if (error) throw error;

      setMappings(prev => 
        prev.map(m => 
          m.id === mappingId ? { ...m, is_active: isActive } : m
        )
      );

      toast({
        title: "Success",
        description: `Mapping ${isActive ? 'enabled' : 'disabled'}`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update mapping",
        variant: "destructive"
      });
    }
  };

  const deleteMapping = async (mappingId: string) => {
    try {
      const { error } = await supabase
        .from('channel_mappings')
        .delete()
        .eq('id', mappingId);

      if (error) throw error;

      setMappings(prev => prev.filter(m => m.id !== mappingId));

      toast({
        title: "Success",
        description: "Mapping deleted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete mapping",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading mappings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Room Type Mappings</h2>
          <p className="text-muted-foreground">
            Map your property's room types to channel-specific room types
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Mapping
        </Button>
      </div>

      {/* Mapping Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Mappings</p>
                <p className="text-2xl font-bold">{mappings.length}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Mappings</p>
                <p className="text-2xl font-bold">
                  {mappings.filter(m => m.is_active).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Missing Mappings</p>
                <p className="text-2xl font-bold">
                  {channels.length * roomTypes.length - mappings.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mappings List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Mappings</CardTitle>
          <CardDescription>
            Manage how your room types are mapped to each channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mappings.length === 0 ? (
            <div className="text-center py-8">
              <ArrowRightLeft className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Mappings Found</h3>
              <p className="text-muted-foreground mb-4">
                Create mappings to synchronize your room types with channels
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mappings.map((mapping) => (
                <Card key={mapping.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      {/* Hotel Room Type */}
                      <div className="text-center">
                        <p className="text-sm font-medium">Hotel Room Type</p>
                        <Badge variant="outline" className="mt-1">
                          {mapping.hotel_room_type_name}
                        </Badge>
                      </div>

                      {/* Mapping Arrow */}
                      <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />

                      {/* Channel Room Type */}
                      <div className="text-center">
                        <p className="text-sm font-medium">{mapping.channel_name}</p>
                        <Badge variant="secondary" className="mt-1">
                          {mapping.channel_room_type_name || mapping.channel_room_type_id}
                        </Badge>
                      </div>

                      {/* Status */}
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={mapping.is_active}
                          onCheckedChange={(checked) => 
                            toggleMapping(mapping.id, checked)
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {mapping.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMapping(mapping.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Mapping Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <p>
                <strong>1. Channel Setup:</strong> Ensure your channels are connected and active before creating mappings
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <p>
                <strong>2. Room Type Matching:</strong> Match your hotel's room types with the corresponding types on each channel
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <p>
                <strong>3. Activate Mappings:</strong> Enable mappings to start synchronizing rates and availability
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <p>
                <strong>4. Monitor Sync:</strong> Check sync logs regularly to ensure data is being pushed correctly
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};