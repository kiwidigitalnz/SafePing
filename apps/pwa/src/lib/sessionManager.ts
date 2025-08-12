import { staffAuth } from './staffAuth'

export interface UnifiedSession {
  token: string
  refreshToken: string
  expiresAt: string
  userId: string
  organizationId: string
  user: any
}

export interface SessionStatus {
  isAuthenticated: boolean
  session: UnifiedSession | null
  isLoading: boolean
  error: string | null
}

class SessionManager {
  private static instance: SessionManager
  private currentSession: UnifiedSession | null = null
  private listeners: Set<(status: SessionStatus) => void> = new Set()

  private constructor() {
    this.initializeSession()
    this.setupStorageListener()
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  private initializeSession() {
    try {
      // Try to restore session from localStorage
      const sessionData = localStorage.getItem('staff_session')
      const userData = localStorage.getItem('staff_user')
      
      if (sessionData && userData) {
        const session = JSON.parse(sessionData)
        const user = JSON.parse(userData)
        
        // Check if session is still valid
        if (new Date(session.expiresAt) > new Date()) {
          this.currentSession = {
            ...session,
            user
          }
          this.notifyListeners()
        } else {
          // Session expired, clear it
          this.clearSession()
        }
      }
    } catch (error) {
      console.error('Error initializing session:', error)
      this.clearSession()
    }
  }

  private setupStorageListener() {
    // Listen for storage changes (e.g., from other tabs)
    window.addEventListener('storage', (event) => {
      if (event.key === 'staff_session' || event.key === 'staff_user') {
        this.initializeSession()
      }
    })
  }

  private notifyListeners() {
    const status = this.getSessionStatus()
    this.listeners.forEach(listener => listener(status))
  }

  // Subscribe to session changes
  subscribe(listener: (status: SessionStatus) => void) {
    this.listeners.add(listener)
    // Immediately call with current status
    listener(this.getSessionStatus())
    
    return () => {
      this.listeners.delete(listener)
    }
  }

  // Get current session status
  getSessionStatus(): SessionStatus {
    return {
      isAuthenticated: !!this.currentSession,
      session: this.currentSession,
      isLoading: false,
      error: null
    }
  }

  // Get current session
  getSession(): UnifiedSession | null {
    return this.currentSession
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.currentSession
  }

  // Get current user
  getCurrentUser() {
    return this.currentSession?.user || null
  }

  // Get session token
  getSessionToken(): string | null {
    return this.currentSession?.token || null
  }

  // Set session (called after successful authentication)
  setSession(session: UnifiedSession) {
    this.currentSession = session
    
    // Store in localStorage
    localStorage.setItem('staff_session', JSON.stringify({
      token: session.token,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      userId: session.userId,
      organizationId: session.organizationId
    }))
    localStorage.setItem('staff_user', JSON.stringify(session.user))
    localStorage.setItem('staff_user_id', session.userId)
    
    this.notifyListeners()
  }

  // Clear session (called on logout or session expiry)
  clearSession() {
    this.currentSession = null
    
    // Clear localStorage
    localStorage.removeItem('staff_session')
    localStorage.removeItem('staff_user')
    localStorage.removeItem('staff_user_id')
    
    this.notifyListeners()
  }

  // Validate session with backend
  async validateSession(): Promise<boolean> {
    if (!this.currentSession) {
      return false
    }

    try {
      const isValid = await staffAuth.validateSession()
      if (!isValid) {
        this.clearSession()
      }
      return isValid
    } catch (error) {
      console.error('Error validating session:', error)
      this.clearSession()
      return false
    }
  }

  // Refresh session if needed
  async refreshSessionIfNeeded(): Promise<boolean> {
    if (!this.currentSession) {
      return false
    }

    // Check if session expires in the next 5 minutes
    const expiresAt = new Date(this.currentSession.expiresAt)
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    if (expiresAt <= fiveMinutesFromNow) {
      // Session expires soon, try to refresh
      try {
        // For now, we'll just clear the session and require re-authentication
        // In a real implementation, you'd call a refresh token endpoint
        console.log('Session expires soon, clearing for security')
        this.clearSession()
        return false
      } catch (error) {
        console.error('Error refreshing session:', error)
        this.clearSession()
        return false
      }
    }

    return true
  }

  // Get session info for debugging
  getSessionInfo() {
    if (!this.currentSession) {
      return { status: 'No active session' }
    }

    const expiresAt = new Date(this.currentSession.expiresAt)
    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60))

    return {
      status: 'Active',
      userId: this.currentSession.userId,
      organizationId: this.currentSession.organizationId,
      expiresAt: this.currentSession.expiresAt,
      minutesUntilExpiry,
      isExpired: timeUntilExpiry <= 0
    }
  }
}

export const sessionManager = SessionManager.getInstance()
export type { UnifiedSession, SessionStatus }
