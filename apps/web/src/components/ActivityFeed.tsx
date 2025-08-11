import { useEffect } from 'react'
import { useCheckInStore } from '../store/checkins'
import { useAuthStore } from '../store/auth'
import { CheckCircle, Clock, AlertTriangle, XCircle, MapPin, MessageSquare } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface ActivityItemProps {
  checkIn: any
  onClick?: () => void
}

function ActivityItem({ checkIn, onClick }: ActivityItemProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'safe':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'checked in safely',
        }
      case 'overdue':
        return {
          icon: Clock,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'is overdue for check-in',
        }
      case 'missed':
        return {
          icon: XCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'missed check-in',
        }
      case 'emergency':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'sent an SOS alert',
        }
      default:
        return {
          icon: CheckCircle,
          iconColor: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'updated status',
        }
    }
  }

  const config = getStatusConfig(checkIn.status)
  const Icon = config.icon
  const timeAgo = formatDistanceToNow(new Date(checkIn.created_at), { addSuffix: true })
  const fullTime = format(new Date(checkIn.created_at), 'MMM d, yyyy h:mm a')

  return (
    <div
      className="group px-6 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 border-l-2 border-transparent hover:border-primary"
      onClick={onClick}
    >
      <div className="flex space-x-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor} ring-2 ring-white shadow-sm`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm">
                <span className="font-semibold text-gray-900">
                  {checkIn.users?.first_name} {checkIn.users?.last_name}
                </span>{' '}
                <span className={`${checkIn.status === 'emergency' ? 'font-semibold text-red-600' : 'text-gray-600'}`}>
                  {config.label}
                </span>
              </p>
              {checkIn.users?.employee_id && (
                <p className="text-xs text-gray-500 mt-0.5">
                  ID: {checkIn.users.employee_id}
                </p>
              )}
            </div>
            <time
              className="text-xs text-gray-400 ml-2 whitespace-nowrap"
              title={fullTime}
            >
              {timeAgo}
            </time>
          </div>
          
          {checkIn.message && (
            <div className="mt-2 flex items-start space-x-2">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700 italic">
                "{checkIn.message}"
              </p>
            </div>
          )}
          
          {checkIn.location_address && (
            <div className="mt-2 flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs text-gray-600 truncate">
                {checkIn.location_address}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ActivityFeedProps {
  limit?: number
  showHeader?: boolean
  onItemClick?: (checkIn: any) => void
}

export function ActivityFeed({ limit = 10, showHeader = true, onItemClick }: ActivityFeedProps) {
  const { user } = useAuthStore()
  const { 
    checkIns, 
    loading, 
    error,
    loadCheckIns,
    selectCheckIn,
    filters,
    setFilters
  } = useCheckInStore()

  useEffect(() => {
    if (user?.organization_id) {
      // Load recent check-ins
      loadCheckIns({ limit })
    }
  }, [user?.organization_id, limit])

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.organization_id) {
        loadCheckIns({ limit })
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [user?.organization_id, limit])

  const handleItemClick = (checkIn: any) => {
    selectCheckIn(checkIn)
    onItemClick?.(checkIn)
  }

  const handleFilterByStatus = (status: string) => {
    if (filters.status === status) {
      // Remove filter if already applied
      setFilters({ status: undefined })
    } else {
      setFilters({ status })
    }
  }

  if (loading && checkIns.length === 0) {
    return (
      <div>
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
        )}
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
        )}
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => loadCheckIns({ limit })}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const displayedCheckIns = checkIns.slice(0, limit)

  return (
    <div>
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            {loading && (
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full" />
            )}
          </div>
        </div>
      )}
      
      <div className="max-h-[600px] overflow-y-auto">
        {displayedCheckIns.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {displayedCheckIns.map((checkIn) => (
              <ActivityItem
                key={checkIn.id}
                checkIn={checkIn}
                onClick={() => handleItemClick(checkIn)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No activity yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Check-ins will appear here as workers submit them.
            </p>
          </div>
        )}
      </div>
      
      {checkIns.length > limit && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => {
              loadCheckIns({ limit: limit + 10 })
            }}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            View all activity →
          </button>
        </div>
      )}
    </div>
  )
}
