// Push Notifications Service for SafePing PWA
import { supabase } from './supabase'

export interface PushNotificationPermission {
  permission: NotificationPermission
  subscription: PushSubscription | null
  supported: boolean
}

export interface NotificationPayload {
  title: string
  body: string
  data?: any
  urgent?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

class PushNotificationService {
  private vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY' // Replace with actual VAPID key
  
  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window
  }
  
  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported')
    }
    
    // Request permission
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      console.log('Push notification permission granted')
      await this.subscribeToPush()
    } else if (permission === 'denied') {
      console.log('Push notification permission denied')
    } else {
      console.log('Push notification permission dismissed')
    }
    
    return permission
  }
  
  /**
   * Get current permission status and subscription
   */
  async getPermissionStatus(): Promise<PushNotificationPermission> {
    if (!this.isSupported()) {
      return {
        permission: 'denied',
        subscription: null,
        supported: false
      }
    }
    
    const permission = Notification.permission
    const registration = await navigator.serviceWorker.getRegistration()
    const subscription = registration ? await registration.pushManager.getSubscription() : null
    
    return {
      permission,
      subscription,
      supported: true
    }
  }
  
  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey).buffer as ArrayBuffer
        })
        
        console.log('New push subscription created:', subscription)
      }
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription)
      
      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      throw error
    }
  }
  
  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) return false
      
      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) return false
      
      // Unsubscribe from push manager
      const result = await subscription.unsubscribe()
      
      if (result) {
        // Remove subscription from server
        await this.removeSubscriptionFromServer(subscription)
        console.log('Push subscription removed')
      }
      
      return result
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }
  
  /**
   * Send subscription details to Supabase
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      const subscriptionData = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.getKey('p256dh') ? 
          btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : null,
        auth_key: subscription.getKey('auth') ? 
          btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : null,
        user_agent: navigator.userAgent,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id,endpoint'
        })
      
      if (error) {
        console.error('Failed to save push subscription:', error)
        throw error
      }
      
      console.log('Push subscription saved to server')
    } catch (error) {
      console.error('Error sending subscription to server:', error)
      throw error
    }
  }
  
  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint)
      
      if (error) {
        console.error('Failed to remove push subscription:', error)
      }
    } catch (error) {
      console.error('Error removing subscription from server:', error)
    }
  }
  
  /**
   * Show local notification (fallback when push not available)
   */
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted')
      return
    }
    
    const options: NotificationOptions & { vibrate?: number[]; actions?: any[] } = {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/badge-72x72.png',
      data: payload.data,
      requireInteraction: payload.urgent || false,
      vibrate: payload.urgent ? [200, 100, 200, 100, 200] : [200, 100, 200],
      tag: 'local-notification',
      actions: payload.actions
    }
    
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.showNotification(payload.title, options)
    } else {
      // Fallback to browser notification
      new Notification(payload.title, options)
    }
  }
  
  /**
   * Test push notification (for development)
   */
  async testNotification(): Promise<void> {
    await this.showLocalNotification({
      title: 'SafePing Test',
      body: 'Push notifications are working correctly!',
      data: { test: true },
      actions: [
        { action: 'ok', title: 'OK' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  }
  
  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  }
  
  /**
   * Handle incoming messages from service worker
   */
  setupMessageListener(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Received message from service worker:', event.data)
        
        if (event.data?.type === 'NOTIFICATION_CLICKED') {
          this.handleNotificationClick(event.data.action, event.data.data)
        }
      })
    }
  }
  
  /**
   * Handle notification click actions
   */
  private handleNotificationClick(action: string, data: any): void {
    console.log('Notification clicked:', action, data)
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('notificationClick', {
      detail: { action, data }
    }))
  }
  
  /**
   * Queue offline data in service worker
   */
  async queueOfflineCheckin(checkinData: any, authToken: string): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.active) {
        registration.active.postMessage({
          type: 'QUEUE_OFFLINE_CHECKIN',
          checkin: {
            data: checkinData,
            authToken: authToken
          }
        })
      }
    }
  }
  
  /**
   * Queue emergency data in service worker
   */
  async queueEmergencyData(emergencyData: any, authToken: string): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.active) {
        registration.active.postMessage({
          type: 'QUEUE_EMERGENCY',
          emergency: {
            data: emergencyData,
            authToken: authToken
          }
        })
      }
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService()

// Hook to use push notifications in React components
export function usePushNotifications() {
  return {
    isSupported: pushNotificationService.isSupported(),
    requestPermission: () => pushNotificationService.requestPermission(),
    getPermissionStatus: () => pushNotificationService.getPermissionStatus(),
    subscribe: () => pushNotificationService.subscribeToPush(),
    unsubscribe: () => pushNotificationService.unsubscribe(),
    showLocalNotification: (payload: NotificationPayload) => 
      pushNotificationService.showLocalNotification(payload),
    testNotification: () => pushNotificationService.testNotification(),
    queueOfflineCheckin: (data: any, token: string) => 
      pushNotificationService.queueOfflineCheckin(data, token),
    queueEmergencyData: (data: any, token: string) => 
      pushNotificationService.queueEmergencyData(data, token)
  }
}
