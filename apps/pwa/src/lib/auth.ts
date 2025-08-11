import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  organization_id?: string
  role?: string
  first_name?: string
  last_name?: string
  job_title?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

export async function signInWithPhone(phone: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    phone,
    password,
  })
  
  if (error) throw error
  
  if (data.user) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role, first_name, last_name, job_title, emergency_contact_name, emergency_contact_phone')
      .eq('id', data.user.id)
      .single()
    
    if (userError) throw userError
    
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

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  
  if (data.user) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role, first_name, last_name, job_title, emergency_contact_name, emergency_contact_phone')
      .eq('id', data.user.id)
      .single()
    
    if (userError) throw userError
    
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

export async function signInWithOTP(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms'
  })
  
  if (error) throw error
  return data
}

export async function sendOTP(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
  })
  
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  // Fetch additional user data
  const { data: userData, error } = await supabase
    .from('users')
    .select('organization_id, role, first_name, last_name, job_title, emergency_contact_name, emergency_contact_phone')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching user data:', error)
    return user as AuthUser
  }
  
  return {
    ...user,
    ...userData,
  } as AuthUser
}

export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const user = await getCurrentUser()
      callback(user)
    } else {
      callback(null)
    }
  })
}