import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IntegrationUsage {
  id: string;
  integrationId: string;
  requestCount: number;
  errorCount: number;
  lastRequestAt: string;
  creditUsage: number;
  usageDate: string;
}

interface IntegrationStatus {
  isConnected: boolean;
  lastChecked: Date | null;
  error: string | null;
  creditInfo: {
    remaining: number;
    resetsIn: number;
    requestCost: number;
  } | null;
}

export function useIntegrationManagement(organizationId: string) {
  const [status, setStatus] = useState<IntegrationStatus>({
    isConnected: false,
    lastChecked: null,
    error: null,
    creditInfo: null
  });
  const [usageHistory, setUsageHistory] = useState<IntegrationUsage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const updateUsage = useCallback(async (
    integrationId: string,
    requestCount: number,
    creditUsage: number,
    errorCount: number = 0
  ) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('integration_usage')
        .upsert({
          integration_id: integrationId,
          usage_date: today,
          request_count: requestCount,
          error_count: errorCount,
          credit_usage: creditUsage,
          last_request_at: new Date().toISOString()
        }, {
          onConflict: 'integration_id,usage_date'
        });

      if (error) {
        console.error('Failed to update usage:', error);
      }
    } catch (error) {
      console.error('Error updating integration usage:', error);
    }
  }, []);

  const getUsageHistory = useCallback(async (integrationId: string, days: number = 30) => {
    setIsLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('integration_usage')
        .select('*')
        .eq('integration_id', integrationId)
        .gte('captured_at', startDate.toISOString())
        .order('captured_at', { ascending: true });

      if (error) {
        toast.error('Failed to fetch usage history');
        return [];
      }

      const mappedData: IntegrationUsage[] = (data || []).map(item => ({
        id: item.id,
        integrationId: item.integration_id,
        requestCount: item.x_request_cost || 0,
        errorCount: 0, // Not available in current schema
        lastRequestAt: item.captured_at || '',
        creditUsage: item.x_request_cost || 0,
        usageDate: item.captured_at?.split('T')[0] || ''
      }));

      setUsageHistory(mappedData);
      return mappedData;
    } catch (error) {
      console.error('Error fetching usage history:', error);
      toast.error('Failed to fetch usage history');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStatus = useCallback((newStatus: Partial<IntegrationStatus>) => {
    setStatus(prev => ({ ...prev, ...newStatus }));
  }, []);

  return {
    status,
    usageHistory,
    isLoading,
    updateUsage,
    getUsageHistory,
    updateStatus
  };
}