import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Shield, Smartphone, Fingerprint, Check, Download } from 'lucide-react'
import { PinEntry } from '../components/PinEntry'
import { BiometricAuth } from '../components/BiometricAuth'
import InstallPrompt from '../components/InstallPrompt'
import { workerAuth } from '../lib/workerAuth'
import { useBiometric } from '../hooks/useBiometric'
import { usePWAInstall } from '../hooks/usePWAInstall'

type SetupStep = 'pin' | 'biometric' | 'install' | 'complete'

export function StaffSetup() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isInstalled, promptInstall } = usePWAInstall()
  const { isAvailable: biometricAvailable } = useBiometric()
  
  const [step, setStep] = useState<SetupStep>('pin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  
  // Get user data from navigation state
  const userData = location.state?.user
  const sessionData = location.state?.session
  
  useEffect(() => {
    // Redirect if no user data
    if (!userData || !sessionData) {
      navigate('/auth')
    }
  }, [userData, sessionData, navigate])

  const handlePinSetup = async (pin: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await workerAuth.setupPin(pin)
      
      if (result.success) {
        // Move to biometric setup if available, otherwise check PWA install
        if (biometricAvailable) {
          setStep('biometric')
        } else if (!isInstalled) {
          setStep('install')
        } else {
          completeSetup()
        }
      } else {
        setError(result.error || 'Failed to set PIN')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleBiometricSetup = async (success: boolean) => {
    if (success) {
      // Biometric setup successful
      if (!isInstalled) {
        setStep('install')
      } else {
        completeSetup()
      }
    } else {
      // Skip biometric, check PWA install
      if (!isInstalled) {
        setStep('install')
      } else {
        completeSetup()
      }
    }
  }

  const handleInstallComplete = () => {
    completeSetup()
  }

  const completeSetup = () => {
    setStep('complete')
    
    // Mark setup as complete
    localStorage.setItem('safeping_setup_complete', 'true')
    
    // Redirect to dashboard after animation
    setTimeout(() => {
      navigate('/dashboard')
    }, 2000)
  }

  // PIN Setup Step
  if (step === 'pin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#15a2a6] to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="text-white" size={36} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your PIN
            </h2>
            <p className="text-gray-600">
              Set up a 6-digit PIN to secure your account
            </p>
          </div>

          {/* PIN Entry */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <PinEntry
              onSubmit={handlePinSetup}
              title="Choose a 6-digit PIN"
              isSetup={true}
              error={error || undefined}
              loading={loading}
            />
            
            {/* Security Tips */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Security Tips:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Don't use easily guessable numbers (123456, 000000)</li>
                <li>• Avoid using your birthdate or phone number</li>
                <li>• Keep your PIN private and secure</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Biometric Setup Step
  if (step === 'biometric') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Fingerprint className="text-white" size={36} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Enable Biometric Login
            </h2>
            <p className="text-gray-600">
              Use Face ID or Touch ID for quick access
            </p>
          </div>

          {/* Biometric Setup */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <BiometricAuth
              onSuccess={() => handleBiometricSetup(true)}
              onCancel={() => handleBiometricSetup(false)}
              isSetup={true}
            />
            
            {/* Benefits */}
            <div className="mt-6 space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Faster login</p>
                  <p className="text-xs text-gray-600">Access SafePing instantly with your fingerprint or face</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Enhanced security</p>
                  <p className="text-xs text-gray-600">Your biometric data stays on your device</p>
                </div>
              </div>
            </div>

            {/* Skip Option */}
            <button
              onClick={() => handleBiometricSetup(false)}
              className="w-full mt-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Install PWA Step
  if (step === 'install') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Download className="text-white" size={36} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Install SafePing App
            </h2>
            <p className="text-gray-600">
              Add SafePing to your home screen for the best experience
            </p>
          </div>

          {/* Install Options */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {showInstallPrompt ? (
              <InstallPrompt
                onInstalled={handleInstallComplete}
                onClose={handleInstallComplete}
              />
            ) : (
              <>
                {/* Benefits */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Works like a native app</p>
                      <p className="text-sm text-gray-600">Full screen experience with no browser UI</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Quick access</p>
                      <p className="text-sm text-gray-600">Launch directly from your home screen</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Works offline</p>
                      <p className="text-sm text-gray-600">Access key features without internet</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <button
                  onClick={() => {
                    if (promptInstall) {
                      promptInstall()
                    }
                    setShowInstallPrompt(true)
                  }}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all transform hover:scale-[1.02]"
                >
                  Install SafePing
                </button>

                <button
                  onClick={handleInstallComplete}
                  className="w-full mt-3 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Continue in browser
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Complete Step
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center transform transition-all animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-scale">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            All Set!
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Welcome to SafePing, {userData?.firstName}!
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Taking you to your dashboard...
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
