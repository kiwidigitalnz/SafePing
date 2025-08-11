import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'
import { getCheckInHistory } from '../lib/checkins'
import { offlineStore } from '../lib/offline'
import { CheckCircle, AlertTriangle, Clock, MapPin, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import type { Database } from '../lib/supabase'

type CheckInRow = Database['public']['Tables']['check_ins']['Row']
type CheckInWithPending = CheckInRow & { isPending: boolean }

export default function HistoryPage() {
  const { user } = useAuthStore()
  const [pendingCheckIns, setPendingCheckIns] = useState<CheckInRow[]>([])

  // Fetch online check-in history
  const { data: onlineHistory = [], isLoading, refetch } = useQuery({
    queryKey: ['checkin-history', user?.id],
    queryFn: () => getCheckInHistory(user!.id),
    enabled: !!user?.id && navigator.onLine,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Load pending offline check-ins
  useEffect(() => {
    const loadPendingCheckIns = async () => {
      const pending = await offlineStore.getPendingCheckIns()
      setPendingCheckIns(pending)
    }
    
    loadPendingCheckIns()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingCheckIns, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="text-green-500" size={20} />
      case 'emergency':
        return <AlertTriangle className="text-red-500" size={20} />
      case 'overdue':
        return <Clock className="text-orange-500" size={20} />
      case 'missed':
        return <Clock className="text-red-500" size={20} />
      default:
        return <Clock className="text-gray-400" size={20} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'emergency':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'overdue':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'missed':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const allCheckIns: CheckInWithPending[] = [
    ...pendingCheckIns.map(checkIn => ({ ...checkIn, isPending: true })),
    ...onlineHistory.map(checkIn => ({ ...checkIn, isPending: false }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Check-in History</h2>
          <button
            onClick={() => refetch()}
            disabled={isLoading || !navigator.onLine}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={isLoading ? 'animate-spin' : ''} size={20} />
          </button>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {allCheckIns.length} total check-ins
          </span>
          <div className="flex items-center space-x-1">
            {navigator.onLine ? (
              <Wifi className="text-green-500" size={16} />
            ) : (
              <WifiOff className="text-red-500" size={16} />
            )}
            <span className={navigator.onLine ? 'text-green-600' : 'text-red-600'}>
              {navigator.onLine ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Check-ins Alert */}
      {pendingCheckIns.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <WifiOff className="text-orange-600 mr-2" size={20} />
            <div>
              <p className="text-sm font-medium text-orange-800">
                {pendingCheckIns.length} check-in{pendingCheckIns.length > 1 ? 's' : ''} pending sync
              </p>
              <p className="text-xs text-orange-600">
                Will sync automatically when online
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Check-in List */}
      <div className="space-y-3">
        {isLoading && allCheckIns.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading check-in history...</p>
            </div>
          </div>
        ) : allCheckIns.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <Clock className="text-gray-400 mx-auto mb-4" size={48} />
              <p className="text-gray-600">No check-ins yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Your safety check-ins will appear here
              </p>
            </div>
          </div>
        ) : (
          allCheckIns.map((checkIn) => (
            <div
              key={checkIn.id}
              className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-l-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(checkIn.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(checkIn.status)}`}>
                        {checkIn.status === 'safe' ? 'Safe' : 
                         checkIn.status === 'emergency' ? 'Emergency' :
                         checkIn.status === 'overdue' ? 'Overdue' :
                         checkIn.status === 'missed' ? 'Missed' : 'Unknown'}
                      </span>
                      
                      {checkIn.isPending && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200">
                          <WifiOff size={12} className="mr-1" />
                          Pending
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(checkIn.created_at), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(checkIn.created_at), 'h:mm a')}
                    </p>
                    
                    {checkIn.message && (
                      <p className="text-sm text-gray-600 mt-2">{checkIn.message}</p>
                    )}
                    
                    {(checkIn.location_lat && checkIn.location_lng) && (
                      <div className="flex items-center text-xs text-gray-500 mt-2">
                        <MapPin size={12} className="mr-1" />
                        <span>Location recorded</span>
                        {checkIn.location_accuracy && (
                          <span className="ml-1">
                            (±{Math.round(checkIn.location_accuracy)}m)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center text-xs text-gray-400">
                  {checkIn.is_offline && <WifiOff size={12} />}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button (for future pagination) */}
      {onlineHistory.length >= 20 && (
        <div className="mt-6 text-center">
          <button className="text-primary font-medium text-sm hover:text-primary-dark transition-colors">
            Load More
          </button>
        </div>
      )}
    </div>
  )
}