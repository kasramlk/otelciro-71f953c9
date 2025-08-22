// Production Supabase Service Layer
// Replaces mock data with real database operations

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { errorHandler } from '@/lib/error-handler';

type Tables = Database['public']['Tables'];

// Type definitions for our entities
export type HotelEntity = Tables['hotels']['Row'];
export type ReservationEntity = Tables['reservations']['Row']; 
export type GuestEntity = Tables['guests']['Row'];
export type RoomEntity = Tables['rooms']['Row'];
export type HousekeepingTaskEntity = Tables['housekeeping_tasks']['Row'];

// Base service class with common error handling and pagination
abstract class BaseService {
  protected async handleOperation<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    context?: string
  ): Promise<T> {
    try {
      const { data, error } = await operation();
      
      if (error) {
        throw errorHandler.handleSupabaseError(error, { operation: context });
      }
      
      if (data === null) {
        throw new Error(`No data found${context ? ` for ${context}` : ''}`);
      }
      
      return data;
    } catch (error) {
      throw errorHandler.handleError(error as Error, { operation: context });
    }
  }

  protected async handleOptionalOperation<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    context?: string
  ): Promise<T | null> {
    try {
      const { data, error } = await operation();
      
      if (error) {
        throw errorHandler.handleSupabaseError(error, { operation: context });
      }
      
      return data;
    } catch (error) {
      throw errorHandler.handleError(error as Error, { operation: context });
    }
  }
}

// Hotels Service
export class HotelService extends BaseService {
  async getCurrentUserHotels(): Promise<HotelEntity[]> {
    return this.handleOperation(
      async () => {
        const result = await supabase
          .from('hotels')
          .select('*')
          .order('created_at', { ascending: false });
        return result;
      },
      'user hotels'
    );
  }

  async getHotelById(id: string): Promise<HotelEntity> {
    return this.handleOperation(
      async () => {
        const result = await supabase
          .from('hotels')
          .select('*')
          .eq('id', id)
          .single();
        return result;
      },
      `hotel ${id}`
    );
  }

  async updateHotel(id: string, updates: Partial<HotelEntity>): Promise<HotelEntity> {
    return this.handleOperation(
      async () => {
        const result = await supabase
          .from('hotels')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        return result;
      },
      `hotel update ${id}`
    );
  }
}

// Reservations Service
export class ReservationService extends BaseService {
  async getReservations(hotelId: string, filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
  }): Promise<ReservationEntity[]> {
    return this.handleOperation(
      async () => {
        let query = supabase
          .from('reservations')
          .select('*')
          .eq('hotel_id', hotelId);

        if (filters?.startDate) {
          query = query.gte('check_in', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('check_out', filters.endDate);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }

        query = query.order('check_in', { ascending: true });

        const result = await query;
        return result;
      },
      'reservations'
    );
  }

  async createReservation(reservation: Tables['reservations']['Insert']): Promise<ReservationEntity> {
    return this.handleOperation(
      async () => {
        const result = await supabase
          .from('reservations')
          .insert(reservation)
          .select()
          .single();
        return result;
      },
      'reservation creation'
    );
  }

  async updateReservation(id: string, updates: Tables['reservations']['Update']): Promise<ReservationEntity> {
    return this.handleOperation(
      async () => {
        const result = await supabase
          .from('reservations')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        return result;
      },
      `reservation update ${id}`
    );
  }

  async deleteReservation(id: string): Promise<void> {
    await this.handleOperation(
      async () => {
        const result = await supabase
          .from('reservations')
          .delete()
          .eq('id', id);
        return result;
      },
      `reservation deletion ${id}`
    );
  }

  async getOccupancyData(hotelId: string, startDate: string, endDate: string) {
    // Get reservations for the date range
    const reservations = await this.getReservations(hotelId, { startDate, endDate });
    
    // Get total rooms for the hotel
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id')
      .eq('hotel_id', hotelId);

    const totalRooms = rooms?.length || 0;
    
    // Calculate occupancy data by date
    const occupancyMap = new Map();
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      occupancyMap.set(dateStr, {
        date: new Date(currentDate),
        occupiedRooms: 0,
        totalRevenue: 0,
        arrivals: 0,
        departures: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Process reservations
    reservations.forEach(reservation => {
      const checkIn = new Date(reservation.check_in);
      const checkOut = new Date(reservation.check_out);
      const currentDate = new Date(checkIn);

      while (currentDate < checkOut) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const occupancyData = occupancyMap.get(dateStr);
        
        if (occupancyData) {
          occupancyData.occupiedRooms++;
          occupancyData.totalRevenue += reservation.rate_amount || 0;
          
          if (currentDate.toDateString() === checkIn.toDateString()) {
            occupancyData.arrivals++;
          }
          if (currentDate.toDateString() === new Date(checkOut.getTime() - 24 * 60 * 60 * 1000).toDateString()) {
            occupancyData.departures++;
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Convert to array and calculate percentages
    return Array.from(occupancyMap.values()).map(data => ({
      ...data,
      totalRooms,
      availableRooms: totalRooms - data.occupiedRooms,
      occupancyRate: totalRooms > 0 ? (data.occupiedRooms / totalRooms) * 100 : 0,
      adr: data.occupiedRooms > 0 ? data.totalRevenue / data.occupiedRooms : 0
    }));
  }
}

// Guests Service
export class GuestService extends BaseService {
  async getGuests(hotelId: string, filters?: {
    search?: string;
    vipOnly?: boolean;
    limit?: number;
  }): Promise<GuestEntity[]> {
    let query = supabase
      .from('guests')
      .select('*')
      .eq('hotel_id', hotelId);

    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('created_at', { ascending: false });

    return this.handleOperation(() => query, 'guests');
  }

  async createGuest(guest: Omit<GuestEntity, 'id' | 'created_at' | 'updated_at'>): Promise<GuestEntity> {
    return this.handleOperation(
      () => supabase
        .from('guests')
        .insert(guest)
        .select()
        .single(),
      'guest creation'
    );
  }

  async updateGuest(id: string, updates: Partial<GuestEntity>): Promise<GuestEntity> {
    return this.handleOperation(
      () => supabase
        .from('guests')
        .update(updates)
        .eq('id', id)
        .select()
        .single(),
      `guest update ${id}`
    );
  }
}

// Rooms Service  
export class RoomService extends BaseService {
  async getRooms(hotelId: string): Promise<RoomEntity[]> {
    return this.handleOperation(
      () => supabase
        .from('rooms') 
        .select('*')
        .eq('hotel_id', hotelId)
        .order('number', { ascending: true }),
      'rooms'
    );
  }

  async updateRoomStatus(id: string, status: string, notes?: string): Promise<RoomEntity> {
    return this.handleOperation(
      () => supabase
        .from('rooms')
        .update({ 
          status,
          notes: notes || undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single(),
      `room status update ${id}`
    );
  }
}

// Housekeeping Service
export class HousekeepingService extends BaseService {
  async getTasks(hotelId: string, filters?: {
    status?: string;
    assignedTo?: string;
    roomId?: string;
  }): Promise<HousekeepingTaskEntity[]> {
    let query = supabase
      .from('housekeeping_tasks')
      .select(`
        *,
        room:rooms(*)
      `)
      .eq('hotel_id', hotelId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    if (filters?.roomId) {
      query = query.eq('room_id', filters.roomId);
    }

    query = query.order('created_at', { ascending: false });

    return this.handleOperation(() => query, 'housekeeping tasks');
  }

  async createTask(task: Omit<HousekeepingTaskEntity, 'id' | 'created_at' | 'updated_at'>): Promise<HousekeepingTaskEntity> {
    return this.handleOperation(
      () => supabase
        .from('housekeeping_tasks')
        .insert(task)
        .select()
        .single(),
      'housekeeping task creation'
    );
  }

  async updateTask(id: string, updates: Partial<HousekeepingTaskEntity>): Promise<HousekeepingTaskEntity> {
    return this.handleOperation(
      () => supabase
        .from('housekeeping_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single(),
      `housekeeping task update ${id}`
    );
  }
}

// Analytics Service
export class AnalyticsService extends BaseService {
  async getKPIData(hotelId: string, startDate: string, endDate: string) {
    const reservationService = new ReservationService();
    const occupancyData = await reservationService.getOccupancyData(hotelId, startDate, endDate);
    
    const totalRevenue = occupancyData.reduce((sum, day) => sum + day.totalRevenue, 0);
    const totalOccupiedRoomNights = occupancyData.reduce((sum, day) => sum + day.occupiedRooms, 0);
    const totalRoomNights = occupancyData.reduce((sum, day) => sum + day.totalRooms, 0);
    
    const avgOccupancyRate = totalRoomNights > 0 ? (totalOccupiedRoomNights / totalRoomNights) * 100 : 0;
    const adr = totalOccupiedRoomNights > 0 ? totalRevenue / totalOccupiedRoomNights : 0;
    const revPAR = totalRoomNights > 0 ? totalRevenue / totalRoomNights : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgOccupancyRate: Math.round(avgOccupancyRate * 100) / 100,
      adr: Math.round(adr * 100) / 100,
      revPAR: Math.round(revPAR * 100) / 100,
      totalArrivals: occupancyData.reduce((sum, day) => sum + day.arrivals, 0),
      totalDepartures: occupancyData.reduce((sum, day) => day.departures, 0),
      occupancyData
    };
  }

  async getChannelPerformance(hotelId: string, period: string) {
    // Get reservations grouped by source/channel
    const reservations = await supabase
      .from('reservations')
      .select('source, total_amount, status')
      .eq('hotel_id', hotelId)
      .gte('created_at', new Date(Date.now() - (period === 'month' ? 30 : 7) * 24 * 60 * 60 * 1000).toISOString());

    if (!reservations.data) return [];

    const channelStats = reservations.data.reduce((acc: any, res: any) => {
      const channel = res.source || 'Direct';
      if (!acc[channel]) {
        acc[channel] = { 
          channel, 
          reservations: 0, 
          revenue: 0, 
          confirmed: 0,
          cancelled: 0 
        };
      }
      
      acc[channel].reservations++;
      acc[channel].revenue += res.total_amount || 0;
      
      if (res.status === 'confirmed') acc[channel].confirmed++;
      if (res.status === 'cancelled') acc[channel].cancelled++;
      
      return acc;
    }, {});

    return Object.values(channelStats);
  }
}

// Service instances - Singleton pattern
export const hotelService = new HotelService();
export const reservationService = new ReservationService();
export const guestService = new GuestService();
export const roomService = new RoomService();
export const housekeepingService = new HousekeepingService();
export const analyticsService = new AnalyticsService();

// Export all services as a single object for easy import
export const services = {
  hotel: hotelService,
  reservation: reservationService,
  guest: guestService,
  room: roomService,
  housekeeping: housekeepingService,
  analytics: analyticsService
};
