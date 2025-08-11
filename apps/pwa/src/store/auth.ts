import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AuthUser } from '../lib/auth'
import { getCurrentUser, onAuthStateChange } from '../lib/auth'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      user: null,
      loading: true,
      initialized: false,
      
      setUser: (user) => set({ user }),
      
      setLoading: (loading) => set({ loading }),
      
      initialize: () => {
        if (get().initialized) return
        
        set({ initialized: true })
        
        // Check for existing session
        getCurrentUser().then((user) => {
          set({ user, loading: false })
        }).catch((error) => {
          console.error('Error getting current user:', error)
          set({ user: null, loading: false })
        })
        
        // Listen for auth changes
        onAuthStateChange((user) => {
          set({ user, loading: false })
        })
      },
    }),
    {
      name: 'pwa-auth-store',
    }
  )
)