import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  IdCard, 
  Building, 
  Briefcase, 
  Shield, 
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  X,
  MapPin
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getRecentCheckIns } from '../lib/api/checkins'
import { getUserSchedules } from '../lib/api/schedules'
import type { Database } from '../lib/supabase'

type User = Database['public']['Tables']['users']['Row']

interface StaffDetailProps {
  staff: User
  onEdit: () => void
  onClose: () => void
}

export function StaffDetail({ staff, onEdit, onClose }: StaffDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'checkins' | 'schedules'>('overview')

  // Fetch recent check-ins for this staff member
  const { data: recentCheckIns = [] } = useQuery({
    queryKey: ['recent-checkins', staff.id],
    queryFn: () => getRecentCheckIns(staff.organization_id, 20),
    select: (data) => data.filter(checkIn => checkIn.user_id === staff.id)
  })

  // Fetch schedules for this staff member
  const { data: userSchedules = [] } = useQuery({
    queryKey: ['user-schedules', staff.id],
    queryFn: () => getUserSchedules(staff.id)
  })

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'admin': return 'Admin'
      case 'supervisor': return 'Supervisor'
      case 'worker': return 'Staff Member'
      default: return role
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'supervisor': return 'bg-green-100 text-green-800'
      case 'worker': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'overdue': return <Clock className="w-4 h-4 text-orange-600" />
      case 'missed': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'emergency': return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: UserIcon },
    { id: 'checkins', label: 'Recent Check-ins', icon: CheckCircle },
    { id: 'schedules', label: 'Schedules', icon: Calendar },
  ]

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-gray-700">
                {staff.first_name[0]}{staff.last_name[0]}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {staff.first_name} {staff.last_name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(staff.role)}`}>
                  {getRoleLabel(staff.role)}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  staff.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {staff.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'checkins' | 'schedules')}
                className={`py-3 px-1 mr-8 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Contact Information
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{staff.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">{staff.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-4 h-4 mr-2" />
                Work Information
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center space-x-3">
                  <IdCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Employee ID</p>
                    <p className="text-sm text-gray-600">{staff.employee_id || 'Not assigned'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Job Title</p>
                    <p className="text-sm text-gray-600">{staff.job_title || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Department</p>
                    <p className="text-sm text-gray-600">{staff.department || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Role</p>
                    <p className="text-sm text-gray-600">{getRoleLabel(staff.role)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            {(staff.emergency_contact_name || staff.emergency_contact_phone) && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Emergency Contact
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Name</p>
                      <p className="text-sm text-gray-600">{staff.emergency_contact_name || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600">{staff.emergency_contact_phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Account Information
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created</p>
                    <p className="text-sm text-gray-600">{formatDateTime(staff.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-600">{formatDateTime(staff.updated_at)}</p>
                  </div>
                </div>
                {staff.last_seen_at && (
                  <div className="flex items-center space-x-3">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Seen</p>
                      <p className="text-sm text-gray-600">{formatDateTime(staff.last_seen_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'checkins' && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Check-ins</h4>
            {recentCheckIns.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No check-ins yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This staff member hasn't submitted any check-ins yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCheckIns.map((checkIn) => (
                  <div key={checkIn.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(checkIn.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {checkIn.status} Check-in
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(checkIn.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{formatDateTime(checkIn.created_at)}</p>
                        {checkIn.location_address && (
                          <p className="text-xs text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {checkIn.location_address}
                          </p>
                        )}
                      </div>
                    </div>
                    {checkIn.message && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-sm text-gray-600">{checkIn.message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedules' && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Assigned Schedules</h4>
            {userSchedules.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules assigned</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This staff member is not currently assigned to any schedules.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userSchedules.map((assignment) => (
                  <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">
                          {assignment.schedule.name}
                        </h5>
                        {assignment.schedule.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {assignment.schedule.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Frequency: {assignment.schedule.frequency}</span>
                          <span>Interval: {assignment.schedule.check_in_interval_minutes}min</span>
                          {assignment.schedule.start_time && assignment.schedule.end_time && (
                            <span>
                              Time: {assignment.schedule.start_time} - {assignment.schedule.end_time}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignment.schedule.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.schedule.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned: {formatDateTime(assignment.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}