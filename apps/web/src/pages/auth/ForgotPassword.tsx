import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { resetPassword } from '../../lib/auth'
import { Mail, AlertCircle, ArrowLeft, Shield, CheckCircle } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
  })

  const watchEmail = watch('email')

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await resetPassword(data.email)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
      // Add subtle shake animation on error
      const form = document.getElementById('forgot-password-form')
      if (form) {
        form.classList.add('animate-shake')
        setTimeout(() => form.classList.remove('animate-shake'), 500)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Forgot password form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Back to sign in link */}
          <Link
            to="/auth/signin"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to sign in
          </Link>

          {/* Logo and title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Forgot your password?
            </h2>
            <p className="mt-2 text-base text-gray-600">
              No worries! Enter your email and we'll send you reset instructions.
            </p>
          </div>

          {/* Success message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-100 rounded-xl p-4 animate-slideDown">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Check your email!</p>
                  <p className="text-sm text-green-700 mt-1">
                    We've sent password reset instructions to {watchEmail}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start space-x-3 animate-slideDown">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Forgot password form */}
          {!success && (
            <form 
              id="forgot-password-form"
              className="space-y-5" 
              onSubmit={handleSubmit(onSubmit)}
            >
              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 ${watchEmail ? 'text-blue-500' : 'text-gray-400'} transition-colors`} />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    required
                    className={`
                      appearance-none block w-full pl-10 pr-3 py-3 
                      border rounded-xl placeholder-gray-400 
                      transition-all duration-200
                      ${errors.email 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }
                      focus:outline-none focus:ring-2 focus:ring-opacity-50
                      text-sm
                    `}
                    placeholder="you@company.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email.message}
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
                      Sending reset email...
                    </>
                  ) : (
                    <>
                      Send reset instructions
                    </>
                  )}
                </button>
              </div>

              {/* Additional help text */}
              <div className="text-center text-sm text-gray-600">
                <p>
                  Remember your password?{' '}
                  <Link
                    to="/auth/signin"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* Success state actions */}
          {success && (
            <div className="space-y-4">
              <Link
                to="/auth/signin"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Return to sign in
              </Link>
              
              <button
                type="button"
                onClick={() => {
                  setSuccess(false)
                  setError(null)
                }}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
              >
                Try a different email
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Feature highlights */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col justify-center px-20 xl:px-24">
          <div className="max-w-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Secure password recovery
            </h3>
            <div className="space-y-5">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white">
                    <Mail className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Email verification</h4>
                  <p className="mt-1 text-gray-600">
                    We'll send a secure link to your registered email address
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Secure reset</h4>
                  <p className="mt-1 text-gray-600">
                    Your password reset link expires after 1 hour for security
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Quick recovery</h4>
                  <p className="mt-1 text-gray-600">
                    Get back to keeping your team safe in just a few clicks
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-900 font-medium mb-2">Security tip:</p>
              <p className="text-sm text-blue-800">
                Always check that password reset emails come from our official domain and never share your reset link with anyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
