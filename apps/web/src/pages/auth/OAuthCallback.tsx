import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleOAuthCallback } from '../../lib/auth'
import { Shield } from 'lucide-react'

export function OAuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processCallback = async () => {
      try {
        const result = await handleOAuthCallback()
        
        if (result && 'needsOnboarding' in result && result.needsOnboarding) {
          // New user needs to complete onboarding
          navigate('/onboarding')
        } else {
          // Existing user, go to dashboard
          navigate('/dashboard')
        }
      } catch (err) {
        console.error('OAuth callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        // Redirect to sign in page after a delay
        setTimeout(() => {
          navigate('/auth/signin')
        }, 3000)
      }
    }

    processCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        
        {error ? (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to sign in...</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Completing sign in...
            </h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-4"></div>
          </>
        )}
      </div>
    </div>
  )
}
