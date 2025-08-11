import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { Lock, AlertCircle, Shield, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react'

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export function ResetPassword() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  })

  const watchPassword = watch('password')
  const watchConfirmPassword = watch('confirmPassword')

  useEffect(() => {
    // Check if we have a valid recovery token
    const checkToken = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        setIsValidToken(false)
        setError('Invalid or expired reset link. Please request a new password reset.')
      }
    }
    
    checkToken()
  }, [])

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })

      if (error) throw error

      setSuccess(true)
      
      // Sign out to ensure clean state
      await supabase.auth.signOut()
      
      // Redirect to sign in after a short delay
      setTimeout(() => {
        navigate('/auth/signin')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
      // Add subtle shake animation on error
      const form = document.getElementById('reset-password-form')
      if (form) {
        form.classList.add('animate-shake')
        setTimeout(() => form.classList.remove('animate-shake'), 500)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' }
    
    let strength = 0
    if (password.length >= 8) strength++
    if (password.match(/[a-z]/)) strength++
    if (password.match(/[A-Z]/)) strength++
    if (password.match(/[0-9]/)) strength++
    if (password.match(/[^a-zA-Z0-9]/)) strength++
    
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600']
    
    return {
      strength,
      label: labels[strength],
      color: colors[strength]
    }
  }

  const passwordStrength = getPasswordStrength(watchPassword || '')

  return (
    <div className="min-h-screen flex">
      {/* Left side - Reset password form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>

          {/* Logo and title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              {success ? 'Password reset successful!' : 'Create new password'}
            </h2>
            <p className="mt-2 text-base text-gray-600">
              {success 
                ? 'Your password has been successfully reset.' 
                : 'Your new password must be different from previously used passwords.'}
            </p>
          </div>

          {/* Success message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-100 rounded-xl p-4 animate-slideDown">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Password updated!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Redirecting you to sign in...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start space-x-3 animate-slideDown">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800">{error}</p>
                {!isValidToken && (
                  <button
                    onClick={() => navigate('/auth/forgot-password')}
                    className="text-sm text-red-700 underline mt-2 hover:text-red-800"
                  >
                    Request a new reset link
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Reset password form */}
          {!success && isValidToken && (
            <form 
              id="reset-password-form"
              className="space-y-5" 
              onSubmit={handleSubmit(onSubmit)}
            >
              {/* New Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 ${watchPassword ? 'text-blue-500' : 'text-gray-400'} transition-colors`} />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className={`
                      appearance-none block w-full pl-10 pr-10 py-3 
                      border rounded-xl placeholder-gray-400 
                      transition-all duration-200
                      ${errors.password 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }
                      focus:outline-none focus:ring-2 focus:ring-opacity-50
                      text-sm
                    `}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {watchPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Password strength:</span>
                      <span className="text-xs font-medium text-gray-700">{passwordStrength.label}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm new password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 ${watchConfirmPassword ? 'text-blue-500' : 'text-gray-400'} transition-colors`} />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className={`
                      appearance-none block w-full pl-10 pr-10 py-3 
                      border rounded-xl placeholder-gray-400 
                      transition-all duration-200
                      ${errors.confirmPassword 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }
                      focus:outline-none focus:ring-2 focus:ring-opacity-50
                      text-sm
                    `}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading || !isValid}
                  className={`
                    group relative w-full flex justify-center items-center py-3 px-4 
                    border border-transparent text-sm font-medium rounded-xl 
                    text-white transition-all duration-200
                    ${isLoading || !isValid
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    }
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  `}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Resetting password...
                    </>
                  ) : (
                    <>
                      Reset password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right side - Security tips */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col justify-center px-20 xl:px-24">
          <div className="max-w-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Create a strong password
            </h3>
            <div className="space-y-5">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                </div>
                <div className="ml-3">
                  <p className="text-gray-700">Use at least 8 characters</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                </div>
                <div className="ml-3">
                  <p className="text-gray-700">Include uppercase and lowercase letters</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                </div>
                <div className="ml-3">
                  <p className="text-gray-700">Add at least one number</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                </div>
                <div className="ml-3">
                  <p className="text-gray-700">Consider using special characters for extra security</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-900 font-medium mb-2">Pro tip:</p>
              <p className="text-sm text-blue-800">
                Use a unique password for SafePing that you don't use for other accounts. Consider using a password manager to generate and store strong passwords securely.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
