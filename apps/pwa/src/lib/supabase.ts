import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'safeping-pwa-auth',
    storage: window.localStorage,
  },
})

// Database types (shared with web app)
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
          settings: Record<string, unknown>
          subscription_status: string
          subscription_plan: string
          trial_ends_at: string | null
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
          settings?: Record<string, unknown>
          subscription_status?: string
          subscription_plan?: string
          trial_ends_at?: string | null
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
          settings?: Record<string, unknown>
          subscription_status?: string
          subscription_plan?: string
          trial_ends_at?: string | null
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
          role: 'super_admin' | 'admin' | 'supervisor' | 'worker'
          is_active: boolean
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string | null
          department: string | null
          job_title: string | null
          profile_image_url: string | null
          last_seen_at: string | null
          settings: Record<string, unknown>
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
          role?: 'super_admin' | 'admin' | 'supervisor' | 'worker'
          is_active?: boolean
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          department?: string | null
          job_title?: string | null
          profile_image_url?: string | null
          last_seen_at?: string | null
          settings?: Record<string, unknown>
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
          role?: 'super_admin' | 'admin' | 'supervisor' | 'worker'
          is_active?: boolean
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          department?: string | null
          job_title?: string | null
          profile_image_url?: string | null
          last_seen_at?: string | null
          settings?: Record<string, unknown>
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
          metadata: Record<string, unknown>
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
          metadata?: Record<string, unknown>
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
          metadata?: Record<string, unknown>
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
      user_role: 'super_admin' | 'admin' | 'supervisor' | 'worker'
      checkin_status: 'safe' | 'overdue' | 'missed' | 'emergency'
      schedule_frequency: 'once' | 'daily' | 'weekly' | 'custom'
      escalation_level: 'level_1' | 'level_2' | 'level_3' | 'emergency'
      incident_severity: 'low' | 'medium' | 'high' | 'critical'
      incident_status: 'open' | 'investigating' | 'resolved' | 'false_alarm'
      message_type: 'chat' | 'alert' | 'system' | 'emergency'
    }
  }
}