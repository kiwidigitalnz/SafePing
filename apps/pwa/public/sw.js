// SafePing Service Worker for Push Notifications and Background Sync
const CACHE_NAME = 'safeping-v1'
const DB_NAME = 'safeping-offline'
const DB_VERSION = 1

// URLs to cache for offline functionality
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files')
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log('Service Worker: Installed successfully')
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker: Activated successfully')
      return self.clients.claim()
    })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return
  
  // Skip Supabase requests - handle them differently
  if (event.request.url.includes('supabase.co')) {
    return
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
      .catch(() => {
        // Return a fallback page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/')
        }
      })
  )
})

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  let data = {}
  
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = { title: 'SafePing Alert', body: event.data.text() }
    }
  }
  
  const options = {
    title: data.title || 'SafePing Safety Alert',
    body: data.body || 'Check your safety status',
    icon: '/pwa-192x192.png',
    badge: '/badge-72x72.png',
    data: data,
    actions: [
      {
        action: 'check-in',
        title: 'Check In Now',
        icon: '/checkin-icon.png'
      },
      {
        action: 'view',
        title: 'View Details',
        icon: '/view-icon.png'
      }
    ],
    requireInteraction: data.urgent || false,
    vibrate: data.urgent ? [200, 100, 200, 100, 200] : [200, 100, 200],
    tag: data.tag || 'safety-alert',
    renotify: true,
    silent: false
  }
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  const notification = event.notification
  const action = event.action
  const data = notification.data || {}
  
  notification.close()
  
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      })
      
      // If SafePing is already open, focus it
      for (const client of clients) {
        if (client.url.includes('safeping') && 'focus' in client) {
          await client.focus()
          
          // Send message to the client about the action
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            action: action,
            data: data
          })
          
          return
        }
      }
      
      // If not open, open a new window
      let url = '/'
      
      if (action === 'check-in') {
        url = '/checkin'
      } else if (action === 'view' && data.incidentId) {
        url = `/incidents/${data.incidentId}`
      } else if (data.url) {
        url = data.url
      }
      
      await self.clients.openWindow(url)
    })()
  )
})

// Background sync for offline check-ins
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag)
  
  if (event.tag === 'background-checkin-sync') {
    event.waitUntil(syncOfflineCheckins())
  } else if (event.tag === 'emergency-sync') {
    event.waitUntil(syncEmergencyData())
  }
})

// Sync offline check-ins when back online
async function syncOfflineCheckins() {
  console.log('Service Worker: Syncing offline check-ins...')
  
  try {
    // Get offline check-ins from IndexedDB
    const db = await openDB()
    const transaction = db.transaction(['offline_checkins'], 'readonly')
    const store = transaction.objectStore('offline_checkins')
    const offlineCheckins = await getAll(store)
    
    if (offlineCheckins.length === 0) {
      console.log('Service Worker: No offline check-ins to sync')
      return
    }
    
    console.log(`Service Worker: Found ${offlineCheckins.length} offline check-ins to sync`)
    
    // Send each check-in to the server
    for (const checkin of offlineCheckins) {
      try {
        const response = await fetch('/api/checkins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${checkin.authToken}`
          },
          body: JSON.stringify(checkin.data)
        })
        
        if (response.ok) {
          // Remove from offline storage
          const deleteTransaction = db.transaction(['offline_checkins'], 'readwrite')
          const deleteStore = deleteTransaction.objectStore('offline_checkins')
          await deleteFromStore(deleteStore, checkin.id)
          
          console.log(`Service Worker: Synced check-in ${checkin.id}`)
          
          // Show success notification
          await self.registration.showNotification('Check-in Synced', {
            body: 'Your offline check-in has been synchronized',
            icon: '/pwa-192x192.png',
            tag: 'sync-success',
            silent: true
          })
        } else {
          console.error(`Service Worker: Failed to sync check-in ${checkin.id}`, response.status)
        }
      } catch (error) {
        console.error(`Service Worker: Error syncing check-in ${checkin.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Error during offline sync:', error)
  }
}

// Sync emergency data
async function syncEmergencyData() {
  console.log('Service Worker: Syncing emergency data...')
  
  try {
    const db = await openDB()
    const transaction = db.transaction(['emergency_queue'], 'readonly')
    const store = transaction.objectStore('emergency_queue')
    const emergencyData = await getAll(store)
    
    for (const emergency of emergencyData) {
      try {
        const response = await fetch('/api/emergency', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${emergency.authToken}`
          },
          body: JSON.stringify(emergency.data)
        })
        
        if (response.ok) {
          // Remove from emergency queue
          const deleteTransaction = db.transaction(['emergency_queue'], 'readwrite')
          const deleteStore = deleteTransaction.objectStore('emergency_queue')
          await deleteFromStore(deleteStore, emergency.id)
          
          console.log(`Service Worker: Synced emergency data ${emergency.id}`)
        }
      } catch (error) {
        console.error(`Service Worker: Error syncing emergency data:`, error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Error during emergency sync:', error)
  }
}

// IndexedDB helper functions
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Create object stores
      if (!db.objectStoreNames.contains('offline_checkins')) {
        const store = db.createObjectStore('offline_checkins', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
      
      if (!db.objectStoreNames.contains('emergency_queue')) {
        const store = db.createObjectStore('emergency_queue', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

function getAll(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function deleteFromStore(store, id) {
  return new Promise((resolve, reject) => {
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'QUEUE_OFFLINE_CHECKIN') {
    queueOfflineCheckin(event.data.checkin)
  } else if (event.data && event.data.type === 'QUEUE_EMERGENCY') {
    queueEmergencyData(event.data.emergency)
  }
})

// Queue offline check-in
async function queueOfflineCheckin(checkinData) {
  try {
    const db = await openDB()
    const transaction = db.transaction(['offline_checkins'], 'readwrite')
    const store = transaction.objectStore('offline_checkins')
    
    const checkin = {
      id: generateId(),
      data: checkinData.data,
      authToken: checkinData.authToken,
      timestamp: Date.now()
    }
    
    await addToStore(store, checkin)
    console.log('Service Worker: Queued offline check-in')
    
    // Register for background sync
    await self.registration.sync.register('background-checkin-sync')
  } catch (error) {
    console.error('Service Worker: Error queuing offline check-in:', error)
  }
}

// Queue emergency data
async function queueEmergencyData(emergencyData) {
  try {
    const db = await openDB()
    const transaction = db.transaction(['emergency_queue'], 'readwrite')
    const store = transaction.objectStore('emergency_queue')
    
    const emergency = {
      id: generateId(),
      data: emergencyData.data,
      authToken: emergencyData.authToken,
      timestamp: Date.now()
    }
    
    await addToStore(store, emergency)
    console.log('Service Worker: Queued emergency data')
    
    // Register for background sync
    await self.registration.sync.register('emergency-sync')
  } catch (error) {
    console.error('Service Worker: Error queuing emergency data:', error)
  }
}

function addToStore(store, data) {
  return new Promise((resolve, reject) => {
    const request = store.add(data)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}