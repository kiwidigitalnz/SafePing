import { supabase } from './supabase'
import { getDeviceInfo, getDeviceId } from '../utils/device'

interface StaffSession {
  token: string
  refreshToken: string
  expiresAt: string
  userId: string
  organizationId: string
}

interface AuthState {
  isAuthenticated: boolean
  requiresPinSetup: boolean
  requiresBiometricSetup: boolean
  session: StaffSession | null
}

class StaffAuthManager {
  private static instance: StaffAuthManager
  private authState: AuthState = {
    isAuthenticated: false,
    requiresPinSetup: false,
    requiresBiometricSetup: false,
    session: null
  }

  private constructor() {
    this.loadSession()
  }

  static getInstance(): StaffAuthManager {
    if (!StaffAuthManager.instance) {
      StaffAuthManager.instance = new StaffAuthManager()
    }
    return StaffAuthManager.instance
  }

  // Load session from localStorage
  private loadSession() {
    const sessionData = localStorage.getItem('staff_session')
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData) as StaffSession
        // Check if session is still valid
        if (new Date(session.expiresAt) > new Date()) {
          this.authState.session = session
          this.authState.isAuthenticated = true
        } else {
          // Session expired, clear it
          this.clearSession()
        }
      } catch (error) {
        console.error('Error loading session:', error)
        this.clearSession()
      }
    }
  }

  // Save session to localStorage
  private saveSession(session: StaffSession) {
    localStorage.setItem('staff_session', JSON.stringify(session))
    this.authState.session = session
    this.authState.isAuthenticated = true
  }

  // Clear session
  clearSession() {
    localStorage.removeItem('staff_session')
    localStorage.removeItem('biometric_credentials')
    localStorage.removeItem('biometric_enabled')
    localStorage.removeItem('last_biometric_auth')
    this.authState.session = null
    this.authState.isAuthenticated = false
  }

  // Verify invitation and OTP
  async verifyInvitation(invitationToken: string, verificationCode: string): Promise<{
    success: boolean
    error?: string
    requiresPinSetup?: boolean
    requiresBiometricSetup?: boolean
  }> {
    try {
      const deviceInfo = getDeviceInfo()
      


      const { data, error } = await supabase.functions.invoke('verify-staff', {
        body: {
          invitationToken,
          verificationCode,
          deviceInfo
        }
      })

      if (error) {
        // Try to parse more detailed error from response
        let errorMessage = error.message || 'Verification failed'
        try {
          if ((error as any)?.body && typeof (error as any).body === 'string') {
            const parsed = JSON.parse((error as any).body)
            if (parsed?.error) errorMessage = parsed.error
          }
        } catch {}
        return { success: false, error: errorMessage }
      }

      if (data?.error) {
        return { success: false, error: data.error }
      }

      if (data.success) {
        // Save session
        const session: StaffSession = {
          token: data.session.token,
          refreshToken: data.session.refreshToken,
          expiresAt: data.session.expiresAt,
          userId: data.user.id,
          organizationId: data.user.organization_id
        }
        
        this.saveSession(session)
        
        // Store user info
        localStorage.setItem('staff_user', JSON.stringify(data.user))
        
        return {
          success: true,
          requiresPinSetup: data.requiresPinSetup,
          requiresBiometricSetup: data.requiresBiometricSetup
        }
      }

      return { success: false, error: 'Verification failed' }
    } catch (error: any) {
      console.error('Error verifying invitation:', error)
      return { success: false, error: error.message }
    }
  }

  // Set up PIN
  async setupPin(pin: string): Promise<{ success: boolean; error?: string }> {
    if (!this.authState.session) {
      return { success: false, error: 'No active session' }
    }

    try {
      const { data, error } = await supabase.functions.invoke('validate-staff-pin', {
        body: {
          sessionToken: this.authState.session.token,
          newPin: pin,
          deviceId: getDeviceId()
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.success) {
        localStorage.setItem('pin_setup_complete', 'true')
        return { success: true }
      }

      return { success: false, error: 'Failed to set PIN' }
    } catch (error: any) {
      console.error('Error setting PIN:', error)
      return { success: false, error: error.message }
    }
  }

  // Validate PIN
  async validatePin(pin: string): Promise<{ success: boolean; error?: string; attemptsRemaining?: number; pinResetRequired?: boolean }> {
    if (!this.authState.session) {
      return { success: false, error: 'No active session' }
    }

    try {
      const { data, error } = await supabase.functions.invoke('validate-staff-pin', {
        body: {
          sessionToken: this.authState.session.token,
          pin,
          deviceId: getDeviceId()
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.success) {
        // Update last auth time
        localStorage.setItem('last_pin_auth', new Date().toISOString())
        // Update last activity in database
        await supabase.rpc('update_last_activity', { p_user_id: this.authState.session.userId })
        return { success: true }
      }

      // Check if PIN reset is required
      if (data.pin_reset_required) {
        return {
          success: false,
          error: 'PIN reset required',
          pinResetRequired: true
        }
      }

      return { 
        success: false, 
        error: data.error || 'Invalid PIN',
        attemptsRemaining: data.attempts_remaining
      }
    } catch (error: any) {
      console.error('Error validating PIN:', error)
      return { success: false, error: error.message }
    }
  }

  // Send OTP for authentication
  async sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-worker-otp', {
        body: {
          phone_number: phoneNumber,
          type: 'worker_auth'
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Failed to send OTP' }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error sending OTP:', error)
      return { success: false, error: error.message }
    }
  }

  // Verify OTP for authentication
  async verifyOTP(phoneNumber: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First verify the code
      const { data: verifyData, error: verifyError } = await supabase
        .rpc('verify_code_simple', {
          p_phone_number: phoneNumber,
          p_code: code
        })

      if (verifyError || !verifyData?.success) {
        return { success: false, error: 'Invalid verification code' }
      }

      // Get user by phone number
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single()

      if (userError || !userData) {
        return { success: false, error: 'User not found' }
      }

      // Create new session
      const deviceInfo = getDeviceInfo()
      const { data: sessionData, error: sessionError } = await supabase
        .rpc('create_staff_session_after_otp', {
          p_user_id: userData.id,
          p_device_id: deviceInfo.deviceId,
          p_device_info: deviceInfo
        })

      if (sessionError || !sessionData?.success) {
        return { success: false, error: 'Failed to create session' }
      }

      // Save session
      const session: StaffSession = {
        token: sessionData.session_token,
        refreshToken: sessionData.refresh_token,
        expiresAt: sessionData.expires_at,
        userId: userData.id,
        organizationId: userData.organization_id
      }
      
      this.saveSession(session)
      
      // Store user info
      localStorage.setItem('staff_user', JSON.stringify(userData))
      
      return { success: true }
    } catch (error: any) {
      console.error('Error verifying OTP:', error)
      return { success: false, error: error.message }
    }
  }

  // Check if session is valid
  async validateSession(): Promise<boolean> {
    if (!this.authState.session) {
      return false
    }

    try {
      const { data, error } = await supabase
        .rpc('validate_staff_session', {
          p_session_token: this.authState.session.token,
          p_device_id: getDeviceId()
        })

      if (error || !data?.valid) {
        this.clearSession()
        return false
      }

      return true
    } catch (error) {
      console.error('Error validating session:', error)
      this.clearSession()
      return false
    }
  }

  // Get current auth state
  getAuthState(): AuthState {
    return { ...this.authState }
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated
  }

  // Get current user
  getCurrentUser() {
    const userData = localStorage.getItem('staff_user')
    if (userData) {
      try {
        return JSON.parse(userData)
      } catch {
        return null
      }
    }
    return null
  }

  // Check if PIN is set up
  isPinSetup(): boolean {
    return localStorage.getItem('pin_setup_complete') === 'true'
  }

  // Check if biometric is enabled
  isBiometricEnabled(): boolean {
    return localStorage.getItem('biometric_enabled') === 'true'
  }

  // Get session token for API calls
  getSessionToken(): string | null {
    return this.authState.session?.token || null
  }

  // Get current session
  getSession(): StaffSession | null {
    return this.authState.session
  }
}

// Export singleton instance
export const staffAuth = StaffAuthManager.getInstance()

// Export types
export type { StaffSession, AuthState }
