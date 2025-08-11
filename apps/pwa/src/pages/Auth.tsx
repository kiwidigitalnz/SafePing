import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signInWithPhone, signInWithEmail, signInWithOTP, sendOTP } from '../lib/auth'
import { useAuthStore } from '../store/auth'
import { 
  Smartphone, 
  Mail, 
  MessageSquare,
  ArrowRight, 
  Shield, 
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Fingerprint,
  Download
} from 'lucide-react'
import InstallPrompt from '../components/InstallPrompt'
import PermissionsOnboarding from '../components/PermissionsOnboarding'
import { formatPhoneNumber, unformatPhoneNumber, countryCodesData } from '../utils/phoneFormatter'
import { usePWAInstall } from '../hooks/usePWAInstall'

const phoneSchema = z.object({
  countryCode: z.string(),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const otpSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number'),
  otp: z.string().length(6, 'Please enter the 6-digit code')
})

type AuthMode = 'phone' | 'email' | 'otp'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(countryCodesData[0])
  const [showPermissions, setShowPermissions] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { setUser } = useAuthStore()
  const { isInstallable, isInstalled } = usePWAInstall()

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { 
      countryCode: '+1',
      phone: '', 
      password: '' 
    }
  })

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '' }
  })

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { phone: '', otp: '' }
  })

  // Auto-format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, form: any) => {
    const formatted = formatPhoneNumber(e.target.value)
    form.setValue('phone', formatted)
  }

  // Check for biometric availability
  useEffect(() => {
    if ('credentials' in navigator) {
      // Check for WebAuthn support
      console.log('WebAuthn supported')
    }
  }, [])

  const handlePhoneSignIn = async (data: z.infer<typeof phoneSchema>) => {
    setLoading(true)
    setError(null)
    
    try {
      const fullPhone = data.countryCode + unformatPhoneNumber(data.phone)
      const result = await signInWithPhone(fullPhone, data.password)
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      }
      
      setUser(result.user)
      
      // Show permissions onboarding for first-time users
      const hasCompletedOnboarding = localStorage.getItem('permissions-onboarding-complete')
      if (!hasCompletedOnboarding) {
        setShowPermissions(true)
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Sign in failed')
      // Add haptic feedback for error
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (data: z.infer<typeof emailSchema>) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await signInWithEmail(data.email, data.password)
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      }
      
      setUser(result.user)
      
      // Show permissions onboarding for first-time users
      const hasCompletedOnboarding = localStorage.getItem('permissions-onboarding-complete')
      if (!hasCompletedOnboarding) {
        setShowPermissions(true)
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Sign in failed')
      // Add haptic feedback for error
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async (data: { phone: string }) => {
    setLoading(true)
    setError(null)
    
    try {
      const fullPhone = selectedCountry.code + unformatPhoneNumber(data.phone)
      await sendOTP(fullPhone)
      setOtpSent(true)
      otpForm.setValue('phone', fullPhone)
      
      // Success haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to send code')
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSignIn = async (data: z.infer<typeof otpSchema>) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await signInWithOTP(data.phone, data.otp)
      setUser(result.user)
      
      // Show permissions onboarding for first-time users
      const hasCompletedOnboarding = localStorage.getItem('permissions-onboarding-complete')
      if (!hasCompletedOnboarding) {
        setShowPermissions(true)
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid code')
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100])
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionsComplete = () => {
    localStorage.setItem('permissions-onboarding-complete', 'true')
    setShowPermissions(false)
  }

  if (showPermissions) {
    return <PermissionsOnboarding onComplete={handlePermissionsComplete} />
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex flex-col safe-area">
        {/* PWA Install Banner */}
        {!isInstalled && isInstallable && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 flex items-center justify-between animate-slide-down">
            <div className="flex items-center space-x-3">
              <Download size={20} />
              <span className="text-sm font-medium">Install for better experience</span>
            </div>
            <button 
              onClick={() => {}}
              className="text-white/80 hover:text-white text-sm underline"
            >
              Install
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Logo and Header */}
            <div className="text-center mb-8 animate-fade-in">
              <div className="w-24 h-24 gradient-orange rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse-scale">
                <Shield className="text-white" size={48} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-600">Sign in to access your safety dashboard</p>
            </div>

            {/* Auth Mode Tabs */}
            <div className="bg-white rounded-2xl shadow-sm p-1 mb-6">
              <div className="flex space-x-1">
                <button
                  onClick={() => setMode('phone')}
                  className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold transition-all haptic-light ${
                    mode === 'phone' 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Smartphone size={18} className="mr-2" />
                  Phone
                </button>
                <button
                  onClick={() => setMode('email')}
                  className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold transition-all haptic-light ${
                    mode === 'email' 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Mail size={18} className="mr-2" />
                  Email
                </button>
                <button
                  onClick={() => setMode('otp')}
                  className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold transition-all haptic-light ${
                    mode === 'otp' 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MessageSquare size={18} className="mr-2" />
                  Code
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start space-x-3 animate-fade-in">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-800 text-sm flex-1">{error}</p>
              </div>
            )}

            {/* Forms Container */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* Phone Sign In */}
              {mode === 'phone' && (
                <form onSubmit={phoneForm.handleSubmit(handlePhoneSignIn)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowCountryPicker(!showCountryPicker)}
                        className="flex items-center space-x-2 px-3 py-4 bg-gray-50 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-xl">{selectedCountry.flag}</span>
                        <span className="text-gray-700 font-medium">{selectedCountry.code}</span>
                      </button>
                      <input
                        {...phoneForm.register('phone')}
                        type="tel"
                        inputMode="tel"
                        placeholder="(555) 123-4567"
                        onChange={(e) => handlePhoneChange(e, phoneForm)}
                        className={`flex-1 input-field ${phoneForm.formState.errors.phone ? 'input-field-error' : ''}`}
                        autoComplete="tel"
                      />
                    </div>
                    {phoneForm.formState.errors.phone && (
                      <p className="text-red-600 text-sm mt-2 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {phoneForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        {...phoneForm.register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className={`input-field pr-12 ${phoneForm.formState.errors.password ? 'input-field-error' : ''}`}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {phoneForm.formState.errors.password && (
                      <p className="text-red-600 text-sm mt-2 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {phoneForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">Remember me</span>
                    </label>
                    <button type="button" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center space-x-2 haptic-medium"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={20} />
                        <span>Sign In Securely</span>
                      </>
                    )}
                  </button>

                  {/* Biometric Option */}
                  <button
                    type="button"
                    className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Fingerprint size={20} />
                    <span>Use Biometric Login</span>
                  </button>
                </form>
              )}

              {/* Email Sign In */}
              {mode === 'email' && (
                <form onSubmit={emailForm.handleSubmit(handleEmailSignIn)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      {...emailForm.register('email')}
                      type="email"
                      inputMode="email"
                      placeholder="your@email.com"
                      className={`input-field ${emailForm.formState.errors.email ? 'input-field-error' : ''}`}
                      autoComplete="email"
                    />
                    {emailForm.formState.errors.email && (
                      <p className="text-red-600 text-sm mt-2 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {emailForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        {...emailForm.register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className={`input-field pr-12 ${emailForm.formState.errors.password ? 'input-field-error' : ''}`}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {emailForm.formState.errors.password && (
                      <p className="text-red-600 text-sm mt-2 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {emailForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">Remember me</span>
                    </label>
                    <button type="button" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center space-x-2 haptic-medium"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={20} />
                        <span>Sign In Securely</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* OTP Sign In */}
              {mode === 'otp' && !otpSent && (
                <form onSubmit={otpForm.handleSubmit(handleSendOTP)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowCountryPicker(!showCountryPicker)}
                        className="flex items-center space-x-2 px-3 py-4 bg-gray-50 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-xl">{selectedCountry.flag}</span>
                        <span className="text-gray-700 font-medium">{selectedCountry.code}</span>
                      </button>
                      <input
                        {...otpForm.register('phone')}
                        type="tel"
                        inputMode="tel"
                        placeholder="(555) 123-4567"
                        onChange={(e) => handlePhoneChange(e, otpForm)}
                        className={`flex-1 input-field ${otpForm.formState.errors.phone ? 'input-field-error' : ''}`}
                        autoComplete="tel"
                      />
                    </div>
                    {otpForm.formState.errors.phone && (
                      <p className="text-red-600 text-sm mt-2 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {otpForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-blue-900 text-sm">
                      We'll send you a 6-digit verification code via SMS
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center space-x-2 haptic-medium"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare size={20} />
                        <span>Send Verification Code</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* OTP Verification */}
              {mode === 'otp' && otpSent && (
                <form onSubmit={otpForm.handleSubmit(handleOTPSignIn)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Enter 6-Digit Code
                    </label>
                    <input
                      {...otpForm.register('otp')}
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      maxLength={6}
                      className="input-field text-center text-2xl font-mono tracking-[0.5em]"
                      autoComplete="one-time-code"
                      autoFocus
                    />
                    {otpForm.formState.errors.otp && (
                      <p className="text-red-600 text-sm mt-2 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {otpForm.formState.errors.otp.message}
                      </p>
                    )}
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-green-900 text-sm flex items-center">
                      <CheckCircle size={16} className="mr-2" />
                      Code sent to {otpForm.watch('phone')}
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                    >
                      <ChevronLeft size={20} />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 btn-primary flex items-center justify-center space-x-2 haptic-medium"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          <span>Verify</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Didn't receive code? Resend
                  </button>
                </form>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need help? Contact your{' '}
                <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
                  safety administrator
                </a>
              </p>
            </div>

            {/* Security Badge */}
            <div className="mt-8 flex items-center justify-center space-x-2 text-gray-500">
              <Lock size={16} />
              <span className="text-xs">256-bit SSL Encrypted</span>
            </div>
          </div>
        </div>

        {/* Country Picker Modal */}
        {showCountryPicker && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCountryPicker(false)}
            />
            <div className="relative w-full max-h-[60vh] bg-white rounded-t-3xl shadow-2xl animate-slide-up">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Country</h3>
              </div>
              <div className="overflow-y-auto scrollbar-hide">
                {countryCodesData.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => {
                      setSelectedCountry(country)
                      phoneForm.setValue('countryCode', country.code)
                      setShowCountryPicker(false)
                    }}
                    className="w-full px-6 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <span className="flex-1 text-left text-gray-900">{country.country}</span>
                    <span className="text-gray-500">{country.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Install Prompt */}
      <InstallPrompt />
    </>
  )
}
