// Production HMS Store
// Replaces mock data store with real Supabase integration

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { services } from '@/lib/services/supabase-service';
import { auditLogger } from '@/lib/audit-logger';
import { toast } from '@/hooks/use-toast';

// Production Types - matching actual database schema
export interface ProductionReservation {
  id: string;
  code: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  nights: number;
  adults: number;
  children: number;
  room_type_id?: string;
  room_id?: string;
  rate_plan_id?: string;
  rate_amount: number;
  total_amount: number;
  status: string;
  source: string;
  notes?: string;
  hotel_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionRoom {
  id: string;
  number: string;
  floor: number;
  room_type_id: string;
  status: 'clean' | 'dirty' | 'occupied' | 'ooo';
  condition: string;
  features: string[];
  last_cleaned?: string;
  notes?: string;
  hotel_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionGuest {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  nationality?: string;
  dob?: string;
  id_number?: string;
  hotel_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionHousekeepingTask {
  id: string;
  room_id: string;
  task_type: string;
  status: 'open' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  description?: string;
  due_date?: string;
  notes?: string;
  hotel_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionOccupancyData {
  date: Date;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  adr: number;
  totalRevenue: number;
  arrivals: number;
  departures: number;
}

// Store interface
interface ProductionHMSStore {
  // Current hotel context
  currentHotelId: string | null;
  
  // UI State
  selectedMonth: Date;
  selectedReservation: string | null;
  selectedRoom: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Cache for frequently accessed data
  cachedReservations: ProductionReservation[];
  cachedRooms: ProductionRoom[];
  cachedGuests: ProductionGuest[];
  cachedTasks: ProductionHousekeepingTask[];
  cachedOccupancyData: ProductionOccupancyData[];
  
  // Cache timestamps for invalidation
  lastFetch: {
    reservations?: number;
    rooms?: number;
    guests?: number;
    tasks?: number;
    occupancy?: number;
  };
  
  // Actions
  setCurrentHotel: (hotelId: string) => void;
  setSelectedMonth: (month: Date) => void;
  setSelectedReservation: (reservationId: string | null) => void;
  setSelectedRoom: (roomId: string | null) => void;
  setError: (error: string | null) => void;
  
  // Data fetching with caching
  fetchReservations: (hotelId: string, force?: boolean) => Promise<ProductionReservation[]>;
  fetchRooms: (hotelId: string, force?: boolean) => Promise<ProductionRoom[]>;
  fetchGuests: (hotelId: string, force?: boolean) => Promise<ProductionGuest[]>;
  fetchHousekeepingTasks: (hotelId: string, force?: boolean) => Promise<ProductionHousekeepingTask[]>;
  fetchOccupancyData: (hotelId: string, startDate: string, endDate: string, force?: boolean) => Promise<ProductionOccupancyData[]>;
  
  // CRUD operations with optimistic updates
  createReservation: (reservation: Omit<ProductionReservation, 'id' | 'created_at' | 'updated_at'>) => Promise<ProductionReservation>;
  updateReservation: (id: string, updates: Partial<ProductionReservation>) => Promise<ProductionReservation>;
  deleteReservation: (id: string) => Promise<void>;
  
  updateRoomStatus: (roomId: string, status: ProductionRoom['status'], notes?: string) => Promise<ProductionRoom>;
  
  createGuest: (guest: Omit<ProductionGuest, 'id' | 'created_at' | 'updated_at'>) => Promise<ProductionGuest>;
  updateGuest: (id: string, updates: Partial<ProductionGuest>) => Promise<ProductionGuest>;
  
  createHousekeepingTask: (task: Omit<ProductionHousekeepingTask, 'id' | 'created_at' | 'updated_at'>) => Promise<ProductionHousekeepingTask>;
  updateHousekeepingTask: (id: string, updates: Partial<ProductionHousekeepingTask>) => Promise<ProductionHousekeepingTask>;
  
  // Cache management
  invalidateCache: (type?: 'reservations' | 'rooms' | 'guests' | 'tasks' | 'occupancy') => void;
  clearAllCache: () => void;
}

// Cache timeout - 5 minutes
const CACHE_TIMEOUT = 5 * 60 * 1000;

// Helper function to check if cache is fresh
const isCacheFresh = (timestamp?: number) => {
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_TIMEOUT;
};

// Create the production store
export const useProductionHMSStore = create<ProductionHMSStore>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // Initial state
        currentHotelId: null,
        selectedMonth: new Date(),
        selectedReservation: null,
        selectedRoom: null,
        isLoading: false,
        error: null,
        
        // Cache
        cachedReservations: [],
        cachedRooms: [],
        cachedGuests: [],
        cachedTasks: [],
        cachedOccupancyData: [],
        lastFetch: {},
        
        // Basic actions
        setCurrentHotel: (hotelId) => set({ currentHotelId: hotelId }),
        setSelectedMonth: (month) => set({ selectedMonth: month }),
        setSelectedReservation: (reservationId) => set({ selectedReservation: reservationId }),
        setSelectedRoom: (roomId) => set({ selectedRoom: roomId }),
        setError: (error) => set({ error }),
        
        // Data fetching with intelligent caching
        fetchReservations: async (hotelId: string, force = false) => {
          const state = get();
          
          // Return cached data if fresh and same hotel
          if (!force && 
              state.currentHotelId === hotelId && 
              isCacheFresh(state.lastFetch.reservations) && 
              state.cachedReservations.length > 0) {
            return state.cachedReservations;
          }
          
          try {
            set({ isLoading: true, error: null });
            const reservations = await services.reservation.getReservations(hotelId);
            
            set({ 
              cachedReservations: reservations,
              lastFetch: { ...state.lastFetch, reservations: Date.now() },
              isLoading: false 
            });
            
            return reservations;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reservations';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        fetchRooms: async (hotelId: string, force = false) => {
          const state = get();
          
          if (!force && 
              state.currentHotelId === hotelId && 
              isCacheFresh(state.lastFetch.rooms) && 
              state.cachedRooms.length > 0) {
            return state.cachedRooms;
          }
          
          try {
            set({ isLoading: true, error: null });
            const rooms = await services.room.getRooms(hotelId);
            
            set({ 
              cachedRooms: rooms,
              lastFetch: { ...state.lastFetch, rooms: Date.now() },
              isLoading: false 
            });
            
            return rooms;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch rooms';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        fetchGuests: async (hotelId: string, force = false) => {
          const state = get();
          
          if (!force && 
              state.currentHotelId === hotelId && 
              isCacheFresh(state.lastFetch.guests) && 
              state.cachedGuests.length > 0) {
            return state.cachedGuests;
          }
          
          try {
            set({ isLoading: true, error: null });
            const guests = await services.guest.getGuests(hotelId);
            
            set({ 
              cachedGuests: guests,
              lastFetch: { ...state.lastFetch, guests: Date.now() },
              isLoading: false 
            });
            
            return guests;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch guests';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        fetchHousekeepingTasks: async (hotelId: string, force = false) => {
          const state = get();
          
          if (!force && 
              state.currentHotelId === hotelId && 
              isCacheFresh(state.lastFetch.tasks) && 
              state.cachedTasks.length > 0) {
            return state.cachedTasks;
          }
          
          try {
            set({ isLoading: true, error: null });
            const tasks = await services.housekeeping.getTasks(hotelId);
            
            set({ 
              cachedTasks: tasks,
              lastFetch: { ...state.lastFetch, tasks: Date.now() },
              isLoading: false 
            });
            
            return tasks;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch housekeeping tasks';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        fetchOccupancyData: async (hotelId: string, startDate: string, endDate: string, force = false) => {
          const state = get();
          
          if (!force && 
              state.currentHotelId === hotelId && 
              isCacheFresh(state.lastFetch.occupancy) && 
              state.cachedOccupancyData.length > 0) {
            return state.cachedOccupancyData;
          }
          
          try {
            set({ isLoading: true, error: null });
            const occupancyData = await services.reservation.getOccupancyData(hotelId, startDate, endDate);
            
            set({ 
              cachedOccupancyData: occupancyData,
              lastFetch: { ...state.lastFetch, occupancy: Date.now() },
              isLoading: false 
            });
            
            return occupancyData;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch occupancy data';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        // CRUD operations with optimistic updates and cache invalidation
        createReservation: async (reservation) => {
          try {
            set({ isLoading: true, error: null });
            const newReservation = await services.reservation.createReservation(reservation);
            
            // Update cache optimistically
            set((state) => ({
              cachedReservations: [...state.cachedReservations, newReservation],
              isLoading: false
            }));
            
            // Invalidate related caches
            get().invalidateCache('occupancy');
            
            // Audit log
            await auditLogger.logReservationCreated(
              newReservation.id,
              newReservation.guest_name,
              newReservation.total_amount
            );
            
            toast({
              title: "Reservation Created",
              description: `Reservation ${newReservation.code} created successfully.`
            });
            
            return newReservation;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create reservation';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        updateReservation: async (id, updates) => {
          try {
            set({ isLoading: true, error: null });
            const updatedReservation = await services.reservation.updateReservation(id, updates);
            
            // Update cache optimistically
            set((state) => ({
              cachedReservations: state.cachedReservations.map(res => 
                res.id === id ? updatedReservation : res
              ),
              isLoading: false
            }));
            
            // Invalidate related caches
            get().invalidateCache('occupancy');
            
            // Audit log
            await auditLogger.logReservationUpdated(id, {}, updates);
            
            toast({
              title: "Reservation Updated",
              description: `Reservation ${updatedReservation.code} updated successfully.`
            });
            
            return updatedReservation;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update reservation';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        deleteReservation: async (id) => {
          try {
            set({ isLoading: true, error: null });
            await services.reservation.deleteReservation(id);
            
            // Update cache optimistically
            set((state) => ({
              cachedReservations: state.cachedReservations.filter(res => res.id !== id),
              isLoading: false
            }));
            
            // Invalidate related caches
            get().invalidateCache('occupancy');
            
            toast({
              title: "Reservation Deleted",
              description: "Reservation has been deleted successfully."
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete reservation';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        updateRoomStatus: async (roomId, status, notes) => {
          try {
            set({ isLoading: true, error: null });
            const updatedRoom = await services.room.updateRoomStatus(roomId, status, notes);
            
            // Update cache optimistically
            set((state) => ({
              cachedRooms: state.cachedRooms.map(room => 
                room.id === roomId ? updatedRoom : room
              ),
              isLoading: false
            }));
            
            toast({
              title: "Room Status Updated",
              description: `Room ${updatedRoom.number} status changed to ${status}.`
            });
            
            return updatedRoom;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update room status';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        createGuest: async (guest) => {
          try {
            set({ isLoading: true, error: null });
            const newGuest = await services.guest.createGuest(guest);
            
            // Update cache optimistically
            set((state) => ({
              cachedGuests: [...state.cachedGuests, newGuest],
              isLoading: false
            }));
            
            toast({
              title: "Guest Created",
              description: `Guest ${newGuest.first_name} ${newGuest.last_name} created successfully.`
            });
            
            return newGuest;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create guest';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        updateGuest: async (id, updates) => {
          try {
            set({ isLoading: true, error: null });
            const updatedGuest = await services.guest.updateGuest(id, updates);
            
            // Update cache optimistically
            set((state) => ({
              cachedGuests: state.cachedGuests.map(guest => 
                guest.id === id ? updatedGuest : guest
              ),
              isLoading: false
            }));
            
            toast({
              title: "Guest Updated",
              description: `Guest ${updatedGuest.first_name} ${updatedGuest.last_name} updated successfully.`
            });
            
            return updatedGuest;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update guest';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        createHousekeepingTask: async (task) => {
          try {
            set({ isLoading: true, error: null });
            const newTask = await services.housekeeping.createTask(task);
            
            // Update cache optimistically
            set((state) => ({
              cachedTasks: [...state.cachedTasks, newTask],
              isLoading: false
            }));
            
            toast({
              title: "Task Created",
              description: "Housekeeping task created successfully."
            });
            
            return newTask;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create housekeeping task';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        updateHousekeepingTask: async (id, updates) => {
          try {
            set({ isLoading: true, error: null });
            const updatedTask = await services.housekeeping.updateTask(id, updates);
            
            // Update cache optimistically
            set((state) => ({
              cachedTasks: state.cachedTasks.map(task => 
                task.id === id ? updatedTask : task
              ),
              isLoading: false
            }));
            
            toast({
              title: "Task Updated",
              description: "Housekeeping task updated successfully."
            });
            
            return updatedTask;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update housekeeping task';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        // Cache management
        invalidateCache: (type) => {
          if (type) {
            set((state) => ({
              lastFetch: { ...state.lastFetch, [type]: 0 }
            }));
          } else {
            set({ lastFetch: {} });
          }
        },
        
        clearAllCache: () => {
          set({
            cachedReservations: [],
            cachedRooms: [],
            cachedGuests: [],
            cachedTasks: [],
            cachedOccupancyData: [],
            lastFetch: {}
          });
        }
      })),
      {
        name: 'production-hms-store',
        partialize: (state) => ({
          currentHotelId: state.currentHotelId,
          selectedMonth: state.selectedMonth,
          // Don't persist cache data - fetch fresh on load
        })
      }
    ),
    { name: 'Production HMS Store' }
  )
);