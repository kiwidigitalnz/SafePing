import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser extends User {
  organization_id?: string
  role?: 'super_admin' | 'org_admin' | 'admin' | 'staff'
  first_name?: string
  last_name?: string
}

export type UserRole = 'super_admin' | 'org_admin' | 'admin' | 'staff'

export interface UserPermissions {
  manage_system?: boolean
  manage_organizations?: boolean
  manage_organization?: boolean
  manage_users?: boolean
  manage_settings?: boolean
  manage_billing?: boolean
  view_all_data?: boolean
  manage_schedules?: boolean
  manage_incidents?: boolean
  view_reports?: boolean
  check_in?: boolean
  view_own_data?: boolean
  update_profile?: boolean
  view_schedules?: boolean
}

// Cache for user data to prevent duplicate fetches
let userDataCache: { [userId: string]: { data: any; timestamp: number } } = {}
const CACHE_DURATION = 5000 // 5 seconds

/**
 * Get stored session from localStorage
 */
export async function getStoredSession(): Promise<Session | null> {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout getting session')), 5000)
    })
    
    const sessionPromise = supabase.auth.getSession()
    
    const { data: { session }, error } = await Promise.race([
      sessionPromise,
      timeoutPromise
    ])
    
    if (error) {
      console.error('[Auth] Error getting stored session:', error)
      return null
    }
    return session
  } catch (error) {
    console.error('[Auth] Unexpected error getting stored session:', error)
    return null
  }
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('[Auth] Error refreshing session:', error)
      return null
    }
    return session
  } catch (error) {
    console.error('[Auth] Unexpected error refreshing session:', error)
    return null
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  
  // Clear cache on sign in
  userDataCache = {}
  
  // Fetch additional user data from our users table
  if (data.user) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role, first_name, last_name')
      .eq('id', data.user.id)
      .single()
    
    if (userError) {
      // User authenticated but not in public.users table
      if (userError.code === 'PGRST116') {
        // Check verification status
        const { data: statusData, error: statusError } = await supabase.functions.invoke('check-verification-status', {
          body: { email }
        })
        
        if (statusError) {
          console.error('Error checking verification status:', statusError)
          throw new Error('Failed to verify account status')
        }
        
        if (statusData?.status === 'pending_verification') {
          // Return special response indicating verification needed
          return {
            ...data,
            needsVerification: true,
            verificationType: statusData.verificationType,
            verificationMetadata: statusData.metadata
          }
        }
        
        // No pending verification found - inconsistent state
        throw new Error('Account setup incomplete. Please contact support.')
      }
      
      throw userError
    }
    
    return {
      ...data,
      user: {
        ...data.user,
        ...userData,
      } as AuthUser
    }
  }
  
  return data
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  
  if (error) throw error
  
  // Clear cache on sign in
  userDataCache = {}
  
  return data
}

/**
 * Handle OAuth callback after redirect
 */
export async function handleOAuthCallback() {
  const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
  
  if (error) throw error
  
  // Clear cache on successful OAuth
  userDataCache = {}
  
  // Check if user exists in our users table
  if (data.user) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role, first_name, last_name')
      .eq('id', data.user.id)
      .single()
    
    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist in public.users table yet
      // They need to complete onboarding
      return {
        ...data,
        needsOnboarding: true,
      }
    }
    
    return data
  }
  
  return data
}

export async function signUp(email: string, password: string, metadata?: any) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })
  
  if (error) throw error
  return data
}

export async function signOut() {
  // Clear cache on sign out
  userDataCache = {}
  
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    console.log('[Auth] Getting current user...')
    
    // First, try to get the session (this is fast and uses cached data)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('[Auth] Session error:', sessionError)
      return null
    }
    
    if (!session?.user) {
      console.log('[Auth] No session found')
      return null
    }
    
    const user = session.user
    console.log('[Auth] Found session for user:', user.id)
    
    // Check cache first
    const cached = userDataCache[user.id]
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[Auth] Using cached user data')
      return {
        ...user,
        ...cached.data,
      } as AuthUser
    }
    
    // Fetch additional user data with timeout
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout fetching user data')), 5000)
      })
      
      const userDataPromise = supabase
        .from('users')
        .select('organization_id, role, first_name, last_name')
        .eq('id', user.id)
        .single()
      
      const { data: userData, error } = await Promise.race([
        userDataPromise,
        timeoutPromise
      ])
      
      if (error) {
        // PGRST116 means user exists in auth.users but not in public.users
        // This is expected for users who haven't completed verification
        if (error.code === 'PGRST116') {
          console.log('[Auth] User not in public.users table (unverified)')
          return user as AuthUser
        }
        console.error('[Auth] Error fetching user data:', error)
        return user as AuthUser
      }
      
      // Cache the user data
      userDataCache[user.id] = {
        data: userData,
        timestamp: Date.now()
      }
      
      return {
        ...user,
        ...userData,
      } as AuthUser
    } catch (error) {
      console.error('[Auth] Error fetching additional user data:', error)
      // Return basic user without additional data
      return user as AuthUser
    }
  } catch (error) {
    console.error('[Auth] Unexpected error in getCurrentUser:', error)
    return null
  }
}

export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  // Track the last event to prevent duplicate processing
  let lastEventProcessed: string | null = null
  
  return supabase.auth.onAuthStateChange(async (event, session) => {
    const eventKey = `${event}-${session?.user?.id || 'null'}-${Date.now()}`
    
    // Skip if we just processed this event (within 50ms)
    if (lastEventProcessed === event && session?.user?.id) {
      console.log('[Auth] Skipping duplicate event:', event)
      return
    }
    
    lastEventProcessed = event
    console.log('[Auth] Processing auth event:', event, session?.user?.id)
    
    if (event === 'SIGNED_OUT') {
      // Clear cache on sign out
      userDataCache = {}
      callback(null)
      return
    }
    
    if (session?.user) {
      try {
        // For INITIAL_SESSION and SIGNED_IN, we already have the user
        // Just fetch additional data
        const user = session.user
        
        // Try to get cached data first
        const cached = userDataCache[user.id]
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          callback({
            ...user,
            ...cached.data,
          } as AuthUser)
          return
        }
        
        // Fetch fresh data
        const { data: userData } = await supabase
          .from('users')
          .select('organization_id, role, first_name, last_name')
          .eq('id', user.id)
          .single()
        
        if (userData) {
          // Cache the data
          userDataCache[user.id] = {
            data: userData,
            timestamp: Date.now()
          }
          
          callback({
            ...user,
            ...userData,
          } as AuthUser)
        } else {
          callback(user as AuthUser)
        }
      } catch (error) {
        console.error('[Auth] Error in auth state change:', error)
        // Still return the basic user on error
        if (session.user) {
          callback(session.user as AuthUser)
        } else {
          callback(null)
        }
      }
    } else {
      callback(null)
    }
  })
}

/**
 * Get user permissions based on role
 */
export function getUserPermissions(role: UserRole): UserPermissions {
  const permissions: Record<UserRole, UserPermissions> = {
    super_admin: {
      manage_system: true,
      manage_organizations: true,
      manage_organization: true,
      manage_users: true,
      manage_settings: true,
      manage_billing: true,
      view_all_data: true,
      manage_schedules: true,
      manage_incidents: true,
      view_reports: true,
      check_in: true,
      view_own_data: true,
      update_profile: true,
      view_schedules: true
    },
    org_admin: {
      manage_organization: true,
      manage_users: true,
      manage_settings: true,
      manage_billing: true,
      view_all_data: true,
      manage_schedules: true,
      manage_incidents: true,
      view_reports: true,
      check_in: true,
      view_own_data: true,
      update_profile: true,
      view_schedules: true
    },
    admin: {
      manage_users: true,
      view_all_data: true,
      manage_schedules: true,
      manage_incidents: true,
      view_reports: true,
      check_in: true,
      view_own_data: true,
      update_profile: true,
      view_schedules: true
    },
    staff: {
      check_in: true,
      view_own_data: true,
      update_profile: true,
      view_schedules: true
    }
  }
  
  return permissions[role] || permissions.staff
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: AuthUser | null, permission: keyof UserPermissions): boolean {
  if (!user?.role) return false
  
  const permissions = getUserPermissions(user.role)
  return Boolean(permissions[permission])
}

/**
 * Check if user is admin level (org_admin or above)
 */
export function isAdmin(user: AuthUser | null): boolean {
  return hasPermission(user, 'manage_users')
}

/**
 * Check if user is org admin level (org_admin or super_admin)
 */
export function isOrgAdmin(user: AuthUser | null): boolean {
  return hasPermission(user, 'manage_organization')
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    org_admin: 'Organization Admin',
    admin: 'Admin',
    staff: 'Staff'
  }
  
  return displayNames[role] || 'Staff'
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    super_admin: 'System administrator with full access across all organizations',
    org_admin: 'Organization administrator with full access within their organization',
    admin: 'Administrative user with operational access within their organization',
    staff: 'Standard user with basic check-in and profile access'
  }
  
  return descriptions[role] || descriptions.staff
}
