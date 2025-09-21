import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

export const InventoryUpdateSchema = z.object({
  hotel_id: z.string().uuid(),
  room_type_id: z.string().uuid(),
  date_from: z.string().date(),
  date_to: z.string().date(),
  allotment: z.number().min(0).optional(),
  min_stay: z.number().min(1).optional(),
  max_stay: z.number().min(1).optional(),
  closed_to_arrival: z.boolean().optional(),
  closed_to_departure: z.boolean().optional(),
  stop_sell: z.boolean().optional(),
});

export type InventoryUpdateData = z.infer<typeof InventoryUpdateSchema>;

export interface InventoryStatus {
  date: string;
  allotment: number;
  booked: number;
  available: number;
  min_stay: number;
  max_stay: number;
  closed_to_arrival: boolean;
  closed_to_departure: boolean;
  stop_sell: boolean;
  occupancy_percentage: number;
}

export interface OverbookingAlert {
  room_type_id: string;
  date: string;
  available: number;
  booked: number;
  overbooking_count: number;
  severity: 'warning' | 'critical';
}

export class InventoryService {
  /**
   * Get inventory status for a date range
   */
  public static async getInventoryStatus(
    hotelId: string,
    roomTypeId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<{ success: boolean; data?: InventoryStatus[]; errors?: string[] }> {
    try {
      // Get inventory records
      const { data: inventory, error: invError } = await supabase
        .from('inventory')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('room_type_id', roomTypeId)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date');

      if (invError) throw invError;

      // Get reservations for the same period
      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select('check_in, check_out, status')
        .eq('hotel_id', hotelId)
        .eq('room_type_id', roomTypeId)
        .in('status', ['Confirmed', 'In House', 'Booked'])
        .or(`and(check_in.lte.${dateTo},check_out.gt.${dateFrom})`);

      if (resError) throw resError;

      // Process inventory status for each date
      const statusData: InventoryStatus[] = [];
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);

      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        
        // Find inventory record for this date
        const invRecord = inventory?.find(inv => inv.date === dateStr);
        const allotment = invRecord?.allotment || 0;

        // Count bookings for this date
        const bookingsForDate = reservations?.filter(res => {
          const checkIn = new Date(res.check_in);
          const checkOut = new Date(res.check_out);
          return checkIn <= date && checkOut > date;
        }).length || 0;

        const available = Math.max(0, allotment - bookingsForDate);
        const occupancyPercentage = allotment > 0 ? (bookingsForDate / allotment) * 100 : 0;

        statusData.push({
          date: dateStr,
          allotment,
          booked: bookingsForDate,
          available,
          min_stay: invRecord?.min_stay || 1,
          max_stay: invRecord?.max_stay || 30,
          closed_to_arrival: invRecord?.closed_to_arrival || false,
          closed_to_departure: invRecord?.closed_to_departure || false,
          stop_sell: invRecord?.stop_sell || false,
          occupancy_percentage: Math.round(occupancyPercentage * 100) / 100
        });
      }

      return { success: true, data: statusData };

    } catch (error) {
      console.error('Get inventory status error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to get inventory status']
      };
    }
  }

  /**
   * Update inventory for a date range
   */
  public static async updateInventory(
    updateData: InventoryUpdateData
  ): Promise<{ success: boolean; updated_dates?: string[]; errors?: string[] }> {
    try {
      // Validate input
      const validationResult = InventoryUpdateSchema.safeParse(updateData);
      if (!validationResult.success) {
        return {
          success: false,
          errors: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }

      const validData = validationResult.data;
      const updatedDates: string[] = [];

      // Generate dates between from and to
      const startDate = new Date(validData.date_from);
      const endDate = new Date(validData.date_to);

      const updatePromises = [];

      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        
        // Prepare update data (exclude date range fields)
        const updateFields = {
          hotel_id: validData.hotel_id,
          room_type_id: validData.room_type_id,
          date: dateStr,
          updated_at: new Date().toISOString(),
          ...(validData.allotment !== undefined && { allotment: validData.allotment }),
          ...(validData.min_stay !== undefined && { min_stay: validData.min_stay }),
          ...(validData.max_stay !== undefined && { max_stay: validData.max_stay }),
          ...(validData.closed_to_arrival !== undefined && { closed_to_arrival: validData.closed_to_arrival }),
          ...(validData.closed_to_departure !== undefined && { closed_to_departure: validData.closed_to_departure }),
          ...(validData.stop_sell !== undefined && { stop_sell: validData.stop_sell }),
        };

        // Use upsert to handle existing records
        const updatePromise = supabase
          .from('inventory')
          .upsert(updateFields, { 
            onConflict: 'hotel_id,room_type_id,date',
            ignoreDuplicates: false 
          })
          .then(() => {
            updatedDates.push(dateStr);
          });

        updatePromises.push(updatePromise);
      }

      await Promise.all(updatePromises);

      // Queue rate push for channels if inventory changed
      if (validData.allotment !== undefined || validData.stop_sell !== undefined) {
        await this.queueInventorySync(
          validData.hotel_id,
          validData.room_type_id,
          validData.date_from,
          validData.date_to
        );
      }

      return {
        success: true,
        updated_dates: updatedDates
      };

    } catch (error) {
      console.error('Update inventory error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to update inventory']
      };
    }
  }

  /**
   * Check for overbooking situations
   */
  public static async checkOverbooking(
    hotelId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<{ success: boolean; alerts?: OverbookingAlert[]; errors?: string[] }> {
    try {
      // Get all room types for the hotel
      const { data: roomTypes, error: roomTypesError } = await supabase
        .from('room_types')
        .select('id, name')
        .eq('hotel_id', hotelId);

      if (roomTypesError) throw roomTypesError;

      const alerts: OverbookingAlert[] = [];

      for (const roomType of roomTypes || []) {
        const inventoryStatus = await this.getInventoryStatus(
          hotelId,
          roomType.id,
          dateFrom,
          dateTo
        );

        if (inventoryStatus.success && inventoryStatus.data) {
          for (const status of inventoryStatus.data) {
            if (status.available < 0) {
              alerts.push({
                room_type_id: roomType.id,
                date: status.date,
                available: status.available,
                booked: status.booked,
                overbooking_count: Math.abs(status.available),
                severity: Math.abs(status.available) > 2 ? 'critical' : 'warning'
              });
            }
          }
        }
      }

      return { success: true, alerts };

    } catch (error) {
      console.error('Check overbooking error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to check overbooking']
      };
    }
  }

  /**
   * Automatically adjust inventory based on booking patterns
   */
  public static async autoAdjustInventory(
    hotelId: string,
    roomTypeId: string,
    analysisDate: string,
    lookbackDays = 30
  ): Promise<{ success: boolean; adjustments?: any[]; errors?: string[] }> {
    try {
      const lookbackDate = new Date(analysisDate);
      lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

      // Analyze booking patterns
      const { data: historicalData, error } = await supabase
        .from('reservations')
        .select('check_in, check_out, created_at, status')
        .eq('hotel_id', hotelId)
        .eq('room_type_id', roomTypeId)
        .gte('created_at', lookbackDate.toISOString())
        .in('status', ['Confirmed', 'In House', 'Checked Out']);

      if (error) throw error;

        const bookingsByDay: Record<string, number> = {};
        historicalData?.forEach(reservation => {
          const bookingDate = reservation.created_at.split('T')[0];
          bookingsByDay[bookingDate] = (bookingsByDay[bookingDate] || 0) + 1;
        });

        const totalBookings = Object.values(bookingsByDay).reduce((sum, count) => sum + count, 0);
        const avgBookingsPerDay = totalBookings / Math.max(Object.keys(bookingsByDay).length, 1);

      // Get current inventory settings
      const currentInventory = await this.getInventoryStatus(
        hotelId,
        roomTypeId,
        analysisDate,
        analysisDate
      );

      if (!currentInventory.success || !currentInventory.data?.[0]) {
        throw new Error('Could not get current inventory data');
      }

      const current = currentInventory.data[0];
      const adjustments = [];

      // Suggest inventory adjustments based on patterns
      if (current.occupancy_percentage > 90 && avgBookingsPerDay > 2) {
        // High demand - consider increasing allotment or enabling overbooking
        adjustments.push({
          type: 'increase_allotment',
          current_allotment: current.allotment,
          suggested_allotment: current.allotment + 1,
          reason: 'High demand detected'
        });
      } else if (current.occupancy_percentage < 50 && avgBookingsPerDay < 0.5) {
        // Low demand - consider reducing allotment
        adjustments.push({
          type: 'decrease_allotment',
          current_allotment: current.allotment,
          suggested_allotment: Math.max(1, current.allotment - 1),
          reason: 'Low demand detected'
        });
      }

      return { success: true, adjustments };

    } catch (error) {
      console.error('Auto adjust inventory error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to auto adjust inventory']
      };
    }
  }

  /**
   * Queue inventory synchronization with channels
   */
  private static async queueInventorySync(
    hotelId: string,
    roomTypeId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<void> {
    try {
      // Find default rate plan for pushing inventory
      const { data: defaultRatePlan } = await supabase
        .from('rate_plans')
        .select('id')
        .eq('hotel_id', hotelId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (defaultRatePlan) {
        await supabase.from('rate_push_queue').insert({
          hotel_id: hotelId,
          room_type_id: roomTypeId,
          rate_plan_id: defaultRatePlan.id,
          date_from: dateFrom,
          date_to: dateTo,
          push_type: 'availability',
          priority: 2, // Medium priority
          status: 'pending',
          scheduled_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to queue inventory sync:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Generate inventory report
   */
  public static async generateInventoryReport(
    hotelId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<{ success: boolean; report?: any; errors?: string[] }> {
    try {
      // Get all room types
      const { data: roomTypes, error: roomTypesError } = await supabase
        .from('room_types')
        .select('id, name, code')
        .eq('hotel_id', hotelId);

      if (roomTypesError) throw roomTypesError;

      const reportData = {};

      for (const roomType of roomTypes || []) {
        const inventoryStatus = await this.getInventoryStatus(
          hotelId,
          roomType.id,
          dateFrom,
          dateTo
        );

        if (inventoryStatus.success && inventoryStatus.data) {
          reportData[roomType.id] = {
            room_type_name: roomType.name,
            room_type_code: roomType.code,
            daily_status: inventoryStatus.data,
            summary: {
              total_days: inventoryStatus.data.length,
              avg_occupancy: inventoryStatus.data.reduce((sum, day) => sum + day.occupancy_percentage, 0) / inventoryStatus.data.length,
              total_room_nights: inventoryStatus.data.reduce((sum, day) => sum + day.allotment, 0),
              total_bookings: inventoryStatus.data.reduce((sum, day) => sum + day.booked, 0),
              overbooking_days: inventoryStatus.data.filter(day => day.available < 0).length,
              stop_sell_days: inventoryStatus.data.filter(day => day.stop_sell).length
            }
          };
        }
      }

      return { success: true, report: reportData };

    } catch (error) {
      console.error('Generate inventory report error:', error);
      return {
        success: false,
        errors: [error.message || 'Failed to generate inventory report']
      };
    }
  }
}