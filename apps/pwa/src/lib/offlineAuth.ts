import { staffAuth } from './staffAuth'

interface OfflineAuthRequest {
  type: 'sendOTP' | 'verifyOTP' | 'validatePin'
  data: any
  timestamp: number
  id: string
}

interface OfflineAuthResponse {
  success: boolean
  data?: any
  error?: string
  offline?: boolean
}

class OfflineAuthManager {
  private static instance: OfflineAuthManager
  private offlineQueue: OfflineAuthRequest[] = []
  private isOnline: boolean = navigator.onLine
  private syncInProgress: boolean = false

  private constructor() {
    this.setupOnlineOfflineListeners()
    this.loadOfflineQueue()
  }

  static getInstance(): OfflineAuthManager {
    if (!OfflineAuthManager.instance) {
      OfflineAuthManager.instance = new OfflineAuthManager()
    }
    return OfflineAuthManager.instance
  }

  private setupOnlineOfflineListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncOfflineQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  private loadOfflineQueue() {
    try {
      const stored = localStorage.getItem('offline_auth_queue')
      if (stored) {
        this.offlineQueue = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading offline queue:', error)
      this.offlineQueue = []
    }
  }

  private saveOfflineQueue() {
    try {
      localStorage.setItem('offline_auth_queue', JSON.stringify(this.offlineQueue))
    } catch (error) {
      console.error('Error saving offline queue:', error)
    }
  }

  private addToOfflineQueue(request: OfflineAuthRequest) {
    this.offlineQueue.push(request)
    this.saveOfflineQueue()
  }

  private removeFromOfflineQueue(id: string) {
    this.offlineQueue = this.offlineQueue.filter(req => req.id !== id)
    this.saveOfflineQueue()
  }

  // Send OTP with offline fallback
  async sendOTP(phoneNumber: string): Promise<OfflineAuthResponse> {
    if (this.isOnline) {
      try {
        const result = await staffAuth.sendOTP(phoneNumber)
        return { success: result.success, data: result, error: result.error }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    } else {
      // Store request for later sync
      const request: OfflineAuthRequest = {
        type: 'sendOTP',
        data: { phoneNumber },
        timestamp: Date.now(),
        id: crypto.randomUUID()
      }
      this.addToOfflineQueue(request)
      
      return {
        success: false,
        error: 'You are offline. OTP request will be sent when connection is restored.',
        offline: true
      }
    }
  }

  // Verify OTP with offline fallback
  async verifyOTP(phoneNumber: string, code: string): Promise<OfflineAuthResponse> {
    if (this.isOnline) {
      try {
        const result = await staffAuth.verifyOTP(phoneNumber, code)
        return { success: result.success, data: result, error: result.error }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    } else {
      // Store request for later sync
      const request: OfflineAuthRequest = {
        type: 'verifyOTP',
        data: { phoneNumber, code },
        timestamp: Date.now(),
        id: crypto.randomUUID()
      }
      this.addToOfflineQueue(request)
      
      return {
        success: false,
        error: 'You are offline. OTP verification will be processed when connection is restored.',
        offline: true
      }
      }
  }

  // Validate PIN with offline fallback
  async validatePin(pin: string): Promise<OfflineAuthResponse> {
    if (this.isOnline) {
      try {
        const result = await staffAuth.validatePin(pin)
        return { success: result.success, data: result, error: result.error }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    } else {
      // For PIN validation, we can check against cached session
      const session = staffAuth.getSession()
      if (session) {
        // In a real implementation, you might want to cache the PIN hash locally
        // for offline validation. For now, we'll just return an offline error.
        return {
          success: false,
          error: 'You are offline. Please check your connection and try again.',
          offline: true
        }
      } else {
        return {
          success: false,
          error: 'No active session found. Please connect to the internet and sign in again.',
          offline: true
        }
      }
    }
  }

  // Sync offline queue when back online
  private async syncOfflineQueue() {
    if (this.syncInProgress || this.offlineQueue.length === 0) {
      return
    }

    this.syncInProgress = true
    console.log('Syncing offline auth queue...')

    const queueCopy = [...this.offlineQueue]
    
    for (const request of queueCopy) {
      try {
        let result: OfflineAuthResponse

        switch (request.type) {
          case 'sendOTP':
            result = await this.sendOTP(request.data.phoneNumber)
            break
          case 'verifyOTP':
            result = await this.verifyOTP(request.data.phoneNumber, request.data.code)
            break
          case 'validatePin':
            result = await this.validatePin(request.data.pin)
            break
          default:
            console.warn('Unknown offline request type:', request.type)
            continue
        }

        if (result.success) {
          this.removeFromOfflineQueue(request.id)
          console.log('Successfully synced offline request:', request.type)
        } else if (!result.offline) {
          // Request failed but wasn't due to being offline
          this.removeFromOfflineQueue(request.id)
          console.error('Failed to sync offline request:', request.type, result.error)
        }
      } catch (error) {
        console.error('Error syncing offline request:', request.type, error)
        // Keep the request in queue for next sync attempt
      }
    }

    this.syncInProgress = false
    console.log('Offline auth queue sync completed')
  }

  // Get offline queue status
  getOfflineQueueStatus() {
    return {
      pendingRequests: this.offlineQueue.length,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    }
  }

  // Clear offline queue (useful for testing or manual cleanup)
  clearOfflineQueue() {
    this.offlineQueue = []
    this.saveOfflineQueue()
  }
}

export const offlineAuth = OfflineAuthManager.getInstance()
export type { OfflineAuthResponse }
