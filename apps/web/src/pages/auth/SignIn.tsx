import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn, signInWithGoogle } from '../../lib/auth'
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, Shield, Users, CheckCircle, ArrowLeft, Home } from 'lucide-react'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type SignInForm = z.infer<typeof signInSchema>

export function SignIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
  })

  const watchEmail = watch('email')
  const watchPassword = watch('password')

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn(data.email, data.password)
      
      // Check if user needs verification
      if (result && 'needsVerification' in result && result.needsVerification) {
        // Redirect to verification page with proper state
        navigate('/auth/verify', {
          state: {
            email: data.email,
            type: result.verificationType,
            organizationName: result.verificationMetadata?.organizationName,
            firstName: result.verificationMetadata?.firstName,
            lastName: result.verificationMetadata?.lastName
          }
        })
        return
      }
      
      // Normal signin successful - auth store will handle navigation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      // Add subtle shake animation on error
      const form = document.getElementById('signin-form')
      if (form) {
        form.classList.add('animate-shake')
        setTimeout(() => form.classList.remove('animate-shake'), 500)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await signInWithGoogle()
      // Google OAuth will redirect to the callback URL
      // No need to handle navigation here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    // Use environment variable for landing page URL
    const landingUrl = import.meta.env.VITE_LANDING_URL || 'http://localhost:5175'
    window.location.href = landingUrl
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Sign in form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to homepage
          </button>

          {/* Logo and title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-base text-gray-600">
              Sign in to access your SafePing dashboard
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start space-x-3 animate-slideDown">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Sign in form */}
          <form 
            id="signin-form"
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

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${watchPassword ? 'text-blue-500' : 'text-gray-400'} transition-colors`} />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
                  placeholder="Enter your password"
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
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me and forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <Link to="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Forgot password?
                </Link>
              </div>
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
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>

            {/* Second Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to SafePing?</span>
              </div>
            </div>

            {/* Sign up link */}
            <div className="text-center">
              <Link
                to="/auth/signup"
                className="inline-flex items-center justify-center w-full py-3 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
              >
                <Users className="w-4 h-4 mr-2" />
                Create a new organization
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Feature highlights */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col justify-center px-20 xl:px-24">
          <div className="max-w-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Keep your team safe with SafePing
            </h3>
            <div className="space-y-5">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Real-time Check-ins</h4>
                  <p className="mt-1 text-gray-600">
                    Monitor your team's safety status with automated check-in schedules
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
                  <h4 className="text-lg font-medium text-gray-900">Emergency Response</h4>
                  <p className="mt-1 text-gray-600">
                    Instant alerts and escalation protocols for emergency situations
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Team Management</h4>
                  <p className="mt-1 text-gray-600">
                    Organize teams, set schedules, and manage permissions effortlessly
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
