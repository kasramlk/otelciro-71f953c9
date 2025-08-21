import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BedDouble, 
  Users, 
  Calendar,
  ArrowRight,
  AlertCircle
} from "lucide-react";

const roomMoveSchema = z.object({
  newRoomId: z.string().min(1, "Please select a room"),
  reason: z.string().min(1, "Please provide a reason for the room move"),
  effectiveDate: z.string().min(1, "Please select an effective date"),
  notifyGuest: z.boolean().default(true),
});

type RoomMoveData = z.infer<typeof roomMoveSchema>;

interface RoomMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: {
    id: string;
    code: string;
    guestName: string;
    currentRoomNumber: string;
    currentRoomType: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
  };
}

export default function RoomMoveDialog({ 
  open, 
  onOpenChange, 
  reservation 
}: RoomMoveDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RoomMoveData>({
    resolver: zodResolver(roomMoveSchema),
    defaultValues: {
      effectiveDate: new Date().toISOString().split('T')[0],
      notifyGuest: true,
    },
  });

  // Fetch available rooms of same type
  const { data: availableRooms = [] } = useQuery({
    queryKey: ['available-rooms', reservation.roomTypeId, reservation.checkIn, reservation.checkOut],
    queryFn: async () => {
      // Get all rooms of the same type - using existing schema
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_type_id', reservation.roomTypeId)
        .eq('status', 'Available')
        .order('number');

      if (roomsError) throw roomsError;

      // Check for conflicting reservations
      const { data: conflicts, error: conflictsError } = await supabase
        .from('reservations')
        .select('room_id')
        .neq('id', reservation.id)
        .in('status', ['Booked', 'Checked In'])
        .or(`and(check_in.lte.${reservation.checkOut},check_out.gte.${reservation.checkIn})`);

      if (conflictsError) throw conflictsError;

      const conflictRoomIds = conflicts?.map(c => c.room_id) || [];
      return rooms?.filter(room => !conflictRoomIds.includes(room.id)) || [];
    },
    enabled: open && Boolean(reservation.roomTypeId),
  });

  // Room move mutation
  const roomMoveMutation = useMutation({
    mutationFn: async (data: RoomMoveData) => {
      // Update reservation with new room
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ 
          room_id: data.newRoomId,
          special_instructions: `Room moved: ${data.reason}`,
        })
        .eq('id', reservation.id);

      if (updateError) throw updateError;

        // Log the room move in audit trail - disabled for schema compatibility
        
        console.log('Room move completed:', data);

      return data;
    },
    onSuccess: (data) => {
      const selectedRoom = availableRooms.find(r => r.id === data.newRoomId);
      toast({
        title: "Room Move Successful",
        description: `${reservation.guestName} moved to room ${selectedRoom?.number}`,
      });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Room Move Failed",
        description: "Unable to move room. Please try again.",
        variant: "destructive",
      });
      console.error('Room move error:', error);
    }
  });

  const onSubmit = (data: RoomMoveData) => {
    roomMoveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5" />
            Move Room - {reservation.code}
          </DialogTitle>
          <DialogDescription>
            Change the room assignment for this reservation
          </DialogDescription>
        </DialogHeader>

        {/* Current Reservation Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">{reservation.guestName}</p>
                <p className="text-sm text-muted-foreground">
                  {reservation.code} • {reservation.currentRoomType}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Current: Room {reservation.currentRoomNumber}</p>
                <div className="flex items-center justify-end gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(reservation.checkIn).toLocaleDateString()} - {new Date(reservation.checkOut).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {reservation.adults} adults {reservation.children > 0 && `, ${reservation.children} children`}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="newRoomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select New Room</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose available room" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRooms.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <AlertCircle className="h-4 w-4 mx-auto mb-2" />
                          No available rooms of the same type
                        </div>
                      ) : (
                        availableRooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>Room {room.number}</span>
                              <div className="flex gap-2 ml-4">
                                {room.floor && (
                                  <Badge variant="outline" className="text-xs">
                                    Floor {room.floor}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {room.housekeeping_status}
                                </Badge>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effectiveDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective Date</FormLabel>
                  <FormControl>
                    <input
                      type="date"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Room Move</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Guest requested room change, maintenance issue in current room..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Move Preview */}
            {form.watch('newRoomId') && (
              <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <p className="font-semibold">Current</p>
                      <p className="text-lg">Room {reservation.currentRoomNumber}</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-blue-600" />
                    <div className="text-center">
                      <p className="font-semibold">New</p>
                      <p className="text-lg">
                        Room {availableRooms.find(r => r.id === form.watch('newRoomId'))?.number}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={roomMoveMutation.isPending || availableRooms.length === 0}
              >
                {roomMoveMutation.isPending ? "Moving Room..." : "Confirm Move"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}