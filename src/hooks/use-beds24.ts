import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { beds24Service, type Beds24Connection, type Beds24Property, type Beds24Channel } from "@/lib/services/beds24-service";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  
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
      toast({ title: "Success", description: "Beds24 connection created successfully" });
    },
    onError: (error) => {
      console.error('Failed to create Beds24 connection:', error);
      toast({ title: "Error", description: "Failed to create Beds24 connection", variant: "destructive" });
    },
  });
}

export function useTestBeds24Connection() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (connectionId: string) => beds24Service.testConnection(connectionId),
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: "Success", description: "Connection test successful" });
      } else {
        toast({ title: "Error", description: `Connection test failed: ${result.error}`, variant: "destructive" });
      }
    },
    onError: (error) => {
      console.error('Connection test failed:', error);
      toast({ title: "Error", description: "Connection test failed", variant: "destructive" });
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
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (connectionId: string) => beds24Service.syncProperties(connectionId),
    onSuccess: (result, connectionId) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: beds24QueryKeys.properties(connectionId) });
        toast({ title: "Success", description: "Properties synced successfully" });
      } else {
        toast({ title: "Error", description: `Failed to sync properties: ${result.error}`, variant: "destructive" });
      }
    },
    onError: (error) => {
      console.error('Failed to sync properties:', error);
      toast({ title: "Error", description: "Failed to sync properties", variant: "destructive" });
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
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (propertyId: string) => beds24Service.syncChannels(propertyId),
    onSuccess: (result, propertyId) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: beds24QueryKeys.channels(propertyId) });
        toast({ title: "Success", description: "Channels synced successfully" });
      } else {
        toast({ title: "Error", description: `Failed to sync channels: ${result.error}`, variant: "destructive" });
      }
    },
    onError: (error) => {
      console.error('Failed to sync channels:', error);
      toast({ title: "Error", description: "Failed to sync channels", variant: "destructive" });
    },
  });
}

// Inventory Hooks
export function usePushInventory() {
  const { toast } = useToast();
  
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
        toast({ title: "Success", description: "Inventory pushed successfully" });
      } else {
        toast({ title: "Error", description: `Failed to push inventory: ${result.error}`, variant: "destructive" });
      }
    },
    onError: (error) => {
      console.error('Failed to push inventory:', error);
      toast({ title: "Error", description: "Failed to push inventory", variant: "destructive" });
    },
  });
}

// Booking Hooks
export function usePullBookings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
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
        queryClient.invalidateQueries({ queryKey: ['reservations'] });
        toast({ title: "Success", description: `Pulled ${result.data?.length || 0} bookings successfully` });
      } else {
        toast({ title: "Error", description: `Failed to pull bookings: ${result.error}`, variant: "destructive" });
      }
    },
    onError: (error) => {
      console.error('Failed to pull bookings:', error);
      toast({ title: "Error", description: "Failed to pull bookings", variant: "destructive" });
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

export function useExchangeInviteCode() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (invitationToken: string) => beds24Service.exchangeInviteCode(invitationToken, '550e8400-e29b-41d4-a716-446655440000'),
    onSuccess: (result: any) => {
      if (result?.success) {
        toast({ title: "Success", description: "Invitation token exchanged successfully" });
      } else {
        toast({ title: "Error", description: `Failed to exchange token: ${result?.error || 'Unknown error'}`, variant: "destructive" });
      }
    },
    onError: (error) => {
      console.error('Failed to exchange invitation token:', error);
      toast({ title: "Error", description: "Failed to exchange invitation token", variant: "destructive" });
    },
  });
}