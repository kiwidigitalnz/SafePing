import Dexie, { Table } from 'dexie'
import type { Database } from './supabase'

type CheckInRow = Database['public']['Tables']['check_ins']['Row']

// IndexedDB schema for offline storage
interface OfflineCheckIn extends CheckInRow {
  id: string
  localId?: string // For offline-created records
}

interface OfflineUser {
  id: string
  organization_id: string
  first_name: string
  last_name: string
  role: string
  last_synced: string
}

class OfflineDatabase extends Dexie {
  pendingCheckIns!: Table<OfflineCheckIn>
  userCache!: Table<OfflineUser>
  syncQueue!: Table<{ id: string; type: string; data: Record<string, unknown>; timestamp: string }>

  constructor() {
    super('SafePingOffline')
    
    this.version(1).stores({
      pendingCheckIns: 'id, user_id, organization_id, status, created_at, synced_at',
      userCache: 'id, organization_id, last_synced',
      syncQueue: 'id, type, timestamp'
    })
  }
}

const db = new OfflineDatabase()

export const offlineStore = {
  // Check-in management
  async addPendingCheckIn(checkIn: OfflineCheckIn): Promise<void> {
    await db.pendingCheckIns.add({
      ...checkIn,
      localId: crypto.randomUUID()
    })
  },

  async getPendingCheckIns(): Promise<OfflineCheckIn[]> {
    return await db.pendingCheckIns.toArray()
  },

  async removePendingCheckIn(id: string): Promise<void> {
    await db.pendingCheckIns.delete(id)
  },

  async clearPendingCheckIns(): Promise<void> {
    await db.pendingCheckIns.clear()
  },

  // User cache management
  async cacheUser(user: OfflineUser): Promise<void> {
    await db.userCache.put({
      ...user,
      last_synced: new Date().toISOString()
    })
  },

  async getCachedUser(id: string): Promise<OfflineUser | undefined> {
    return await db.userCache.get(id)
  },

  // Sync queue management
  async addToSyncQueue(type: string, data: Record<string, unknown>): Promise<void> {
    await db.syncQueue.add({
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: new Date().toISOString()
    })
  },

  async getSyncQueue(): Promise<Array<{ id: string; type: string; data: Record<string, unknown>; timestamp: string }>> {
    return await db.syncQueue.orderBy('timestamp').toArray()
  },

  async removeFromSyncQueue(id: string): Promise<void> {
    await db.syncQueue.delete(id)
  },

  // Utility functions
  async getStorageInfo(): Promise<{ 
    pendingCheckIns: number
    cachedUsers: number
    syncQueueItems: number 
  }> {
    return {
      pendingCheckIns: await db.pendingCheckIns.count(),
      cachedUsers: await db.userCache.count(),
      syncQueueItems: await db.syncQueue.count()
    }
  },

  async clearAllData(): Promise<void> {
    await db.pendingCheckIns.clear()
    await db.userCache.clear()
    await db.syncQueue.clear()
  }
}

// Background sync functionality
export async function handleBackgroundSync(): Promise<void> {
  if (!navigator.onLine) {
    console.log('Device is offline, skipping sync')
    return
  }

  try {
    const { syncPendingCheckIns } = await import('./checkins')
    await syncPendingCheckIns()
    console.log('Background sync completed successfully')
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Register sync event listener
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    // Background sync is not available in all browsers
    if ('sync' in (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } })) {
      return (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('background-sync')
    }
  }).catch((error) => {
    console.warn('Background sync registration failed:', error)
  })
}

// Online/offline event handlers
window.addEventListener('online', () => {
  console.log('Device came online, triggering sync')
  handleBackgroundSync()
})

window.addEventListener('offline', () => {
  console.log('Device went offline')
})