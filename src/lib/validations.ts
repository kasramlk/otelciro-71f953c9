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
  if (!checkIn || !checkOut) {
    return 'Both check-in and check-out dates are required';
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkinDate = new Date(checkIn);
  checkinDate.setHours(0, 0, 0, 0);
  
  const checkoutDate = new Date(checkOut);
  checkoutDate.setHours(0, 0, 0, 0);
  
  if (checkinDate < today) {
    return 'Check-in date cannot be in the past';
  }
  
  if (checkoutDate <= checkinDate) {
    return 'Check-out date must be after check-in date';
  }
  
  // Maximum stay validation (e.g., 30 days)
  const maxDays = 30;
  const daysDiff = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > maxDays) {
    return `Maximum stay is ${maxDays} days`;
  }
  
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
    
    // Get inventory allotment for the date range
    const { data: inventoryData, error: invError } = await supabase
      .from('inventory')
      .select('allotment, stop_sell')
      .eq('room_type_id', roomTypeId)
      .gte('date', checkinStr)
      .lt('date', checkoutStr);
    
    if (invError) {
      console.error('Inventory check error:', invError);
      return { available: false, message: 'Unable to check availability' };
    }
    
    // If no inventory data, get physical room count as fallback
    if (!inventoryData || inventoryData.length === 0) {
      const { data: roomCount } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_type_id', roomTypeId);
      
      if (!roomCount || roomCount.length === 0) {
        return { available: false, message: 'No rooms of this type available' };
      }
    } else {
      // Check for stop-sell dates
      const stopSellDates = inventoryData.filter(inv => inv.stop_sell);
      if (stopSellDates.length > 0) {
        return { available: false, message: 'Room type closed for selected dates' };
      }
      
      // Get minimum allotment for the period
      const minAllotment = Math.min(...inventoryData.map(inv => inv.allotment));
      if (minAllotment <= 0) {
        return { available: false, message: 'No inventory available for selected dates' };
      }
    }
    
    // Check existing reservations that overlap
    let reservationQuery = supabase
      .from('reservations')
      .select('id')
      .eq('room_type_id', roomTypeId)
      .lt('check_in', checkoutStr)
      .gt('check_out', checkinStr)
      .neq('status', 'cancelled');
    
    if (excludeReservationId) {
      reservationQuery = reservationQuery.neq('id', excludeReservationId);
    }
    
    const { data: conflictingReservations } = await reservationQuery;
    
    const conflictCount = conflictingReservations?.length || 0;
    const availableAllotment = inventoryData?.[0]?.allotment || 1;
    
    if (conflictCount >= availableAllotment) {
      return {
        available: false,
        message: 'No rooms available for selected dates. Would you like to add to waitlist?'
      };
    }
    
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