import { useState, useEffect } from 'react'
import { Fingerprint, Scan, Smartphone, AlertCircle, CheckCircle } from 'lucide-react'
import { useBiometric } from '../hooks/useBiometric'

interface BiometricAuthProps {
  onSuccess: () => void
  onCancel?: () => void
  onSetupComplete?: () => void
  isSetup?: boolean
  userId?: string
}

export function BiometricAuth({
  onSuccess,
  onCancel,
  onSetupComplete,
  isSetup = false,
  userId
}: BiometricAuthProps) {
  const {
    isSupported,
    isAvailable,
    isRegistered,
    biometricType,
    registerBiometric,
    authenticateWithBiometric
  } = useBiometric()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [setupStep, setSetupStep] = useState<'intro' | 'register' | 'complete'>('intro')

  useEffect(() => {
    // Auto-trigger authentication if not in setup mode and biometric is registered
    if (!isSetup && isRegistered && isAvailable) {
      handleAuthenticate()
    }
  }, [isSetup, isRegistered, isAvailable])

  const handleAuthenticate = async () => {
    setLoading(true)
    setError(null)

    try {
      const success = await authenticateWithBiometric()
      if (success) {
        onSuccess()
      } else {
        setError('Authentication failed. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!userId && !isSetup) {
      setError('User ID is required for registration')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userIdToUse = userId || localStorage.getItem('worker_user_id') || 'default'
      const success = await registerBiometric(userIdToUse)
      
      if (success) {
        setSetupStep('complete')
        setTimeout(() => {
          if (onSetupComplete) {
            onSetupComplete()
          } else {
            onSuccess()
          }
        }, 2000)
      } else {
        setError('Failed to register biometric. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'face_id':
        return <Scan className="w-8 h-8 text-blue-600" />
      case 'touch_id':
      case 'fingerprint':
        return <Fingerprint className="w-8 h-8 text-blue-600" />
      default:
        return <Smartphone className="w-8 h-8 text-blue-600" />
    }
  }

  const getBiometricName = () => {
    switch (biometricType) {
      case 'face_id':
        return 'Face ID'
      case 'touch_id':
        return 'Touch ID'
      case 'fingerprint':
        return 'Fingerprint'
      case 'windows_hello':
        return 'Windows Hello'
      default:
        return 'Biometric Authentication'
    }
  }

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Biometric Not Supported
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Your device doesn't support biometric authentication.
          </p>
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Use Different Method
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!isAvailable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Biometric Not Available
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Please set up {getBiometricName()} in your device settings first.
          </p>
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Use Different Method
            </button>
          )}
        </div>
      </div>
    )
  }

  // Setup flow
  if (isSetup) {
    if (setupStep === 'intro') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-6">
          <div className="w-full max-w-sm">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                {getBiometricIcon()}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Enable {getBiometricName()}
            </h2>
            
            <p className="text-sm text-gray-600 text-center mb-8">
              Use {getBiometricName()} for quick and secure access to SafePing
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </div>
                <p className="text-sm text-gray-700">
                  Fast and convenient authentication
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </div>
                <p className="text-sm text-gray-700">
                  Your biometric data stays on your device
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </div>
                <p className="text-sm text-gray-700">
                  Can be disabled anytime in settings
                </p>
              </div>
            </div>

            <button
              onClick={() => setSetupStep('register')}
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 mb-3"
            >
              Enable {getBiometricName()}
            </button>

            {onCancel && (
              <button
                onClick={onCancel}
                disabled={loading}
                className="w-full py-3 text-sm text-gray-600 hover:text-gray-700"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>
      )
    }

    if (setupStep === 'register') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-6">
          <div className="w-full max-w-sm text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                {getBiometricIcon()}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Setting Up {getBiometricName()}
            </h2>
            
            <p className="text-sm text-gray-600 mb-8">
              Follow your device prompts to complete setup
            </p>

            {error && (
              <div className="flex items-center justify-center gap-2 mb-4 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Try Again'}
            </button>
          </div>
        </div>
      )
    }

    if (setupStep === 'complete') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-6">
          <div className="w-full max-w-sm text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {getBiometricName()} Enabled!
            </h2>
            
            <p className="text-sm text-gray-600">
              You can now use {getBiometricName()} to access SafePing
            </p>
          </div>
        </div>
      )
    }
  }

  // Authentication flow
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            {getBiometricIcon()}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Authenticate with {getBiometricName()}
        </h2>
        
        <p className="text-sm text-gray-600 mb-8">
          Use your {getBiometricName()} to continue
        </p>

        {error && (
          <div className="flex items-center justify-center gap-2 mb-4 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleAuthenticate}
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 mb-3"
        >
          {loading ? 'Authenticating...' : `Use ${getBiometricName()}`}
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full py-3 text-sm text-blue-600 hover:text-blue-700"
          >
            Use different authentication method
          </button>
        )}
      </div>
    </div>
  )
}
