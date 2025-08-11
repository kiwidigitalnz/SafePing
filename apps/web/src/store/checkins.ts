import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { subscribeWithSelector } from 'zustand/middleware'
import type { CheckInWithUser } from '../lib/api/checkins'
import {
  getCheckIns,
  getLatestCheckIns,
  getCheckInStats,
  getOverdueCheckIns,
  subscribeToCheckIns,
  createCheckIn,
  updateCheckInStatus,
  acknowledgeCheckIn,
} from '../lib/api/checkins'

export interface CheckInStats {
  total: number
  safe: number
  overdue: number
  missed: number
  emergency: number
  onTimeRate: string
}

interface CheckInState {
  // Data
  checkIns: CheckInWithUser[]
  latestCheckIns: CheckInWithUser[]
  overdueCheckIns: any[]
  stats: CheckInStats | null
  
  // UI State
  loading: boolean
  error: string | null
  selectedCheckIn: CheckInWithUser | null
  
  // Real-time
  isConnected: boolean
  subscription: (() => void) | null
  
  // Actions
  loadCheckIns: (options?: any) => Promise<void>
  loadLatestCheckIns: () => Promise<void>
  loadOverdueCheckIns: () => Promise<void>
  loadStats: (timeRange?: { startDate: string; endDate: string }) => Promise<void>
  createCheckIn: (data: any) => Promise<CheckInWithUser>
  updateStatus: (id: string, status: any) => Promise<void>
  acknowledge: (id: string, notes?: string) => Promise<void>
  selectCheckIn: (checkIn: CheckInWithUser | null) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Real-time subscriptions
  subscribeToUpdates: (organizationId: string) => void
  unsubscribe: () => void
  
  // Filters and pagination
  filters: {
    userId?: string
    status?: string
    startDate?: string
    endDate?: string
  }
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
  setFilters: (filters: any) => void
  resetFilters: () => void
  loadMore: () => Promise<void>
}

export const useCheckInStore = create<CheckInState>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
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
        loadCheckIns: async (options?: any) => {
          set({ loading: true, error: null })
          try {
            const { filters, pagination } = get()
            const data = await getCheckIns({
              ...filters,
              ...options,
              limit: pagination.limit,
              offset: pagination.offset,
            })
            
            set({
              checkIns: pagination.offset === 0 ? data : [...get().checkIns, ...data],
              loading: false,
              pagination: {
                ...pagination,
                hasMore: data.length === pagination.limit,
              },
            })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load check-ins',
              loading: false 
            })
          }
        },

        // Load latest check-in for each user
        loadLatestCheckIns: async () => {
          set({ loading: true, error: null })
          try {
            const data = await getLatestCheckIns()
            set({ latestCheckIns: data, loading: false })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load latest check-ins',
              loading: false 
            })
          }
        },

        // Load overdue check-ins
        loadOverdueCheckIns: async () => {
          try {
            const data = await getOverdueCheckIns()
            set({ overdueCheckIns: data })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load overdue check-ins'
            })
          }
        },

        // Load statistics
        loadStats: async (timeRange?: { startDate: string; endDate: string }) => {
          try {
            const data = await getCheckInStats(timeRange)
            set({ stats: data })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load statistics'
            })
          }
        },

        // Create new check-in
        createCheckIn: async (data: any) => {
          try {
            const newCheckIn = await createCheckIn(data)
            
            // Add to the beginning of the list
            set(state => ({
              checkIns: [newCheckIn as CheckInWithUser, ...state.checkIns],
            }))
            
            // Refresh latest check-ins
            get().loadLatestCheckIns()
            
            return newCheckIn as CheckInWithUser
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create check-in'
            set({ error: message })
            throw new Error(message)
          }
        },

        // Update check-in status
        updateStatus: async (id: string, status: any) => {
          try {
            const updated = await updateCheckInStatus(id, status)
            
            set(state => ({
              checkIns: state.checkIns.map(c => 
                c.id === id ? { ...c, status: updated.status } : c
              ),
              latestCheckIns: state.latestCheckIns.map(c => 
                c.id === id ? { ...c, status: updated.status } : c
              ),
            }))
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update status'
            })
          }
        },

        // Acknowledge check-in
        acknowledge: async (id: string, notes?: string) => {
          try {
            const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser())
            if (!user) throw new Error('Not authenticated')

            const updated = await acknowledgeCheckIn(id, user.id, notes)
            
            set(state => ({
              checkIns: state.checkIns.map(c => 
                c.id === id ? { ...c, metadata: updated.metadata } : c
              ),
            }))
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to acknowledge check-in'
            })
          }
        },

        // Select check-in for detailed view
        selectCheckIn: (checkIn: CheckInWithUser | null) => {
          set({ selectedCheckIn: checkIn })
        },

        // Set error
        setError: (error: string | null) => {
          set({ error })
        },

        // Clear error
        clearError: () => {
          set({ error: null })
        },

        // Subscribe to real-time updates
        subscribeToUpdates: (organizationId: string) => {
          // Unsubscribe from existing subscription
          get().unsubscribe()
          
          const unsubscribe = subscribeToCheckIns(organizationId, (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload
            
            set(state => {
              switch (eventType) {
                case 'INSERT':
                  return {
                    checkIns: [newRecord, ...state.checkIns],
                    isConnected: true,
                  }
                  
                case 'UPDATE':
                  return {
                    checkIns: state.checkIns.map(c => 
                      c.id === newRecord.id ? { ...c, ...newRecord } : c
                    ),
                    latestCheckIns: state.latestCheckIns.map(c => 
                      c.id === newRecord.id ? { ...c, ...newRecord } : c
                    ),
                    isConnected: true,
                  }
                  
                case 'DELETE':
                  return {
                    checkIns: state.checkIns.filter(c => c.id !== oldRecord.id),
                    latestCheckIns: state.latestCheckIns.filter(c => c.id !== oldRecord.id),
                    isConnected: true,
                  }
                  
                default:
                  return { ...state, isConnected: true }
              }
            })
            
            // Refresh overdue check-ins and stats on updates
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
              get().loadOverdueCheckIns()
              get().loadStats()
            }
          })
          
          set({ subscription: unsubscribe, isConnected: true })
        },

        // Unsubscribe from real-time updates
        unsubscribe: () => {
          const { subscription } = get()
          if (subscription) {
            subscription()
            set({ subscription: null, isConnected: false })
          }
        },

        // Set filters
        setFilters: (newFilters: any) => {
          set(state => ({
            filters: { ...state.filters, ...newFilters },
            pagination: { ...state.pagination, offset: 0 }, // Reset pagination
          }))
          
          // Reload data with new filters
          get().loadCheckIns()
        },

        // Reset filters
        resetFilters: () => {
          set({
            filters: {},
            pagination: { limit: 50, offset: 0, hasMore: true },
          })
          
          get().loadCheckIns()
        },

        // Load more check-ins (pagination)
        loadMore: async () => {
          const { pagination, loading } = get()
          if (loading || !pagination.hasMore) return
          
          set(state => ({
            pagination: {
              ...state.pagination,
              offset: state.pagination.offset + state.pagination.limit,
            },
          }))
          
          await get().loadCheckIns()
        },
      })
    ),
    {
      name: 'checkin-store',
    }
  )
)