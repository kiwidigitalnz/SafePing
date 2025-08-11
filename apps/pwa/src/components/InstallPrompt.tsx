import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Bell, MapPin, Shield } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'

interface InstallPromptProps {
  onClose?: () => void
  onInstalled?: () => void
}

export default function InstallPrompt({ onClose, onInstalled }: InstallPromptProps) {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall()
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Check if we should show the prompt
    const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen')
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    
    if (!isInstalled && !hasSeenPrompt) {
      // Show prompt after a short delay for better UX
      const timer = setTimeout(() => {
        setShowPrompt(true)
        if (isIOS && !isInstallable) {
          setShowIOSInstructions(true)
        }
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [isInstalled, isInstallable])

  const handleInstall = async () => {
    setIsInstalling(true)
    
    try {
      const installed = await promptInstall()
      
      if (installed) {
        setShowPrompt(false)
        localStorage.setItem('pwa-install-prompt-seen', 'true')
        onInstalled?.()
      }
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleClose = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-prompt-seen', 'true')
    onClose?.()
  }

  if (!showPrompt || isInstalled) {
    return null
  }

  const benefits = [
    { icon: Smartphone, text: 'Quick access from home screen' },
    { icon: Bell, text: 'Real-time safety notifications' },
    { icon: MapPin, text: 'Location-based check-ins' },
    { icon: Shield, text: 'Works offline for emergencies' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up sm:animate-fade-in">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* Content */}
        <div className="p-6 pb-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="text-white" size={40} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
            Install SafePing
          </h2>
          
          <p className="text-center text-gray-600 mb-6">
            Add SafePing to your home screen for the best experience
          </p>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <benefit.icon size={20} className="text-orange-600" />
                </div>
                <span className="text-gray-700 text-sm">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Install button or iOS instructions */}
          {showIOSInstructions ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  To install on iOS:
                </p>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Tap the Share button <span className="inline-block w-4 h-4 align-middle">⬆️</span></li>
                  <li>2. Scroll down and tap "Add to Home Screen"</li>
                  <li>3. Tap "Add" to install</li>
                </ol>
              </div>
              
              <button
                onClick={handleClose}
                className="w-full py-4 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Got it
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleInstall}
                disabled={!isInstallable || isInstalling}
                className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isInstalling ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Installing...</span>
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    <span>Install Now</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleClose}
                className="w-full mt-3 py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
              >
                Maybe later
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
