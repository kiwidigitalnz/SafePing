import { useState } from 'react'
import { useCheckInStore } from '../store/checkins'
import { useAuthStore } from '../store/auth'
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react'

export function TestCheckInButton() {
  const { user } = useAuthStore()
  const { createCheckIn } = useCheckInStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTestCheckIn = async (status: 'safe' | 'overdue' | 'emergency') => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const testMessages = {
        safe: 'Test check-in - All good!',
        overdue: 'Test overdue check-in',
        emergency: 'TEST EMERGENCY - This is a drill!'
      }

      await createCheckIn({
        user_id: user.id,
        status,
        message: testMessages[status],
        location_lat: -36.8485,
        location_lng: 174.7633,
        location_address: 'Queen Street, Auckland CBD (Test Location)',
        is_manual: true,
        is_offline: false,
        metadata: {
          test: true,
          device: 'admin-dashboard'
        }
      })

      console.log(`Test ${status} check-in created successfully`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test check-in')
      console.error('Test check-in error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="relative group">
      <button
        className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        onClick={() => setError(null)}
      >
        <AlertTriangle className="w-3 h-3 mr-1" />
        Dev Tools
      </button>
      
      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 hidden group-hover:block z-50">
        <p className="text-xs text-gray-600 mb-2">Test Check-in System</p>
        
        {error && (
          <div className="mb-2 text-xs text-red-600">
            Error: {error}
          </div>
        )}
        
        <div className="space-y-1">
          <button
            onClick={() => handleTestCheckIn('safe')}
            disabled={loading}
            className="w-full inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Test Safe Check-in
          </button>
          
          <button
            onClick={() => handleTestCheckIn('overdue')}
            disabled={loading}
            className="w-full inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
          >
            <Clock className="w-3 h-3 mr-1" />
            Test Overdue
          </button>
          
          <button
            onClick={() => handleTestCheckIn('emergency')}
            disabled={loading}
            className="w-full inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Test Emergency
          </button>
        </div>
        
        {loading && (
          <div className="mt-2 text-xs text-gray-600">
            Creating test check-in...
          </div>
        )}
      </div>
    </div>
  )
}
