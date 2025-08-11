import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { usePushNotifications } from '../lib/pushNotifications'
import { useGeolocation } from '../hooks/useGeolocation'

interface SOSButtonProps {
  userId: string
  organizationId: string
  onEmergencyTriggered?: (incidentId: string) => void
}

interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: number
}

export function SOSButton({ userId, organizationId, onEmergencyTriggered }: SOSButtonProps) {
  const [_isActivated, setIsActivated] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [emergencyState, setEmergencyState] = useState<'idle' | 'countdown' | 'triggered' | 'cancelling'>('idle')
  const [incidentId, setIncidentId] = useState<string | null>(null)
  
  const { queueEmergencyData } = usePushNotifications()
  const { location, accuracy, requestLocation, isLoading: locationLoading } = useGeolocation()
  
  const holdTimerRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const vibrationRef = useRef<number | null>(null)
  
  const HOLD_DURATION = 3000 // 3 seconds to activate
  const COUNTDOWN_DURATION = 10000 // 10 seconds to cancel
  
  useEffect(() => {
    // Cleanup timers on unmount
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current)
      if (vibrationRef.current) clearTimeout(vibrationRef.current)
    }
  }, [])
  
  useEffect(() => {
    // Start countdown when SOS is activated
    if (emergencyState === 'countdown') {
      setCountdown(COUNTDOWN_DURATION / 1000)
      
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            triggerEmergency()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      countdownTimerRef.current = interval
      
      // Vibrate during countdown
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200])
      }
      
      return () => clearInterval(interval)
    }
  }, [emergencyState])
  
  const handleMouseDown = () => {
    if (emergencyState !== 'idle') return
    
    setIsHolding(true)
    
    // Start hold timer
    holdTimerRef.current = setTimeout(() => {
      setEmergencyState('countdown')
      setIsActivated(true)
      
      // Intense vibration to indicate activation
      if ('vibrate' in navigator) {
        navigator.vibrate([500, 200, 500, 200, 500])
      }
      
      // Request location immediately
      requestLocation()
    }, HOLD_DURATION)
    
    // Gentle vibration to indicate holding
    if ('vibrate' in navigator) {
      navigator.vibrate(100)
    }
  }
  
  const handleMouseUp = () => {
    setIsHolding(false)
    
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    
    // Stop vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(0)
    }
  }
  
  const cancelEmergency = async () => {
    if (emergencyState !== 'countdown') return
    
    setEmergencyState('cancelling')
    
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    
    // Stop vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(0)
    }
    
    // Reset state after animation
    setTimeout(() => {
      setEmergencyState('idle')
      setIsActivated(false)
      setCountdown(0)
    }, 1000)
  }
  
  const triggerEmergency = async () => {
    setEmergencyState('triggered')
    
    try {
      // Get current location
      const currentLocation = location || await getCurrentLocation()
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }
      
      const emergencyData = {
        userId,
        organizationId,
        emergencyType: 'panic_button',
        location: currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: accuracy || undefined,
          timestamp: Date.now()
        } : undefined,
        message: 'Emergency SOS activated - immediate assistance required',
        triggeredBy: 'sos_button',
        timestamp: new Date().toISOString()
      }
      
      // Try to send immediately if online
      if (navigator.onLine) {
        const { data, error } = await supabase.functions.invoke('emergency-escalation', {
          body: emergencyData
        })
        
        if (error) {
          console.error('Emergency escalation error:', error)
          // Fall back to offline queue
          await queueEmergencyData(emergencyData, session.access_token)
        } else {
          console.log('Emergency escalation triggered:', data)
          if (data.incident_id) {
            setIncidentId(data.incident_id)
            onEmergencyTriggered?.(data.incident_id)
          }
        }
      } else {
        // Queue for when back online
        await queueEmergencyData(emergencyData, session.access_token)
        console.log('Emergency queued for when back online')
      }
      
      // Show local notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 Emergency SOS Activated', {
          body: 'Emergency services and contacts have been notified',
          icon: '/pwa-192x192.png',
          tag: 'emergency-sos'
        })
      }
      
      // Continuous vibration pattern for emergency
      if ('vibrate' in navigator) {
        const emergencyVibrate = () => {
          navigator.vibrate([1000, 500, 1000, 500, 1000])
          vibrationRef.current = setTimeout(emergencyVibrate, 3000)
        }
        emergencyVibrate()
      }
      
    } catch (error) {
      console.error('Failed to trigger emergency:', error)
      
      // Still show local notification even if server call fails
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 Emergency SOS', {
          body: 'Emergency recorded locally. Will sync when connection restored.',
          icon: '/pwa-192x192.png',
          tag: 'emergency-sos-offline'
        })
      }
    }
  }
  
  const resolveEmergency = async () => {
    if (!incidentId) return
    
    try {
      const { error } = await supabase.functions.invoke('resolve-incident', {
        body: {
          incidentId,
          resolvedBy: 'User (self-resolved)',
          resolutionNotes: 'Emergency resolved by user through SOS interface'
        }
      })
      
      if (error) {
        console.error('Failed to resolve incident:', error)
      }
      
      // Reset emergency state
      setEmergencyState('idle')
      setIsActivated(false)
      setIncidentId(null)
      
      // Stop vibration
      if ('vibrate' in navigator) {
        navigator.vibrate(0)
      }
      if (vibrationRef.current) {
        clearTimeout(vibrationRef.current)
        vibrationRef.current = null
      }
      
    } catch (error) {
      console.error('Error resolving emergency:', error)
    }
  }
  
  const getCurrentLocation = (): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 30000
        }
      )
    })
  }
  
  const getButtonClass = () => {
    let baseClass = 'relative flex items-center justify-center rounded-full font-bold text-white transition-all duration-200 select-none'
    
    switch (emergencyState) {
      case 'idle':
        return `${baseClass} w-32 h-32 bg-red-500 hover:bg-red-600 active:bg-red-700 ${isHolding ? 'scale-110 ring-4 ring-red-300' : 'hover:scale-105'}`
      case 'countdown':
        return `${baseClass} w-40 h-40 bg-red-600 ring-8 ring-red-300 animate-pulse scale-110`
      case 'triggered':
        return `${baseClass} w-40 h-40 bg-red-700 ring-8 ring-red-400 animate-bounce`
      case 'cancelling':
        return `${baseClass} w-32 h-32 bg-gray-500 scale-95`
      default:
        return baseClass
    }
  }
  
  const getButtonContent = () => {
    switch (emergencyState) {
      case 'idle':
        return (
          <div className="text-center">
            <div className="text-4xl mb-1">🚨</div>
            <div className="text-sm">HOLD FOR SOS</div>
          </div>
        )
      case 'countdown':
        return (
          <div className="text-center">
            <div className="text-5xl font-mono">{countdown}</div>
            <div className="text-xs">RELEASING</div>
          </div>
        )
      case 'triggered':
        return (
          <div className="text-center">
            <div className="text-3xl mb-1">🚨</div>
            <div className="text-xs">EMERGENCY</div>
            <div className="text-xs">ACTIVE</div>
          </div>
        )
      case 'cancelling':
        return (
          <div className="text-center">
            <div className="text-2xl">✓</div>
            <div className="text-xs">CANCELLED</div>
          </div>
        )
    }
  }
  
  return (
    <div className="flex flex-col items-center space-y-6 p-8">
      {/* SOS Button */}
      <div className="relative">
        <button
          className={getButtonClass()}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          disabled={emergencyState === 'triggered'}
        >
          {getButtonContent()}
        </button>
        
        {/* Progress ring for hold duration */}
        {isHolding && emergencyState === 'idle' && (
          <div className="absolute inset-0 rounded-full">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="4"
                className="animate-[dash_3s_linear_forwards]"
                strokeDasharray="283"
                strokeDashoffset="283"
                style={{
                  animation: `dash ${HOLD_DURATION}ms linear forwards`
                }}
              />
            </svg>
          </div>
        )}
      </div>
      
      {/* Status and Controls */}
      <div className="text-center space-y-4">
        {emergencyState === 'idle' && (
          <div className="text-gray-600">
            <p className="text-sm">Hold the button for 3 seconds to activate emergency SOS</p>
            <p className="text-xs text-gray-500 mt-2">
              This will notify emergency contacts and your organization
            </p>
          </div>
        )}
        
        {emergencyState === 'countdown' && (
          <div className="space-y-4">
            <p className="text-red-600 font-semibold">
              Emergency will be triggered in {countdown} seconds
            </p>
            <button
              onClick={cancelEmergency}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel Emergency
            </button>
          </div>
        )}
        
        {emergencyState === 'triggered' && (
          <div className="space-y-4">
            <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-800 font-semibold">🚨 Emergency Active</p>
              <p className="text-red-700 text-sm mt-1">
                Emergency contacts and services have been notified
              </p>
              {incidentId && (
                <p className="text-red-600 text-xs mt-2">
                  Incident ID: {incidentId}
                </p>
              )}
            </div>
            
            <button
              onClick={resolveEmergency}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              I'm Safe - Resolve Emergency
            </button>
          </div>
        )}
        
        {/* Location Status */}
        {(emergencyState === 'countdown' || emergencyState === 'triggered') && (
          <div className="text-xs text-gray-500 mt-4">
            {locationLoading ? (
              <p>📍 Getting location...</p>
            ) : location ? (
              <p>📍 Location acquired (±{accuracy?.toFixed(0)}m)</p>
            ) : (
              <p>📍 Location unavailable</p>
            )}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  )
}