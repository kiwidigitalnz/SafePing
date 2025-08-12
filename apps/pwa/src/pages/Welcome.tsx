import { useNavigate } from 'react-router-dom'
import { Shield, CheckCircle, Bell, MapPin, Wifi, Users, ArrowRight, HelpCircle } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'

export function WelcomePage() {
  const navigate = useNavigate()
  const { isInstalled } = usePWAInstall()

  const features = [
    {
      icon: CheckCircle,
      title: 'Quick Check-ins',
      description: 'Regular safety confirmations',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: Bell,
      title: 'Emergency SOS',
      description: 'Instant alerts when needed',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      icon: Wifi,
      title: 'Works Offline',
      description: 'No signal? No problem',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: MapPin,
      title: 'Location Sharing',
      description: 'Optional GPS tracking',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/safeping-logo-full.png" 
            alt="SafePing" 
            className="h-16 mb-4"
          />
          <h1 className="text-4xl font-bold text-gray-900">SafePing</h1>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            Your Safety Companion
          </h2>
          <p className="text-lg text-gray-600 max-w-sm mx-auto">
            Check in regularly to let your team know you're safe
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className={`w-10 h-10 ${feature.bgColor} rounded-full flex items-center justify-center mb-3`}>
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="px-6 pb-8">
        <div className="max-w-md mx-auto space-y-3">
          {/* New Staff Button */}
          <button
            onClick={() => navigate('/invite')}
            className="w-full bg-gradient-to-r from-[#15a2a6] to-teal-500 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all flex items-center justify-center space-x-3"
          >
            <Users className="w-5 h-5" />
            <span>I'm a New Staff Member</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Returning User Button */}
          <button
            onClick={() => navigate('/auth')}
            className="w-full bg-white text-gray-900 py-4 px-6 rounded-xl font-semibold shadow-sm border-2 border-gray-200 hover:border-[#15a2a6] hover:shadow-md transform hover:scale-[1.02] transition-all flex items-center justify-center space-x-3"
          >
            <Shield className="w-5 h-5 text-[#15a2a6]" />
            <span>Sign In</span>
          </button>

          {/* Install Prompt */}
          {!isInstalled && (
            <div className="text-center text-xs text-gray-500">
              <p>Add SafePing to your home screen for the best experience</p>
            </div>
          )}
        </div>
      </div>

      {/* Help Link */}
      <div className="px-6 pb-8">
        <div className="text-center">
          <a 
            href="https://safeping.com/support" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-[#15a2a6] transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Need help? Contact support</span>
          </a>
        </div>
      </div>

      {/* Bottom Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#15a2a6] to-teal-500"></div>
    </div>
  )
}