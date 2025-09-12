import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Receipt, FileText, StickyNote, Check, X, Upload, Download, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useHMSStore } from '@/stores/hms-store';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const reservationSchema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  checkIn: z.string().min(1, 'Check-in date required'),
  checkOut: z.string().min(1, 'Check-out date required'),
  adults: z.string().min(1, 'Adults required'),
  children: z.string(),
  roomTypeId: z.string().min(1, 'Room type required'),
  rateCode: z.string().min(1, 'Rate plan required'),
  source: z.string().min(1, 'Source required'),
  notes: z.string().optional()
});

type ReservationForm = z.infer<typeof reservationSchema>;

interface HMSNewReservationProps {
  onClose?: () => void;
  onSave?: () => void;
}

export const HMSNewReservation = ({ onClose, onSave }: HMSNewReservationProps = {} as HMSNewReservationProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedHotelId } = useHMSStore();

  // Get current hotel
  const { data: currentHotel } = useQuery({
    queryKey: ['hotel', selectedHotelId],
    queryFn: async () => {
      if (!selectedHotelId) return null;
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', selectedHotelId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedHotelId
  });
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ReservationForm>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      adults: '1',
      children: '0',
      source: 'direct'
    }
  });

  const watchedValues = watch();
  // Fetch room types and rate plans from database
  const { data: roomTypes = [] } = useQuery({
    queryKey: ['room-types', currentHotel?.id],
    queryFn: async () => {
      if (!currentHotel?.id) return [];
      const { data, error } = await supabase
        .from('room_types')
        .select('id, name, code, capacity_adults, capacity_children')
        .eq('hotel_id', currentHotel.id);
      if (error) throw error;
      return data;
    },
    enabled: !!currentHotel?.id
  });

  const { data: ratePlans = [] } = useQuery({
    queryKey: ['rate-plans', currentHotel?.id],
    queryFn: async () => {
      if (!currentHotel?.id) return [];
      const { data, error } = await supabase
        .from('rate_plans')
        .select('id, name, code')
        .eq('hotel_id', currentHotel.id);
      if (error) throw error;
      return data;
    },
    enabled: !!currentHotel?.id
  });

  // Load rooms from database instead of store
  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms', currentHotel?.id],
    queryFn: async () => {
      if (!currentHotel?.id) return [];
      const { data, error } = await supabase
        .from('rooms')
        .select('id, number, status, room_type_id, floor')
        .eq('hotel_id', currentHotel.id);
      if (error) throw error;
      // Map database field to match expected interface
      return data.map(room => ({
        ...room,
        roomTypeId: room.room_type_id
      }));
    },
    enabled: !!currentHotel?.id
  });

  const selectedRoomType = roomTypes.find(rt => rt.id === watchedValues.roomTypeId);
  const availableRooms = rooms.filter(r => 
    r.roomTypeId === watchedValues.roomTypeId
  );


  // Calculate nights and total
  const calculateDetails = () => {
    if (!watchedValues.checkIn || !watchedValues.checkOut) return { nights: 0, total: 0 };
    
    const checkIn = new Date(watchedValues.checkIn);
    const checkOut = new Date(watchedValues.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const baseRate = 120; // Mock rate
    const total = nights * baseRate;
    
    return { nights, total };
  };

  const { nights, total } = calculateDetails();


  // Save reservation to database
  const onSubmit = async (data: ReservationForm) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!currentHotel?.id) {
        throw new Error('Hotel not selected');
      }

      // First, create the guest
      const { data: guest, error: guestError } = await supabase
        .from('guests')
        .insert({
          hotel_id: currentHotel.id,
          first_name: data.firstName,
          last_name: data.lastName,
          email: null, // Optional field
          phone: null  // Optional field
        })
        .select()
        .single();

      if (guestError) throw guestError;

      // Find the selected rate plan
      const selectedRatePlan = ratePlans.find(rp => rp.code === data.rateCode);
      if (!selectedRatePlan) {
        throw new Error('Rate plan not found');
      }

      // Create the reservation
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          hotel_id: currentHotel.id,
          guest_id: guest.id,
          room_type_id: data.roomTypeId,
          room_id: selectedRoom || null,
          rate_plan_id: selectedRatePlan.id,
          check_in: data.checkIn,
          check_out: data.checkOut,
          adults: parseInt(data.adults),
          children: parseInt(data.children || '0'),
          total_price: total,
          total_amount: total,
          balance_due: total * 0.8, // 80% balance due
          deposit_amount: total * 0.2, // 20% deposit
          currency: 'EUR',
          status: 'Booked',
          source: data.source,
          notes: data.notes || null,
          code: `RES${Date.now()}`
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      toast({ 
        title: 'Success', 
        description: `Reservation ${reservation.code} created for ${data.firstName} ${data.lastName}` 
      });
      
      // Call optional callbacks if provided
      onSave?.();
      
      // Navigate to reservations if used as standalone route, otherwise close modal
      if (onClose) {
        onClose();
      } else {
        navigate('/reservations');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to create reservation', 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Guest Information */}
        <Card>
          <CardHeader>
            <CardTitle>Guest Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input {...register('firstName')} placeholder="First name" />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input {...register('lastName')} placeholder="Last name" />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Room Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkIn">Check-in Date</Label>
                <Input {...register('checkIn')} type="date" />
                {errors.checkIn && <p className="text-sm text-destructive">{errors.checkIn.message}</p>}
              </div>
              <div>
                <Label htmlFor="checkOut">Check-out Date</Label>
                <Input {...register('checkOut')} type="date" />
                {errors.checkOut && <p className="text-sm text-destructive">{errors.checkOut.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="adults">Adults</Label>
                <Select onValueChange={(value) => setValue('adults', value)} defaultValue="1">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="children">Children</Label>
                <Select onValueChange={(value) => setValue('children', value)} defaultValue="0">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0,1,2,3].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nights</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted">
                  {nights}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="roomTypeId">Room Type</Label>
              <Select onValueChange={(value) => setValue('roomTypeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map(rt => (
                    <SelectItem key={rt.id} value={rt.id}>
                      {rt.name} ({rt.code}) - Max: {rt.capacity_adults + (rt.capacity_children || 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roomTypeId && <p className="text-sm text-destructive">{errors.roomTypeId.message}</p>}
            </div>

            {selectedRoomType && (
              <div>
                <Label>Available Rooms</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {availableRooms.map(room => (
                    <Button
                      key={room.id}
                      type="button"
                      variant={selectedRoom === room.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedRoom(room.id)}
                      className="flex flex-col items-center p-2"
                    >
                      <span className="font-medium">{room.number}</span>
                      <Badge variant={room.status === 'clean' ? 'default' : 'secondary'} className="text-xs">
                        {room.status}
                      </Badge>
                    </Button>
                  ))}
                </div>
                {availableRooms.length === 0 && (
                  <p className="text-sm text-muted-foreground">No rooms of this type available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rate Plan & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Plan & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rateCode">Rate Plan</Label>
              <Select onValueChange={(value) => setValue('rateCode', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rate plan" />
                </SelectTrigger>
                <SelectContent>
                  {ratePlans.map(rp => (
                    <SelectItem key={rp.id} value={rp.code}>
                      {rp.name} ({rp.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rateCode && <p className="text-sm text-destructive">{errors.rateCode.message}</p>}
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Room Rate (per night):</span>
                <span>€120.00</span>
              </div>
              <div className="flex justify-between">
                <span>Nights:</span>
                <span>{nights}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Total Amount:</span>
                <span>€{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Balance Due:</span>
                <span>€{(total * 0.8).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="source">Booking Source</Label>
              <Select onValueChange={(value) => setValue('source', value)} defaultValue="direct">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="booking.com">Booking.com</SelectItem>
                  <SelectItem value="expedia">Expedia</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="walk-in">Walk-in</SelectItem>
                </SelectContent>
              </Select>
              {errors.source && <p className="text-sm text-destructive">{errors.source.message}</p>}
            </div>

            <div>
              <Label htmlFor="notes">Special Requests / Notes</Label>
              <Textarea {...register('notes')} placeholder="Any special requests or notes..." rows={4} />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-6 border-t">
          <Button 
            type="button" 
            onClick={() => onClose ? onClose() : navigate('/reservations')} 
            variant="outline"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-gradient-primary"
            disabled={isSubmitting}
          >
            <Check className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Save Reservation'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};