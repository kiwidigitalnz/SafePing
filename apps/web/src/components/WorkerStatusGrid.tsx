import { useEffect } from 'react'
import { useCheckInStore } from '../store/checkins'
import { useAuthStore } from '../store/auth'
import { CheckCircle, Clock, AlertTriangle, XCircle, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface WorkerStatusCardProps {
  checkIn: any
  onClick?: () => void
}

function WorkerStatusCard({ checkIn, onClick }: WorkerStatusCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'safe':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          iconColor: 'text-green-600',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          label: 'Safe',
        }
      case 'overdue':
        return {
          icon: Clock,
          bgColor: 'bg-yellow-50',
          iconColor: 'text-yellow-600',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          label: 'Overdue',
        }
      case 'missed':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          label: 'Missed',
        }
      case 'emergency':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-50 animate-pulse',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          label: 'EMERGENCY',
        }
      default:
        return {
          icon: User,
          bgColor: 'bg-gray-50',
          iconColor: 'text-gray-600',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          label: 'Unknown',
        }
    }
  }

  const config = getStatusConfig(checkIn.status)
  const Icon = config.icon
  const timeAgo = checkIn.created_at 
    ? formatDistanceToNow(new Date(checkIn.created_at), { addSuffix: true })
    : 'Never'

  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md
        ${config.bgColor} ${config.borderColor}
      `}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">
              {checkIn.users?.first_name} {checkIn.users?.last_name}
            </p>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.textColor} ${config.bgColor}`}>
              {config.label}
            </span>
          </div>
          
          {checkIn.users?.employee_id && (
            <p className="text-xs text-gray-500">
              ID: {checkIn.users.employee_id}
            </p>
          )}
          
          <div className="mt-2">
            <p className="text-xs text-gray-600">
              Last check-in: {timeAgo}
            </p>
            
            {checkIn.message && (
              <p className="text-xs text-gray-600 truncate mt-1">
                "{checkIn.message}"
              </p>
            )}
            
            {checkIn.location_address && (
              <p className="text-xs text-gray-500 truncate mt-1">
                📍 {checkIn.location_address}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {checkIn.status === 'emergency' && (
        <div className="absolute -top-1 -right-1">
          <div className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></div>
          <div className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></div>
        </div>
      )}
    </div>
  )
}

interface WorkerStatusGridProps {
  onWorkerClick?: (checkIn: any) => void
}

export function WorkerStatusGrid({ onWorkerClick }: WorkerStatusGridProps) {
  const { user } = useAuthStore()
  const { 
    latestCheckIns, 
    loading, 
    error,
    loadLatestCheckIns,
    subscribeToUpdates,
    unsubscribe,
    isConnected,
    selectCheckIn
  } = useCheckInStore()

  useEffect(() => {
    if (user?.organization_id) {
      // Load initial data
      loadLatestCheckIns()
      
      // Subscribe to real-time updates
      subscribeToUpdates(user.organization_id)
    }

    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [user?.organization_id])

  // Auto-refresh every 30 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.organization_id) {
        loadLatestCheckIns()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [user?.organization_id])

  const handleWorkerClick = (checkIn: any) => {
    selectCheckIn(checkIn)
    onWorkerClick?.(checkIn)
  }

  if (loading && latestCheckIns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={() => loadLatestCheckIns()}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (latestCheckIns.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No workers yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Invite your first worker to start monitoring their safety.
        </p>
      </div>
    )
  }

  // Group workers by status for better organization
  const groupedWorkers = {
    emergency: latestCheckIns.filter(c => c.status === 'emergency'),
    missed: latestCheckIns.filter(c => c.status === 'missed'),
    overdue: latestCheckIns.filter(c => c.status === 'overdue'),
    safe: latestCheckIns.filter(c => c.status === 'safe'),
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Worker Status ({latestCheckIns.length} workers)
        </h3>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400' : 'bg-gray-400'
            }`}
          />
          <span className="text-xs text-gray-500">
            {isConnected ? 'Live' : 'Offline'}
          </span>
          {loading && (
            <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full" />
          )}
        </div>
      </div>

      {/* Emergency Workers - Always show first */}
      {groupedWorkers.emergency.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-red-600 mb-3 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" />
            EMERGENCY ({groupedWorkers.emergency.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groupedWorkers.emergency.map((checkIn) => (
              <WorkerStatusCard
                key={checkIn.id}
                checkIn={checkIn}
                onClick={() => handleWorkerClick(checkIn)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Missed Workers */}
      {groupedWorkers.missed.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-red-600 mb-3">
            MISSED CHECK-INS ({groupedWorkers.missed.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groupedWorkers.missed.map((checkIn) => (
              <WorkerStatusCard
                key={checkIn.id}
                checkIn={checkIn}
                onClick={() => handleWorkerClick(checkIn)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Overdue Workers */}
      {groupedWorkers.overdue.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-yellow-600 mb-3">
            OVERDUE ({groupedWorkers.overdue.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groupedWorkers.overdue.map((checkIn) => (
              <WorkerStatusCard
                key={checkIn.id}
                checkIn={checkIn}
                onClick={() => handleWorkerClick(checkIn)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Safe Workers */}
      {groupedWorkers.safe.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-green-600 mb-3">
            SAFE ({groupedWorkers.safe.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groupedWorkers.safe.map((checkIn) => (
              <WorkerStatusCard
                key={checkIn.id}
                checkIn={checkIn}
                onClick={() => handleWorkerClick(checkIn)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}