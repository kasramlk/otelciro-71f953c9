import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Please enter a valid email address');
export const phoneSchema = z.string().min(10, 'Phone number must be at least 10 digits');
export const requiredStringSchema = z.string().min(1, 'This field is required');

// Date validation helpers
export const isValidDateRange = (checkIn: Date, checkOut: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkinDate = new Date(checkIn);
  checkinDate.setHours(0, 0, 0, 0);
  
  const checkoutDate = new Date(checkOut);
  checkoutDate.setHours(0, 0, 0, 0);
  
  // Check-in cannot be in the past
  if (checkinDate < today) {
    return false;
  }
  
  // Check-out must be after check-in
  if (checkoutDate <= checkinDate) {
    return false;
  }
  
  return true;
};

export const getDateValidationError = (checkIn: Date | undefined, checkOut: Date | undefined): string | null => {
  console.log('🔍 getDateValidationError called with:', {
    checkIn,
    checkOut,
    checkInType: typeof checkIn,
    checkOutType: typeof checkOut,
    checkInISO: checkIn?.toISOString(),
    checkOutISO: checkOut?.toISOString()
  });

  if (!checkIn || !checkOut) {
    console.log('❌ Date validation: Missing dates');
    return 'Both check-in and check-out dates are required';
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  console.log('🔍 Today date for comparison:', {
    today,
    todayISO: today.toISOString()
  });
  
  const checkinDate = new Date(checkIn);
  checkinDate.setHours(0, 0, 0, 0);
  
  const checkoutDate = new Date(checkOut);
  checkoutDate.setHours(0, 0, 0, 0);
  
  console.log('🔍 Normalized dates for comparison:', {
    checkinDate,
    checkoutDate,
    checkinDateISO: checkinDate.toISOString(),
    checkoutDateISO: checkoutDate.toISOString(),
    todayTime: today.getTime(),
    checkinTime: checkinDate.getTime(),
    isPast: checkinDate < today
  });
  
  if (checkinDate < today) {
    console.log('❌ Date validation: Check-in is in the past');
    return 'Check-in date cannot be in the past';
  }
  
  if (checkoutDate <= checkinDate) {
    console.log('❌ Date validation: Check-out not after check-in');
    return 'Check-out date must be after check-in date';
  }
  
  // Maximum stay validation (e.g., 30 days)
  const maxDays = 30;
  const daysDiff = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
  
  console.log('🔍 Stay days calculation:', {
    daysDiff,
    maxDays,
    isExceeded: daysDiff > maxDays
  });
  
  if (daysDiff > maxDays) {
    console.log('❌ Date validation: Stay too long');
    return `Maximum stay is ${maxDays} days`;
  }
  
  console.log('✅ Date validation passed');
  return null;
};

// Guest validation schema
export const guestValidationSchema = z.object({
  firstName: requiredStringSchema,
  lastName: requiredStringSchema,
  email: emailSchema,
  phone: phoneSchema,
  nationality: z.string().optional(),
  idNumber: z.string().optional(),
  company: z.string().optional(),
  isVIP: z.boolean().optional(),
  loyaltyNumber: z.string().optional(),
});

// Reservation validation schema
export const reservationValidationSchema = z.object({
  checkIn: z.date({
    required_error: 'Check-in date is required',
    invalid_type_error: 'Invalid check-in date',
  }),
  checkOut: z.date({
    required_error: 'Check-out date is required',
    invalid_type_error: 'Invalid check-out date',
  }),
  adults: z.number().min(1, 'At least 1 adult is required').max(10, 'Maximum 10 adults allowed'),
  children: z.number().min(0, 'Children cannot be negative').max(10, 'Maximum 10 children allowed'),
  roomType: requiredStringSchema,
  ratePlan: z.string().optional(),
  specialRequests: z.string().optional(),
  arrivalTime: z.string().optional(),
  departureTime: z.string().optional(),
});

// Billing validation schema
export const billingValidationSchema = z.object({
  source: requiredStringSchema,
  channel: z.string().optional(),
  paymentMethod: requiredStringSchema,
  depositAmount: z.number().min(0, 'Deposit cannot be negative'),
  notes: z.string().optional(),
  sendConfirmation: z.boolean().optional(),
  marketingConsent: z.boolean().optional(),
});

// Complete reservation validation
export const completeReservationSchema = guestValidationSchema
  .merge(reservationValidationSchema)
  .merge(billingValidationSchema)
  .refine(
    (data) => isValidDateRange(data.checkIn, data.checkOut),
    {
      message: 'Invalid date range',
      path: ['checkOut'],
    }
  );

// Currency validation
export const currencySchema = z.object({
  code: z.string().length(3, 'Currency code must be 3 characters'),
  amount: z.number().positive('Amount must be positive'),
});

// Rate validation
export const rateValidationSchema = z.object({
  baseRate: z.number().min(0, 'Base rate cannot be negative'),
  currency: z.string().length(3, 'Invalid currency code'),
  taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%'),
  serviceChargeRate: z.number().min(0, 'Service charge cannot be negative').max(100, 'Service charge cannot exceed 100%'),
});

// Business rule validations
export const validateOccupancy = (adults: number, children: number, roomCapacity: number): string | null => {
  const totalGuests = adults + children;
  if (totalGuests > roomCapacity) {
    return `Room capacity (${roomCapacity}) exceeded. Total guests: ${totalGuests}`;
  }
  return null;
};

export const validateRoomAvailability = async (
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
  excludeReservationId?: string
): Promise<{ available: boolean; message?: string }> => {
  try {
    // Import supabase here to avoid circular dependency
    const { supabase } = await import('@/integrations/supabase/client');
    
    const checkinStr = checkIn.toISOString().split('T')[0];
    const checkoutStr = checkOut.toISOString().split('T')[0];
    
    console.log('🔍 Availability Check Started:', { 
      roomTypeId, 
      checkinStr, 
      checkoutStr,
      checkInOriginal: checkIn,
      checkOutOriginal: checkOut,
      typeof_checkIn: typeof checkIn,
      typeof_checkOut: typeof checkOut
    });
    
    // Calculate number of nights (hotel industry standard)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    console.log('🔍 Nights calculation:', nights);
    
    // Generate array of dates for each night of stay
    const stayDates: string[] = [];
    for (let i = 0; i < nights; i++) {
      const date = new Date(checkIn);
      date.setDate(date.getDate() + i);
      stayDates.push(date.toISOString().split('T')[0]);
    }
    console.log('🔍 Stay dates required:', stayDates);
    
    // Get inventory for all nights of the stay
    const { data: inventoryData, error: invError } = await supabase
      .from('room_inventory')
      .select('date, allotment, stop_sell')
      .eq('room_type_id', roomTypeId)
      .in('date', stayDates);
    
    console.log('🔍 Inventory query result:', { inventoryData, invError, stayDates });
    
    if (invError) {
      console.error('❌ Inventory check error:', invError);
      return { available: false, message: 'Unable to check availability' };
    }
    
    // Check if we have inventory for all required dates
    const inventoryByDate = new Map(inventoryData?.map(inv => [inv.date, inv]) || []);
    const missingDates = stayDates.filter(date => !inventoryByDate.has(date));
    
    console.log('🔍 Inventory analysis:', { 
      inventoryByDate: Object.fromEntries(inventoryByDate), 
      missingDates 
    });
    
    // If missing inventory for any date, check physical room count as fallback
    if (missingDates.length > 0) {
      console.log('⚠️ Missing inventory for dates:', missingDates, '- checking physical rooms');
      
      const { data: roomCount } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_type_id', roomTypeId);
      
      console.log('🔍 Physical rooms found:', roomCount?.length || 0);
      
      if (!roomCount || roomCount.length === 0) {
        return { available: false, message: 'No rooms of this type exist' };
      }
      
      // Use physical room count as default allotment for missing dates
      const physicalRoomCount = roomCount.length;
      for (const missingDate of missingDates) {
        inventoryByDate.set(missingDate, { 
          date: missingDate, 
          allotment: physicalRoomCount, 
          stop_sell: false 
        });
      }
      
      console.log('🔍 Updated inventory with physical rooms:', Object.fromEntries(inventoryByDate));
    }
    
    // Check for stop-sell dates
    const stopSellDates = Array.from(inventoryByDate.values()).filter(inv => inv.stop_sell);
    if (stopSellDates.length > 0) {
      console.log('❌ Stop-sell found for dates:', stopSellDates.map(d => d.date));
      return { available: false, message: 'Room type closed for selected dates' };
    }
    
    // Get existing overlapping reservations
    let reservationQuery = supabase
      .from('reservations')
      .select('id, check_in, check_out')
      .eq('room_type_id', roomTypeId)
      .lt('check_in', checkoutStr)
      .gt('check_out', checkinStr)
      .neq('status', 'cancelled');
    
    if (excludeReservationId) {
      reservationQuery = reservationQuery.neq('id', excludeReservationId);
    }
    
    const { data: conflictingReservations, error: resError } = await reservationQuery;
    
    if (resError) {
      console.error('❌ Reservation check error:', resError);
      return { available: false, message: 'Unable to check existing reservations' };
    }
    
    console.log('🔍 Conflicting reservations:', conflictingReservations);
    
    // For each night, check if we have enough rooms
    for (const date of stayDates) {
      const inventory = inventoryByDate.get(date);
      if (!inventory) continue;
      
      // Count reservations that include this specific night
      const reservationsForDate = conflictingReservations?.filter(res => {
        const resCheckIn = res.check_in;
        const resCheckOut = res.check_out;
        return date >= resCheckIn && date < resCheckOut;
      }).length || 0;
      
      const availableRooms = inventory.allotment - reservationsForDate;
      
      console.log(`🔍 Date ${date}:`, {
        allotment: inventory.allotment,
        reservations: reservationsForDate,
        available: availableRooms
      });
      
      if (availableRooms <= 0) {
        return {
          available: false,
          message: `No rooms available for ${date}. ${reservationsForDate} of ${inventory.allotment} rooms already booked.`
        };
      }
    }
    
    console.log('✅ Availability check passed for all dates');
    return { available: true };
    
  } catch (error) {
    console.error('Availability validation error:', error);
    return { available: false, message: 'Unable to check availability' };
  }
};

// Financial calculations
export const calculateStayAmount = (
  nights: number,
  baseRate: number,
  taxRate: number = 0,
  serviceChargeRate: number = 0
): {
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  total: number;
} => {
  const subtotal = nights * baseRate;
  const taxAmount = subtotal * (taxRate / 100);
  const serviceChargeAmount = subtotal * (serviceChargeRate / 100);
  const total = subtotal + taxAmount + serviceChargeAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    serviceChargeAmount: Math.round(serviceChargeAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

// Sanitization utilities
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/[<>]/g, ''); // Remove < and > characters
};

export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as any)[key] = sanitizeInput(sanitized[key] as string);
    }
  }
  
  return sanitized;
};