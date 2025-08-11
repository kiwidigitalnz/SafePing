import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Users, UserPlus, MoreVertical, Edit, Trash2, Eye, UserCheck, UserX, MessageSquare, Send } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { StaffForm } from '../components/StaffForm'
import { StaffDetail } from '../components/StaffDetail'
import { supabase } from '../lib/supabase'
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  activateUser, 
  deactivateUser,
  searchUsers,
  getUserStats
} from '../lib/api/users'
import type { Database } from '../lib/supabase'

type User = Database['public']['Tables']['users']['Row']
type ViewMode = 'list' | 'create' | 'edit' | 'detail'

interface StaffMember extends User {
  // Add any additional computed properties if needed
}

export function Staff() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [sendingSMS, setSendingSMS] = useState<string | null>(null)

  // Fetch all users
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['users', user?.organization_id],
    queryFn: () => getUsers(user!.organization_id!),
    enabled: !!user?.organization_id
  })

  // Fetch user statistics
  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.organization_id],
    queryFn: () => getUserStats(user!.organization_id!),
    enabled: !!user?.organization_id
  })

  // Search users when search term changes
  const { data: searchResults } = useQuery({
    queryKey: ['search-users', user?.organization_id, searchTerm],
    queryFn: () => searchUsers(user!.organization_id!, searchTerm),
    enabled: !!user?.organization_id && searchTerm.length > 2
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      setViewMode('list')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      setViewMode('list')
      setSelectedStaff(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
    }
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? activateUser(id) : deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
    }
  })

  // Filter users based on search, role, and status
  const filteredUsers = (searchTerm.length > 2 ? searchResults : allUsers)?.filter(user => {
    const roleMatch = filterRole === 'all' || user.role === filterRole
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active)
    return roleMatch && statusMatch
  }) || []

  const handleCreate = async (data: Partial<User>) => {
    await createMutation.mutateAsync({
      ...data,
      organization_id: user!.organization_id!
    })
  }

  const handleUpdate = async (data: Partial<User>) => {
    if (!selectedStaff) return
    await updateMutation.mutateAsync({ id: selectedStaff.id, data })
  }

  const handleDelete = async (staff: StaffMember) => {
    if (confirm(`Are you sure you want to delete ${staff.first_name} ${staff.last_name}? This action cannot be undone.`)) {
      await deleteMutation.mutateAsync(staff.id)
      setOpenMenuId(null)
    }
  }

  const handleToggleActive = async (staff: StaffMember) => {
    await toggleActiveMutation.mutateAsync({ 
      id: staff.id, 
      isActive: !staff.is_active 
    })
    setOpenMenuId(null)
  }

  const handleEdit = (staff: StaffMember) => {
    setSelectedStaff(staff)
    setViewMode('edit')
    setOpenMenuId(null)
  }

  const handleViewDetail = (staff: StaffMember) => {
    setSelectedStaff(staff)
    setViewMode('detail')
    setOpenMenuId(null)
  }

  const handleCancel = () => {
    setViewMode('list')
    setSelectedStaff(null)
  }

  const handleResendSMS = async (staff: StaffMember) => {
    if (!staff.phone) {
      alert('This staff member does not have a phone number on file.')
      return
    }

    setSendingSMS(staff.id)
    setOpenMenuId(null)

    try {
      // Generate a new invitation token
      const invitationToken = crypto.randomUUID()
      
      // Update the user's invitation token
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          invitation_token: invitationToken,
          invitation_sent_at: new Date().toISOString()
        })
        .eq('id', staff.id)

      if (updateError) {
        console.error('Error updating user invitation token:', updateError)
        throw new Error('Failed to update invitation token')
      }

      // Create or update worker invitation record
      const { error: invitationError } = await supabase
        .from('worker_invitations')
        .upsert({
          user_id: staff.id,
          organization_id: user?.organization_id,
          invited_by: user?.id,
          invitation_token: invitationToken,
          phone_number: staff.phone,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (invitationError) {
        console.error('Error creating/updating invitation record:', invitationError)
        throw new Error('Failed to create invitation record')
      }

      // Send SMS via edge function
      console.log('Invoking send-worker-invitation function with:', {
        phoneNumber: staff.phone,
        invitationToken,
        workerName: `${staff.first_name} ${staff.last_name}`,
        organizationName: 'SafePing'
      })

      const { data, error } = await supabase.functions.invoke('send-worker-invitation', {
        body: {
          phoneNumber: staff.phone,
          invitationToken,
          workerName: `${staff.first_name} ${staff.last_name}`,
          organizationName: 'SafePing'
        }
      })

      console.log('Edge function response:', { data, error })

      if (error) {
        console.error('Edge function error:', error)
        throw error
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Failed to send SMS')
      }

      // Show success message
      alert(`SMS invitation resent to ${staff.first_name} ${staff.last_name} at ${staff.phone}`)
      
      // Refresh the user list
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (error: any) {
      console.error('Error resending SMS:', error)
      const errorMessage = error.message || error.error || 'Unknown error'
      alert(`Failed to resend SMS: ${errorMessage}`)
    } finally {
      setSendingSMS(null)
    }
  }

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

  if (!user?.organization_id) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500">Access denied. Organization not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your organization's staff members and their roles
          </p>
        </div>
        
        {viewMode === 'list' && (
          <button
            onClick={() => navigate('/staff/invite')}
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-[#15a2a6] to-teal-500 text-white rounded-xl font-semibold hover:from-[#128a8e] hover:to-teal-600 transform transition-all hover:scale-[1.02] shadow-lg"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add Staff Member
          </button>
        )}
      </div>

      {/* Statistics */}
      {viewMode === 'list' && stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500">
                      Total Staff
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.total}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500">
                      Active
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.active}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                    <UserX className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500">
                      Inactive
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.inactive}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#15a2a6]/20 to-teal-200 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-[#15a2a6]" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500">
                      Staff Members
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.by_role.worker || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {viewMode === 'list' && (
        <div className="bg-white shadow-lg rounded-2xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search staff by name, email, or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 block w-full border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all bg-white"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="supervisor">Supervisor</option>
                <option value="worker">Staff Member</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {viewMode === 'list' && (
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Staff Members ({filteredUsers.length})
            </h3>
          </div>
          
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by adding your first staff member.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((staff) => (
                <div key={staff.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {staff.first_name[0]}{staff.last_name[0]}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {staff.first_name} {staff.last_name}
                          </p>
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
                        
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          {staff.email && (
                            <span>{staff.email}</span>
                          )}
                          {staff.phone && (
                            <span className="flex items-center">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {staff.phone}
                            </span>
                          )}
                          {staff.employee_id && (
                            <span>ID: {staff.employee_id}</span>
                          )}
                          {staff.department && (
                            <span>{staff.department}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === staff.id ? null : staff.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {openMenuId === staff.id && (
                        <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <button
                              onClick={() => handleViewDetail(staff)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </button>
                            
                            <button
                              onClick={() => handleEdit(staff)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </button>
                            
                            {!staff.is_active && staff.phone && (
                              <button
                                onClick={() => handleResendSMS(staff)}
                                disabled={sendingSMS === staff.id}
                                className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {sendingSMS === staff.id ? (
                                  <>
                                    <div className="w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Resend SMS Invitation
                                  </>
                                )}
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleToggleActive(staff)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                            
                            <button
                              onClick={() => handleDelete(staff)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'create' && (
        <StaffForm
          organizationId={user.organization_id}
          onSubmit={handleCreate}
          onCancel={handleCancel}
          loading={createMutation.isPending}
        />
      )}

      {viewMode === 'edit' && selectedStaff && (
        <StaffForm
          staff={selectedStaff}
          organizationId={user.organization_id}
          onSubmit={handleUpdate}
          onCancel={handleCancel}
          loading={updateMutation.isPending}
        />
      )}

      {viewMode === 'detail' && selectedStaff && (
        <StaffDetail
          staff={selectedStaff}
          onEdit={() => setViewMode('edit')}
          onClose={handleCancel}
        />
      )}
    </div>
  )
}
