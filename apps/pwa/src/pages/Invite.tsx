import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Shield, Check, AlertCircle, Loader2, ChevronDown, Search, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatPhoneForDisplay, formatPhoneForStorage, COUNTRIES } from '@safeping/phone-utils'

type VerificationStep = 'loading' | 'verify' | 'success' | 'error'

export function InvitePage() {
  const navigate = useNavigate()
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  
  const [step, setStep] = useState<VerificationStep>('loading')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // For manual code entry
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  
  // User data after verification
  const [userData, setUserData] = useState<any>(null)

  // Generate device ID
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('safeping_device_id')
    if (!deviceId) {
      deviceId = `pwa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('safeping_device_id', deviceId)
    }
    return deviceId
  }

  // Auto-verify if token is provided
  useEffect(() => {
    if (token) {
      verifyWithToken()
    } else {
      // Check if we have phone number in URL params (for manual entry)
      const phone = searchParams.get('phone')
      if (phone) {
        setPhoneNumber(formatPhoneForDisplay(phone))
      }
      setStep('verify')
    }
  }, [token])

  const verifyWithToken = async () => {
    setLoading(true)
    setError(null)

    try {
      const deviceInfo = {
        deviceId: getDeviceId(),
        deviceType: 'pwa',
        deviceModel: navigator.userAgent,
        userAgent: navigator.userAgent,
        appVersion: '1.0.0'
      }

      const { data, error: verifyError } = await supabase.functions.invoke('verify-staff', {
        body: {
          invitationToken: token,
          deviceInfo
        }
      })

      if (verifyError) {
        setError(verifyError.message || 'Verification failed')
        setStep('error')
      } else if (data?.requiresCodeEntry) {
        // Token is valid, but we need the user to enter the code
        // Pre-fill the phone number if provided
        if (data.phoneNumber) {
          // Extract country code and format the number
          const country = COUNTRIES.find(c => data.phoneNumber.startsWith(c.dialCode))
          if (country) {
            setSelectedCountry(country)
            const phoneWithoutCode = data.phoneNumber.substring(country.code.length)
            setPhoneNumber(formatPhoneForDisplay(phoneWithoutCode))
          }
        }
        setStep('verify')
        setError(null)
        // Show a message to the user
        setError('Please enter the 6-digit verification code sent to your phone')
      } else if (!data?.success) {
        setError(data?.error || 'Verification failed')
        setStep('error')
        
        // If already verified, redirect to auth
        if (data?.alreadyVerified) {
          setTimeout(() => {
            navigate('/auth')
          }, 3000)
        }
      } else {
        handleVerificationSuccess(data)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const verifyWithCode = async () => {
    if (!phoneNumber || !verificationCode) {
      setError('Please enter your phone number and verification code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const fullPhoneNumber = selectedCountry.dialCode + formatPhoneForStorage(phoneNumber)
      const deviceInfo = {
        deviceId: getDeviceId(),
        deviceType: 'pwa',
        deviceModel: navigator.userAgent,
        userAgent: navigator.userAgent,
        appVersion: '1.0.0'
      }

      const { data, error: verifyError } = await supabase.functions.invoke('verify-staff', {
        body: {
          phoneNumber: fullPhoneNumber,
          verificationCode: verificationCode,
          deviceInfo
        }
      })

      if (verifyError || !data?.success) {
        setError(data?.error || verifyError?.message || 'Invalid verification code')
      } else {
        handleVerificationSuccess(data)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationSuccess = (data: any) => {
    setUserData(data.user)
    
    // Store session
    localStorage.setItem('safeping_session', JSON.stringify(data.session))
    localStorage.setItem('safeping_user', JSON.stringify(data.user))
    
    setStep('success')
    
    // Redirect to onboarding or dashboard
    setTimeout(() => {
      if (data.requiresPinSetup || !data.user.onboardingCompleted) {
        // Redirect to onboarding with all necessary data
        navigate('/onboarding', { 
          state: { 
            user: data.user,
            session: data.session,
            invitationId: data.invitationId,
            requiresPinSetup: data.requiresPinSetup 
          } 
        })
      } else {
        // User already set up, go to dashboard
        navigate('/dashboard')
      }
    }, 2000)
  }

  // Filter countries for picker
  const filteredCountries = COUNTRIES.filter(country => 
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.includes(countrySearch)
  )

  // Loading state
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying your invitation...</p>
        </div>
      </div>
    )
  }

  // Success state
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center transform transition-all animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-[#15a2a6] to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-scale">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Welcome to SafePing!
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Hi {userData?.firstName}, you've been successfully verified.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Setting up your account...
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-[#15a2a6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#15a2a6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#15a2a6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (step === 'error' && token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Verification Failed
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => {
              setStep('verify')
              setError(null)
            }}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            Enter Code Manually
          </button>
        </div>
      </div>
    )
  }

  // Manual verification form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/safeping-logo-full.png" 
            alt="SafePing" 
            className="h-14 mx-auto mb-4"
          />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Join SafePing
          </h2>
          <p className="text-gray-600">
            Enter your invitation details to get started
          </p>
        </div>

        {/* Verification Form */}
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
                  onChange={(e) => setPhoneNumber(formatPhoneForDisplay(e.target.value))}
                  placeholder="21 234 5678"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-r-xl focus:border-[#15a2a6] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Verification Code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#15a2a6] focus:outline-none transition-colors text-center text-2xl font-mono tracking-widest"
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter the 6-digit code from your SMS invitation
              </p>
            </div>

            {/* Error or Info Message */}
            {error && (
              <div className={`border rounded-lg p-3 ${
                error.includes('verification code') 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm ${
                  error.includes('verification code')
                    ? 'text-blue-700'
                    : 'text-red-700'
                }`}>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={verifyWithCode}
              disabled={loading || !phoneNumber || !verificationCode}
              className="w-full py-4 bg-gradient-to-r from-[#15a2a6] to-teal-500 text-white font-semibold rounded-xl hover:from-[#128a8e] hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Shield size={20} />
                  <span>Verify & Join</span>
                </>
              )}
            </button>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Didn't receive an invitation?{' '}
                <a href="/contact" className="text-[#15a2a6] hover:underline">
                  Contact your administrator
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Your information is encrypted and secure
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Select Country</h3>
                <button
                  onClick={() => {
                    setShowCountryPicker(false)
                    setCountrySearch('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-[#15a2a6] focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Country List */}
            <div className="overflow-y-auto max-h-[50vh]">
              {filteredCountries.map((country) => (
                <button
                  key={country.code + country.name}
                  onClick={() => {
                    setSelectedCountry(country)
                    setShowCountryPicker(false)
                    setCountrySearch('')
                  }}
                  className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                    selectedCountry.code === country.code && selectedCountry.name === country.name ? 'bg-teal-50' : ''
                  }`}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <span className="flex-1 text-left text-gray-900">{country.name}</span>
                  <span className="text-gray-500">{country.code}</span>
                  {selectedCountry.code === country.code && selectedCountry.name === country.name && (
                    <Check className="text-[#15a2a6]" size={20} />
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
