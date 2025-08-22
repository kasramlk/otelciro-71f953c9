// Mock Data Layer for Hotel Management System
// USE_SUPABASE = false by default - toggle to use real Supabase data

export const USE_SUPABASE = false;

// Hotel Configuration
export const HOTEL_CONFIG = {
  name: "Seaside Grand",
  code: "SGH",
  timezone: "Europe/Istanbul",
  currency: "EUR",
  totalRooms: 50,
  checkInTime: "15:00",
  checkOutTime: "11:00"
};

// Room Types
export const ROOM_TYPES = [
  { id: "1", name: "Standard Double", code: "STD", count: 12, maxOccupancy: 2 },
  { id: "2", name: "Deluxe Double", code: "DLX", count: 10, maxOccupancy: 2 },
  { id: "3", name: "Twin Garden", code: "TWN", count: 8, maxOccupancy: 2 },
  { id: "4", name: "Family", code: "FAM", count: 8, maxOccupancy: 4 },
  { id: "5", name: "Suite Sea", code: "STE", count: 12, maxOccupancy: 3 }
];

// Rate Plans
export const RATE_PLANS = [
  { id: "1", name: "Best Available Rate", code: "BAR", isBase: true },
  { id: "2", name: "Non-Refundable", code: "NR", baseRate: "1", modifier: -10, modifierType: "percent" },
  { id: "3", name: "Bed & Breakfast", code: "BB", baseRate: "1", modifier: 10, modifierType: "amount" }
];

// Generate mock rooms
export const generateMockRooms = () => {
  const rooms = [];
  let roomNumber = 101;
  
  ROOM_TYPES.forEach(roomType => {
    for (let i = 0; i < roomType.count; i++) {
      rooms.push({
        id: `room-${roomNumber}`,
        number: roomNumber.toString(),
        floor: Math.floor(roomNumber / 100),
        roomTypeId: roomType.id,
        roomType: roomType.name,
        status: Math.random() > 0.8 ? "dirty" : Math.random() > 0.6 ? "clean" : "occupied",
        condition: "good",
        features: ["wifi", "ac", "tv"],
        lastCleaned: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        notes: ""
      });
      roomNumber++;
    }
  });
  
  return rooms;
};

// Generate date range
export const generateDateRange = (startDate: Date, days: number) => {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// Generate mock occupancy data
export const generateMockOccupancyData = (month: number, year: number) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const data = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseOccupancy = isWeekend ? 0.75 : 0.6;
    const occupancyRate = Math.min(0.95, baseOccupancy + Math.random() * 0.3);
    const occupiedRooms = Math.floor(HOTEL_CONFIG.totalRooms * occupancyRate);
    const availableRooms = HOTEL_CONFIG.totalRooms - occupiedRooms;
    const baseADR = isWeekend ? 120 : 100;
    const adr = baseADR + (Math.random() * 40 - 20);
    
    data.push({
      date,
      day,
      specialDay: isWeekend ? "Weekend" : "",
      capacity: HOTEL_CONFIG.totalRooms,
      availableRooms,
      occupiedRooms,
      occupancyRate,
      adr: Math.round(adr * 100) / 100,
      totalRevenue: Math.round(occupiedRooms * adr * 100) / 100,
      arrivals: Math.floor(occupiedRooms * 0.3),
      departures: Math.floor(occupiedRooms * 0.25)
    });
  }
  
  return data;
};

// Generate mock reservations
export const generateMockReservations = () => {
  const statuses = ["confirmed", "checked-in", "checked-out", "cancelled", "no-show"];
  const sources = ["direct", "booking.com", "expedia", "phone", "walk-in"];
  const rooms = generateMockRooms();
  
  const reservations = [];
  for (let i = 0; i < 100; i++) {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 60 - 30));
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 7 + 1));
    
    const roomType = ROOM_TYPES[Math.floor(Math.random() * ROOM_TYPES.length)];
    const assignedRoom = Math.random() > 0.3 ? rooms.find(r => r.roomTypeId === roomType.id) : null;
    
    reservations.push({
      id: `res-${1000 + i}`,
      code: `RES${1000 + i}`,
      guestName: `Guest ${i + 1}`,
      email: `guest${i + 1}@example.com`,
      phone: `+1234567${String(i).padStart(3, '0')}`,
      checkIn,
      checkOut,
      nights: Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
      adults: Math.floor(Math.random() * 3 + 1),
      children: Math.floor(Math.random() * 2),
      roomTypeId: roomType.id,
      roomType: roomType.name,
      roomId: assignedRoom?.id || null,
      roomNumber: assignedRoom?.number || null,
      rateCode: RATE_PLANS[Math.floor(Math.random() * RATE_PLANS.length)].code,
      rate: Math.round((100 + Math.random() * 100) * 100) / 100,
      totalAmount: Math.round((100 + Math.random() * 500) * 100) / 100,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      notes: Math.random() > 0.7 ? "Special requests: Late check-in" : "",
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      balance: Math.round(Math.random() * 200 * 100) / 100
    });
  }
  
  return reservations.sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());
};

// Generate mock guests
export const generateMockGuests = () => {
  const guests = [];
  for (let i = 0; i < 50; i++) {
    guests.push({
      id: `guest-${i + 1}`,
      firstName: `Guest`,
      lastName: `${i + 1}`,
      email: `guest${i + 1}@example.com`,
      phone: `+1234567${String(i).padStart(3, '0')}`,
      nationality: "US",
      dateOfBirth: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      idNumber: `ID${String(i + 1).padStart(6, '0')}`,
      vipStatus: Math.random() > 0.9,
      loyaltyTier: Math.random() > 0.7 ? "Gold" : Math.random() > 0.4 ? "Silver" : "Standard",
      loyaltyPoints: Math.floor(Math.random() * 5000),
      lastStay: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      totalStays: Math.floor(Math.random() * 20),
      totalSpent: Math.round(Math.random() * 10000 * 100) / 100,
      preferences: Math.random() > 0.5 ? ["high-floor", "quiet-room"] : ["early-checkin"],
      blacklisted: false,
      notes: ""
    });
  }
  return guests;
};

// Generate mock housekeeping tasks
export const generateMockHousekeepingTasks = () => {
  const taskTypes = ["cleaning", "maintenance", "inspection", "amenity-restock"];
  const statuses = ["open", "in-progress", "completed"];
  const rooms = generateMockRooms();
  
  const tasks = [];
  for (let i = 0; i < 30; i++) {
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    tasks.push({
      id: `task-${i + 1}`,
      roomId: room.id,
      roomNumber: room.number,
      taskType: taskTypes[Math.floor(Math.random() * taskTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
      assignedTo: `Staff ${Math.floor(Math.random() * 5) + 1}`,
      description: `${taskTypes[Math.floor(Math.random() * taskTypes.length)]} required`,
      dueDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      completedAt: Math.random() > 0.6 ? new Date() : null,
      notes: ""
    });
  }
  return tasks;
};

// Generate mock ARI data
export const generateMockARIData = (startDate: Date, endDate: Date) => {
  const dates = generateDateRange(startDate, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const ariData = [];
  
  ROOM_TYPES.forEach(roomType => {
    RATE_PLANS.forEach(ratePlan => {
      dates.forEach(date => {
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const baseRate = isWeekend ? 120 : 100;
        let rate = baseRate;
        
        // Apply rate plan modifiers
        if (ratePlan.modifier) {
          if (ratePlan.modifierType === "percent") {
            rate = baseRate * (1 + ratePlan.modifier / 100);
          } else {
            rate += ratePlan.modifier;
          }
        }
        
        ariData.push({
          date,
          roomTypeId: roomType.id,
          ratePlanId: ratePlan.id,
          rate: Math.round(rate * 100) / 100,
          availability: Math.floor(Math.random() * roomType.count),
          minLOS: Math.random() > 0.8 ? 2 : 1,
          maxLOS: Math.random() > 0.9 ? 7 : 0,
          closedToArrival: Math.random() > 0.95,
          closedToDeparture: Math.random() > 0.95,
          stopSell: Math.random() > 0.98
        });
      });
    });
  });
  
  return ariData;
};

// Export all mock data generators
export const mockData = {
  rooms: generateMockRooms(),
  reservations: generateMockReservations(),
  guests: generateMockGuests(),
  housekeepingTasks: generateMockHousekeepingTasks(),
  occupancyData: generateMockOccupancyData(new Date().getMonth() + 1, new Date().getFullYear()),
  ariData: generateMockARIData(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
};
