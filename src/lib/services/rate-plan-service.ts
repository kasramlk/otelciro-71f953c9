import { supabase } from '@/integrations/supabase/client';
import { auditLogger } from '@/lib/audit-logger';

export interface RatePlanData {
  name: string;
  code: string;
  description?: string;
  currency: string;
}

export interface RatePlanUpdate extends Partial<Omit<RatePlanData, 'name' | 'code'>> {
  id: string;
  name?: string;
  code?: string;
}

export const ratePlanService = {
  // Get all rate plans for a hotel
  async getRatePlans(hotelId: string) {
    const { data, error } = await supabase
      .from('rate_plans')
      .select(`
        *,
        daily_rates (
          date,
          rate,
          room_type_id
        )
      `)
      .eq('hotel_id', hotelId)
      .order('name');

    if (error) throw error;
    return data;
  },

  // Get rate plans for specific room type
  async getRatePlansForRoomType(hotelId: string, roomTypeId: string) {
    const { data, error } = await supabase
      .from('rate_plans')
      .select(`
        *,
        daily_rates!inner (
          date,
          rate
        )
      `)
      .eq('hotel_id', hotelId)
      .eq('daily_rates.room_type_id', roomTypeId)
      .order('name');

    if (error) throw error;
    return data;
  },

  // Create a new rate plan
  async createRatePlan(hotelId: string, ratePlanData: RatePlanData) {
    const { data, error } = await supabase
      .from('rate_plans')
      .insert({
        ...ratePlanData,
        hotel_id: hotelId,
      })
      .select()
      .single();

    if (error) throw error;

    // Log the creation
    await auditLogger.log({
      action: 'CREATE',
      entity_type: 'rate_plan',
      entity_id: data.id,
      new_values: data,
    });

    // Create default daily rates for all room types
    await this.createDefaultDailyRates(hotelId, data.id, 120); // Default base rate

    return data;
  },

  // Update an existing rate plan
  async updateRatePlan(ratePlanUpdate: RatePlanUpdate) {
    const { id, ...updateData } = ratePlanUpdate;
    
    const { data: oldData } = await supabase
      .from('rate_plans')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('rate_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await auditLogger.log({
      action: 'UPDATE',
      entity_type: 'rate_plan',
      entity_id: id,
      old_values: oldData,
      new_values: data,
    });

    return data;
  },

  // Delete a rate plan
  async deleteRatePlan(id: string) {
    // Check if there are any reservations using this rate plan
    const { data: reservations } = await supabase
      .from('reservations')
      .select('id')
      .eq('rate_plan_id', id)
      .limit(1);

    if (reservations && reservations.length > 0) {
      throw new Error('Cannot delete rate plan that has existing reservations');
    }

    const { data: oldData } = await supabase
      .from('rate_plans')
      .select('*')
      .eq('id', id)
      .single();

    // Delete associated daily rates first
    await supabase
      .from('daily_rates')
      .delete()
      .eq('rate_plan_id', id);

    const { error } = await supabase
      .from('rate_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await auditLogger.log({
      action: 'DELETE',
      entity_type: 'rate_plan',
      entity_id: id,
      old_values: oldData,
    });

    return true;
  },

  // Create default daily rates for a rate plan
  async createDefaultDailyRates(hotelId: string, ratePlanId: string, baseRate: number) {
    // Get all room types for this hotel
    const { data: roomTypes } = await supabase
      .from('room_types')
      .select('id, name')
      .eq('hotel_id', hotelId);

    if (!roomTypes || roomTypes.length === 0) return;

    const dailyRatesData = [];
    
    // Create rates for next 365 days
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Apply seasonal adjustments
      const seasonalMultiplier = this.getSeasonalMultiplier(date);
      const weekendMultiplier = this.getWeekendMultiplier(date);
      
      for (const roomType of roomTypes) {
        // Deluxe rooms get a premium
        const roomTypeMultiplier = roomType.name.toLowerCase().includes('deluxe') ? 1.4 : 1.0;
        const adjustedRate = baseRate * seasonalMultiplier * weekendMultiplier * roomTypeMultiplier;
        
        dailyRatesData.push({
          hotel_id: hotelId,
          room_type_id: roomType.id,
          rate_plan_id: ratePlanId,
          date: dateStr,
          rate: Math.round(adjustedRate * 100) / 100, // Round to 2 decimals
        });
      }
    }

    const { error } = await supabase
      .from('daily_rates')
      .upsert(dailyRatesData, {
        onConflict: 'hotel_id,room_type_id,rate_plan_id,date'
      });

    if (error) {
      console.error('Error creating default daily rates:', error);
    }
  },

  // Get seasonal multiplier based on date
  getSeasonalMultiplier(date: Date): number {
    const month = date.getMonth() + 1; // 1-12
    
    // High season: December, January, July, August
    if ([12, 1, 7, 8].includes(month)) {
      return 1.3;
    }
    
    // Medium season: June, September, November
    if ([6, 9, 11].includes(month)) {
      return 1.1;
    }
    
    // Low season: rest of the year
    return 1.0;
  },

  // Get weekend multiplier
  getWeekendMultiplier(date: Date): number {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Weekend rates (Friday, Saturday)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return 1.2;
    }
    
    return 1.0;
  },

  // Update daily rates for a date range
  async updateDailyRates(
    hotelId: string, 
    roomTypeId: string, 
    ratePlanId: string, 
    dateFrom: string, 
    dateTo: string, 
    newRate: number
  ) {
    const { data, error } = await supabase
      .from('daily_rates')
      .update({ rate: newRate })
      .eq('hotel_id', hotelId)
      .eq('room_type_id', roomTypeId)
      .eq('rate_plan_id', ratePlanId)
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .select();

    if (error) throw error;

    // Log the rate change
    await auditLogger.log({
      action: 'UPDATE',
      entity_type: 'daily_rates',
      entity_id: `${hotelId}-${roomTypeId}-${ratePlanId}`,
      new_values: {
        date_range: `${dateFrom} to ${dateTo}`,
        new_rate: newRate,
        records_updated: data?.length || 0
      },
    });

    return data;
  }
};