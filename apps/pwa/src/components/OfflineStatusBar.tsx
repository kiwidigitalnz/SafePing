import { useOfflineSync } from '../lib/offlineSync'

export function OfflineStatusBar() {
  const { isOnline, syncStats, triggerSync } = useOfflineSync()

  if (isOnline && syncStats.queuedActions === 0) {
    return null // Don't show anything when online and no pending actions
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-2 text-sm ${
      isOnline ? 'bg-yellow-500 text-yellow-900' : 'bg-red-500 text-white'
    }`}>
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">
            {isOnline ? '⚠️' : '📡'}
          </span>
          <span>
            {isOnline 
              ? `Syncing ${syncStats.queuedActions} pending actions...`
              : 'Offline - Actions will sync when reconnected'
            }
          </span>
        </div>
        
        {isOnline && syncStats.queuedActions > 0 && (
          <button
            onClick={triggerSync}
            className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30 transition-colors"
          >
            Sync Now
          </button>
        )}
      </div>
      
      {syncStats.queuedActions > 0 && (
        <div className="max-w-md mx-auto mt-1 text-xs opacity-75">
          {Object.entries(syncStats.actionsByType).map(([type, count]) => (
            <span key={type} className="mr-3">
              {type}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}