import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, Smartphone, MessageSquare, Fingerprint, Search, ChevronDown, Check } from 'lucide-react'
import { PinEntry } from '../components/PinEntry'
import { BiometricAuth } from '../components/BiometricAuth'
import { OtpVerification } from '../components/OtpVerification'
import InstallPrompt from '../components/InstallPrompt'
import PermissionsOnboarding from '../components/PermissionsOnboarding'
import { workerAuth } from '../lib/workerAuth'
import { useBiometric } from '../hooks/useBiometric'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { formatPhoneNumber, unformatPhoneNumber, countryCodesData } from '../utils/phoneFormatter'

type AuthMethod = 'biometric' | 'pin' | 'otp'
type AuthFlow = 'invitation' | 'signin' | 'setup'
type SetupStep = 'install' | 'permissions' | 'pin' | 'biometric' | 'complete'

export function WorkerAuth() {
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

  // Invitation data
  const [invitationToken, setInvitationToken] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  
  // Country selection
  const [selectedCountry, setSelectedCountry] = useState(countryCodesData[0])
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
      
      const detectedCountry = countryCodesData.find(c => c.code === defaultCountryCode)
      if (detectedCountry) {
        setSelectedCountry(detectedCountry)
      }
    }
    
    detectCountry()
  }, [])

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await workerAuth.validateSession()
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
      const result = await workerAuth.verifyInvitation(invitationToken, code)
      
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
      const result = await workerAuth.setupPin(pin)
      
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
      const result = await workerAuth.validatePin(pin)
      
      if (result.success) {
        navigate('/dashboard')
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
      const fullPhoneNumber = selectedCountry.code + unformatPhoneNumber(phoneNumber)
      const result = await workerAuth.sendOTP(fullPhoneNumber)
      
      if (result.success) {
        setAuthMethod('otp')
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
      const fullPhoneNumber = selectedCountry.code + unformatPhoneNumber(phoneNumber)
      const result = await workerAuth.verifyOTP(fullPhoneNumber, code)
      
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
  const filteredCountries = countryCodesData.filter(country => 
    country.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
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
            <PinEntry
              onSubmit={handlePinSetup}
              title="Create Your PIN"
              isSetup={true}
              error={error || undefined}
              loading={loading}
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SafePing</h1>
            <p className="text-gray-600">Choose your authentication method</p>
          </div>

          <div className="space-y-3">
            {/* Biometric option */}
            {biometricAvailable && workerAuth.isBiometricEnabled() && (
              <button
                onClick={() => setAuthMethod('biometric')}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Fingerprint className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Biometric</p>
                  <p className="text-sm text-gray-600">Use Face ID or Touch ID</p>
                </div>
              </button>
            )}

            {/* PIN option */}
            {workerAuth.isPinSetup() && (
              <button
                onClick={() => setAuthMethod('pin')}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">PIN Code</p>
                  <p className="text-sm text-gray-600">Enter your 6-digit PIN</p>
                </div>
              </button>
            )}

            {/* OTP option */}
            <button
              onClick={() => {
                // Show phone input screen
                setAuthMethod('otp')
              }}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">SMS Code</p>
                <p className="text-sm text-gray-600">Receive a code via SMS</p>
              </div>
            </button>
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
          <PinEntry
            onSubmit={handlePinAuth}
            onCancel={() => setAuthMethod(null)}
            error={error || undefined}
            loading={loading}
          />
        </div>
      )

    case 'otp':
      if (!phoneNumber) {
        // Phone number input with country selector
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-6">
            <div className="w-full max-w-md">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Smartphone className="text-white" size={36} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Enter Your Phone Number
                </h2>
                <p className="text-gray-600">
                  We'll send you a verification code via SMS
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
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-blue-400 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{selectedCountry.flag}</span>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{selectedCountry.country}</p>
                          <p className="text-sm text-gray-500">{selectedCountry.code}</p>
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
                    <div className="flex space-x-2">
                      <div className="flex items-center px-3 bg-gray-100 rounded-l-xl border-2 border-r-0 border-gray-200">
                        <span className="text-lg">{selectedCountry.flag}</span>
                        <span className="ml-2 font-medium text-gray-700">{selectedCountry.code}</span>
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                        placeholder="(555) 123-4567"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-r-xl focus:border-blue-400 focus:outline-none transition-colors"
                        autoFocus
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
                    disabled={loading || !phoneNumber}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2"
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

                  {/* Back Button */}
                  <button
                    onClick={() => setAuthMethod(null)}
                    className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Back to options
                  </button>
                </div>
              </div>

              {/* Security Note */}
              <p className="text-center text-sm text-gray-500 mt-6">
                Your phone number is encrypted and never shared
              </p>
            </div>

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
                <div className="relative w-full max-h-[70vh] bg-white rounded-t-3xl shadow-2xl animate-slide-up">
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
                      />
                    </div>
                  </div>
                  
                  {/* Country List */}
                  <div className="overflow-y-auto max-h-[50vh]">
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
                        <span className="flex-1 text-left text-gray-900">{country.country}</span>
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
        )
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <OtpVerification
            phoneNumber={phoneNumber}
            onVerify={handleOtpVerification}
            onResend={handleOtpRequest}
            onCancel={() => {
              setPhoneNumber('')
              setAuthMethod(null)
            }}
            error={error || undefined}
            loading={loading}
          />
        </div>
      )

    default:
      return null
  }
}
