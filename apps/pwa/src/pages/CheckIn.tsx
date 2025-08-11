import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import { submitCheckIn } from '../lib/checkins'
import { CheckCircle, AlertTriangle, MapPin, Wifi, WifiOff } from 'lucide-react'

export default function CheckInPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null)
  const [isOnline] = useState(navigator.onLine)
  
  const handleCheckIn = async (status: 'safe' | 'emergency') => {
    if (!user) return
    
    setLoading(true)
    
    try {
      // Get location if available
      let location = null
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000 // 5 minutes
            })
          })
          
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
        } catch (error) {
          console.warn('Could not get location:', error)
        }
      }
      
      await submitCheckIn({
        user_id: user.id,
        organization_id: user.organization_id!,
        status,
        location_lat: location?.lat || null,
        location_lng: location?.lng || null,
        location_accuracy: location?.accuracy || null,
        is_manual: true,
        is_offline: !isOnline,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      })
      
      setLastCheckIn(new Date())
      
      // Show success feedback
      if (status === 'safe') {
        // Could add a toast notification here
        console.log('Safe check-in recorded')
      } else {
        // Emergency - could trigger additional actions
        console.log('Emergency check-in recorded')
      }
      
    } catch (error) {
      console.error('Check-in failed:', error)
      // Handle error - could show error message or queue for later
    } finally {
      setLoading(false)
    }
  }

  const getTimeUntilNext = () => {
    // This would normally come from schedule data
    // For now, showing a placeholder
    return "1h 30m"
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Status Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            {isOnline ? (
              <Wifi className="text-green-500 mr-2" size={20} />
            ) : (
              <WifiOff className="text-red-500 mr-2" size={20} />
            )}
            <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome, {user?.first_name}
          </h2>
          
          {lastCheckIn ? (
            <p className="text-sm text-gray-600">
              Last check-in: {lastCheckIn.toLocaleTimeString()}
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Time until next check-in: {getTimeUntilNext()}
            </p>
          )}
        </div>
      </div>

      {/* Check-in Buttons */}
      <div className="space-y-4">
        <button
          onClick={() => handleCheckIn('safe')}
          disabled={loading}
          className="btn-safe w-full text-2xl font-bold py-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
          ) : (
            <CheckCircle className="mr-3" size={32} />
          )}
          I'm Safe ✓
        </button>
        
        <button
          onClick={() => handleCheckIn('emergency')}
          disabled={loading}
          className="btn-emergency w-full text-2xl font-bold py-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <AlertTriangle className="mr-3" size={32} />
          Send Help!
        </button>
      </div>

      {/* Location Info */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin size={16} className="mr-2" />
          <span>
            Location will be shared with your safety check-ins to help ensure your security.
          </span>
        </div>
      </div>

      {/* Recent Activity */}
      {lastCheckIn && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="text-green-600 mr-2" size={20} />
            <div>
              <p className="text-sm font-medium text-green-800">
                Check-in successful
              </p>
              <p className="text-xs text-green-600">
                Recorded at {lastCheckIn.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}