// Offline Sync Management for SafePing PWA
import { supabase } from './supabase'

interface OfflineAction {
  id: string
  type: 'checkin' | 'emergency' | 'incident_update' | 'profile_update'
  data: any
  timestamp: number
  retryCount: number
  authToken: string
  organizationId: string
}

interface SyncResult {
  success: boolean
  action: OfflineAction
  error?: string
}

class OfflineSyncManager {
  private dbName = 'safeping-offline'
  private dbVersion = 1
  private db: IDBDatabase | null = null
  private syncInProgress = false
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Initialize the offline sync manager
   */
  async initialize(): Promise<void> {
    try {
      this.db = await this.openDatabase()
      this.setupServiceWorkerSync()
      this.setupNetworkEventListeners()
      
      // Start periodic sync attempts
      this.startPeriodicSync()
      
      console.log('Offline sync manager initialized')
    } catch (error) {
      console.error('Failed to initialize offline sync manager:', error)
    }
  }

  /**
   * Open IndexedDB database
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores for different types of offline actions
        if (!db.objectStoreNames.contains('offline_actions')) {
          const store = db.createObjectStore('offline_actions', { keyPath: 'id' })
          store.createIndex('type', 'type', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('retryCount', 'retryCount', { unique: false })
        }

        if (!db.objectStoreNames.contains('sync_status')) {
          const statusStore = db.createObjectStore('sync_status', { keyPath: 'key' })
        }
      }
    })
  }

  /**
   * Queue an action for offline sync
   */
  async queueAction(
    type: OfflineAction['type'],
    data: any,
    organizationId: string
  ): Promise<string> {
    if (!this.db) {
      throw new Error('Offline sync manager not initialized')
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('No authentication session')
    }

    const action: OfflineAction = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      authToken: session.access_token,
      organizationId
    }

    const transaction = this.db.transaction(['offline_actions'], 'readwrite')
    const store = transaction.objectStore('offline_actions')
    
    await this.promisifyRequest(store.add(action))
    
    console.log(`Queued offline action: ${type}`, action.id)

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.triggerSync()
    }

    return action.id
  }

  /**
   * Get all queued actions
   */
  async getQueuedActions(): Promise<OfflineAction[]> {
    if (!this.db) return []

    const transaction = this.db.transaction(['offline_actions'], 'readonly')
    const store = transaction.objectStore('offline_actions')
    const request = store.getAll()
    
    return this.promisifyRequest(request)
  }

  /**
   * Remove action from queue
   */
  async removeAction(actionId: string): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(['offline_actions'], 'readwrite')
    const store = transaction.objectStore('offline_actions')
    
    await this.promisifyRequest(store.delete(actionId))
    console.log(`Removed offline action: ${actionId}`)
  }

  /**
   * Update action retry count
   */
  async updateRetryCount(actionId: string, retryCount: number): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(['offline_actions'], 'readwrite')
    const store = transaction.objectStore('offline_actions')
    
    const action = await this.promisifyRequest(store.get(actionId))
    if (action) {
      action.retryCount = retryCount
      await this.promisifyRequest(store.put(action))
    }
  }

  /**
   * Trigger sync process
   */
  async triggerSync(): Promise<SyncResult[]> {
    if (this.syncInProgress || !navigator.onLine) {
      return []
    }

    this.syncInProgress = true
    const results: SyncResult[] = []

    try {
      const actions = await this.getQueuedActions()
      console.log(`Starting sync of ${actions.length} offline actions`)

      for (const action of actions) {
        try {
          const result = await this.syncAction(action)
          results.push(result)

          if (result.success) {
            await this.removeAction(action.id)
            this.clearRetryTimeout(action.id)
          } else {
            await this.handleSyncFailure(action)
          }
        } catch (error) {
          console.error(`Error syncing action ${action.id}:`, error)
          results.push({
            success: false,
            action,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          await this.handleSyncFailure(action)
        }
      }

      // Update last sync timestamp
      await this.updateSyncStatus('lastSync', Date.now())

    } finally {
      this.syncInProgress = false
    }

    console.log(`Sync completed. ${results.filter(r => r.success).length}/${results.length} actions synced`)
    return results
  }

  /**
   * Sync individual action
   */
  private async syncAction(action: OfflineAction): Promise<SyncResult> {
    console.log(`Syncing action: ${action.type}`, action.id)

    try {
      let success = false

      switch (action.type) {
        case 'checkin':
          success = await this.syncCheckin(action)
          break
        case 'emergency':
          success = await this.syncEmergency(action)
          break
        case 'incident_update':
          success = await this.syncIncidentUpdate(action)
          break
        case 'profile_update':
          success = await this.syncProfileUpdate(action)
          break
        default:
          throw new Error(`Unknown action type: ${action.type}`)
      }

      return { success, action }
    } catch (error) {
      return {
        success: false,
        action,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Sync check-in action
   */
  private async syncCheckin(action: OfflineAction): Promise<boolean> {
    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        ...action.data,
        created_at: new Date(action.timestamp).toISOString()
      })

    if (error) {
      console.error('Failed to sync checkin:', error)
      return false
    }

    console.log('Checkin synced successfully:', data)
    return true
  }

  /**
   * Sync emergency action
   */
  private async syncEmergency(action: OfflineAction): Promise<boolean> {
    const { data, error } = await supabase.functions.invoke('emergency-escalation', {
      body: action.data
    })

    if (error) {
      console.error('Failed to sync emergency:', error)
      return false
    }

    console.log('Emergency synced successfully:', data)
    return true
  }

  /**
   * Sync incident update
   */
  private async syncIncidentUpdate(action: OfflineAction): Promise<boolean> {
    const { data, error } = await supabase
      .from('incidents')
      .update(action.data.updates)
      .eq('id', action.data.incidentId)

    if (error) {
      console.error('Failed to sync incident update:', error)
      return false
    }

    console.log('Incident update synced successfully:', data)
    return true
  }

  /**
   * Sync profile update
   */
  private async syncProfileUpdate(action: OfflineAction): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .update(action.data.updates)
      .eq('id', action.data.userId)

    if (error) {
      console.error('Failed to sync profile update:', error)
      return false
    }

    console.log('Profile update synced successfully:', data)
    return true
  }

  /**
   * Handle sync failure with retry logic
   */
  private async handleSyncFailure(action: OfflineAction): Promise<void> {
    const maxRetries = 5
    const baseDelay = 1000 // 1 second
    const maxDelay = 300000 // 5 minutes

    if (action.retryCount >= maxRetries) {
      console.error(`Action ${action.id} exceeded max retries, removing from queue`)
      await this.removeAction(action.id)
      return
    }

    const newRetryCount = action.retryCount + 1
    await this.updateRetryCount(action.id, newRetryCount)

    // Exponential backoff with jitter
    const delay = Math.min(
      baseDelay * Math.pow(2, newRetryCount) + Math.random() * 1000,
      maxDelay
    )

    console.log(`Scheduling retry ${newRetryCount} for action ${action.id} in ${delay}ms`)

    const timeoutId = setTimeout(() => {
      this.triggerSync()
      this.retryTimeouts.delete(action.id)
    }, delay)

    this.retryTimeouts.set(action.id, timeoutId)
  }

  /**
   * Clear retry timeout for action
   */
  private clearRetryTimeout(actionId: string): void {
    const timeoutId = this.retryTimeouts.get(actionId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.retryTimeouts.delete(actionId)
    }
  }

  /**
   * Setup service worker sync
   */
  private setupServiceWorkerSync(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_REQUEST') {
          this.triggerSync()
        }
      })
    }
  }

  /**
   * Setup network event listeners
   */
  private setupNetworkEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('Network connection restored, triggering sync')
      setTimeout(() => this.triggerSync(), 1000) // Slight delay to ensure connection is stable
    })

    window.addEventListener('offline', () => {
      console.log('Network connection lost')
    })
  }

  /**
   * Start periodic sync attempts
   */
  private startPeriodicSync(): void {
    // Sync every 30 seconds when online
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.triggerSync()
      }
    }, 30000)
  }

  /**
   * Update sync status in IndexedDB
   */
  private async updateSyncStatus(key: string, value: any): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(['sync_status'], 'readwrite')
    const store = transaction.objectStore('sync_status')
    
    await this.promisifyRequest(store.put({ key, value, timestamp: Date.now() }))
  }

  /**
   * Get sync status from IndexedDB
   */
  async getSyncStatus(): Promise<{ [key: string]: any }> {
    if (!this.db) return {}

    const transaction = this.db.transaction(['sync_status'], 'readonly')
    const store = transaction.objectStore('sync_status')
    const request = store.getAll()
    
    const results = await this.promisifyRequest(request)
    const status: { [key: string]: any } = {}
    
    for (const item of results) {
      status[item.key] = item.value
    }
    
    return status
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    queuedActions: number
    lastSync: number | null
    actionsByType: { [type: string]: number }
  }> {
    const actions = await this.getQueuedActions()
    const status = await this.getSyncStatus()
    
    const actionsByType: { [type: string]: number } = {}
    for (const action of actions) {
      actionsByType[action.type] = (actionsByType[action.type] || 0) + 1
    }
    
    return {
      queuedActions: actions.length,
      lastSync: status.lastSync || null,
      actionsByType
    }
  }

  /**
   * Clear all queued actions (for development/testing)
   */
  async clearQueue(): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(['offline_actions'], 'readwrite')
    const store = transaction.objectStore('offline_actions')
    
    await this.promisifyRequest(store.clear())
    console.log('Offline action queue cleared')
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * Convert IDBRequest to Promise
   */
  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

// Export singleton instance
export const offlineSyncManager = new OfflineSyncManager()

// React hook for using offline sync
import { useState, useEffect } from 'react'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStats, setSyncStats] = useState<{
    queuedActions: number
    lastSync: number | null
    actionsByType: { [type: string]: number }
  }>({
    queuedActions: 0,
    lastSync: null,
    actionsByType: {}
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const updateStats = async () => {
      try {
        const stats = await offlineSyncManager.getSyncStats()
        setSyncStats(stats)
      } catch (error) {
        console.error('Failed to get sync stats:', error)
      }
    }

    updateStats()
    const interval = setInterval(updateStats, 5000) // Update every 5 seconds
    
    return () => clearInterval(interval)
  }, [])

  return {
    isOnline,
    syncStats,
    queueAction: offlineSyncManager.queueAction.bind(offlineSyncManager),
    triggerSync: offlineSyncManager.triggerSync.bind(offlineSyncManager),
    clearQueue: offlineSyncManager.clearQueue.bind(offlineSyncManager)
  }
}