import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AuthUser } from '../lib/auth'
import { getCurrentUser, onAuthStateChange, getStoredSession } from '../lib/auth'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
  sessionChecked: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
}

// Debounce function to prevent rapid state changes
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      user: null,
      loading: true,
      initialized: false,
      sessionChecked: false,
      
      setUser: (user) => {
        console.log('[Auth Store] Setting user:', user?.id || 'null')
        set({ user, loading: false })
      },
      
      setLoading: (loading) => set({ loading }),
      
      initialize: async () => {
        // Prevent multiple initializations
        if (get().initialized) {
          console.log('[Auth Store] Already initialized, skipping...')
          return
        }
        
        set({ initialized: true })
        console.log('[Auth Store] Starting initialization...')
        console.log('[Auth Store] Environment check:', {
          url: import.meta.env.VITE_SUPABASE_URL || 'NOT SET',
          hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          keyPreview: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) || 'NOT SET'
        })
        
        try {
          // Step 1: Check for stored session first (synchronous)
          console.log('[Auth Store] Calling getStoredSession...')
          const storedSession = await getStoredSession()
          console.log('[Auth Store] getStoredSession returned:', !!storedSession)
          if (storedSession) {
            console.log('[Auth Store] Found stored session, validating...')
            // We have a stored session, but we still need to validate it
            // and get the full user data
          } else {
            console.log('[Auth Store] No stored session found')
          }
          
          // Step 2: Set up auth state listener BEFORE checking current user
          // This prevents race conditions
          let listenerReady = false
          const debouncedStateChange = debounce(async (user: AuthUser | null) => {
            if (!listenerReady) return // Ignore events until we're ready
            
            console.log('[Auth Store] Auth state changed (debounced):', user?.id || 'null')
            set({ user, loading: false, sessionChecked: true })
          }, 100) // 100ms debounce
          
          console.log('[Auth Store] Setting up auth state listener...')
          const { data: { subscription } } = onAuthStateChange((user) => {
            debouncedStateChange(user)
          })
          console.log('[Auth Store] Auth state listener set up')
          
          // Store subscription for cleanup
          ;(get() as any).authSubscription = subscription
          
          // Step 3: Now check current user with proper timeout handling
          const timeoutId = setTimeout(() => {
            console.warn('[Auth Store] Auth initialization timed out after 10 seconds')
            set({ user: null, loading: false, sessionChecked: true })
          }, 10000)
          
          try {
            console.log('[Auth Store] Calling getCurrentUser...')
            const user = await getCurrentUser()
            console.log('[Auth Store] getCurrentUser returned:', !!user)
            clearTimeout(timeoutId)
            
            // Mark listener as ready after initial check
            listenerReady = true
            
            console.log('[Auth Store] Initial user check completed:', user?.id || 'null')
            set({ user, loading: false, sessionChecked: true })
          } catch (error) {
            clearTimeout(timeoutId)
            console.error('[Auth Store] Error during initial user check:', error)
            
            // Even on error, mark as checked and ready
            listenerReady = true
            set({ user: null, loading: false, sessionChecked: true })
          }
        } catch (error) {
          console.error('[Auth Store] Fatal error during initialization:', error)
          set({ user: null, loading: false, sessionChecked: true })
        }
      },
    }),
    {
      name: 'web-auth-store',
    }
  )
)
