import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { getCheckIns, getLatestCheckIns, getCheckInStats, getOverdueCheckIns, subscribeToCheckIns, createCheckIn, updateCheckInStatus, acknowledgeCheckIn, } from '../lib/api/checkins';
export const useCheckInStore = create()(devtools(subscribeWithSelector((set, get) => ({
    // Initial state
    checkIns: [],
    latestCheckIns: [],
    overdueCheckIns: [],
    stats: null,
    loading: false,
    error: null,
    selectedCheckIn: null,
    isConnected: false,
    subscription: null,
    filters: {},
    pagination: {
        limit: 50,
        offset: 0,
        hasMore: true,
    },
    // Load check-ins with optional filters
    loadCheckIns: async (options) => {
        set({ loading: true, error: null });
        try {
            const { filters, pagination } = get();
            const data = await getCheckIns({
                ...filters,
                ...options,
                limit: pagination.limit,
                offset: pagination.offset,
            });
            set({
                checkIns: pagination.offset === 0 ? data : [...get().checkIns, ...data],
                loading: false,
                pagination: {
                    ...pagination,
                    hasMore: data.length === pagination.limit,
                },
            });
        }
        catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load check-ins',
                loading: false
            });
        }
    },
    // Load latest check-in for each user
    loadLatestCheckIns: async () => {
        set({ loading: true, error: null });
        try {
            const data = await getLatestCheckIns();
            set({ latestCheckIns: data, loading: false });
        }
        catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load latest check-ins',
                loading: false
            });
        }
    },
    // Load overdue check-ins
    loadOverdueCheckIns: async () => {
        try {
            const data = await getOverdueCheckIns();
            set({ overdueCheckIns: data });
        }
        catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load overdue check-ins'
            });
        }
    },
    // Load statistics
    loadStats: async (timeRange) => {
        try {
            const data = await getCheckInStats(timeRange);
            set({ stats: data });
        }
        catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load statistics'
            });
        }
    },
    // Create new check-in
    createCheckIn: async (data) => {
        try {
            const newCheckIn = await createCheckIn(data);
            // Add to the beginning of the list
            set(state => ({
                checkIns: [newCheckIn, ...state.checkIns],
            }));
            // Refresh latest check-ins
            get().loadLatestCheckIns();
            return newCheckIn;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create check-in';
            set({ error: message });
            throw new Error(message);
        }
    },
    // Update check-in status
    updateStatus: async (id, status) => {
        try {
            const updated = await updateCheckInStatus(id, status);
            set(state => ({
                checkIns: state.checkIns.map(c => c.id === id ? { ...c, status: updated.status } : c),
                latestCheckIns: state.latestCheckIns.map(c => c.id === id ? { ...c, status: updated.status } : c),
            }));
        }
        catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update status'
            });
        }
    },
    // Acknowledge check-in
    acknowledge: async (id, notes) => {
        try {
            const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser());
            if (!user)
                throw new Error('Not authenticated');
            const updated = await acknowledgeCheckIn(id, user.id, notes);
            set(state => ({
                checkIns: state.checkIns.map(c => c.id === id ? { ...c, metadata: updated.metadata } : c),
            }));
        }
        catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to acknowledge check-in'
            });
        }
    },
    // Select check-in for detailed view
    selectCheckIn: (checkIn) => {
        set({ selectedCheckIn: checkIn });
    },
    // Set error
    setError: (error) => {
        set({ error });
    },
    // Clear error
    clearError: () => {
        set({ error: null });
    },
    // Subscribe to real-time updates
    subscribeToUpdates: (organizationId) => {
        // Unsubscribe from existing subscription
        get().unsubscribe();
        const unsubscribe = subscribeToCheckIns(organizationId, (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            set(state => {
                switch (eventType) {
                    case 'INSERT':
                        return {
                            checkIns: [newRecord, ...state.checkIns],
                            isConnected: true,
                        };
                    case 'UPDATE':
                        return {
                            checkIns: state.checkIns.map(c => c.id === newRecord.id ? { ...c, ...newRecord } : c),
                            latestCheckIns: state.latestCheckIns.map(c => c.id === newRecord.id ? { ...c, ...newRecord } : c),
                            isConnected: true,
                        };
                    case 'DELETE':
                        return {
                            checkIns: state.checkIns.filter(c => c.id !== oldRecord.id),
                            latestCheckIns: state.latestCheckIns.filter(c => c.id !== oldRecord.id),
                            isConnected: true,
                        };
                    default:
                        return { ...state, isConnected: true };
                }
            });
            // Refresh overdue check-ins and stats on updates
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                get().loadOverdueCheckIns();
                get().loadStats();
            }
        });
        set({ subscription: unsubscribe, isConnected: true });
    },
    // Unsubscribe from real-time updates
    unsubscribe: () => {
        const { subscription } = get();
        if (subscription) {
            subscription();
            set({ subscription: null, isConnected: false });
        }
    },
    // Set filters
    setFilters: (newFilters) => {
        set(state => ({
            filters: { ...state.filters, ...newFilters },
            pagination: { ...state.pagination, offset: 0 }, // Reset pagination
        }));
        // Reload data with new filters
        get().loadCheckIns();
    },
    // Reset filters
    resetFilters: () => {
        set({
            filters: {},
            pagination: { limit: 50, offset: 0, hasMore: true },
        });
        get().loadCheckIns();
    },
    // Load more check-ins (pagination)
    loadMore: async () => {
        const { pagination, loading } = get();
        if (loading || !pagination.hasMore)
            return;
        set(state => ({
            pagination: {
                ...state.pagination,
                offset: state.pagination.offset + state.pagination.limit,
            },
        }));
        await get().loadCheckIns();
    },
})), {
    name: 'checkin-store',
}));
