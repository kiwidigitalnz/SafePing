import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signUp } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { getAuthErrorMessage } from '../../lib/errors'
import { generateOrganizationSlug, validateSignupData } from '../../lib/authValidation'
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, Shield, Building2, User, CheckCircle, ArrowLeft } from 'lucide-react'

const signUpSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
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

type SignUpForm = z.infer<typeof signUpSchema>

export function SignUp() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
  })

  const watchPassword = watch('password')
  const watchEmail = watch('email')
  const watchOrgName = watch('organizationName')
  const watchFirstName = watch('firstName')
  const watchLastName = watch('lastName')
  const watchConfirmPassword = watch('confirmPassword')

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

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate form data
      const validation = validateSignupData(data)
      if (!validation.isValid) {
        setError(validation.errors.join('. '))
        return
      }

      // Generate unique organization slug
      const slug = await generateOrganizationSlug(data.organizationName)

      // Create pending organization record and send verification code
      const { data: codeData, error: codeError } = await supabase.functions.invoke('send-verification-code', {
        body: {
          email: data.email,
          type: 'signup_verification',
          organizationName: data.organizationName,
          firstName: data.firstName,
          lastName: data.lastName,
          password: data.password, // Pass password securely to backend
          metadata: {
            organization_name: data.organizationName,
            first_name: data.firstName,
            last_name: data.lastName,
            slug: slug
          }
        }
      })

      if (codeError) {
        throw codeError
      }
      
      // Check if the function returned an error in the data
      if (codeData && !codeData.success && codeData.error) {
        throw new Error(codeData.error)
      }

      // Show success message briefly before navigating
      setSuccessMessage('Verification code sent! Redirecting...')
      
      // Navigate to verification page after a short delay
      setTimeout(() => {
        navigate('/auth/verify', {
          state: {
            email: data.email,
            type: 'signup_verification',
            organizationName: data.organizationName,
            firstName: data.firstName,
            lastName: data.lastName,
            slug: slug
          }
        })
      }, 1500)
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(getAuthErrorMessage(err))
      // Add subtle shake animation on error
      const form = document.getElementById('signup-form')
      if (form) {
        form.classList.add('animate-shake')
        setTimeout(() => form.classList.remove('animate-shake'), 500)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    // In production, this would be your landing page domain
    // In development, redirect to the landing app running on port 5175
    const landingUrl = import.meta.env.PROD 
      ? 'https://safeping.co.nz' // Replace with your actual production landing page URL
      : 'http://localhost:5175'
    
    window.location.href = landingUrl
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Sign up form */}
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
              Create your organization
            </h2>
            <p className="mt-2 text-base text-gray-600">
              Set up your SafePing account to start protecting your team
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start space-x-3 animate-slideDown">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-100 rounded-xl p-4 animate-slideDown">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Sign up form */}
          <form 
            id="signup-form"
            className="space-y-5" 
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Organization name field */}
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Organization name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className={`h-5 w-5 ${watchOrgName ? 'text-blue-500' : 'text-gray-400'} transition-colors`} />
                </div>
                <input
                  {...register('organizationName')}
                  type="text"
                  required
                  className={`
                    appearance-none block w-full pl-10 pr-3 py-3 
                    border rounded-xl placeholder-gray-400 
                    transition-all duration-200
                    ${errors.organizationName 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }
                    focus:outline-none focus:ring-2 focus:ring-opacity-50
                    text-sm
                  `}
                  placeholder="Your company or team name"
                />
              </div>
              {errors.organizationName && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.organizationName.message}
                </p>
              )}
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  First name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className={`h-5 w-5 ${watchFirstName ? 'text-blue-500' : 'text-gray-400'} transition-colors`} />
                  </div>
                  <input
                    {...register('firstName')}
                    type="text"
                    required
                    className={`
                      appearance-none block w-full pl-10 pr-3 py-3 
                      border rounded-xl placeholder-gray-400 
                      transition-all duration-200
                      ${errors.firstName 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }
                      focus:outline-none focus:ring-2 focus:ring-opacity-50
                      text-sm
                    `}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Last name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className={`h-5 w-5 ${watchLastName ? 'text-blue-500' : 'text-gray-400'} transition-colors`} />
                  </div>
                  <input
                    {...register('lastName')}
                    type="text"
                    required
                    className={`
                      appearance-none block w-full pl-10 pr-3 py-3 
                      border rounded-xl placeholder-gray-400 
                      transition-all duration-200
                      ${errors.lastName 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }
                      focus:outline-none focus:ring-2 focus:ring-opacity-50
                      text-sm
                    `}
                    placeholder="Doe"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

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
                  placeholder="Create a strong password"
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
                Confirm password
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
                  placeholder="Confirm your password"
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Terms and sign in link */}
            <div className="space-y-4">
              <p className="text-xs text-gray-500 text-center">
                By creating an account, you agree to our{' '}
                <Link to="/legal/terms" className="text-blue-600 hover:text-blue-500">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/legal/privacy" className="text-blue-600 hover:text-blue-500">Privacy Policy</Link>
              </p>
              
              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/auth/signin"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Feature highlights */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col justify-center px-20 xl:px-24">
          <div className="max-w-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Start protecting your team in minutes
            </h3>
            <div className="space-y-5">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Enterprise-grade security</h4>
                  <p className="mt-1 text-gray-600">
                    Your data is encrypted and protected with industry-leading security standards
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
                  <h4 className="text-lg font-medium text-gray-900">Quick setup</h4>
                  <p className="mt-1 text-gray-600">
                    Get your team up and running with SafePing in less than 5 minutes
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500 text-white">
                    <Building2 className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Scalable solution</h4>
                  <p className="mt-1 text-gray-600">
                    Whether you have 10 or 10,000 employees, SafePing scales with your needs
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-900 font-medium mb-2">What's included:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Unlimited check-ins for your team</li>
                <li>• Real-time emergency alerts</li>
                <li>• Customizable escalation protocols</li>
                <li>• 24/7 monitoring dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
