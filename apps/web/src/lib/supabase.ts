import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'safeping-auth-token',
    flowType: 'pkce', // Use PKCE flow for better security
  },
  global: {
    headers: {
      'x-client-info': 'safeping-web',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Add connection state monitoring
let connectionRetries = 0
const MAX_RETRIES = 3

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('[Supabase] Token refreshed successfully')
    connectionRetries = 0
  } else if (event === 'SIGNED_OUT') {
    console.log('[Supabase] User signed out')
    connectionRetries = 0
  } else if (event === 'USER_UPDATED') {
    console.log('[Supabase] User data updated')
  }
})

// Monitor for network issues
window.addEventListener('online', () => {
  console.log('[Supabase] Network connection restored')
  // Attempt to refresh session when coming back online
  supabase.auth.refreshSession().catch(err => {
    console.error('[Supabase] Failed to refresh session after reconnect:', err)
  })
})

window.addEventListener('offline', () => {
  console.log('[Supabase] Network connection lost')
})

// Database types
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          domain: string | null
          phone: string | null
          address: string | null
          timezone: string
          settings: any
          subscription_status: string
          subscription_plan: string
          trial_ends_at: string | null
          primary_admin_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          domain?: string | null
          phone?: string | null
          address?: string | null
          timezone?: string
          settings?: any
          subscription_status?: string
          subscription_plan?: string
          trial_ends_at?: string | null
          primary_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          domain?: string | null
          phone?: string | null
          address?: string | null
          timezone?: string
          settings?: any
          subscription_status?: string
          subscription_plan?: string
          trial_ends_at?: string | null
          primary_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
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
        Insert: {
          id?: string
          organization_id: string
          email?: string | null
          phone?: string | null
          first_name: string
          last_name: string
          role?: 'super_admin' | 'org_admin' | 'admin' | 'staff'
          is_active?: boolean
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          department?: string | null
          job_title?: string | null
          profile_image_url?: string | null
          last_seen_at?: string | null
          settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string | null
          phone?: string | null
          first_name?: string
          last_name?: string
          role?: 'super_admin' | 'org_admin' | 'admin' | 'staff'
          is_active?: boolean
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          department?: string | null
          job_title?: string | null
          profile_image_url?: string | null
          last_seen_at?: string | null
          settings?: any
          created_at?: string
          updated_at?: string
        }
      }
      check_ins: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          status: 'safe' | 'overdue' | 'missed' | 'emergency'
          location_lat: number | null
          location_lng: number | null
          location_accuracy: number | null
          location_address: string | null
          message: string | null
          image_url: string | null
          is_manual: boolean
          is_offline: boolean
          metadata: any
          created_at: string
          synced_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          status?: 'safe' | 'overdue' | 'missed' | 'emergency'
          location_lat?: number | null
          location_lng?: number | null
          location_accuracy?: number | null
          location_address?: string | null
          message?: string | null
          image_url?: string | null
          is_manual?: boolean
          is_offline?: boolean
          metadata?: any
          created_at?: string
          synced_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          status?: 'safe' | 'overdue' | 'missed' | 'emergency'
          location_lat?: number | null
          location_lng?: number | null
          location_accuracy?: number | null
          location_address?: string | null
          message?: string | null
          image_url?: string | null
          is_manual?: boolean
          is_offline?: boolean
          metadata?: any
          created_at?: string
          synced_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'super_admin' | 'org_admin' | 'admin' | 'staff'
      checkin_status: 'safe' | 'overdue' | 'missed' | 'emergency'
      schedule_frequency: 'once' | 'daily' | 'weekly' | 'custom'
      escalation_level: 'level_1' | 'level_2' | 'level_3' | 'emergency'
      incident_severity: 'low' | 'medium' | 'high' | 'critical'
      incident_status: 'open' | 'investigating' | 'resolved' | 'false_alarm'
      message_type: 'chat' | 'alert' | 'system' | 'emergency'
    }
  }
}
