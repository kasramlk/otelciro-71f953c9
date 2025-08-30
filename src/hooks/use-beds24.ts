import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { beds24Service, type Beds24Connection, type Beds24Property, type Beds24Channel } from "@/lib/services/beds24-service";
import { toast } from "sonner";

// Query Keys
export const beds24QueryKeys = {
  connections: (hotelId: string) => ['beds24', 'connections', hotelId] as const,
  properties: (connectionId: string) => ['beds24', 'properties', connectionId] as const,
  channels: (propertyId: string) => ['beds24', 'channels', propertyId] as const,
  syncLogs: (connectionId: string) => ['beds24', 'sync-logs', connectionId] as const,
};

// Connection Hooks
export function useBeds24Connections(hotelId: string) {
  return useQuery({
    queryKey: beds24QueryKeys.connections(hotelId),
    queryFn: () => beds24Service.getConnections(hotelId),
    enabled: !!hotelId,
  });
}

export function useCreateBeds24Connection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ hotelId, connectionData }: {
      hotelId: string;
      connectionData: {
        account_id: string;
        account_email: string;
        refresh_token: string;
        scopes: string[];
        allow_linked_properties?: boolean;
        ip_whitelist?: string[];
      };
    }) => {
      const connection = await beds24Service.createConnection(hotelId, connectionData);
      if (!connection) {
        throw new Error('Failed to create Beds24 connection');
      }
      return connection;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: beds24QueryKeys.connections(variables.hotelId) });
      toast.success('Beds24 connection created successfully');
    },
    onError: (error) => {
      console.error('Failed to create Beds24 connection:', error);
      toast.error('Failed to create Beds24 connection');
    },
  });
}

export function useTestBeds24Connection() {
  return useMutation({
    mutationFn: (connectionId: string) => beds24Service.testConnection(connectionId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Connection test successful');
      } else {
        toast.error(`Connection test failed: ${result.error}`);
      }
    },
    onError: (error) => {
      console.error('Connection test failed:', error);
      toast.error('Connection test failed');
    },
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
    onSuccess: (result, connectionId) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: beds24QueryKeys.properties(connectionId) });
        toast.success('Properties synced successfully');
      } else {
        toast.error(`Failed to sync properties: ${result.error}`);
      }
    },
    onError: (error) => {
      console.error('Failed to sync properties:', error);
      toast.error('Failed to sync properties');
    },
  });
}

// Channel Hooks
export function useBeds24Channels(propertyId: string) {
  return useQuery({
    queryKey: beds24QueryKeys.channels(propertyId),
    queryFn: () => beds24Service.getChannels(propertyId),
    enabled: !!propertyId,
  });
}

export function useSyncBeds24Channels() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (propertyId: string) => beds24Service.syncChannels(propertyId),
    onSuccess: (result, propertyId) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: beds24QueryKeys.channels(propertyId) });
        toast.success('Channels synced successfully');
      } else {
        toast.error(`Failed to sync channels: ${result.error}`);
      }
    },
    onError: (error) => {
      console.error('Failed to sync channels:', error);
      toast.error('Failed to sync channels');
    },
  });
}

// Inventory Hooks
export function usePushInventory() {
  return useMutation({
    mutationFn: ({
      propertyId,
      inventoryData
    }: {
      propertyId: string;
      inventoryData: {
        roomTypeId: string;
        dateRange: { from: string; to: string };
        availability?: number;
        rates?: { [key: string]: number };
        restrictions?: any;
      };
    }) => beds24Service.pushInventory(propertyId, inventoryData),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Inventory pushed successfully');
      } else {
        toast.error(`Failed to push inventory: ${result.error}`);
      }
    },
    onError: (error) => {
      console.error('Failed to push inventory:', error);
      toast.error('Failed to push inventory');
    },
  });
}

// Booking Hooks
export function usePullBookings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      connectionId,
      dateRange
    }: {
      connectionId: string;
      dateRange?: { from: string; to: string };
    }) => beds24Service.pullBookings(connectionId, dateRange),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate reservations queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['reservations'] });
        toast.success(`Pulled ${result.data?.length || 0} bookings successfully`);
      } else {
        toast.error(`Failed to pull bookings: ${result.error}`);
      }
    },
    onError: (error) => {
      console.error('Failed to pull bookings:', error);
      toast.error('Failed to pull bookings');
    },
  });
}

// Sync Logs Hooks
export function useBeds24SyncLogs(connectionId: string) {
  return useQuery({
    queryKey: beds24QueryKeys.syncLogs(connectionId),
    queryFn: () => beds24Service.getSyncLogs(connectionId),
    enabled: !!connectionId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Exchange Invite Code Hook
export function useExchangeInviteCode() {
  return useMutation({
    mutationFn: (inviteCode: string) => beds24Service.exchangeInviteCode(inviteCode),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Invite code exchanged successfully');
      } else {
        toast.error(`Failed to exchange invite code: ${result.error}`);
      }
    },
    onError: (error) => {
      console.error('Failed to exchange invite code:', error);
      toast.error('Failed to exchange invite code');
    },
  });
}