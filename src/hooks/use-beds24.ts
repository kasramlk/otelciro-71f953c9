import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { beds24Service } from "@/lib/services/beds24-service";

// Query Keys
export const beds24QueryKeys = {
  all: ['beds24'] as const,
  connections: (hotelId: string) => [...beds24QueryKeys.all, 'connections', hotelId] as const,
  properties: (connectionId: string) => [...beds24QueryKeys.all, 'properties', connectionId] as const,
  channels: (propertyId: string) => [...beds24QueryKeys.all, 'channels', propertyId] as const,
  inventory: (propertyId: string, dateRange?: { from: string; to: string }) => 
    [...beds24QueryKeys.all, 'inventory', propertyId, dateRange] as const,
  syncLogs: (connectionId: string) => [...beds24QueryKeys.all, 'syncLogs', connectionId] as const,
};

// Connection Hooks
export function useBeds24Connections(hotelId: string) {
  return useQuery({
    queryKey: beds24QueryKeys.connections(hotelId),
    queryFn: () => beds24Service.getConnections(hotelId),
    enabled: !!hotelId,
  });
}

export function useSetupBeds24Connection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invitationCode, hotelId }: { invitationCode: string; hotelId: string }) =>
      beds24Service.setupConnection(invitationCode, hotelId),
    onSuccess: (_, { hotelId }) => {
      queryClient.invalidateQueries({ queryKey: beds24QueryKeys.connections(hotelId) });
    },
  });
}

export function useTestBeds24Connection() {
  return useMutation({
    mutationFn: (connectionId: string) => beds24Service.testConnection(connectionId),
  });
}

// Property Hooks
export function useBeds24Properties(connectionId: string) {
  return useQuery({
    queryKey: beds24QueryKeys.properties(connectionId),
    queryFn: () => beds24Service.getProperties(connectionId),
    enabled: !!connectionId,
  });
}

export function useSyncBeds24Properties() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (connectionId: string) => beds24Service.syncProperties(connectionId),
    onSuccess: (_, connectionId) => {
      queryClient.invalidateQueries({ queryKey: beds24QueryKeys.properties(connectionId) });
    },
  });
}

// Channel Hooks - Temporarily disabled until full implementation
export function useBeds24Channels(propertyId: string) {
  return useQuery({
    queryKey: beds24QueryKeys.channels(propertyId),
    queryFn: () => Promise.resolve([]),
    enabled: false,
  });
}

export function useSyncBeds24Channels() {
  return useMutation({
    mutationFn: (propertyId: string) => Promise.resolve({ success: true, data: [] }),
    onSuccess: () => {
      // No-op for now
    },
  });
}

// Inventory Hooks
export function useBeds24Inventory(propertyId: string, dateRange?: { from: string; to: string }) {
  return useQuery({
    queryKey: beds24QueryKeys.inventory(propertyId, dateRange),
    queryFn: () => beds24Service.getInventory(propertyId, dateRange),
    enabled: !!propertyId,
  });
}

export function useSyncBeds24Inventory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ connectionId, propertyId, dateRange }: {
      connectionId: string;
      propertyId: string;
      dateRange: { from: string; to: string };
    }) => beds24Service.syncInventory(connectionId, propertyId, dateRange),
    onSuccess: (_, { propertyId, dateRange }) => {
      queryClient.invalidateQueries({ queryKey: beds24QueryKeys.inventory(propertyId, dateRange) });
    },
  });
}

export function usePushInventory() {
  return useMutation({
    mutationFn: ({ connectionId, propertyId, inventoryData }: {
      connectionId: string;
      propertyId: string;
      inventoryData: {
        roomTypeId: string;
        dateRange: { from: string; to: string };
        availability?: number;
        rates?: { [key: string]: number };
        restrictions?: any;
      };
    }) => beds24Service.pushInventory(connectionId, propertyId, inventoryData),
  });
}

// Booking Hooks
export function usePullBookings() {
  return useMutation({
    mutationFn: ({ connectionId, dateRange }: {
      connectionId: string;
      dateRange?: { from: string; to: string };
    }) => beds24Service.pullBookings(connectionId, dateRange),
  });
}

// Sync Logs - Temporarily disabled until full implementation
export function useBeds24SyncLogs(connectionId: string) {
  return useQuery({
    queryKey: beds24QueryKeys.syncLogs(connectionId),
    queryFn: () => Promise.resolve([]),
    enabled: false,
  });
}