import { supabase } from '@/integrations/supabase/client';

export interface BookingRequest {
  hotelId: string;
  roomTypeId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  specialRequests?: string;
  agencyId: string;
  rateQuoted: number;
}

export interface BookingResponse {
  success: boolean;
  reservationId?: string;
  bookingReference?: string;
  error?: string;
}

export const createAgencyBooking = async (bookingData: BookingRequest): Promise<BookingResponse> => {
  try {
    // Call the agency-booking edge function instead
    const { data, error } = await supabase.functions.invoke('agency-booking', {
      body: bookingData
    });

    if (error) {
      console.error('Agency booking failed:', error);
      return { success: false, error: error.message };
    }

    return {
      success: data?.success || false,
      reservationId: data?.reservationId,
      bookingReference: data?.bookingReference
    };
  } catch (error) {
    console.error('Booking service error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

export const checkRealTimeAvailability = async (
  hotelId: string, 
  roomTypeId: string, 
  checkIn: string, 
  checkOut: string
): Promise<{ available: boolean; availableRooms: number }> => {
  try {
    // Get inventory for the date range
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select('allotment, stop_sell, date')
      .eq('hotel_id', hotelId)
      .eq('room_type_id', roomTypeId)
      .gte('date', checkIn)
      .lt('date', checkOut);

    if (invError) throw invError;

    // Get existing reservations for the period
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('check_in, check_out')
      .eq('hotel_id', hotelId)
      .eq('room_type_id', roomTypeId)
      .neq('status', 'Cancelled')
      .or(`check_in.lte.${checkOut},check_out.gte.${checkIn}`);

    if (resError) throw resError;

    if (!inventory || inventory.length === 0) {
      return { available: false, availableRooms: 0 };
    }

    // Check availability for each date in the range
    let minAvailableRooms = Infinity;
    
    for (const inv of inventory) {
      if (inv.stop_sell) {
        return { available: false, availableRooms: 0 };
      }

      // Count reservations that occupy this date
      const bookedRooms = reservations?.filter(res => 
        res.check_in <= inv.date && res.check_out > inv.date
      ).length || 0;

      const availableRooms = inv.allotment - bookedRooms;
      minAvailableRooms = Math.min(minAvailableRooms, availableRooms);
    }

    const finalAvailableRooms = Math.max(0, minAvailableRooms === Infinity ? 0 : minAvailableRooms);
    
    return {
      available: finalAvailableRooms > 0,
      availableRooms: finalAvailableRooms
    };
  } catch (error) {
    console.error('Availability check error:', error);
    return { available: false, availableRooms: 0 };
  }
};

export const getRealTimeRates = async (
  hotelId: string,
  roomTypeId: string,
  checkIn: string,
  checkOut: string
): Promise<{ averageRate: number; totalAmount: number; nights: number }> => {
  try {
    // Get daily rates for the period
    const { data: rates, error } = await supabase
      .from('daily_rates')
      .select('rate, date')
      .eq('hotel_id', hotelId)
      .eq('room_type_id', roomTypeId)
      .gte('date', checkIn)
      .lt('date', checkOut)
      .order('date');

    if (error) throw error;

    if (!rates || rates.length === 0) {
      // Fallback to default rate since no base_price column exists
      const baseRate = 150;
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        averageRate: baseRate,
        totalAmount: baseRate * nights,
        nights
      };
    }

    const totalAmount = rates.reduce((sum, rate) => sum + Number(rate.rate), 0);
    const averageRate = totalAmount / rates.length;
    const nights = rates.length;

    return {
      averageRate,
      totalAmount,
      nights
    };
  } catch (error) {
    console.error('Rate lookup error:', error);
    // Return fallback rates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      averageRate: 150,
      totalAmount: 150 * nights,
      nights
    };
  }
};