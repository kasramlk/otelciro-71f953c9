import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertTriangle, 
  Wrench, 
  Calendar,
  Clock
} from "lucide-react";

const outOfOrderSchema = z.object({
  roomId: z.string().min(1, "Please select a room"),
  status: z.enum(["Out of Order", "Out of Service", "Under Maintenance"]),
  reason: z.string().min(1, "Please provide a reason"),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  assignedTo: z.string().optional(),
  estimatedCost: z.number().optional(),
  notes: z.string().optional(),
});

type OutOfOrderData = z.infer<typeof outOfOrderSchema>;

interface OutOfOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: string;
  rooms: Array<{
    id: string;
    room_number: string;
    room_types: { name: string } | null;
    status: string;
  }>;
}

const statusColors = {
  "Out of Order": "destructive",
  "Out of Service": "secondary", 
  "Under Maintenance": "default"
} as const;

const priorityColors = {
  "Low": "secondary",
  "Medium": "default",
  "High": "default",
  "Critical": "destructive"
} as const;

export default function OutOfOrderDialog({
  open,
  onOpenChange,
  hotelId,
  rooms
}: OutOfOrderDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<OutOfOrderData>({
    resolver: zodResolver(outOfOrderSchema),
    defaultValues: {
      status: "Out of Order",
      priority: "Medium",
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  // Out of order mutation
  const outOfOrderMutation = useMutation({
    mutationFn: async (data: OutOfOrderData) => {
      // Update room status
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ 
          status: data.status,
          out_of_order_reason: data.reason,
          out_of_order_from: data.startDate,
          out_of_order_until: data.endDate || null
        })
        .eq('id', data.roomId);

      if (roomError) throw roomError;

      // Create maintenance request entry instead
      const { error: logError } = await supabase
        .from('maintenance_requests')
        .insert({
          room_id: data.roomId,
          hotel_id: hotelId,
          title: `${data.status} - Room Out of Order`,
          description: data.reason,
          category: 'Room Status',
          priority: data.priority.toLowerCase(),
          status: 'open',
          estimated_cost: data.estimatedCost || null,
          scheduled_date: data.endDate ? new Date(data.endDate).toISOString() : null,
          notes: data.notes || null,
          reported_by: 'current-user-id' // TODO: Get from auth context
        });

      if (logError) throw logError;

      return data;
    },
    onSuccess: (data) => {
      const selectedRoom = rooms.find(r => r.id === data.roomId);
      toast({
        title: "Room Status Updated",
        description: `Room ${selectedRoom?.room_number} marked as ${data.status}`,
      });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-status-log'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Unable to update room status. Please try again.",
        variant: "destructive",
      });
      console.error('Out of order error:', error);
    }
  });

  const onSubmit = (data: OutOfOrderData) => {
    outOfOrderMutation.mutate(data);
  };

  // Filter available rooms (not already out of order)
  const availableRooms = rooms.filter(room => room.status === 'Available' || room.status === 'Clean');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Mark Room Out of Order
          </DialogTitle>
          <DialogDescription>
            Remove a room from available inventory for maintenance or repairs
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Room</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose room" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRooms.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            No available rooms
                          </div>
                        ) : (
                          availableRooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>Room {room.room_number}</span>
                                <div className="flex gap-2 ml-4">
                                  <Badge variant="outline" className="text-xs">
                                    {room.room_types?.name || 'Unknown Type'}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {room.status}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Out of Order">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            Out of Order
                          </div>
                        </SelectItem>
                        <SelectItem value="Out of Service">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            Out of Service
                          </div>
                        </SelectItem>
                        <SelectItem value="Under Maintenance">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-blue-500" />
                            Under Maintenance
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Plumbing issue, AC repair needed, deep cleaning..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(priorityColors) as Array<keyof typeof priorityColors>).map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            <div className="flex items-center gap-2">
                              <Badge variant={priorityColors[priority]} className="text-xs">
                                {priority}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Cost ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Staff member or contractor name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information or special instructions..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Preview */}
            {form.watch('roomId') && form.watch('status') && (
              <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">Status Change Preview</span>
                    </div>
                    <Badge variant={statusColors[form.watch('status') as keyof typeof statusColors]}>
                      {form.watch('status')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Room {availableRooms.find(r => r.id === form.watch('roomId'))?.room_number} will be removed from inventory
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={outOfOrderMutation.isPending || availableRooms.length === 0}
              >
                {outOfOrderMutation.isPending ? "Updating..." : "Mark Out of Order"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}