import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  entity_type: string;
  entity_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

class AuditLogger {
  private async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Failed to get current user for audit log:', error);
      return null;
    }
  }

  private async getClientInfo() {
    try {
      // Get client IP (in production, this would come from headers)
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();
      
      return {
        ip_address: ip,
        user_agent: navigator.userAgent,
      };
    } catch (error) {
      return {
        ip_address: 'unknown',
        user_agent: navigator.userAgent,
      };
    }
  }

  private calculateDiff(oldValues: Record<string, any>, newValues: Record<string, any>): Record<string, any> {
    const diff: Record<string, any> = {};
    
    // Find changed, added, or removed fields
    const allKeys = new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]);
    
    allKeys.forEach(key => {
      const oldValue = oldValues?.[key];
      const newValue = newValues?.[key];
      
      if (oldValue !== newValue) {
        diff[key] = {
          from: oldValue,
          to: newValue,
        };
      }
    });
    
    return diff;
  }

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      const clientInfo = await getClientInfo();
      
      const auditEntry = {
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        action: entry.action,
        old_values: entry.old_values || null,
        new_values: entry.new_values || null,
        diff_json: entry.old_values && entry.new_values 
          ? this.calculateDiff(entry.old_values, entry.new_values)
          : null,
        user_id: entry.user_id || user?.id || null,
        ip_address: entry.ip_address || clientInfo.ip_address,
        user_agent: entry.user_agent || clientInfo.user_agent,
        metadata: entry.metadata || null,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('audit_log')
        .insert(auditEntry);

      if (error) {
        console.error('Failed to write audit log:', error);
      }
    } catch (error) {
      console.error('Error in audit logger:', error);
    }
  }

  // Specific methods for common operations
  async logReservationCreated(reservationId: string, reservationData: Record<string, any>, metadata?: Record<string, any>) {
    await this.log({
      entity_type: 'reservation',
      entity_id: reservationId,
      action: 'CREATE',
      new_values: reservationData,
      metadata: {
        source: 'web_app',
        module: 'reservations',
        ...metadata,
      },
    });
  }

  async logReservationUpdated(
    reservationId: string, 
    oldData: Record<string, any>, 
    newData: Record<string, any>,
    metadata?: Record<string, any>
  ) {
    await this.log({
      entity_type: 'reservation',
      entity_id: reservationId,
      action: 'UPDATE',
      old_values: oldData,
      new_values: newData,
      metadata: {
        source: 'web_app',
        module: 'reservations',
        ...metadata,
      },
    });
  }

  async logReservationCancelled(reservationId: string, reservationData: Record<string, any>, reason?: string) {
    await this.log({
      entity_type: 'reservation',
      entity_id: reservationId,
      action: 'DELETE',
      old_values: reservationData,
      metadata: {
        source: 'web_app',
        module: 'reservations',
        cancellation_reason: reason,
      },
    });
  }

  async logGuestCreated(guestId: string, guestData: Record<string, any>) {
    await this.log({
      entity_type: 'guest',
      entity_id: guestId,
      action: 'CREATE',
      new_values: guestData,
      metadata: {
        source: 'web_app',
        module: 'guests',
      },
    });
  }

  async logPaymentProcessed(paymentId: string, paymentData: Record<string, any>) {
    await this.log({
      entity_type: 'payment',
      entity_id: paymentId,
      action: 'CREATE',
      new_values: {
        ...paymentData,
        // Mask sensitive payment information
        card_number: paymentData.card_number ? '****-****-****-' + paymentData.card_number.slice(-4) : undefined,
      },
      metadata: {
        source: 'web_app',
        module: 'payments',
      },
    });
  }

  async logRoomAssignment(reservationId: string, roomId: string, oldRoomId?: string) {
    await this.log({
      entity_type: 'reservation',
      entity_id: reservationId,
      action: 'UPDATE',
      old_values: oldRoomId ? { room_id: oldRoomId } : null,
      new_values: { room_id: roomId },
      metadata: {
        source: 'web_app',
        module: 'room_assignment',
        operation: 'room_assignment',
      },
    });
  }

  async logUserAction(action: string, entityType: string, entityId: string, details?: Record<string, any>) {
    await this.log({
      entity_type: entityType,
      entity_id: entityId,
      action: 'VIEW',
      metadata: {
        source: 'web_app',
        user_action: action,
        ...details,
      },
    });
  }

  async logSystemError(error: Error, context?: string, additionalData?: Record<string, any>) {
    try {
      const user = await this.getCurrentUser();
      const clientInfo = await getClientInfo();

      const { error: logError } = await supabase
        .from('system_errors')
        .insert({
          error_type: 'application_error',
          error_message: error.message,
          error_stack: error.stack,
          context: context || 'unknown',
          user_id: user?.id || null,
          ip_address: clientInfo.ip_address,
          user_agent: clientInfo.user_agent,
          metadata: {
            url: window.location.href,
            timestamp: Date.now(),
            ...additionalData,
          },
          created_at: new Date().toISOString(),
        });

      if (logError) {
        console.error('Failed to log system error:', logError);
      }
    } catch (logError) {
      console.error('Error in system error logger:', logError);
    }
  }
}

// Create singleton instance
export const auditLogger = new AuditLogger();

// Hook for easy audit logging in React components
export const useAuditLogger = () => {
  return {
    logReservationCreated: auditLogger.logReservationCreated.bind(auditLogger),
    logReservationUpdated: auditLogger.logReservationUpdated.bind(auditLogger),
    logReservationCancelled: auditLogger.logReservationCancelled.bind(auditLogger),
    logGuestCreated: auditLogger.logGuestCreated.bind(auditLogger),
    logPaymentProcessed: auditLogger.logPaymentProcessed.bind(auditLogger),
    logRoomAssignment: auditLogger.logRoomAssignment.bind(auditLogger),
    logUserAction: auditLogger.logUserAction.bind(auditLogger),
    logSystemError: auditLogger.logSystemError.bind(auditLogger),
  };
};

// Utility function for tracking performance
export const performanceLogger = {
  async logSlowQuery(query: string, duration: number, results: number) {
    if (duration > 1000) { // Log queries slower than 1 second
      await auditLogger.log({
        entity_type: 'system',
        entity_id: 'performance',
        action: 'VIEW',
        metadata: {
          type: 'slow_query',
          query,
          duration_ms: duration,
          result_count: results,
          threshold: 1000,
        },
      });
    }
  },

  async logPageLoad(page: string, loadTime: number) {
    if (loadTime > 3000) { // Log slow page loads
      await auditLogger.log({
        entity_type: 'system',
        entity_id: 'performance',
        action: 'VIEW',
        metadata: {
          type: 'slow_page_load',
          page,
          load_time_ms: loadTime,
          threshold: 3000,
        },
      });
    }
  },
};