import { supabase } from './supabase'

interface QueuedAction {
  id: string
  type: 'checkin' | 'checkout' | 'emergency' | 'location_update'
  data: any
  timestamp: string
  retryCount: number
  maxRetries: number
}

class OfflineQueueManager {
  private static instance: OfflineQueueManager
  private queue: QueuedAction[] = []
  private isOnline: boolean = navigator.onLine
  private isSyncing: boolean = false
  private syncInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.loadQueue()
    this.setupEventListeners()
    this.startSyncInterval()
  }

  static getInstance(): OfflineQueueManager {
    if (!OfflineQueueManager.instance) {
      OfflineQueueManager.instance = new OfflineQueueManager()
    }
    return OfflineQueueManager.instance
  }

  private setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Network: Online')
      this.isOnline = true
      this.processQueue()
    })

    window.addEventListener('offline', () => {
      console.log('Network: Offline')
      this.isOnline = false
    })

    // Listen for visibility change to sync when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processQueue()
      }
    })
  }

  private startSyncInterval() {
    // Try to sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.queue.length > 0) {
        this.processQueue()
      }
    }, 30000)
  }

  private loadQueue() {
    const stored = localStorage.getItem('offline_queue')
    if (stored) {
      try {
        this.queue = JSON.parse(stored)
      } catch (error) {
        console.error('Failed to load offline queue:', error)
        this.queue = []
      }
    }
  }

  private saveQueue() {
    localStorage.setItem('offline_queue', JSON.stringify(this.queue))
  }

  // Add action to queue
  async addToQueue(type: QueuedAction['type'], data: any): Promise<string> {
    const action: QueuedAction = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3
    }

    this.queue.push(action)
    this.saveQueue()

    // Try to process immediately if online
    if (this.isOnline) {
      this.processQueue()
    }

    return action.id
  }

  // Process queued actions
  async processQueue() {
    if (this.isSyncing || this.queue.length === 0) return

    this.isSyncing = true
    console.log(`Processing ${this.queue.length} queued actions`)

    const processedIds: string[] = []

    for (const action of this.queue) {
      try {
        const success = await this.processAction(action)
        
        if (success) {
          processedIds.push(action.id)
          console.log(`Successfully processed action: ${action.type}`)
        } else {
          action.retryCount++
          
          if (action.retryCount >= action.maxRetries) {
            console.error(`Action ${action.id} failed after ${action.maxRetries} retries`)
            processedIds.push(action.id) // Remove failed actions after max retries
          }
        }
      } catch (error) {
        console.error(`Error processing action ${action.id}:`, error)
        action.retryCount++
      }
    }

    // Remove processed actions from queue
    this.queue = this.queue.filter(action => !processedIds.includes(action.id))
    this.saveQueue()

    this.isSyncing = false
  }

  // Process individual action
  private async processAction(action: QueuedAction): Promise<boolean> {
    try {
      switch (action.type) {
        case 'checkin':
          return await this.syncCheckIn(action.data)
        
        case 'checkout':
          return await this.syncCheckOut(action.data)
        
        case 'emergency':
          return await this.syncEmergency(action.data)
        
        case 'location_update':
          return await this.syncLocationUpdate(action.data)
        
        default:
          console.warn(`Unknown action type: ${action.type}`)
          return false
      }
    } catch (error) {
      console.error(`Failed to process ${action.type}:`, error)
      return false
    }
  }

  // Sync check-in
  private async syncCheckIn(data: any): Promise<boolean> {
    const { error } = await supabase
      .from('check_ins')
      .insert({
        user_id: data.userId,
        location: data.location,
        scheduled_time: data.scheduledTime,
        actual_time: data.actualTime || new Date().toISOString(),
        status: 'completed',
        notes: data.notes,
        offline_sync: true
      })

    return !error
  }

  // Sync check-out
  private async syncCheckOut(data: any): Promise<boolean> {
    const { error } = await supabase
      .from('check_ins')
      .update({
        checkout_time: data.checkoutTime || new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', data.checkInId)

    return !error
  }

  // Sync emergency
  private async syncEmergency(data: any): Promise<boolean> {
    const { data: incident, error } = await supabase
      .from('incidents')
      .insert({
        user_id: data.userId,
        type: 'emergency_sos',
        status: 'active',
        location: data.location,
        triggered_at: data.triggeredAt || new Date().toISOString(),
        offline_sync: true
      })
      .select()
      .single()

    if (!error && incident) {
      // Trigger escalation
      await supabase.functions.invoke('trigger-escalation', {
        body: { incident_id: incident.id }
      })
    }

    return !error
  }

  // Sync location update
  private async syncLocationUpdate(data: any): Promise<boolean> {
    const { error } = await supabase
      .from('location_updates')
      .insert({
        user_id: data.userId,
        check_in_id: data.checkInId,
        location: data.location,
        timestamp: data.timestamp || new Date().toISOString(),
        offline_sync: true
      })

    return !error
  }

  // Get queue status
  getQueueStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queueLength: this.queue.length,
      queue: this.queue
    }
  }

  // Clear queue (use with caution)
  clearQueue() {
    this.queue = []
    this.saveQueue()
  }

  // Manually trigger sync
  async manualSync() {
    if (this.isOnline) {
      await this.processQueue()
      return true
    }
    return false
  }

  // Check if action is queued
  isQueued(actionId: string): boolean {
    return this.queue.some(action => action.id === actionId)
  }

  // Get pending actions count
  getPendingCount(): number {
    return this.queue.length
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  }
}

// Export singleton instance
export const offlineQueue = OfflineQueueManager.getInstance()

// Export types
export type { QueuedAction }
