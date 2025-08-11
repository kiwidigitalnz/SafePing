import { useEffect, useState } from 'react'
import { useCheckInStore } from '../store/checkins'
import { useAuthStore } from '../store/auth'
import { StaffStatusGrid } from '../components/StaffStatusGrid'
import { ActivityFeed } from '../components/ActivityFeed'
import { TestCheckInButton } from '../components/TestCheckInButton'
import { RealtimeDashboard } from '../components/RealtimeDashboard'
import { CheckCircle, Clock, AlertTriangle, Users, TrendingUp, Shield, Plus, Settings } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<any>
  color: string
  subtitle?: string
  trend?: {
    value: string
    direction: 'up' | 'down'
    label: string
  }
}

function StatsCard({ title, value, icon: Icon, color, subtitle, trend }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-md ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {subtitle && (
                <div className="ml-2 text-sm text-gray-500">{subtitle}</div>
              )}
            </dd>
            {trend && (
              <dd className="flex items-center text-sm">
                <TrendingUp
                  className={`w-4 h-4 mr-1 ${
                    trend.direction === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}
                />
                <span
                  className={
                    trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {trend.value}
                </span>
                <span className="text-gray-500 ml-1">{trend.label}</span>
              </dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}

interface StaffDetailModalProps {
  checkIn: any
  isOpen: boolean
  onClose: () => void
}

function StaffDetailModal({ checkIn, isOpen, onClose }: StaffDetailModalProps) {
  const { acknowledge } = useCheckInStore()
  const [acknowledging, setAcknowledging] = useState(false)
  const [notes, setNotes] = useState('')

  if (!isOpen || !checkIn) return null

  const handleAcknowledge = async () => {
    setAcknowledging(true)
    try {
      await acknowledge(checkIn.id, notes)
      onClose()
    } catch (error) {
      console.error('Failed to acknowledge:', error)
    } finally {
      setAcknowledging(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Staff Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">
                {checkIn.users?.first_name} {checkIn.users?.last_name}
              </h4>
              {checkIn.users?.employee_id && (
                <p className="text-sm text-gray-500">ID: {checkIn.users.employee_id}</p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <p className={`text-sm font-medium ${
                checkIn.status === 'safe' ? 'text-green-600' :
                checkIn.status === 'overdue' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {checkIn.status.toUpperCase()}
              </p>
            </div>
            
            {checkIn.message && (
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <p className="text-sm text-gray-900">{checkIn.message}</p>
              </div>
            )}
            
            {checkIn.location_address && (
              <div>
                <label className="text-sm font-medium text-gray-700">Location</label>
                <p className="text-sm text-gray-900">{checkIn.location_address}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-700">Check-in Time</label>
              <p className="text-sm text-gray-900">
                {new Date(checkIn.created_at).toLocaleString()}
              </p>
            </div>
            
            {(checkIn.status === 'overdue' || checkIn.status === 'missed' || checkIn.status === 'emergency') && (
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Acknowledgment Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Add notes about your response..."
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
            {(checkIn.status === 'overdue' || checkIn.status === 'missed' || checkIn.status === 'emergency') && (
              <button
                onClick={handleAcknowledge}
                disabled={acknowledging}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {acknowledging ? 'Acknowledging...' : 'Acknowledge'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuthStore()
  const { stats, loadStats, selectedCheckIn, selectCheckIn } = useCheckInStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Use actual organization ID from authenticated user
  const organizationId = user?.organization_id || null

  useEffect(() => {
    if (organizationId) {
      setLoading(true)
      loadStats().finally(() => setLoading(false))
      
      // Refresh stats every 2 minutes
      const interval = setInterval(() => {
        loadStats()
      }, 120000)
      
      return () => clearInterval(interval)
    } else {
      setLoading(false)
    }
  }, [organizationId, loadStats])

  useEffect(() => {
    if (selectedCheckIn) {
      setModalOpen(true)
    }
  }, [selectedCheckIn])

  const handleCloseModal = () => {
    setModalOpen(false)
    selectCheckIn(null)
  }

  // Show empty state if no organization
  if (!organizationId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to SafePing</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Complete your organization setup to start monitoring your staff safety.
          </p>
          <button className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            <Settings className="w-4 h-4 mr-2" />
            Complete Setup
          </button>
        </div>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Total Staff',
      value: loading ? '...' : (stats?.total || 0),
      icon: Users,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    },
    {
      title: 'Safe Check-ins',
      value: loading ? '...' : (stats?.safe || 0),
      icon: CheckCircle,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      subtitle: 'last 24h',
    },
    {
      title: 'Overdue',
      value: loading ? '...' : (stats?.overdue || 0),
      icon: Clock,
      color: 'bg-gradient-to-r from-amber-500 to-orange-500',
    },
    {
      title: 'Compliance Rate',
      value: loading ? '...' : (stats?.onTimeRate ? `${stats.onTimeRate}%` : '100%'),
      icon: Shield,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitor your team's safety in real-time
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {process.env.NODE_ENV === 'development' && <TestCheckInButton />}
          <button className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.color} shadow-sm`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  {stat.subtitle && (
                    <span className="ml-2 text-sm text-gray-500">{stat.subtitle}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Alerts */}
      {(stats?.emergency || 0) > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-red-900">
                Emergency Alert
              </h3>
              <p className="mt-1 text-red-800">
                {stats?.emergency} staff member(s) have sent SOS alerts and require immediate attention.
              </p>
              <button className="mt-3 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                View Emergency Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missed Check-ins Alert */}
      {(stats?.missed || 0) > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-100 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-amber-900">
                Missed Check-ins
              </h3>
              <p className="mt-1 text-amber-800">
                {stats?.missed} staff member(s) have missed their scheduled check-ins.
              </p>
              <button className="mt-3 inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
                Review Missed Check-ins
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Staff Status Grid - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Staff Status</h3>
              <p className="text-sm text-gray-600">Current status of all team members</p>
            </div>
            <StaffStatusGrid onStaffClick={() => {}} />
          </div>
        </div>
        
        {/* Activity Feed - Takes 1 column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-600">Latest check-ins and alerts</p>
            </div>
            <ActivityFeed limit={8} />
          </div>
        </div>
      </div>

      {/* Staff Detail Modal */}
      <StaffDetailModal
        checkIn={selectedCheckIn}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
