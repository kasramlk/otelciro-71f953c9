import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, startOfDay, isSameDay } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockRooms = [
  { id: "1", number: "101", roomType: "Standard", floor: 1 },
  { id: "2", number: "102", roomType: "Standard", floor: 1 },
  { id: "3", number: "103", roomType: "Deluxe", floor: 1 },
  { id: "4", number: "201", roomType: "Suite", floor: 2 },
  { id: "5", number: "202", roomType: "Suite", floor: 2 },
  { id: "6", number: "203", roomType: "Deluxe", floor: 2 },
];

const mockReservations = [
  {
    id: "res1",
    code: "RES001",
    guest: "John Doe",
    roomId: "1",
    checkIn: new Date("2024-01-15"),
    checkOut: new Date("2024-01-18"),
    status: "CheckedIn",
  },
  {
    id: "res2",
    code: "RES002",
    guest: "Jane Smith",
    roomId: "2",
    checkIn: new Date("2024-01-16"),
    checkOut: new Date("2024-01-19"),
    status: "Booked",
  },
  {
    id: "res3",
    code: "RES003",
    guest: "Bob Johnson",
    roomId: "3",
    checkIn: new Date("2024-01-14"),
    checkOut: new Date("2024-01-16"),
    status: "CheckedOut",
  },
  {
    id: "res4",
    code: "RES004",
    guest: "Alice Wilson",
    roomId: "4",
    checkIn: new Date("2024-01-17"),
    checkOut: new Date("2024-01-20"),
    status: "Cancelled",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Booked":
      return "bg-blue-500 hover:bg-blue-600";
    case "CheckedIn":
      return "bg-green-500 hover:bg-green-600";
    case "CheckedOut":
      return "bg-gray-400 hover:bg-gray-500";
    case "Cancelled":
      return "bg-red-500 hover:bg-red-600";
    default:
      return "bg-blue-500 hover:bg-blue-600";
  }
};

export default function RoomPlan() {
  const [startDate, setStartDate] = useState(new Date());
  const [viewDays, setViewDays] = useState(14);
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reservations, setReservations] = useState(mockReservations);
  const { toast } = useToast();

  const dates = useMemo(() => {
    return Array.from({ length: viewDays }, (_, i) => addDays(startDate, i));
  }, [startDate, viewDays]);

  const filteredRooms = useMemo(() => {
    return mockRooms.filter((room) => {
      return roomTypeFilter === "all" || room.roomType === roomTypeFilter;
    });
  }, [roomTypeFilter]);

  const getReservationForRoomAndDate = (roomId: string, date: Date) => {
    return reservations.find((res) => {
      if (statusFilter !== "all" && res.status !== statusFilter) return false;
      return (
        res.roomId === roomId &&
        date >= startOfDay(res.checkIn) &&
        date < startOfDay(res.checkOut)
      );
    });
  };

  const calculateReservationSpan = (reservation: any, date: Date) => {
    const checkIn = startOfDay(reservation.checkIn);
    const checkOut = startOfDay(reservation.checkOut);
    const currentDate = startOfDay(date);
    
    const isStart = isSameDay(currentDate, checkIn);
    const isEnd = isSameDay(addDays(currentDate, 1), checkOut);
    
    let span = 1;
    let startCol = dates.findIndex(d => isSameDay(d, currentDate));
    let endCol = dates.findIndex(d => isSameDay(d, addDays(checkOut, -1)));
    
    if (startCol !== -1 && endCol !== -1) {
      span = Math.min(endCol - startCol + 1, dates.length - startCol);
    }
    
    return { span, isStart, isEnd };
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    const reservationId = draggableId;
    const newRoomId = destination.droppableId.replace("room-", "");
    
    // Update reservation room
    setReservations(prev =>
      prev.map(res =>
        res.id === reservationId
          ? { ...res, roomId: newRoomId }
          : res
      )
    );

    const reservation = reservations.find(res => res.id === reservationId);
    const newRoom = mockRooms.find(room => room.id === newRoomId);
    
    toast({
      title: "Reservation moved",
      description: `${reservation?.code} moved to room ${newRoom?.number}`,
    });
  };

  const navigateDate = (direction: "prev" | "next") => {
    setStartDate(prev => 
      direction === "prev" ? subDays(prev, viewDays) : addDays(prev, viewDays)
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center">
          <Calendar className="mr-2 h-8 w-8" />
          Room Plan
        </h2>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setStartDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select value={viewDays.toString()} onValueChange={(value) => setViewDays(parseInt(value))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Room Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Standard">Standard</SelectItem>
            <SelectItem value="Deluxe">Deluxe</SelectItem>
            <SelectItem value="Suite">Suite</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Booked">Booked</SelectItem>
            <SelectItem value="CheckedIn">Checked In</SelectItem>
            <SelectItem value="CheckedOut">Checked Out</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-4 mb-4">
        <span className="text-sm font-medium">Status:</span>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm">Booked</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm">Checked In</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span className="text-sm">Checked Out</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm">Cancelled</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-max">
                {/* Header with dates */}
                <div className="grid" style={{ gridTemplateColumns: `200px repeat(${viewDays}, 120px)` }}>
                  <div className="p-3 border-b border-r font-semibold bg-muted">
                    Room
                  </div>
                  {dates.map((date) => (
                    <div
                      key={date.toISOString()}
                      className="p-3 border-b text-center text-sm font-medium bg-muted"
                    >
                      <div>{format(date, "EEE")}</div>
                      <div>{format(date, "MMM dd")}</div>
                    </div>
                  ))}
                </div>

                {/* Room rows */}
                {filteredRooms.map((room) => (
                  <Droppable key={room.id} droppableId={`room-${room.id}`} direction="horizontal">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="grid border-b"
                        style={{ gridTemplateColumns: `200px repeat(${viewDays}, 120px)` }}
                      >
                        {/* Room info */}
                        <div className="p-3 border-r flex flex-col justify-center">
                          <div className="font-medium">{room.number}</div>
                          <div className="text-sm text-muted-foreground">{room.roomType}</div>
                          <div className="text-xs text-muted-foreground">Floor {room.floor}</div>
                        </div>

                        {/* Date cells */}
                        {dates.map((date, dateIndex) => {
                          const reservation = getReservationForRoomAndDate(room.id, date);
                          
                          if (reservation) {
                            const { span, isStart } = calculateReservationSpan(reservation, date);
                            
                            if (isStart) {
                              return (
                                <Draggable
                                  key={`${reservation.id}-${dateIndex}`}
                                  draggableId={reservation.id}
                                  index={dateIndex}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`
                                        relative p-1 border-r border-gray-200 cursor-grab
                                        ${snapshot.isDragging ? "z-50 shadow-lg" : ""}
                                      `}
                                      style={{
                                        gridColumn: `span ${span}`,
                                        ...provided.draggableProps.style
                                      }}
                                    >
                                      <div
                                        className={`
                                          h-8 rounded px-2 py-1 text-white text-xs font-medium
                                          ${getStatusColor(reservation.status)}
                                          transition-colors cursor-grab
                                        `}
                                      >
                                        <div className="truncate">
                                          {reservation.code}
                                        </div>
                                        <div className="truncate text-xs opacity-90">
                                          {reservation.guest}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            } else {
                              return null; // Skip cells that are part of a spanning reservation
                            }
                          }

                          return (
                            <div
                              key={dateIndex}
                              className="p-3 border-r min-h-[60px] hover:bg-muted/50 transition-colors"
                            />
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </DragDropContext>
    </div>
  );
}