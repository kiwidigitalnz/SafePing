import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Clock, CheckCircle } from 'lucide-react'
import { offlineAuth } from '../lib/offlineAuth'

export function OfflineStatusBar() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queueStatus, setQueueStatus] = useState({ pendingRequests: 0, syncInProgress: false })

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    const updateQueueStatus = () => {
      setQueueStatus(offlineAuth.getOfflineQueueStatus())
    }

    // Update status immediately
    updateQueueStatus()

    // Set up event listeners
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // Update queue status periodically
    const interval = setInterval(updateQueueStatus, 2000)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      clearInterval(interval)
    }
  }, [])

  if (isOnline && queueStatus.pendingRequests === 0) {
    return null // Don't show anything when online and no pending requests
  }

  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50 p-2 text-sm font-medium text-center
      ${isOnline 
        ? 'bg-yellow-100 text-yellow-800 border-b border-yellow-200' 
        : 'bg-red-100 text-red-800 border-b border-red-200'
      }
    `}>
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            {queueStatus.syncInProgress ? (
              <>
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Syncing offline requests...</span>
              </>
            ) : queueStatus.pendingRequests > 0 ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Synced {queueStatus.pendingRequests} offline requests</span>
              </>
            ) : (
              <span>Back online</span>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>
              You're offline
              {queueStatus.pendingRequests > 0 && (
                <span className="ml-1">
                  • {queueStatus.pendingRequests} request{queueStatus.pendingRequests !== 1 ? 's' : ''} queued
                </span>
              )}
            </span>
          </>
        )}
      </div>
    </div>
  )
}