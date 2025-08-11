import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'

interface OnboardingState {
  isNewOrganization?: boolean
  isNewAdmin?: boolean
  organizationId?: string
}

export function Onboarding() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, organization, loadOrganization } = useAuthStore()
  const state = location.state as OnboardingState

  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin')
      return
    }

    // Load organization data
    if (state?.organizationId && !organization) {
      loadOrganization(state.organizationId)
    }

    setIsLoading(false)
  }, [user, organization, state, navigate, loadOrganization])

  const handleGetStarted = () => {
    // Navigate to settings page to complete organization profile
    navigate('/settings')
  }

  const handleSkipToApp = () => {
    navigate('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (state?.isNewOrganization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="text-center space-y-8">
            {/* Success Animation */}
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Welcome Message */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-900">
                🎉 Welcome to SafePing!
              </h1>
              <p className="text-xl text-gray-600">
                Your organization <span className="font-semibold text-primary">{organization?.name}</span> is ready to go
              </p>
            </div>

            {/* Features Preview */}
            <div className="grid md:grid-cols-3 gap-6 py-8">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">📍</span>
                </div>
                <h3 className="font-semibold text-gray-900">Safety Check-ins</h3>
                <p className="text-sm text-gray-600">Configure regular check-ins for your team</p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">🚨</span>
                </div>
                <h3 className="font-semibold text-gray-900">Emergency Alerts</h3>
                <p className="text-sm text-gray-600">Instant notifications when help is needed</p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="font-semibold text-gray-900">Team Management</h3>
                <p className="text-sm text-gray-600">Add and manage your team members</p>
              </div>
            </div>

            {/* Trial Info */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Your 14-day free trial has started!</h3>
              <p className="text-blue-100">
                Explore all SafePing features with no limits. No credit card required.
              </p>
            </div>

            {/* Next Steps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Ready to get started?</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGetStarted}
                  className="px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Set Up Your Organization
                </button>
                <button
                  onClick={handleSkipToApp}
                  className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Explore Dashboard First
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state?.isNewAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-4">
        <div className="max-w-xl w-full text-center space-y-8">
          {/* Success Animation */}
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>

          {/* Welcome Message */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to the team!
            </h1>
            <p className="text-lg text-gray-600">
              You've successfully joined <span className="font-semibold text-green-600">{organization?.name}</span> on SafePing
            </p>
          </div>

          {/* Role Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Your Administrator Access</h3>
            <p className="text-green-800">
              As an administrator, you can manage team members, configure safety settings, 
              and help keep your organization secure.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGetStarted}
            className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Default fallback
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to SafePing</h1>
        <button
          onClick={handleGetStarted}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Get Started
        </button>
      </div>
    </div>
  )
}