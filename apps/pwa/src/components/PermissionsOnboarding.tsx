import { useState } from 'react'
import { Bell, MapPin, Camera, Shield, Check, X, ChevronRight } from 'lucide-react'
import { usePermissions } from '../hooks/usePermissions'

interface PermissionsOnboardingProps {
  onComplete: () => void
  onSkip?: () => void
}

export default function PermissionsOnboarding({ onComplete, onSkip }: PermissionsOnboardingProps) {
  const { 
    permissions, 
    requestNotificationPermission, 
    requestGeolocationPermission,
    requestCameraPermission 
  } = usePermissions()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [isRequesting, setIsRequesting] = useState(false)

  const permissionSteps = [
    {
      id: 'notifications',
      icon: Bell,
      title: 'Safety Notifications',
      description: 'Get instant alerts for check-ins and emergency situations',
      benefits: [
        'Reminder notifications for scheduled check-ins',
        'Emergency alerts from your team',
        'Safety updates and incident notifications'
      ],
      request: requestNotificationPermission,
      status: permissions.notifications
    },
    {
      id: 'geolocation',
      icon: MapPin,
      title: 'Location Services',
      description: 'Share your location during emergencies for faster response',
      benefits: [
        'Automatic location sharing in emergencies',
        'Location-based check-in verification',
        'Faster emergency response times'
      ],
      request: requestGeolocationPermission,
      status: permissions.geolocation
    },
    {
      id: 'camera',
      icon: Camera,
      title: 'Camera Access',
      description: 'Document safety incidents with photos when needed',
      benefits: [
        'Photo evidence for incident reports',
        'Visual verification for check-ins',
        'Document workplace hazards'
      ],
      request: requestCameraPermission,
      status: permissions.camera,
      optional: true
    }
  ]

  const currentPermission = permissionSteps[currentStep]

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    
    try {
      const granted = await currentPermission.request()
      
      // Move to next step after a short delay
      setTimeout(() => {
        if (currentStep < permissionSteps.length - 1) {
          setCurrentStep(currentStep + 1)
        } else {
          onComplete()
        }
        setIsRequesting(false)
      }, granted ? 500 : 1000)
    } catch (error) {
      console.error('Permission request failed:', error)
      setIsRequesting(false)
    }
  }

  const handleSkip = () => {
    if (currentStep < permissionSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkipAll = () => {
    onSkip ? onSkip() : onComplete()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <Check className="text-green-600" size={20} />
      case 'denied':
        return <X className="text-red-600" size={20} />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col safe-area">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Setup Permissions</h1>
          <button
            onClick={handleSkipAll}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Skip all
          </button>
        </div>
        
        {/* Progress indicator */}
        <div className="flex space-x-2">
          {permissionSteps.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg ${
              currentPermission.status === 'granted' 
                ? 'bg-gradient-to-br from-green-400 to-green-600' 
                : 'bg-gradient-to-br from-orange-400 to-orange-600'
            }`}>
              <currentPermission.icon className="text-white" size={48} />
            </div>
          </div>

          {/* Title and description */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentPermission.title}
              </h2>
              {getStatusIcon(currentPermission.status)}
            </div>
            <p className="text-gray-600">
              {currentPermission.description}
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Why we need this:</h3>
            <ul className="space-y-3">
              {currentPermission.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-orange-600" />
                  </div>
                  <span className="text-gray-700 text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Status message */}
          {currentPermission.status === 'granted' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-800 text-sm font-medium">
                ✓ Permission already granted
              </p>
            </div>
          )}

          {currentPermission.status === 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 text-sm">
                Permission was denied. You can enable it later in your device settings.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-8">
        <div className="max-w-md mx-auto space-y-3">
          {currentPermission.status === 'granted' ? (
            <button
              onClick={() => currentStep < permissionSteps.length - 1 ? setCurrentStep(currentStep + 1) : onComplete()}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl flex items-center justify-center space-x-2"
            >
              <span>Continue</span>
              <ChevronRight size={20} />
            </button>
          ) : currentPermission.status === 'denied' ? (
            <button
              onClick={handleSkip}
              className="w-full py-4 px-6 bg-gray-200 text-gray-700 font-semibold rounded-xl"
            >
              Continue without {currentPermission.id}
            </button>
          ) : (
            <>
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isRequesting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Requesting...</span>
                  </>
                ) : (
                  <>
                    <Shield size={20} />
                    <span>Enable {currentPermission.title}</span>
                  </>
                )}
              </button>
              
              {currentPermission.optional && (
                <button
                  onClick={handleSkip}
                  className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
                >
                  Skip for now
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
