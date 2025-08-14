import { supabase } from '../supabase'

export interface User {
  id: string
  organization_id: string
  email: string | null
  phone: string | null
  first_name: string
  last_name: string
  role: 'super_admin' | 'org_admin' | 'admin' | 'staff'
  is_active: boolean
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  employee_id: string | null
  department: string | null
  job_title: string | null
  profile_image_url: string | null
  last_seen_at: string | null
  settings: any
  created_at: string
  updated_at: string
}

/**
 * Get all users for an organization
 */
export async function getUsers(organizationId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', organizationId)
    .order('first_name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  return data || []
}

/**
 * Get staff only
 */
export async function getStaff(organizationId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('role', 'staff')
    .eq('is_active', true)
    .order('first_name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch staff: ${error.message}`)
  }

  return data || []
}

/**
 * Get workers only (alias for backwards compatibility)
 * @deprecated Use getStaff instead
 */
export async function getWorkers(organizationId: string): Promise<User[]> {
  return getStaff(organizationId)
}

/**
 * Get user by ID
 */
export async function getUser(id: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`)
  }

  return data
}

/**
 * Create a new user
 */
export async function createUser(userData: {
  organization_id: string
  email?: string | null
  phone?: string | null
  first_name: string
  last_name: string
  role?: 'super_admin' | 'org_admin' | 'admin' | 'staff'
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  employee_id?: string | null
  department?: string | null
  job_title?: string | null
  sendSMSInvitation?: boolean
  invited_by?: string
}): Promise<User> {
  // First create the user
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      ...userData,
      role: userData.role ?? 'staff',
      is_active: true,
      settings: {}
    })
    .select()
    .single()

  if (userError) {
    throw new Error(`Failed to create user: ${userError.message}`)
  }

  // If phone number is provided and SMS invitation is requested, create invitation and send SMS
  if (userData.phone && userData.sendSMSInvitation) {
    try {
              // Create invitation record using RPC function
        const { data: invitationData, error: invitationError } = await supabase
          .rpc('create_staff_invitation', {
            p_user_id: user.id,
            p_organization_id: userData.organization_id,
            p_phone_number: userData.phone,
            p_invited_by: userData.invited_by || null
          })

      if (invitationError) {
        console.error('Failed to create invitation record:', invitationError)
        // Don't fail the user creation, just log the error
      } else if (invitationData && invitationData.length > 0) {
        const invitation = invitationData[0]
        
        // Send SMS invitation via edge function
        const { error: smsError } = await supabase.functions.invoke('send-staff-invitation', {
          body: {
            phoneNumber: userData.phone,
            invitationToken: invitation.invitation_token,
            staffName: `${userData.first_name} ${userData.last_name}`,
            organizationName: null, // Will be fetched by the edge function
            verificationCode: invitation.verification_code
          }
        })

        if (smsError) {
          console.error('Failed to send SMS invitation:', smsError)
          // Don't fail the user creation, just log the error
        }
      }
    } catch (error) {
      console.error('Error in invitation process:', error)
      // Don't fail the user creation, just log the error
    }
  }

  return user
}

/**
 * Update a user
 */
export async function updateUser(
  id: string,
  updates: Partial<Omit<User, 'id' | 'organization_id' | 'created_at'>>
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`)
  }

  return data
}

/**
 * Deactivate a user (soft delete)
 */
export async function deactivateUser(id: string): Promise<User> {
  return updateUser(id, { is_active: false })
}

/**
 * Activate a user
 */
export async function activateUser(id: string): Promise<User> {
  return updateUser(id, { is_active: true })
}

/**
 * Delete a user (hard delete)
 */
export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`)
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(organizationId: string): Promise<{
  total: number
  active: number
  inactive: number
  by_role: {
    super_admin: number
    org_admin: number
    admin: number
    staff: number
  }
}> {
  const { data, error } = await supabase
    .from('users')
    .select('is_active, role')
    .eq('organization_id', organizationId)

  if (error) {
    throw new Error(`Failed to fetch user stats: ${error.message}`)
  }

  const users = data || []

  const stats = users.reduce(
    (acc, user) => {
      acc.total++
      if (user.is_active) {
        acc.active++
      } else {
        acc.inactive++
      }
      // Handle the role counting, defaulting to 0 if role doesn't exist
      const role = user.role as keyof typeof acc.by_role
      if (role in acc.by_role) {
        acc.by_role[role]++
      }
      return acc
    },
    {
      total: 0,
      active: 0,
      inactive: 0,
      by_role: {
        super_admin: 0,
        org_admin: 0,
        admin: 0,
        staff: 0
      }
    }
  )

  return stats
}

/**
 * Search users by name or employee ID
 */
export async function searchUsers(
  organizationId: string,
  query: string
): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', organizationId)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,employee_id.ilike.%${query}%`)
    .order('first_name', { ascending: true })

  if (error) {
    throw new Error(`Failed to search users: ${error.message}`)
  }

  return data || []
}
