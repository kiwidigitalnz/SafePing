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
  MapPin,
  Users,
  Activity,
  UserCheck,
  UserX
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getRecentCheckIns } from '../lib/api/checkins'
import { getUserSchedules } from '../lib/api/schedules'
import type { Database } from '../lib/supabase'

type User = Database['public']['Tables']['users']['Row']

interface StaffDetailProps {
  staff: any // Accept any type for staff to handle role conversion
  onEdit: () => void
  onClose: () => void
  onToggleActive?: (staff: any) => void
  onDelete?: (staff: any) => void
}

export function StaffDetail({ staff, onEdit, onClose, onToggleActive, onDelete }: StaffDetailProps) {
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
      case 'org_admin': return 'Organization Admin'
      case 'admin': return 'Administrator'
      case 'staff': return 'Staff Member'
      default: return role
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'from-red-500 to-red-600'
      case 'org_admin': return 'from-purple-500 to-purple-600'
      case 'admin': return 'from-blue-500 to-blue-600'
      case 'staff': return 'from-gray-500 to-gray-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'overdue': return <Clock className="w-5 h-5 text-orange-600" />
      case 'missed': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'emergency': return <AlertTriangle className="w-5 h-5 text-red-600" />
      default: return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-200'
      case 'overdue': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'missed': return 'bg-red-100 text-red-800 border-red-200'
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: UserIcon },
    { id: 'checkins', label: 'Recent Check-ins', icon: Activity },
    { id: 'schedules', label: 'Schedules', icon: Calendar },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#15a2a6] to-teal-500 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
              <span className="text-3xl font-bold text-white">
                {staff.first_name[0]}{staff.last_name[0]}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {staff.first_name} {staff.last_name}
              </h3>
              <div className="flex items-center space-x-3 mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getRoleBadgeColor(staff.role)} text-white`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {getRoleLabel(staff.role)}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  staff.is_active 
                    ? 'bg-green-400/30 text-white border border-green-300/50' 
                    : 'bg-red-400/30 text-white border border-red-300/50'
                }`}>
                  {staff.is_active ? (
                    <>
                      <UserCheck className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <UserX className="w-3 h-3 mr-1" />
                      Inactive
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onEdit}
              className="inline-flex items-center px-4 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white font-semibold hover:bg-white/30 transition-all"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
            {onToggleActive && (
              <button
                onClick={() => onToggleActive(staff)}
                className={`inline-flex items-center px-4 py-2.5 backdrop-blur-sm border rounded-xl font-semibold transition-all ${
                  staff.is_active
                    ? 'bg-orange-500/20 border-orange-300/30 text-white hover:bg-orange-500/30'
                    : 'bg-green-500/20 border-green-300/30 text-white hover:bg-green-500/30'
                }`}
              >
                {staff.is_active ? (
                  <>
                    <UserX className="w-4 h-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${staff.first_name} ${staff.last_name}? This action cannot be undone.`)) {
                    onDelete(staff)
                  }
                }}
                className="inline-flex items-center px-4 py-2.5 bg-red-500/20 backdrop-blur-sm border border-red-300/30 rounded-xl text-white font-semibold hover:bg-red-500/30 transition-all"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 bg-gray-50">
        <nav className="flex px-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'checkins' | 'schedules')}
                className={`py-4 px-6 border-b-3 font-semibold text-sm flex items-center transition-all ${
                  activeTab === tab.id
                    ? 'border-[#15a2a6] text-[#15a2a6] bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
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
      <div className="p-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Contact Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                Contact Information
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Email Address</p>
                      <p className="text-sm text-gray-900 mt-1">{staff.email || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Phone Number</p>
                      <p className="text-sm text-gray-900 mt-1">{staff.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-[#15a2a6] to-teal-500 rounded-lg flex items-center justify-center mr-3">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                Work Information
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <IdCard className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Employee ID</p>
                      <p className="text-sm text-gray-900 mt-1">{staff.employee_id || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Job Title</p>
                      <p className="text-sm text-gray-900 mt-1">{staff.job_title || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Department</p>
                      <p className="text-sm text-gray-900 mt-1">{staff.department || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Access Role</p>
                      <p className="text-sm text-gray-900 mt-1">{getRoleLabel(staff.role)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            {(staff.emergency_contact_name || staff.emergency_contact_phone) && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Emergency Contact
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Contact Name</p>
                        <p className="text-sm text-gray-900 mt-1">{staff.emergency_contact_name || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Contact Phone</p>
                        <p className="text-sm text-gray-900 mt-1">{staff.emergency_contact_phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                Account Information
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Created</p>
                      <p className="text-sm text-gray-900 mt-1">{formatDateTime(staff.created_at)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Last Updated</p>
                      <p className="text-sm text-gray-900 mt-1">{formatDateTime(staff.updated_at)}</p>
                    </div>
                  </div>
                </div>
                {staff.last_seen_at && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <Activity className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Last Seen</p>
                        <p className="text-sm text-gray-900 mt-1">{formatDateTime(staff.last_seen_at)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'checkins' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-gray-900">Recent Check-ins</h4>
              <span className="text-sm text-gray-500">
                Showing last 20 check-ins
              </span>
            </div>
            
            {recentCheckIns.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No check-ins yet</h3>
                <p className="mt-2 text-sm text-gray-600">
                  This staff member hasn't submitted any check-ins yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCheckIns.map((checkIn) => (
                  <div key={checkIn.id} className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="mt-1">
                          {getStatusIcon(checkIn.status)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(checkIn.status)}`}>
                              {checkIn.status.charAt(0).toUpperCase() + checkIn.status.slice(1)} Check-in
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDistanceToNow(new Date(checkIn.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {checkIn.message && (
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                              {checkIn.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatDateTime(checkIn.created_at)}</p>
                        {checkIn.location_address && (
                          <p className="text-xs text-gray-500 flex items-center justify-end mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {checkIn.location_address}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedules' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-gray-900">Assigned Schedules</h4>
              <span className="text-sm text-gray-500">
                {userSchedules.length} schedule{userSchedules.length !== 1 ? 's' : ''} assigned
              </span>
            </div>
            
            {userSchedules.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No schedules assigned</h3>
                <p className="mt-2 text-sm text-gray-600">
                  This staff member is not currently assigned to any schedules.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {userSchedules.map((assignment) => (
                  <div key={assignment.id} className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h5 className="text-lg font-semibold text-gray-900">
                            {assignment.schedule.name}
                          </h5>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            assignment.schedule.is_active 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {assignment.schedule.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        {assignment.schedule.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {assignment.schedule.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                            Check-in every {assignment.schedule.check_in_interval_minutes} minutes
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                            {assignment.schedule.frequency}
                          </div>
                          {assignment.schedule.start_time && assignment.schedule.end_time && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Activity className="w-4 h-4 mr-1.5 text-gray-400" />
                              {assignment.schedule.start_time} - {assignment.schedule.end_time}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-500">
                          Assigned
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDateTime(assignment.created_at)}
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
