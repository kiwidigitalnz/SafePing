import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react'
import { RealtimeManager, realtimeStatus } from '../lib/realtime'
import { getUsers } from '../lib/api/users'
import { getRecentCheckIns } from '../lib/api/checkins'
import { getActiveIncidents } from '../lib/api/incidents'

interface RealtimeDashboardProps {
  organizationId: string
}

interface DashboardStats {
  totalStaff: number
  safeStaff: number
  overdueStaff: number
  activeIncidents: number
}

interface RecentActivity {
  id: string
  type: 'check_in' | 'incident' | 'escalation'
  message: string
  timestamp: string
  status: 'safe' | 'overdue' | 'emergency' | 'resolved'
}

export function RealtimeDashboard({ organizationId }: RealtimeDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalStaff: 0,
    safeStaff: 0,
    overdueStaff: 0,
    activeIncidents: 0
  })
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [realtimeManager] = useState(() => new RealtimeManager(organizationId))

  useEffect(() => {
    loadInitialData()
    setupRealtimeSubscriptions()

    // Monitor connection status
    const statusInterval = setInterval(() => {
      setIsConnected(realtimeStatus.isConnected)
    }, 1000)

    return () => {
      clearInterval(statusInterval)
      realtimeManager.unsubscribeAll()
    }
  }, [organizationId])

  const loadInitialData = async () => {
    try {
      // Load staff
      const users = await getUsers(organizationId)
      const staff = users.filter(user => user.role === 'worker')
      
      // Load recent check-ins
      const recentCheckIns = await getRecentCheckIns(organizationId, 10)
      
      // Load active incidents
      const incidents = await getActiveIncidents(organizationId)
      
      // Calculate stats
      const safeCount = recentCheckIns.filter(checkIn => checkIn.status === 'safe').length
      const overdueCount = recentCheckIns.filter(checkIn => checkIn.status === 'overdue').length
      
      setStats({
        totalStaff: staff.length,
        safeStaff: safeCount,
        overdueStaff: overdueCount,
        activeIncidents: incidents.length
      })

      // Transform recent activity
      const activity: RecentActivity[] = [
        ...recentCheckIns.slice(0, 5).map(checkIn => ({
          id: checkIn.id,
          type: 'check_in' as const,
          message: `${checkIn.user?.first_name} ${checkIn.user?.last_name} checked in (${checkIn.status})`,
          timestamp: checkIn.created_at,
          status: checkIn.status
        })),
        ...incidents.slice(0, 3).map(incident => ({
          id: incident.id,
          type: 'incident' as const,
          message: `Incident: ${incident.title}`,
          timestamp: incident.created_at,
          status: incident.severity === 'high' ? 'emergency' as const : 'overdue' as const
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setRecentActivity(activity)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const setupRealtimeSubscriptions = () => {
    // Subscribe to check-ins
    realtimeManager.subscribeToCheckIns({
      onInsert: (payload) => {
        console.log('New check-in:', payload.new)
        addRecentActivity({
          id: payload.new.id,
          type: 'check_in',
          message: `Staff member checked in (${payload.new.status})`,
          timestamp: payload.new.created_at,
          status: payload.new.status
        })
        updateStatsFromCheckIn(payload.new.status, 'insert')
      },
      onUpdate: (payload) => {
        console.log('Updated check-in:', payload.new)
        addRecentActivity({
          id: payload.new.id,
          type: 'check_in',
          message: `Check-in updated (${payload.new.status})`,
          timestamp: payload.new.updated_at || payload.new.created_at,
          status: payload.new.status
        })
        updateStatsFromCheckIn(payload.old?.status, 'delete')
        updateStatsFromCheckIn(payload.new.status, 'insert')
      }
    })

    // Subscribe to incidents
    realtimeManager.subscribeToIncidents({
      onInsert: (payload) => {
        console.log('New incident:', payload.new)
        addRecentActivity({
          id: payload.new.id,
          type: 'incident',
          message: `New incident: ${payload.new.title}`,
          timestamp: payload.new.created_at,
          status: payload.new.severity === 'high' ? 'emergency' : 'overdue'
        })
        setStats(prev => ({
          ...prev,
          activeIncidents: prev.activeIncidents + 1
        }))
      },
      onUpdate: (payload) => {
        if (payload.new.status === 'resolved' && payload.old?.status !== 'resolved') {
          addRecentActivity({
            id: payload.new.id,
            type: 'incident',
            message: `Incident resolved: ${payload.new.title}`,
            timestamp: payload.new.updated_at || payload.new.created_at,
            status: 'resolved'
          })
          setStats(prev => ({
            ...prev,
            activeIncidents: Math.max(0, prev.activeIncidents - 1)
          }))
        }
      }
    })
  }

  const addRecentActivity = (activity: RecentActivity) => {
    setRecentActivity(prev => [activity, ...prev.slice(0, 9)])
    setLastUpdated(new Date())
  }

  const updateStatsFromCheckIn = (status: string, operation: 'insert' | 'delete') => {
    const multiplier = operation === 'insert' ? 1 : -1
    
    setStats(prev => {
      const newStats = { ...prev }
      
      if (status === 'safe') {
        newStats.safeStaff = Math.max(0, prev.safeStaff + multiplier)
      } else if (status === 'overdue') {
        newStats.overdueStaff = Math.max(0, prev.overdueStaff + multiplier)
      }
      
      return newStats
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'overdue': return <Clock className="w-4 h-4 text-orange-600" />
      case 'emergency': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'resolved': return <CheckCircle className="w-4 h-4 text-blue-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const refreshData = () => {
    loadInitialData()
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-3">
          {isConnected ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-600" />
          )}
          <span className={`text-sm font-medium ${
            isConnected ? 'text-green-800' : 'text-red-800'
          }`}>
            {isConnected ? 'Real-time Connected' : 'Disconnected'}
          </span>
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Last updated: {formatTimestamp(lastUpdated.toISOString())}
            </span>
          )}
        </div>
        
        <button
          onClick={refreshData}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          title="Refresh data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Safe</p>
              <p className="text-2xl font-bold text-green-700">{stats.safeStaff}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-orange-700">{stats.overdueStaff}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Incidents</p>
              <p className="text-2xl font-bold text-red-700">{stats.activeIncidents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-600">Live updates from your safety monitoring system</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentActivity.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No recent activity
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="p-6 flex items-center space-x-4">
                {getStatusIcon(activity.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activity.type === 'check_in' 
                    ? 'bg-blue-100 text-blue-800'
                    : activity.type === 'incident'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {activity.type.replace('_', ' ')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}