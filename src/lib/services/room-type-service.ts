import { supabase } from '@/integrations/supabase/client';
import { auditLogger } from '@/lib/audit-logger';

export interface RoomTypeData {
  name: string;
  code: string;
  description?: string;
  capacity_adults: number;
  capacity_children?: number;
}

export interface RoomTypeUpdate extends Partial<RoomTypeData> {
  id: string;
}

export const roomTypeService = {
  // Get all room types for a hotel
  async getRoomTypes(hotelId: string) {
    const { data, error } = await supabase
      .from('room_types')
      .select(`
        *,
        rooms (id, number, status)
      `)
      .eq('hotel_id', hotelId)
      .order('name');

    if (error) throw error;
    return data;
  },

  // Create a new room type
  async createRoomType(hotelId: string, roomTypeData: RoomTypeData) {
    const { data, error } = await supabase
      .from('room_types')
      .insert({
        ...roomTypeData,
        hotel_id: hotelId,
      })
      .select()
      .single();

    if (error) throw error;

    // Log the creation
    await auditLogger.log({
      action: 'CREATE',
      entity_type: 'room_type',
      entity_id: data.id,
      new_values: data,
    });

    // Create default inventory for next 365 days
    await this.createDefaultInventory(hotelId, data.id);

    return data;
  },

  // Update an existing room type
  async updateRoomType(roomTypeUpdate: RoomTypeUpdate) {
    const { id, ...updateData } = roomTypeUpdate;
    
    const { data: oldData } = await supabase
      .from('room_types')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('room_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await auditLogger.log({
      action: 'UPDATE',
      entity_type: 'room_type',
      entity_id: id,
      old_values: oldData,
      new_values: data,
    });

    return data;
  },

  // Delete a room type (soft delete)
  async deleteRoomType(id: string) {
    // Check if there are any rooms of this type
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_type_id', id)
      .limit(1);

    if (rooms && rooms.length > 0) {
      throw new Error('Cannot delete room type that has existing rooms');
    }

    // Check if there are any reservations for this room type
    const { data: reservations } = await supabase
      .from('reservations')
      .select('id')
      .eq('room_type_id', id)
      .limit(1);

    if (reservations && reservations.length > 0) {
      throw new Error('Cannot delete room type that has existing reservations');
    }

    const { data: oldData } = await supabase
      .from('room_types')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('room_types')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await auditLogger.log({
      action: 'DELETE',
      entity_type: 'room_type',
      entity_id: id,
      old_values: oldData,
    });

    return true;
  },

  // Create default inventory for a room type
  async createDefaultInventory(hotelId: string, roomTypeId: string) {
    // Get the number of physical rooms for this room type
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id')
      .eq('hotel_id', hotelId)
      .eq('room_type_id', roomTypeId);

    const allotment = rooms?.length || 1; // Default to 1 if no rooms exist yet
    const inventoryData = [];

    // Create inventory for next 365 days
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      inventoryData.push({
        hotel_id: hotelId,
        room_type_id: roomTypeId,
        date: date.toISOString().split('T')[0],
        allotment,
        available: allotment,
        stop_sell: false,
        min_stay: 1,
        max_stay: null,
        cta: false, // closed to arrival
        ctd: false, // closed to departure
      });
    }

    const { error } = await supabase
      .from('inventory')
      .upsert(inventoryData, {
        onConflict: 'hotel_id,room_type_id,date'
      });

    if (error) {
      console.error('Error creating default inventory:', error);
    }
  },

  // Update inventory allotment when rooms are added/removed
  async updateInventoryAllotment(hotelId: string, roomTypeId: string) {
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id')
      .eq('hotel_id', hotelId)
      .eq('room_type_id', roomTypeId);

    const newAllotment = rooms?.length || 0;

    // Update future inventory records
    const futureDate = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('inventory')
      .update({
        allotment: newAllotment,
        available: newAllotment // Reset available to match new allotment
      })
      .eq('hotel_id', hotelId)
      .eq('room_type_id', roomTypeId)
      .gte('date', futureDate);

    if (error) {
      console.error('Error updating inventory allotment:', error);
    }
  }
};