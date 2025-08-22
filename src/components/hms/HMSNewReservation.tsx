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
import { ROOM_TYPES, RATE_PLANS } from '@/lib/mock-data';
import { format } from 'date-fns';

const reservationSchema = z.object({
  guestName: z.string().min(2, 'Guest name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone required'),
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
  const { addReservation, rooms, addAuditEntry } = useHMSStore();
  const [activeTab, setActiveTab] = useState('rooms');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState('');
  const [documents, setDocuments] = useState<Array<{id: string; name: string; url: string}>>([]);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ReservationForm>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      adults: '1',
      children: '0',
      source: 'direct'
    }
  });

  const watchedValues = watch();
  const selectedRoomType = ROOM_TYPES.find(rt => rt.id === watchedValues.roomTypeId);
  const availableRooms = rooms.filter(r => 
    r.roomTypeId === watchedValues.roomTypeId && 
    (r.status === 'clean' || r.status === 'dirty')
  );

  // Mock document upload
  const handleDocumentUpload = () => {
    const mockDoc = {
      id: `doc-${Date.now()}`,
      name: `Document_${documents.length + 1}.pdf`,
      url: '#mock-url'
    };
    setDocuments([...documents, mockDoc]);
    toast({ title: 'Document uploaded successfully' });
  };

  const removeDocument = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id));
  };

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

  // Export reservation as PDF/CSV
  const handleExport = (format: 'pdf' | 'csv') => {
    if (!watchedValues.guestName) {
      toast({ title: 'Error', description: 'Please fill required fields first', variant: 'destructive' });
      return;
    }

    const content = format === 'csv' 
      ? `Guest,${watchedValues.guestName}\nEmail,${watchedValues.email}\nCheck-in,${watchedValues.checkIn}\nCheck-out,${watchedValues.checkOut}`
      : `Reservation Draft\nGuest: ${watchedValues.guestName}\nEmail: ${watchedValues.email}`;
    
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservation_draft.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: `${format.toUpperCase()} exported successfully` });
  };

  // Send email
  const handleEmail = () => {
    if (!emailAddress) {
      toast({ title: 'Error', description: 'Email address required', variant: 'destructive' });
      return;
    }
    
    // Mock email send
    setTimeout(() => {
      toast({ title: 'Email sent successfully', description: `Reservation details sent to ${emailAddress}` });
      setEmailAddress('');
    }, 1000);
  };

  // Save reservation
  const onSubmit = (data: ReservationForm) => {
    try {
      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);
      
      const newReservation = {
        code: `RES${Date.now()}`,
        guestName: data.guestName,
        email: data.email,
        phone: data.phone,
        checkIn,
        checkOut,
        nights,
        adults: parseInt(data.adults),
        children: parseInt(data.children || '0'),
        roomTypeId: data.roomTypeId,
        roomType: selectedRoomType?.name || '',
        roomId: selectedRoom || null,
        roomNumber: selectedRoom ? rooms.find(r => r.id === selectedRoom)?.number || null : null,
        rateCode: data.rateCode,
        rate: 120, // Mock rate
        totalAmount: total,
        status: 'confirmed',
        source: data.source,
        notes: data.notes || '',
        balance: total * 0.2, // Mock 20% deposit paid
        createdAt: new Date()
      };

      addReservation(newReservation);
      addAuditEntry('Reservation Created', `New reservation ${newReservation.code} for ${data.guestName}`);
      
      toast({ title: 'Reservation created successfully' });
      
      // Call optional callbacks if provided
      onSave?.();
      
      // Navigate to reservations if used as standalone route, otherwise close modal
      if (onClose) {
        onClose();
      } else {
        navigate('/reservations');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create reservation', variant: 'destructive' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="guests" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Guests
          </TabsTrigger>
          <TabsTrigger value="folio" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Folio
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Notes
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TabsContent value="rooms" className="space-y-4">
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
                      {ROOM_TYPES.map(rt => (
                        <SelectItem key={rt.id} value={rt.id}>
                          {rt.name} - {rt.count} available
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
                      <p className="text-sm text-muted-foreground">No rooms available for selected dates</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Guest Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="guestName">Guest Name</Label>
                  <Input {...register('guestName')} placeholder="Full name" />
                  {errors.guestName && <p className="text-sm text-destructive">{errors.guestName.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input {...register('email')} type="email" placeholder="guest@example.com" />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input {...register('phone')} placeholder="+1 234 567 8900" />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="folio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reservation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rateCode">Rate Plan</Label>
                  <Select onValueChange={(value) => setValue('rateCode', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rate plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {RATE_PLANS.map(rp => (
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
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button type="button" onClick={handleDocumentUpload} variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
                
                {documents.length > 0 && (
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{doc.name}</span>
                        <Button type="button" size="sm" variant="destructive" onClick={() => removeDocument(doc.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
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
          </TabsContent>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button type="button" variant="outline" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Email address"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-48"
                />
                <Button type="button" onClick={handleEmail} variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
              
              <Button type="button" onClick={() => onClose ? onClose() : navigate('/reservations')} variant="outline">
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-primary">
                <Check className="h-4 w-4 mr-2" />
                Save Reservation
              </Button>
            </div>
          </div>
        </form>
      </Tabs>
    </motion.div>
  );
};