import { supabase } from './supabase';
/**
 * Subscribe to real-time changes for a specific table
 */
export function subscribeToTable(table, handlers, filter) {
    const channelName = `${table}_changes_${Date.now()}`;
    let channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter
    }, (payload) => {
        console.log('Realtime change:', payload);
        switch (payload.eventType) {
            case 'INSERT':
                handlers.onInsert?.(payload);
                break;
            case 'UPDATE':
                handlers.onUpdate?.(payload);
                break;
            case 'DELETE':
                handlers.onDelete?.(payload);
                break;
        }
    })
        .subscribe();
    return {
        channel,
        unsubscribe: () => {
            supabase.removeChannel(channel);
        }
    };
}
/**
 * Subscribe to check-in status changes for an organization
 */
export function subscribeToCheckIns(organizationId, handlers) {
    return subscribeToTable('check_ins', handlers, `organization_id=eq.${organizationId}`);
}
/**
 * Subscribe to incident changes for an organization
 */
export function subscribeToIncidents(organizationId, handlers) {
    return subscribeToTable('incidents', handlers, `organization_id=eq.${organizationId}`);
}
/**
 * Subscribe to escalation rule changes for an organization
 */
export function subscribeToEscalations(organizationId, handlers) {
    return subscribeToTable('escalations', handlers, `organization_id=eq.${organizationId}`);
}
/**
 * Subscribe to user status changes for an organization
 */
export function subscribeToUsers(organizationId, handlers) {
    return subscribeToTable('users', handlers, `organization_id=eq.${organizationId}`);
}
/**
 * Subscribe to schedule changes for an organization
 */
export function subscribeToSchedules(organizationId, handlers) {
    return subscribeToTable('schedules', handlers, `organization_id=eq.${organizationId}`);
}
/**
 * React hook for real-time subscriptions (remove React import dependency)
 */
// Note: This hook would require React import in the consuming component
/**
 * Multi-table subscription manager
 */
export class RealtimeManager {
    constructor(organizationId) {
        this.subscriptions = new Map();
        this.organizationId = organizationId;
    }
    /**
     * Subscribe to check-ins with automatic cleanup
     */
    subscribeToCheckIns(handlers) {
        const key = 'check_ins';
        this.unsubscribe(key);
        const subscription = subscribeToCheckIns(this.organizationId, handlers);
        this.subscriptions.set(key, subscription);
        return subscription;
    }
    /**
     * Subscribe to incidents with automatic cleanup
     */
    subscribeToIncidents(handlers) {
        const key = 'incidents';
        this.unsubscribe(key);
        const subscription = subscribeToIncidents(this.organizationId, handlers);
        this.subscriptions.set(key, subscription);
        return subscription;
    }
    /**
     * Subscribe to escalations with automatic cleanup
     */
    subscribeToEscalations(handlers) {
        const key = 'escalations';
        this.unsubscribe(key);
        const subscription = subscribeToEscalations(this.organizationId, handlers);
        this.subscriptions.set(key, subscription);
        return subscription;
    }
    /**
     * Subscribe to users with automatic cleanup
     */
    subscribeToUsers(handlers) {
        const key = 'users';
        this.unsubscribe(key);
        const subscription = subscribeToUsers(this.organizationId, handlers);
        this.subscriptions.set(key, subscription);
        return subscription;
    }
    /**
     * Subscribe to schedules with automatic cleanup
     */
    subscribeToSchedules(handlers) {
        const key = 'schedules';
        this.unsubscribe(key);
        const subscription = subscribeToSchedules(this.organizationId, handlers);
        this.subscriptions.set(key, subscription);
        return subscription;
    }
    /**
     * Unsubscribe from a specific table
     */
    unsubscribe(key) {
        const subscription = this.subscriptions.get(key);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(key);
        }
    }
    /**
     * Unsubscribe from all tables
     */
    unsubscribeAll() {
        this.subscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
        this.subscriptions.clear();
    }
    /**
     * Get active subscription count
     */
    getActiveCount() {
        return this.subscriptions.size;
    }
}
/**
 * Global realtime status
 */
export const realtimeStatus = {
    isConnected: false,
    lastHeartbeat: null,
    reconnectAttempts: 0,
    updateStatus(connected) {
        this.isConnected = connected;
        this.lastHeartbeat = connected ? new Date() : null;
        if (connected) {
            this.reconnectAttempts = 0;
        }
    },
    incrementReconnectAttempts() {
        this.reconnectAttempts++;
    }
};
