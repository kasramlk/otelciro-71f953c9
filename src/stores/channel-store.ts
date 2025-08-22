import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Channel Manager Data Types
export interface RoomType {
  id: string;
  code: string;
  name: string;
  capacity: number;
  sortOrder: number;
}

export interface RatePlan {
  id: string;
  code: string;
  name: string;
  derivedOf?: string;
  derivationType?: 'percent' | 'amount';
  derivationValue?: number;
  isDerived: boolean;
}

export interface InventoryCalendar {
  id: string;
  date: string;
  roomTypeId: string;
  totalRooms: number;
  soldRooms: number;
  outOfOrderRooms: number;
}

export interface ARIValue {
  id: string;
  date: string;
  roomTypeId: string;
  ratePlanId: string;
  rateCents: number;
  minLos: number;
  maxLos: number;
  cta: boolean;
  ctd: boolean;
  stopSell: boolean;
  source: 'manual' | 'ai' | 'rules';
  overridden: boolean;
}

export interface ChannelMapping {
  id: string;
  roomTypeId: string;
  ratePlanId: string;
  gdsProductCode: string;
  isActive: boolean;
}

export interface PublishQueueItem {
  id: string;
  timestamp: string;
  kind: 'rate' | 'availability' | 'restriction';
  dateFrom: string;
  dateTo: string;
  scope: any;
  status: 'queued' | 'sending' | 'success' | 'failed' | 'retrying';
  attempt: number;
  lastError?: string;
  idempotencyKey: string;
}

export interface GDSSnapshot {
  id: string;
  timestamp: string;
  date: string;
  roomTypeId: string;
  ratePlanId: string;
  rateCents: number;
  availability: number;
  minLos: number;
  maxLos: number;
  cta: boolean;
  ctd: boolean;
  stopSell: boolean;
  channel: string;
}

export interface InboundOrder {
  id: string;
  timestampReceived: string;
  payload: any;
  status: 'pending' | 'applied' | 'rejected';
  reason?: string;
  idempotencyKey: string;
  agencyCode: string;
  signatureOk: boolean;
}

export interface Reservation {
  id: string;
  gdsRef?: string;
  pnr?: string;
  status: 'new' | 'confirmed' | 'modified' | 'cancelled';
  checkIn: string;
  checkOut: string;
  roomTypeId: string;
  ratePlanId: string;
  guestName: string;
  email: string;
  phone: string;
  totalCents: number;
  currency: string;
  agencyCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  payload: any;
}

// Store Interface
interface ChannelStore {
  // Data
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  inventoryCalendar: InventoryCalendar[];
  ariValues: ARIValue[];
  channelMappings: ChannelMapping[];
  publishQueue: PublishQueueItem[];
  gdsSnapshots: GDSSnapshot[];
  inboundOrders: InboundOrder[];
  reservations: Reservation[];
  auditLog: AuditLog[];

  // UI State
  selectedDateRange: { from: string; to: string };
  selectedRoomTypes: string[];
  selectedRatePlans: string[];
  activeTab: 'rates' | 'availability' | 'restrictions' | 'all';
  pendingChanges: Map<string, Partial<ARIValue>>;
  
  // Undo/Redo
  history: any[];
  historyIndex: number;

  // Actions
  setSelectedDateRange: (range: { from: string; to: string }) => void;
  setSelectedRoomTypes: (roomTypeIds: string[]) => void;
  setSelectedRatePlans: (ratePlanIds: string[]) => void;
  setActiveTab: (tab: 'rates' | 'availability' | 'restrictions' | 'all') => void;
  
  // ARI Operations
  updateARIValue: (key: string, updates: Partial<ARIValue>) => void;
  bulkUpdateARI: (updates: { dates: string[]; roomTypeIds: string[]; ratePlanIds: string[]; changes: Partial<ARIValue> }) => void;
  clearPendingChanges: () => void;
  
  // Mapping Operations
  updateChannelMapping: (roomTypeId: string, ratePlanId: string, gdsProductCode: string) => void;
  deleteChannelMapping: (roomTypeId: string, ratePlanId: string) => void;
  
  // Publish Operations
  enqueuePublish: (items: Omit<PublishQueueItem, 'id' | 'timestamp'>[]) => void;
  processPublishQueue: () => Promise<void>;
  
  // Reconciliation
  fetchGDSSnapshots: () => Promise<void>;
  compareWithGDS: () => any[];
  forceFullRefresh: (dateRange: { from: string; to: string }) => Promise<void>;
  
  // Inbound Orders
  addInboundOrder: (order: Omit<InboundOrder, 'id' | 'timestampReceived'>) => void;
  processInboundOrder: (orderId: string, action: 'apply' | 'reject', reason?: string) => void;
  
  // Audit
  addAuditEntry: (entry: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  addToHistory: (state: any) => void;
}

// Mock Data
const mockRoomTypes: RoomType[] = [
  { id: '1', code: 'STD', name: 'Standard Double', capacity: 2, sortOrder: 1 },
  { id: '2', code: 'DLX', name: 'Deluxe Double', capacity: 2, sortOrder: 2 },
  { id: '3', code: 'TWN', name: 'Twin Garden', capacity: 2, sortOrder: 3 },
  { id: '4', code: 'FAM', name: 'Family', capacity: 4, sortOrder: 4 },
  { id: '5', code: 'STE', name: 'Suite Sea', capacity: 3, sortOrder: 5 },
];

const mockRatePlans: RatePlan[] = [
  { id: '1', code: 'BAR', name: 'Best Available Rate', isDerived: false },
  { id: '2', code: 'NR', name: 'Non-Refundable', derivedOf: '1', derivationType: 'percent', derivationValue: -10, isDerived: true },
  { id: '3', code: 'BB', name: 'Bed & Breakfast', derivedOf: '1', derivationType: 'amount', derivationValue: 10, isDerived: true },
];

// Generate initial ARI data
const generateInitialARIData = (): ARIValue[] => {
  const data: ARIValue[] = [];
  const startDate = new Date();
  
  for (let i = 0; i < 120; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    mockRoomTypes.forEach(roomType => {
      mockRatePlans.forEach(ratePlan => {
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        let baseRate = isWeekend ? 12000 : 10000; // cents
        
        // Apply derivation
        if (ratePlan.isDerived && ratePlan.derivedOf && ratePlan.derivationType && ratePlan.derivationValue) {
          if (ratePlan.derivationType === 'percent') {
            baseRate = baseRate * (1 + ratePlan.derivationValue / 100);
          } else {
            baseRate += ratePlan.derivationValue * 100; // convert to cents
          }
        }
        
        data.push({
          id: `ari-${dateStr}-${roomType.id}-${ratePlan.id}`,
          date: dateStr,
          roomTypeId: roomType.id,
          ratePlanId: ratePlan.id,
          rateCents: Math.round(baseRate),
          minLos: 1,
          maxLos: 0,
          cta: false,
          ctd: false,
          stopSell: false,
          source: 'manual',
          overridden: false,
        });
      });
    });
  }
  
  return data;
};

// Generate initial inventory data
const generateInitialInventory = (): InventoryCalendar[] => {
  const data: InventoryCalendar[] = [];
  const startDate = new Date();
  
  for (let i = 0; i < 120; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    mockRoomTypes.forEach(roomType => {
      const totalRooms = Math.floor(Math.random() * 15) + 10;
      const soldRooms = Math.floor(Math.random() * totalRooms * 0.8);
      
      data.push({
        id: `inv-${dateStr}-${roomType.id}`,
        date: dateStr,
        roomTypeId: roomType.id,
        totalRooms,
        soldRooms,
        outOfOrderRooms: 0,
      });
    });
  }
  
  return data;
};

export const useChannelStore = create<ChannelStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial data
        roomTypes: mockRoomTypes,
        ratePlans: mockRatePlans,
        inventoryCalendar: generateInitialInventory(),
        ariValues: generateInitialARIData(),
        channelMappings: [],
        publishQueue: [],
        gdsSnapshots: [],
        inboundOrders: [],
        reservations: [],
        auditLog: [],

        // UI State
        selectedDateRange: {
          from: new Date().toISOString().split('T')[0],
          to: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        selectedRoomTypes: mockRoomTypes.map(rt => rt.id),
        selectedRatePlans: mockRatePlans.map(rp => rp.id),
        activeTab: 'all',
        pendingChanges: new Map(),
        
        // Undo/Redo
        history: [],
        historyIndex: -1,

        // Actions
        setSelectedDateRange: (range) => set({ selectedDateRange: range }),
        setSelectedRoomTypes: (roomTypeIds) => set({ selectedRoomTypes: roomTypeIds }),
        setSelectedRatePlans: (ratePlanIds) => set({ selectedRatePlans: ratePlanIds }),
        setActiveTab: (tab) => set({ activeTab: tab }),

        // ARI Operations
        updateARIValue: (key, updates) => {
          set((state) => {
            const newPendingChanges = new Map(state.pendingChanges);
            const existing = newPendingChanges.get(key) || {};
            newPendingChanges.set(key, { ...existing, ...updates });
            return { pendingChanges: newPendingChanges };
          });
        },

        bulkUpdateARI: ({ dates, roomTypeIds, ratePlanIds, changes }) => {
          set((state) => {
            const newPendingChanges = new Map(state.pendingChanges);
            
            dates.forEach(date => {
              roomTypeIds.forEach(roomTypeId => {
                ratePlanIds.forEach(ratePlanId => {
                  const key = `ari-${date}-${roomTypeId}-${ratePlanId}`;
                  const existing = newPendingChanges.get(key) || {};
                  newPendingChanges.set(key, { ...existing, ...changes });
                });
              });
            });
            
            return { pendingChanges: newPendingChanges };
          });
        },

        clearPendingChanges: () => {
          set((state) => {
            // Apply pending changes to actual data
            const newARIValues = [...state.ariValues];
            
            state.pendingChanges.forEach((changes, key) => {
              const index = newARIValues.findIndex(ari => ari.id === key);
              if (index !== -1) {
                newARIValues[index] = { ...newARIValues[index], ...changes };
              }
            });
            
            return {
              ariValues: newARIValues,
              pendingChanges: new Map(),
            };
          });
        },

        // Mapping Operations
        updateChannelMapping: (roomTypeId, ratePlanId, gdsProductCode) => {
          set((state) => {
            const newMappings = state.channelMappings.filter(
              m => !(m.roomTypeId === roomTypeId && m.ratePlanId === ratePlanId)
            );
            
            if (gdsProductCode) {
              newMappings.push({
                id: `mapping-${roomTypeId}-${ratePlanId}`,
                roomTypeId,
                ratePlanId,
                gdsProductCode,
                isActive: true,
              });
            }
            
            return { channelMappings: newMappings };
          });
        },

        deleteChannelMapping: (roomTypeId, ratePlanId) => {
          set((state) => ({
            channelMappings: state.channelMappings.filter(
              m => !(m.roomTypeId === roomTypeId && m.ratePlanId === ratePlanId)
            ),
          }));
        },

        // Publish Operations
        enqueuePublish: (items) => {
          set((state) => {
            const newItems = items.map(item => ({
              ...item,
              id: `pub-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toISOString(),
            }));
            
            return {
              publishQueue: [...state.publishQueue, ...newItems],
            };
          });
        },

        processPublishQueue: async () => {
          const { publishQueue } = get();
          const queuedItems = publishQueue.filter(item => item.status === 'queued');
          
          for (const item of queuedItems) {
            set((state) => ({
              publishQueue: state.publishQueue.map(qi =>
                qi.id === item.id ? { ...qi, status: 'sending' } : qi
              ),
            }));
            
            try {
              // Mock API call
              await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
              
              if (Math.random() > 0.1) { // 90% success rate
                set((state) => ({
                  publishQueue: state.publishQueue.map(qi =>
                    qi.id === item.id ? { ...qi, status: 'success' } : qi
                  ),
                }));
              } else {
                throw new Error('Mock API failure');
              }
            } catch (error) {
              set((state) => ({
                publishQueue: state.publishQueue.map(qi =>
                  qi.id === item.id 
                    ? { 
                        ...qi, 
                        status: qi.attempt >= 5 ? 'failed' : 'retrying',
                        attempt: qi.attempt + 1,
                        lastError: (error as Error).message,
                      } 
                    : qi
                ),
              }));
            }
          }
        },

        // Reconciliation
        fetchGDSSnapshots: async () => {
          // Mock fetching GDS snapshots
          const { ariValues } = get();
          const snapshots: GDSSnapshot[] = ariValues.map(ari => ({
            id: `snapshot-${ari.id}`,
            timestamp: new Date().toISOString(),
            date: ari.date,
            roomTypeId: ari.roomTypeId,
            ratePlanId: ari.ratePlanId,
            rateCents: ari.rateCents + (Math.random() > 0.8 ? Math.floor(Math.random() * 1000) : 0),
            availability: Math.floor(Math.random() * 20),
            minLos: ari.minLos,
            maxLos: ari.maxLos,
            cta: ari.cta,
            ctd: ari.ctd,
            stopSell: ari.stopSell,
            channel: 'mini-gds',
          }));
          
          set({ gdsSnapshots: snapshots });
        },

        compareWithGDS: () => {
          const { ariValues, gdsSnapshots, inventoryCalendar } = get();
          const diffs = [];
          
          for (const ari of ariValues) {
            const gds = gdsSnapshots.find(s => 
              s.date === ari.date && 
              s.roomTypeId === ari.roomTypeId && 
              s.ratePlanId === ari.ratePlanId
            );
            
            const inventory = inventoryCalendar.find(i => 
              i.date === ari.date && i.roomTypeId === ari.roomTypeId
            );
            
            if (gds) {
              const rateDiff = ari.rateCents !== gds.rateCents;
              const availDiff = inventory && (inventory.totalRooms - inventory.soldRooms) !== gds.availability;
              
              if (rateDiff || availDiff) {
                diffs.push({
                  date: ari.date,
                  roomTypeId: ari.roomTypeId,
                  ratePlanId: ari.ratePlanId,
                  pmsRate: ari.rateCents,
                  gdsRate: gds.rateCents,
                  pmsAvail: inventory ? inventory.totalRooms - inventory.soldRooms : 0,
                  gdsAvail: gds.availability,
                  rateDiff,
                  availDiff,
                });
              }
            }
          }
          
          return diffs;
        },

        forceFullRefresh: async (dateRange) => {
          const { ariValues, inventoryCalendar } = get();
          
          // Create publish queue items for full refresh
          const items: Omit<PublishQueueItem, 'id' | 'timestamp'>[] = [
            {
              kind: 'rate',
              dateFrom: dateRange.from,
              dateTo: dateRange.to,
              scope: { roomTypeIds: mockRoomTypes.map(rt => rt.id), ratePlanIds: mockRatePlans.map(rp => rp.id) },
              status: 'queued',
              attempt: 0,
              idempotencyKey: `refresh-${Date.now()}`,
            },
            // Add availability and restriction items as needed
          ];
          
          get().enqueuePublish(items);
          await get().processPublishQueue();
        },

        // Inbound Orders
        addInboundOrder: (order) => {
          set((state) => ({
            inboundOrders: [...state.inboundOrders, {
              ...order,
              id: `order-${Date.now()}`,
              timestampReceived: new Date().toISOString(),
            }],
          }));
        },

        processInboundOrder: (orderId, action, reason) => {
          set((state) => {
            const order = state.inboundOrders.find(o => o.id === orderId);
            if (!order) return state;
            
            const newStatus: 'pending' | 'applied' | 'rejected' = action === 'apply' ? 'applied' : 'rejected';
            const newOrders = state.inboundOrders.map(o =>
              o.id === orderId ? { ...o, status: newStatus, reason } : o
            );
            
            let newReservations = state.reservations;
            
            if (action === 'apply' && order.payload) {
              // Create new reservation from order payload
              const reservation: Reservation = {
                id: `res-${Date.now()}`,
                gdsRef: order.payload.reservation_id,
                status: 'confirmed',
                checkIn: order.payload.stay.check_in,
                checkOut: order.payload.stay.check_out,
                roomTypeId: '1', // This would be mapped from order.payload.room_type_code
                ratePlanId: '1', // This would be mapped from order.payload.rate_plan_code
                guestName: order.payload.guest.name,
                email: order.payload.guest.email,
                phone: order.payload.guest.phone,
                totalCents: order.payload.total_cents,
                currency: order.payload.currency,
                agencyCode: order.agencyCode,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              
              newReservations = [...state.reservations, reservation];
            }
            
            return {
              inboundOrders: newOrders,
              reservations: newReservations,
            };
          });
        },

        // Audit
        addAuditEntry: (entry) => {
          set((state) => ({
            auditLog: [...state.auditLog, {
              ...entry,
              id: `audit-${Date.now()}`,
              timestamp: new Date().toISOString(),
            }],
          }));
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
      }),
      {
        name: 'channel-store',
        partialize: (state) => ({
          channelMappings: state.channelMappings,
          selectedDateRange: state.selectedDateRange,
          selectedRoomTypes: state.selectedRoomTypes,
          selectedRatePlans: state.selectedRatePlans,
        }),
      }
    ),
    { name: 'Channel Store' }
  )
);