import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { mockData, USE_SUPABASE, generateMockOccupancyData } from '@/lib/mock-data';

// Types
export interface Reservation {
  id: string;
  code: string;
  guestName: string;
  email: string;
  phone: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  roomTypeId: string;
  roomType: string;
  roomId: string | null;
  roomNumber: string | null;
  rateCode: string;
  rate: number;
  totalAmount: number;
  status: string;
  source: string;
  notes: string;
  createdAt: Date;
  balance: number;
}

export interface Room {
  id: string;
  number: string;
  floor: number;
  roomTypeId: string;
  roomType: string;
  status: 'clean' | 'dirty' | 'occupied' | 'ooo';
  condition: string;
  features: string[];
  lastCleaned: Date;
  notes: string;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  dateOfBirth: Date;
  idNumber: string;
  vipStatus: boolean;
  loyaltyTier: string;
  loyaltyPoints: number;
  lastStay: Date;
  totalStays: number;
  totalSpent: number;
  preferences: string[];
  blacklisted: boolean;
  notes: string;
}

export interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber: string;
  taskType: string;
  status: 'open' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  description: string;
  dueDate: Date;
  createdAt: Date;
  completedAt: Date | null;
  notes: string;
}

export interface OccupancyData {
  date: Date;
  day: number;
  specialDay: string;
  capacity: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  adr: number;
  totalRevenue: number;
  arrivals: number;
  departures: number;
}

export interface ARIData {
  date: Date;
  roomTypeId: string;
  ratePlanId: string;
  rate: number;
  availability: number;
  minLOS: number;
  maxLOS: number;
  closedToArrival: boolean;
  closedToDeparture: boolean;
  stopSell: boolean;
}

// Store interface
interface HMSStore {
  // Data
  reservations: Reservation[];
  rooms: Room[];
  guests: Guest[];
  housekeepingTasks: HousekeepingTask[];
  occupancyData: OccupancyData[];
  ariData: ARIData[];
  
  // UI State
  selectedMonth: Date;
  selectedReservation: string | null;
  selectedRoom: string | null;
  isLoading: boolean;
  
  // Undo/Redo
  history: any[];
  historyIndex: number;
  
  // Actions
  setSelectedMonth: (month: Date) => void;
  setSelectedReservation: (reservationId: string | null) => void;
  setSelectedRoom: (roomId: string | null) => void;
  
  // Reservations
  addReservation: (reservation: Omit<Reservation, 'id'>) => void;
  updateReservation: (id: string, updates: Partial<Reservation>) => void;
  deleteReservation: (id: string) => void;
  
  // Rooms
  updateRoomStatus: (roomId: string, status: Room['status']) => void;
  
  // Guests
  addGuest: (guest: Omit<Guest, 'id'>) => void;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  
  // Housekeeping
  addTask: (task: Omit<HousekeepingTask, 'id'>) => void;
  updateTask: (id: string, updates: Partial<HousekeepingTask>) => void;
  deleteTask: (id: string) => void;
  
  // ARI
  updateARI: (updates: Partial<ARIData>[]) => void;
  bulkUpdateARI: (updates: { dates: Date[]; roomTypeIds: string[]; ratePlanIds: string[]; changes: Partial<ARIData> }) => void;
  
  // Data refresh
  refreshOccupancyData: (month: number, year: number) => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  addToHistory: (state: any) => void;
}

// Create store
export const useHMSStore = create<HMSStore>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // Initial data
        reservations: mockData.reservations,
        rooms: mockData.rooms,
        guests: mockData.guests,
        housekeepingTasks: mockData.housekeepingTasks,
        occupancyData: mockData.occupancyData,
        ariData: mockData.ariData,
        
        // UI State
        selectedMonth: new Date(),
        selectedReservation: null,
        selectedRoom: null,
        isLoading: false,
        
        // Undo/Redo
        history: [],
        historyIndex: -1,
        
        // Actions
        setSelectedMonth: (month) => set({ selectedMonth: month }),
        setSelectedReservation: (reservationId) => set({ selectedReservation: reservationId }),
        setSelectedRoom: (roomId) => set({ selectedRoom: roomId }),
        
        // Reservations
        addReservation: (reservation) => {
          const newReservation = {
            ...reservation,
            id: `res-${Date.now()}`,
            createdAt: new Date()
          };
          set((state) => ({
            reservations: [...state.reservations, newReservation]
          }));
        },
        
        updateReservation: (id, updates) => {
          set((state) => ({
            reservations: state.reservations.map(res =>
              res.id === id ? { ...res, ...updates } : res
            )
          }));
        },
        
        deleteReservation: (id) => {
          set((state) => ({
            reservations: state.reservations.filter(res => res.id !== id)
          }));
        },
        
        // Rooms
        updateRoomStatus: (roomId, status) => {
          set((state) => ({
            rooms: state.rooms.map(room =>
              room.id === roomId ? { ...room, status, lastCleaned: status === 'clean' ? new Date() : room.lastCleaned } : room
            )
          }));
        },
        
        // Guests
        addGuest: (guest) => {
          const newGuest = {
            ...guest,
            id: `guest-${Date.now()}`
          };
          set((state) => ({
            guests: [...state.guests, newGuest]
          }));
        },
        
        updateGuest: (id, updates) => {
          set((state) => ({
            guests: state.guests.map(guest =>
              guest.id === id ? { ...guest, ...updates } : guest
            )
          }));
        },
        
        deleteGuest: (id) => {
          set((state) => ({
            guests: state.guests.filter(guest => guest.id !== id)
          }));
        },
        
        // Housekeeping
        addTask: (task) => {
          const newTask = {
            ...task,
            id: `task-${Date.now()}`,
            createdAt: new Date()
          };
          set((state) => ({
            housekeepingTasks: [...state.housekeepingTasks, newTask]
          }));
        },
        
        updateTask: (id, updates) => {
          set((state) => ({
            housekeepingTasks: state.housekeepingTasks.map(task =>
              task.id === id ? { ...task, ...updates } : task
            )
          }));
        },
        
        deleteTask: (id) => {
          set((state) => ({
            housekeepingTasks: state.housekeepingTasks.filter(task => task.id !== id)
          }));
        },
        
        // ARI
        updateARI: (updates) => {
          set((state) => {
            const newARIData = [...state.ariData];
            updates.forEach(update => {
              const index = newARIData.findIndex(
                ari => ari.date.getTime() === update.date?.getTime() &&
                       ari.roomTypeId === update.roomTypeId &&
                       ari.ratePlanId === update.ratePlanId
              );
              if (index !== -1) {
                newARIData[index] = { ...newARIData[index], ...update };
              }
            });
            return { ariData: newARIData };
          });
        },
        
        bulkUpdateARI: ({ dates, roomTypeIds, ratePlanIds, changes }) => {
          set((state) => {
            const newARIData = [...state.ariData];
            dates.forEach(date => {
              roomTypeIds.forEach(roomTypeId => {
                ratePlanIds.forEach(ratePlanId => {
                  const index = newARIData.findIndex(
                    ari => ari.date.getTime() === date.getTime() &&
                           ari.roomTypeId === roomTypeId &&
                           ari.ratePlanId === ratePlanId
                  );
                  if (index !== -1) {
                    newARIData[index] = { ...newARIData[index], ...changes };
                  }
                });
              });
            });
            return { ariData: newARIData };
          });
        },
        
        // Data refresh
        refreshOccupancyData: (month, year) => {
          const newData = generateMockOccupancyData(month, year);
          set({ occupancyData: newData });
        },
        
        // Undo/Redo
        undo: () => {
          const { history, historyIndex } = get();
          if (historyIndex > 0) {
            const previousState = history[historyIndex - 1];
            set({ ...previousState, historyIndex: historyIndex - 1 });
          }
        },
        
        redo: () => {
          const { history, historyIndex } = get();
          if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            set({ ...nextState, historyIndex: historyIndex + 1 });
          }
        },
        
        addToHistory: (state) => {
          const { history, historyIndex } = get();
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(state);
          set({ history: newHistory, historyIndex: newHistory.length - 1 });
        }
      })),
      {
        name: 'hms-store',
        partialize: (state) => ({
          selectedMonth: state.selectedMonth,
          reservations: state.reservations,
          rooms: state.rooms,
          guests: state.guests,
          housekeepingTasks: state.housekeepingTasks
        })
      }
    ),
    { name: 'HMS Store' }
  )
);
