import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, UserPlus, Phone, Mail, Shield, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/auth'

export default function InviteWorkerPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    role: 'staff' as 'staff' | 'admin',
    sendSMS: true
  })

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData({ ...formData, phoneNumber: formatted })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Clean phone number for storage
      const cleanPhone = formData.phoneNumber.replace(/\D/g, '')
      
      if (cleanPhone.length !== 10) {
        throw new Error('Please enter a valid 10-digit phone number')
      }

      // Format phone for international
      const formattedPhone = `+1${cleanPhone}`

      // Create the worker user first
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formattedPhone,
          email: formData.email || null,
          role: formData.role,
          organization_id: user?.organization_id,
          is_active: false, // Will be activated after they complete onboarding
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) throw createError

      // Create invitation record
      const invitationToken = crypto.randomUUID()
      
      const { error: inviteError } = await supabase
        .from('worker_invitations')
        .insert({
          user_id: newUser.id,
          organization_id: user?.organization_id,
          invited_by: user?.id,
          invitation_token: invitationToken,
          phone_number: formattedPhone,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })

      if (inviteError) throw inviteError

      // Send SMS invitation if requested
      if (formData.sendSMS) {
        const { error: smsError } = await supabase.functions.invoke('send-worker-invitation', {
          body: {
            phoneNumber: formattedPhone,
            invitationToken,
            workerName: `${formData.firstName} ${formData.lastName}`,
            organizationName: 'SafePing' // You can fetch org name separately if needed
          }
        })

        if (smsError) {
          console.error('SMS send error:', smsError)
          // Don't throw - invitation was created, just SMS failed
          setError('Worker invited but SMS failed to send. They can still be added manually.')
        }
      }

      setSuccess(true)
      
      // Reset form after 2 seconds and navigate back
      setTimeout(() => {
        navigate('/workers')
      }, 2000)

    } catch (err: any) {
      console.error('Error inviting worker:', err)
      setError(err.message || 'Failed to invite worker')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Invitation Sent!
          </h2>
          <p className="text-gray-600 mb-4">
            {formData.firstName} {formData.lastName} has been invited to join SafePing
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to workers list...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/workers')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Workers
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#1A9B9C] rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invite Worker</h1>
              <p className="text-gray-600">Send an invitation to join your organization</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A9B9C] focus:border-transparent"
                placeholder="John"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A9B9C] focus:border-transparent"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number (Required)
            </label>
            <input
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A9B9C] focus:border-transparent"
              placeholder="(555) 123-4567"
            />
            <p className="text-xs text-gray-500 mt-1">
              Worker will receive SMS invitation at this number
            </p>
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A9B9C] focus:border-transparent"
              placeholder="john.doe@example.com"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield className="w-4 h-4 inline mr-1" />
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'staff' | 'admin' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A9B9C] focus:border-transparent"
            >
              <option value="staff">Staff (Worker)</option>
              <option value="admin">Admin (Supervisor)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Admins can manage workers and view reports
            </p>
          </div>

          {/* Send SMS Option */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="sendSMS"
              checked={formData.sendSMS}
              onChange={(e) => setFormData({ ...formData, sendSMS: e.target.checked })}
              className="w-5 h-5 text-[#1A9B9C] rounded focus:ring-[#1A9B9C]"
            />
            <label htmlFor="sendSMS" className="flex-1">
              <span className="font-medium text-gray-900">Send SMS invitation immediately</span>
              <p className="text-sm text-gray-600">
                Worker will receive a text message with download link and setup instructions
              </p>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1A9B9C] text-white rounded-lg font-semibold hover:bg-[#158a8b] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Sending Invitation...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Invitation
              </>
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Worker receives SMS with invitation link</li>
            <li>They install the SafePing PWA on their phone</li>
            <li>Complete verification with the code sent to their phone</li>
            <li>Set up their PIN and biometric authentication</li>
            <li>Start using SafePing for check-ins</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
