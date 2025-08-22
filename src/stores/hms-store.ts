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
  
  // AI Revenue Optimization
  applyAISuggestion: (date: Date, suggestedADR: number) => void;
  
  // Audit logging
  auditLog: Array<{id: string; action: string; details: string; timestamp: Date}>;
  addAuditEntry: (action: string, details: string) => void;
  
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
        auditLog: [],
        
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
        },
        
        // AI Revenue Optimization - Apply suggested ADR and recalculate KPIs
        applyAISuggestion: (date, suggestedADR) => {
          set((state) => {
            const updatedOccupancyData = state.occupancyData.map(day => {
              if (day.date.toDateString() === date.toDateString()) {
                const newRevenue = day.occupiedRooms * suggestedADR;
                return {
                  ...day,
                  adr: suggestedADR,
                  totalRevenue: Math.round(newRevenue * 100) / 100
                };
              }
              return day;
            });
            
            // Add audit entry
            const auditEntry = {
              id: `audit-${Date.now()}`,
              action: 'AI Suggestion Applied',
              details: `ADR updated to €${suggestedADR} for ${date.toDateString()}`,
              timestamp: new Date()
            };
            
            return {
              occupancyData: updatedOccupancyData,
              auditLog: [...state.auditLog, auditEntry]
            };
          });
        },
        
        // Add audit entry
        addAuditEntry: (action, details) => {
          set((state) => ({
            auditLog: [...state.auditLog, {
              id: `audit-${Date.now()}`,
              action,
              details,
              timestamp: new Date()
            }]
          }));
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
        }),
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            try {
              const data = JSON.parse(str);
              // Convert selectedMonth string back to Date object
              if (data.state?.selectedMonth && typeof data.state.selectedMonth === 'string') {
                data.state.selectedMonth = new Date(data.state.selectedMonth);
              }
              // Convert Date strings in reservations back to Date objects
              if (data.state?.reservations) {
                data.state.reservations = data.state.reservations.map((res: any) => ({
                  ...res,
                  checkIn: new Date(res.checkIn),
                  checkOut: new Date(res.checkOut),
                  createdAt: new Date(res.createdAt)
                }));
              }
              // Convert Date strings in rooms back to Date objects
              if (data.state?.rooms) {
                data.state.rooms = data.state.rooms.map((room: any) => ({
                  ...room,
                  lastCleaned: new Date(room.lastCleaned)
                }));
              }
              // Convert Date strings in guests back to Date objects
              if (data.state?.guests) {
                data.state.guests = data.state.guests.map((guest: any) => ({
                  ...guest,
                  dateOfBirth: new Date(guest.dateOfBirth),
                  lastStay: new Date(guest.lastStay)
                }));
              }
              // Convert Date strings in housekeeping tasks back to Date objects
              if (data.state?.housekeepingTasks) {
                data.state.housekeepingTasks = data.state.housekeepingTasks.map((task: any) => ({
                  ...task,
                  dueDate: new Date(task.dueDate),
                  createdAt: new Date(task.createdAt),
                  completedAt: task.completedAt ? new Date(task.completedAt) : null
                }));
              }
              return data;
            } catch (error) {
              console.error('Error parsing persisted HMS store data:', error);
              return null;
            }
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          }
        }
      }
    ),
    { name: 'HMS Store' }
  )
);
