import { useState, useEffect } from 'react'
import { MapPin, Phone, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useGeolocation } from '../hooks/useGeolocation'

export default function EmergencyPage() {
  const [isEmergency, setIsEmergency] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [emergencyId, setEmergencyId] = useState<string | null>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const { location, error: locationError, requestLocation } = useGeolocation()

  useEffect(() => {
    loadEmergencyContacts()
  }, [])

  useEffect(() => {
    if (isEmergency && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (isEmergency && countdown === 0) {
      triggerEmergency()
    }
  }, [isEmergency, countdown])

  const loadEmergencyContacts = async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) return

    const { data } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user.user.id)
      .order('priority')

    if (data) setContacts(data)
  }

  const triggerEmergency = async () => {
    try {
      // Get current location
      await requestLocation()
      
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user) return

      // Create emergency incident
      const { data: incident, error } = await supabase
        .from('incidents')
        .insert({
          user_id: user.user.id,
          type: 'emergency_sos',
          status: 'active',
          location: location ? {
            lat: location.latitude,
            lng: location.longitude,
            accuracy: (location as any).accuracy || 10
          } : null,
          triggered_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      setEmergencyId(incident.id)

      // Trigger escalation to contacts
      await supabase.functions.invoke('trigger-escalation', {
        body: { incident_id: incident.id }
      })

    } catch (error) {
      console.error('Failed to trigger emergency:', error)
    }
  }

  const cancelEmergency = () => {
    setIsEmergency(false)
    setCountdown(10)
    if (emergencyId) {
      // Cancel the emergency
      supabase
        .from('incidents')
        .update({ status: 'cancelled' })
        .eq('id', emergencyId)
    }
  }

  const confirmSafe = async () => {
    if (emergencyId) {
      await supabase
        .from('incidents')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', emergencyId)
      
      setEmergencyId(null)
      setIsEmergency(false)
      setCountdown(10)
    }
  }

  if (emergencyId) {
    return (
      <div className="min-h-screen bg-red-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Emergency Alert Sent
            </h1>
            
            <p className="text-gray-600 mb-6">
              Your emergency contacts have been notified
            </p>

            <div className="space-y-3 mb-6">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.phone}</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>

            {location && (
              <div className="p-3 bg-blue-50 rounded-lg mb-6">
                <div className="flex items-center justify-center space-x-2 text-blue-700">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm">Location shared with contacts</span>
                </div>
              </div>
            )}

            <button
              onClick={confirmSafe}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              I'm Safe Now
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isEmergency) {
    return (
      <div className="min-h-screen bg-red-600 p-4">
        <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-screen">
          <div className="text-center text-white">
            <div className="w-32 h-32 border-8 border-white rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-6xl font-bold">{countdown}</span>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">
              Emergency Alert
            </h1>
            
            <p className="text-xl mb-8 opacity-90">
              Alerting emergency contacts in {countdown} seconds
            </p>

            <button
              onClick={cancelEmergency}
              className="w-full max-w-xs py-4 bg-white text-red-600 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              Cancel Emergency
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Emergency SOS
            </h1>
            <p className="text-gray-600">
              Press and hold the button below to send an emergency alert
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Emergency Contacts
            </h2>
            {contacts.length > 0 ? (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No emergency contacts configured
              </p>
            )}
          </div>

          <button
            onMouseDown={() => setIsEmergency(true)}
            onMouseUp={() => {
              if (countdown > 7) {
                setIsEmergency(false)
                setCountdown(10)
              }
            }}
            onTouchStart={() => setIsEmergency(true)}
            onTouchEnd={() => {
              if (countdown > 7) {
                setIsEmergency(false)
                setCountdown(10)
              }
            }}
            className="w-full py-6 bg-red-600 text-white rounded-2xl font-bold text-lg hover:bg-red-700 active:bg-red-800 transition-all transform active:scale-95"
          >
            Hold for Emergency
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Hold button for 3 seconds to trigger emergency alert
          </p>
        </div>
      </div>
    </div>
  )
}
