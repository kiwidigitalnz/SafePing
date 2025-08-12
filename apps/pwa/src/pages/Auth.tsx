import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, MessageSquare, Fingerprint, Search, ChevronDown, Check } from 'lucide-react'
import { FlexiblePinEntry } from '../components/FlexiblePinEntry'
import { BiometricAuth } from '../components/BiometricAuth'
import { OtpVerification } from '../components/OtpVerification'
import InstallPrompt from '../components/InstallPrompt'
import PermissionsOnboarding from '../components/PermissionsOnboarding'
import { staffAuth } from '../lib/staffAuth'
import { useBiometric } from '../hooks/useBiometric'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { COUNTRIES, type Country } from '@safeping/phone-utils'

type AuthMethod = 'biometric' | 'pin' | 'otp'
type AuthFlow = 'invitation' | 'signin' | 'setup'
type SetupStep = 'install' | 'permissions' | 'pin' | 'biometric' | 'complete'

export function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isInstalled } = usePWAInstall()
  const { isAvailable: biometricAvailable } = useBiometric()

  // Auth state
  const [authFlow, setAuthFlow] = useState<AuthFlow>('signin')
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null)
  const [setupStep, setSetupStep] = useState<SetupStep>('install')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pinResetRequired, setPinResetRequired] = useState(false)

  // Invitation data
  const [invitationToken, setInvitationToken] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  
  // Country selection
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  // Check for invitation token in URL
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setInvitationToken(token)
      setAuthFlow('invitation')
      // Extract phone number from token if needed
      // This would typically be fetched from the backend
    }
  }, [searchParams])

  // Auto-detect user's country based on browser locale or timezone
  useEffect(() => {
    const detectCountry = () => {
      // Try to get country from browser's language
      const browserLang = navigator.language || 'en-NZ'
      const countryCode = browserLang.split('-')[1]?.toUpperCase()
      
      // Map common country codes to phone country codes
      const countryMap: { [key: string]: string } = {
        'NZ': '+64',  // New Zealand first
        'AU': '+61',  // Australia second
        'US': '+1',
        'GB': '+44',
        'CA': '+1',
        'IN': '+91',
        'CN': '+86',
        'JP': '+81',
        'KR': '+82',
        'DE': '+49',
        'FR': '+33',
        'IT': '+39',
        'ES': '+34',
        'MX': '+52',
        'BR': '+55',
        'AR': '+54',
        'ZA': '+27',
        'NG': '+234',
        'EG': '+20',
        'VN': '+84',
        'TH': '+66',
        'PH': '+63',
        'ID': '+62',
        'MY': '+60',
        'SG': '+65'
      }
      
      // Default to New Zealand if no country detected
      let defaultCountryCode = '+64'
      
      if (countryCode && countryMap[countryCode]) {
        defaultCountryCode = countryMap[countryCode]
      }
      
      const detectedCountry = COUNTRIES.find(c => c.dialCode === defaultCountryCode)
      if (detectedCountry) {
        setSelectedCountry(detectedCountry)
      }
    }
    
    detectCountry()
  }, [])

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await staffAuth.validateSession()
      if (isAuthenticated) {
        navigate('/dashboard')
      }
    }
    checkAuth()
  }, [navigate])

  // Handle invitation verification
  const handleInvitationVerification = async (code: string) => {
    if (!invitationToken) return

    setLoading(true)
    setError(null)

    try {
      const result = await staffAuth.verifyInvitation(invitationToken, code)
      
      if (result.success) {
        // Move to setup flow
        setAuthFlow('setup')
        setSetupStep('install')
      } else {
        setError(result.error || 'Verification failed')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle PIN setup
  const handlePinSetup = async (pin: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await staffAuth.setupPin(pin)
      
      if (result.success) {
        // Move to biometric setup if available
        if (biometricAvailable) {
          setSetupStep('biometric')
        } else {
          setSetupStep('complete')
          setTimeout(() => {
            navigate('/dashboard')
          }, 2000)
        }
      } else {
        setError(result.error || 'Failed to set PIN')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle PIN authentication
  const handlePinAuth = async (pin: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await staffAuth.validatePin(pin)
      
      if (result.success) {
        navigate('/dashboard')
      } else if (result.pinResetRequired) {
        // PIN reset is required - move to setup flow
        setAuthFlow('setup')
        setSetupStep('pin')
        setPinResetRequired(true)
        setError(null)
      } else {
        setError(result.error || 'Invalid PIN')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP request
  const handleOtpRequest = async () => {
    if (!phoneNumber) {
      setError('Please enter your phone number')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const fullPhoneNumber = '+' + selectedCountry.dialCode + phoneNumber
      const result = await staffAuth.sendOTP(fullPhoneNumber)
      
      if (result.success) {
        setOtpSent(true)
        setError(null)
      } else {
        setError(result.error || 'Failed to send OTP')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP verification
  const handleOtpVerification = async (code: string) => {
    setLoading(true)
    setError(null)

    try {
      const fullPhoneNumber = '+' + selectedCountry.dialCode + phoneNumber
      const result = await staffAuth.verifyOTP(fullPhoneNumber, code)
      
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.error || 'Invalid code')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter countries based on search
  const filteredCountries = COUNTRIES.filter((country: Country) => 
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.includes(countrySearch)
  )

  // Render invitation flow
  if (authFlow === 'invitation' && invitationToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <OtpVerification
          phoneNumber={phoneNumber}
          onVerify={handleInvitationVerification}
          onResend={() => {
            // Handle resend for invitation
          }}
          error={error || undefined}
          loading={loading}
          isInvitation={true}
        />
      </div>
    )
  }

  // Render setup flow
  if (authFlow === 'setup') {
    switch (setupStep) {
      case 'install':
        if (!isInstalled) {
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <InstallPrompt
                onInstalled={() => setSetupStep('permissions')}
                onClose={() => setSetupStep('permissions')}
              />
            </div>
          )
        }
        setSetupStep('permissions')
        break

      case 'permissions':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <PermissionsOnboarding
              onComplete={() => setSetupStep('pin')}
              onSkip={() => setSetupStep('pin')}
            />
          </div>
        )

      case 'pin':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <FlexiblePinEntry
              onSubmit={handlePinSetup}
              title={pinResetRequired ? "Create New PIN" : "Create Your PIN"}
              isSetup={true}
              error={error || undefined}
              loading={loading}
              minLength={4}
              maxLength={6}
              pinResetRequired={pinResetRequired}
            />
          </div>
        )

      case 'biometric':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <BiometricAuth
              onSuccess={() => {
                setSetupStep('complete')
                setTimeout(() => navigate('/dashboard'), 2000)
              }}
              onCancel={() => {
                setSetupStep('complete')
                setTimeout(() => navigate('/dashboard'), 2000)
              }}
              isSetup={true}
            />
          </div>
        )

      case 'complete':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h2>
              <p className="text-gray-600">Redirecting to dashboard...</p>
            </div>
          </div>
        )
    }
  }

  // Render sign-in flow
  if (!authMethod) {
    // Auth method selection
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* Back to Welcome */}
          <button
            onClick={() => navigate('/')}
            className="mb-6 text-sm text-gray-600 hover:text-[#15a2a6] flex items-center space-x-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>

          <div className="text-center mb-8">
            <img 
              src="/safeping-logo-full.png" 
              alt="SafePing" 
              className="h-14 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to access your safety dashboard</p>
          </div>

          <div className="space-y-3">
            {/* Biometric option */}
            {biometricAvailable && staffAuth.isBiometricEnabled() && (
              <button
                onClick={() => setAuthMethod('biometric')}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-[#15a2a6] shadow-sm hover:shadow-md transition-all transform hover:scale-[1.01]"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                  <Fingerprint className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Biometric</p>
                  <p className="text-sm text-gray-600">Use Face ID or Touch ID</p>
                </div>
              </button>
            )}

            {/* PIN option */}
            {staffAuth.isPinSetup() && (
              <button
                onClick={() => setAuthMethod('pin')}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-[#15a2a6] shadow-sm hover:shadow-md transition-all transform hover:scale-[1.01]"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">PIN Code</p>
                  <p className="text-sm text-gray-600">Enter your 4-6 digit PIN</p>
                </div>
              </button>
            )}

            {/* OTP option */}
            <button
              onClick={() => {
                // Show phone input screen
                setAuthMethod('otp')
              }}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-[#15a2a6] shadow-sm hover:shadow-md transition-all transform hover:scale-[1.01]"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-teal-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">SMS Code</p>
                <p className="text-sm text-gray-600">Receive a code via SMS</p>
              </div>
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-8 space-y-3">
            <div className="text-center">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-600 hover:text-[#15a2a6] transition-colors"
              >
                Not you? Switch account
              </button>
            </div>
            
            <div className="text-center">
              <a 
                href="https://safeping.com/support" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-[#15a2a6] transition-colors"
              >
                Forgot PIN? Contact your administrator
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render selected auth method
  switch (authMethod) {
    case 'biometric':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <BiometricAuth
            onSuccess={() => navigate('/dashboard')}
            onCancel={() => setAuthMethod(null)}
          />
        </div>
      )

    case 'pin':
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <FlexiblePinEntry
            onSubmit={handlePinAuth}
            onCancel={() => setAuthMethod(null)}
            onForgotPin={() => setAuthMethod('otp')}
            error={error || undefined}
            loading={loading}
            minLength={4}
            maxLength={6}
          />
        </div>
      )

    case 'otp':
      // Show OTP verification if code was sent, otherwise show phone input
      if (otpSent) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center px-6">
            <div className="w-full max-w-md">
              <div className="text-center mb-6">
                <img 
                  src="/safeping-logo-full.png" 
                  alt="SafePing" 
                  className="h-14 mx-auto"
                />
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <OtpVerification
                  phoneNumber={'+' + selectedCountry.dialCode + phoneNumber}
                  onVerify={handleOtpVerification}
                  onResend={handleOtpRequest}
                  onCancel={() => {
                    setOtpSent(false)
                    setError(null)
                  }}
                  error={error || undefined}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        )
      }

      // Phone input screen
      return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex flex-col">
          <div className="flex-1 flex items-center justify-center px-6 py-safe">
            <div className="w-full max-w-md">
            {/* Back Button */}
            <button
              onClick={() => {
                setAuthMethod(null)
                setPhoneNumber('')
                setError(null)
                setOtpSent(false)
              }}
              className="mb-6 text-sm text-gray-600 hover:text-[#15a2a6] flex items-center space-x-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <img 
                src="/safeping-logo-full.png" 
                alt="SafePing" 
                className="h-14 mx-auto mb-4"
              />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Sign In with SMS
              </h2>
              <p className="text-gray-600">
                We'll send you a verification code
              </p>
            </div>

            {/* Phone Input Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="space-y-4">
                {/* Country Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Country
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCountryPicker(true)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-[#15a2a6] transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{selectedCountry.flag}</span>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{selectedCountry.name}</p>
                        <p className="text-sm text-gray-500">+{selectedCountry.dialCode}</p>
                      </div>
                    </div>
                    <ChevronDown className="text-gray-400" size={20} />
                  </button>
                </div>

                {/* Phone Number Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>

                  {/* Improved combined container for better styling */}
                  <div className="flex overflow-hidden rounded-xl border-2 border-gray-200 focus-within:border-[#15a2a6] transition-colors">
                    <div className="flex items-center px-3 bg-gray-100 flex-shrink-0">
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span className="ml-2 font-medium text-gray-700">+{selectedCountry.dialCode}</span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        setPhoneNumber(value)
                      }}
                      placeholder={selectedCountry.dialCode === '1' ? "555 123 4567" : "21 234 5678"}
                      className="flex-1 px-4 py-3 focus:outline-none transition-colors text-base"
                      autoFocus
                      autoComplete="tel-national"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleOtpRequest}
                  disabled={loading || !phoneNumber || phoneNumber.length < 6}
                  className="w-full py-4 bg-gradient-to-r from-[#15a2a6] to-teal-500 text-white font-semibold rounded-xl hover:from-[#128a8e] hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare size={20} />
                      <span>Send Verification Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Security Note */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Your phone number is encrypted and never shared
            </p>

            {/* Country Picker Modal */}

            {showCountryPicker && (
              <div className="fixed inset-0 z-50 flex items-end justify-center">
                <div 
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => {
                    setShowCountryPicker(false)
                    setCountrySearch('')
                  }}
                />
                {/* Improved handling for mobile keyboard */}
                <div 
                  className="relative w-full bg-white rounded-t-3xl shadow-2xl animate-slide-up safe-area-bottom" 
                  style={{ maxHeight: '100dvh' }}
                >
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Country</h3>
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder="Search country or code..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
                        autoFocus
                        ref={(el) => {
                          if (el) {
                            setTimeout(() => {
                              el.scrollIntoView({ block: 'center', behavior: 'smooth' })
                            }, 300)
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Country List */}
                  <div className="overflow-y-auto" style={{ maxHeight: '50vh' }}>
                    {filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => {
                          setSelectedCountry(country)
                          setShowCountryPicker(false)
                          setCountrySearch('')
                        }}
                        className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                          selectedCountry.code === country.code ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span className="text-2xl">{country.flag}</span>
                        <span className="flex-1 text-left text-gray-900">{country.name}</span>
                        <span className="text-gray-500">{country.code}</span>
                        {selectedCountry.code === country.code && (
                          <Check className="text-blue-600" size={20} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}
