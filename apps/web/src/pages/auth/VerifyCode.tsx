import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'
import { getAuthErrorMessage } from '../../lib/errors'
import { ArrowLeft } from 'lucide-react'

interface VerificationState {
  email: string
  type: 'signup_verification' | 'admin_invitation' | 'password_reset'
  organizationName?: string
  firstName?: string
  lastName?: string
  inviterName?: string
  password?: string // For signup flow
  slug?: string
}

export function VerifyCode() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const state = location.state as VerificationState

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!state?.email) {
      navigate('/auth/signin')
      return
    }

    // Focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [state, navigate])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value

    setCode(newCode)
    setError(null)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits entered
    if (value && index === 5 && newCode.every(digit => digit !== '')) {
      handleVerify(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('')
      setCode(newCode)
      handleVerify(pastedData)
    }
  }

  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('')
    
    if (codeToVerify.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('Calling verify-and-complete-signup with:', {
        email: state.email,
        code: codeToVerify,
        type: state.type,
        organizationName: state.organizationName,
        firstName: state.firstName,
        lastName: state.lastName
      })
      
      const { data, error: verifyError } = await supabase.functions.invoke('verify-and-complete-signup', {
        body: {
          email: state.email,
          code: codeToVerify,
          type: state.type,
          organizationName: state.organizationName,
          firstName: state.firstName,
          lastName: state.lastName
        }
      })

      console.log('Verification response:', { data, error: verifyError })

      if (verifyError) {
        console.error('Edge function error:', verifyError)
        throw verifyError
      }

      // Handle response
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from verification service')
      }
      
      if (!data.success) {
        setError(data.error || 'Invalid verification code')
        return
      }

      console.log('Verification successful, processing session data...')
      console.log('Session data:', data.session)
      console.log('User data:', data.user)

      // Handle session data from the Edge Function
      if (data.session) {
        console.log('Setting session in client...')
        // Set the session in the client
        const { error: sessionError } = await supabase.auth.setSession(data.session)
        if (sessionError) {
          console.error('Error setting session:', sessionError)
          throw sessionError
        }
        console.log('Session set successfully')
        
        // Update the auth store with user data
        if (data.user) {
          console.log('Setting user in auth store:', data.user)
          setUser(data.user as any)
        }
      } else {
        console.log('No session data, using fallback method...')
        // Fallback: try to get current user session
        const userIdToUse = data.authUserId
        if (userIdToUse) {
          const { data: userData } = await supabase
            .from('users')
            .select('organization_id, role, first_name, last_name')
            .eq('id', userIdToUse)
            .single()

          if (userData) {
            // Try to get the current user session
            const { data: { user: fullAuthUser } } = await supabase.auth.getUser()
            if (fullAuthUser) {
              setUser({
                ...fullAuthUser,
                ...userData,
              })
            }
          }
        }
      }

      // Redirect based on type
      if (state.type === 'signup_verification') {
        navigate('/onboarding', { 
          state: { 
            isNewOrganization: true,
            organizationId: data.organizationId 
          } 
        })
      } else if (state.type === 'admin_invitation') {
        navigate('/onboarding', { 
          state: { 
            isNewAdmin: true,
            organizationId: data.organizationId 
          } 
        })
      } else {
        navigate('/auth/reset-password', { 
          state: { 
            codeId: data.codeId,
            email: state.email 
          } 
        })
      }

    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setError(null)

    try {
      const { error } = await supabase.functions.invoke('send-verification-code', {
        body: {
          email: state.email,
          type: state.type,
          organizationName: state.organizationName,
          firstName: state.firstName,
          metadata: {
            organization_name: state.organizationName,
            first_name: state.firstName,
            inviter_name: state.inviterName
          }
        }
      })

      if (error) throw error

      setResendCooldown(60) // 60 second cooldown
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()

    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setResendLoading(false)
    }
  }

  if (!state?.email) {
    return null // Will redirect in useEffect
  }

  const getTitle = () => {
    switch (state.type) {
      case 'signup_verification':
        return 'Verify your email'
      case 'admin_invitation':
        return 'Accept invitation'
      case 'password_reset':
        return 'Reset password'
      default:
        return 'Enter verification code'
    }
  }

  const getDescription = () => {
    switch (state.type) {
      case 'signup_verification':
        return `We've sent a 6-digit code to ${state.email}. Enter it below to complete your ${state.organizationName} organization setup.`
      case 'admin_invitation':
        return `We've sent a 6-digit code to ${state.email}. Enter it below to join ${state.organizationName}.`
      case 'password_reset':
        return `We've sent a 6-digit code to ${state.email}. Enter it below to reset your password.`
      default:
        return `Enter the 6-digit code sent to ${state.email}`
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {getTitle()}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {getDescription()}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
            Verification Code
          </label>
          <div className="flex justify-center space-x-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-12 text-center text-lg font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => handleVerify()}
          disabled={isLoading || code.some(digit => digit === '')}
          className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Verifying...
            </div>
          ) : (
            'Verify Code'
          )}
        </button>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={resendLoading || resendCooldown > 0}
            className="text-sm font-medium text-primary hover:text-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? (
              'Sending...'
            ) : resendCooldown > 0 ? (
              `Resend in ${resendCooldown}s`
            ) : (
              'Resend code'
            )}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
        </div>
      </div>
    </div>
  )
}
