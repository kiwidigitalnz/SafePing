import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'
import { getRoleDisplayName } from '../lib/auth'
import type { UserRole } from '../lib/auth'

interface Admin {
  id: string
  email: string | null
  first_name: string
  last_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  is_primary_admin: boolean
}

interface AdminManagementProps {
  organizationId: string
}

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['org_admin', 'admin'] as const),
})

type InviteForm = z.infer<typeof inviteSchema>

export function AdminManagement({ organizationId }: AdminManagementProps) {
  const { user } = useAuthStore()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'admin',
    },
  })

  useEffect(() => {
    loadAdmins()
  }, [organizationId])

  const loadAdmins = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('organization_admins')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setAdmins(data || [])
    } catch (error) {
      console.error('Error loading admins:', error)
      setMessage({ 
        type: 'error', 
        text: 'Failed to load administrators' 
      })
    } finally {
      setLoading(false)
    }
  }

  const onInvite = async (data: InviteForm) => {
    setInviteLoading(true)
    setMessage(null)

    try {
      // Get organization name for invitation email
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single()

      // Create admin invitation record
      const { error: invitationError } = await supabase
        .from('admin_invitations')
        .insert({
          organization_id: organizationId,
          invited_by: user?.id,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role,
          verification_code_id: null // Will be set by Edge Function
        })

      if (invitationError) throw invitationError

      // Send invitation email with verification code
      const { error: emailError } = await supabase.functions.invoke('send-verification-code', {
        body: {
          email: data.email,
          type: 'admin_invitation',
          organizationName: orgData?.name || 'Your Organization',
          firstName: data.firstName,
          lastName: data.lastName,
          metadata: {
            organization_name: orgData?.name,
            inviter_name: `${user?.first_name} ${user?.last_name}`,
            role: data.role
          }
        }
      })

      if (emailError) throw emailError

      setMessage({ 
        type: 'success', 
        text: `Successfully sent invitation to ${data.firstName} ${data.lastName}. They will receive a verification code via email.` 
      })
      
      setShowInviteForm(false)
      reset()
      loadAdmins()
      
    } catch (error) {
      console.error('Error inviting admin:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to invite administrator' 
      })
    } finally {
      setInviteLoading(false)
    }
  }

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId)

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: `Administrator ${!currentStatus ? 'activated' : 'deactivated'} successfully` 
      })
      
      loadAdmins()
    } catch (error) {
      console.error('Error updating admin status:', error)
      setMessage({ 
        type: 'error', 
        text: 'Failed to update administrator status' 
      })
    }
  }

  const updateAdminRole = async (adminId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId)

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: 'Administrator role updated successfully' 
      })
      
      loadAdmins()
    } catch (error) {
      console.error('Error updating admin role:', error)
      setMessage({ 
        type: 'error', 
        text: 'Failed to update administrator role' 
      })
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Administrators</h3>
              <p className="mt-1 text-sm text-gray-600">
                Manage organization administrators and their permissions
              </p>
            </div>
            <button
              onClick={() => setShowInviteForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Add Administrator
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Invite Form */}
          {showInviteForm && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="text-md font-medium text-gray-900 mb-4">Invite Administrator</h4>
              <form onSubmit={handleSubmit(onInvite)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name *
                    </label>
                    <input
                      {...register('firstName')}
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="Enter first name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name *
                    </label>
                    <input
                      {...register('lastName')}
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="Enter last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role *
                  </label>
                  <select
                    {...register('role')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    <option value="admin">Admin</option>
                    <option value="org_admin">Organization Admin</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteForm(false)
                      reset()
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {inviteLoading ? 'Adding...' : 'Add Administrator'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Admins List */}
          {admins.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">No administrators found</p>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Administrator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {admin.first_name.charAt(0)}{admin.last_name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {admin.first_name} {admin.last_name}
                              {admin.is_primary_admin && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{admin.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={admin.role}
                          onChange={(e) => updateAdminRole(admin.id, e.target.value as UserRole)}
                          disabled={admin.id === user?.id || admin.is_primary_admin}
                          className="text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="admin">Admin</option>
                          <option value="org_admin">Organization Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          admin.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {admin.id !== user?.id && !admin.is_primary_admin && (
                          <button
                            onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                            className={`${
                              admin.is_active 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {admin.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}