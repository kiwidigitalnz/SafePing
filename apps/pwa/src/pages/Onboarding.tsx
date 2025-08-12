import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  User, 
  Phone, 
  Camera, 
  Shield, 
  Smartphone,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  AlertCircle,
  Fingerprint,
  Key,
  MessageSquare,
  Download,
  Bell,
  Loader2,
  X
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type OnboardingStep = 'profile' | 'emergency' | 'photo' | 'pwa' | 'auth' | 'complete'

interface ProfileData {
  firstName: string
  lastName: string
  email?: string
  department?: string
  jobTitle?: string
}

interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

interface AuthMethod {
  type: 'pin' | 'biometric' | 'otp'
  pin?: string
  biometricEnabled?: boolean
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Get user data from navigation state
  const { user, session, invitationId } = location.state || {}
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: '',
    department: '',
    jobTitle: ''
  })
  
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    name: '',
    phone: '',
    relationship: ''
  })
  
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [authMethod, setAuthMethod] = useState<AuthMethod>({ type: 'pin' })
  const [pin, setPin] = useState(['', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', ''])
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  
  // Check if user is authenticated
  useEffect(() => {
    if (!user || !session) {
      navigate('/staff-invite')
    }
    
    // Check biometric availability
    checkBiometricAvailability()
  }, [user, session, navigate])
  
  const checkBiometricAvailability = async () => {
    if ('credentials' in navigator) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        setBiometricAvailable(available)
      } catch {
        setBiometricAvailable(false)
      }
    }
  }
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be less than 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handlePinChange = (index: number, value: string, isConfirm: boolean = false) => {
    if (value.length > 1) return
    if (!/^\d*$/.test(value)) return
    
    const pins = isConfirm ? [...confirmPin] : [...pin]
    pins[index] = value
    
    if (isConfirm) {
      setConfirmPin(pins)
    } else {
      setPin(pins)
    }
    
    // Auto-focus next input
    if (value && index < 3) {
      const inputs = document.querySelectorAll(isConfirm ? '.confirm-pin-input' : '.pin-input')
      const nextInput = inputs[index + 1] as HTMLInputElement
      if (nextInput) nextInput.focus()
    }
  }
  
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'profile':
        if (!profileData.firstName || !profileData.lastName) {
          setError('Please enter your first and last name')
          return false
        }
        break
      case 'emergency':
        if (!emergencyContact.name || !emergencyContact.phone) {
          setError('Please provide emergency contact details')
          return false
        }
        break
      case 'auth':
        if (authMethod.type === 'pin') {
          const pinString = pin.join('')
          const confirmPinString = confirmPin.join('')
          if (pinString.length !== 4) {
            setError('Please enter a 4-digit PIN')
            return false
          }
          if (pinString !== confirmPinString) {
            setError('PINs do not match')
            return false
          }
        }
        break
    }
    setError(null)
    return true
  }
  
  const handleNext = async () => {
    if (!validateCurrentStep()) return
    
    const steps: OnboardingStep[] = ['profile', 'emergency', 'photo', 'pwa', 'auth', 'complete']
    const currentIndex = steps.indexOf(currentStep)
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }
  
  const handleBack = () => {
    const steps: OnboardingStep[] = ['profile', 'emergency', 'photo', 'pwa', 'auth', 'complete']
    const currentIndex = steps.indexOf(currentStep)
    
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }
  
  const handleComplete = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          email: profileData.email || null,
          department: profileData.department || null,
          job_title: profileData.jobTitle || null,
          emergency_contact_name: emergencyContact.name,
          emergency_contact_phone: emergencyContact.phone,
          emergency_contact_relationship: emergencyContact.relationship,
          profile_image_url: profilePhoto,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (updateError) throw updateError
      
      // Set up authentication method
      if (authMethod.type === 'pin') {
        const pinString = pin.join('')
        // In production, hash the PIN before storing
        const { error: pinError } = await supabase
          .from('users')
          .update({
            pin_hash: pinString, // Should be hashed in production
            auth_method: 'pin'
          })
          .eq('id', user.id)
        
        if (pinError) throw pinError
      } else if (authMethod.type === 'biometric') {
        // Store biometric preference
        const { error: bioError } = await supabase
          .from('users')
          .update({
            biometric_enabled: true,
            auth_method: 'biometric'
          })
          .eq('id', user.id)
        
        if (bioError) throw bioError
      }
      
      // Mark invitation as completed if we have one
      if (invitationId) {
        await supabase.rpc('complete_staff_setup', {
          p_invitation_id: invitationId,
          p_pin_hash: authMethod.type === 'pin' ? pin.join('') : null,
          p_biometric_enabled: authMethod.type === 'biometric'
        })
      }
      
      // Store updated user data
      const updatedUser = {
        ...user,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        onboardingCompleted: true
      }
      localStorage.setItem('safeping_user', JSON.stringify(updatedUser))
      
      // Show complete step briefly then redirect
      setCurrentStep('complete')
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
      
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding')
    } finally {
      setLoading(false)
    }
  }
  
  const installPWA = () => {
    // This would trigger the PWA install prompt
    // Implementation depends on browser support
    if ('BeforeInstallPromptEvent' in window) {
      // Trigger install
      console.log('Triggering PWA install')
    }
  }
  
  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        new Notification('SafePing', {
          body: 'Notifications enabled successfully!',
          icon: '/icon-192.png'
        })
      }
    }
  }
  
  const getStepNumber = () => {
    const steps: OnboardingStep[] = ['profile', 'emergency', 'photo', 'pwa', 'auth']
    return steps.indexOf(currentStep) + 1
  }
  
  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-scale">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Welcome to SafePing!
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Your account is all set up
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold text-gray-900">Complete Your Profile</h1>
            <span className="text-sm text-gray-500">Step {getStepNumber()} of 5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#15a2a6] to-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(getStepNumber() / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Profile Information Step */}
        {currentStep === 'profile' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#15a2a6] to-teal-500 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                <p className="text-gray-600">Let's get to know you better</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#15a2a6] focus:outline-none"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#15a2a6] focus:outline-none"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#15a2a6] focus:outline-none"
                  placeholder="john.doe@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department (Optional)
                </label>
                <input
                  type="text"
                  value={profileData.department}
                  onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#15a2a6] focus:outline-none"
                  placeholder="Field Operations"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Title (Optional)
                </label>
                <input
                  type="text"
                  value={profileData.jobTitle}
                  onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#15a2a6] focus:outline-none"
                  placeholder="Field Technician"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Emergency Contact Step */}
        {currentStep === 'emergency' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">Emergency Contact</h2>
                <p className="text-gray-600">Who should we contact in case of emergency?</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={emergencyContact.name}
                  onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#15a2a6] focus:outline-none"
                  placeholder="Jane Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={emergencyContact.phone}
                  onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#15a2a6] focus:outline-none"
                  placeholder="+64 21 234 5678"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Relationship
                </label>
                <select
                  value={emergencyContact.relationship}
                  onChange={(e) => setEmergencyContact({ ...emergencyContact, relationship: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#15a2a6] focus:outline-none bg-white"
                >
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Profile Photo Step */}
        {currentStep === 'photo' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">Profile Photo</h2>
                <p className="text-gray-600">Add a photo to personalize your profile (optional)</p>
              </div>
            </div>
            
            <div className="text-center">
              {profilePhoto ? (
                <div className="relative inline-block">
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#15a2a6]"
                  />
                  <button
                    onClick={() => setProfilePhoto(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-[#15a2a6] to-teal-500 text-white rounded-xl font-semibold hover:from-[#128a8e] hover:to-teal-600 transition-all inline-flex items-center"
              >
                <Upload className="w-5 h-5 mr-2" />
                {profilePhoto ? 'Change Photo' : 'Upload Photo'}
              </button>
              
              <p className="text-sm text-gray-500 mt-4">
                Maximum file size: 5MB
              </p>
            </div>
          </div>
        )}
        
        {/* PWA Installation Step */}
        {currentStep === 'pwa' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">Install SafePing App</h2>
                <p className="text-gray-600">Get the best experience with our app</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Benefits of installing:</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Quick access from your home screen</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Works offline for basic features</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Instant notifications for safety alerts</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Faster loading and better performance</span>
                  </li>
                </ul>
              </div>
              
              <button
                onClick={installPWA}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center"
              >
                <Download className="w-5 h-5 mr-2" />
                Install SafePing
              </button>
              
              <button
                onClick={requestNotifications}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center"
              >
                <Bell className="w-5 h-5 mr-2" />
                Enable Notifications
              </button>
              
              <p className="text-center text-sm text-gray-500">
                You can also do this later from settings
              </p>
            </div>
          </div>
        )}
        
        {/* Authentication Method Step */}
        {currentStep === 'auth' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#15a2a6] to-teal-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">Secure Your Account</h2>
                <p className="text-gray-600">Choose how you'll sign in next time</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* PIN Option */}
              <label className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                authMethod.type === 'pin' ? 'border-[#15a2a6] bg-teal-50' : 'border-gray-200'
              }`}>
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="auth"
                    value="pin"
                    checked={authMethod.type === 'pin'}
                    onChange={() => setAuthMethod({ type: 'pin' })}
                    className="mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <Key className="w-5 h-5 mr-2 text-[#15a2a6]" />
                      <span className="font-semibold">4-Digit PIN</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Quick and secure access with a PIN
                    </p>
                  </div>
                </div>
              </label>
              
              {/* Biometric Option */}
              {biometricAvailable && (
                <label className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  authMethod.type === 'biometric' ? 'border-[#15a2a6] bg-teal-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="auth"
                      value="biometric"
                      checked={authMethod.type === 'biometric'}
                      onChange={() => setAuthMethod({ type: 'biometric' })}
                      className="mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <Fingerprint className="w-5 h-5 mr-2 text-[#15a2a6]" />
                        <span className="font-semibold">Biometric</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Use fingerprint or face recognition
                      </p>
                    </div>
                  </div>
                </label>
              )}
              
              {/* OTP Option */}
              <label className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                authMethod.type === 'otp' ? 'border-[#15a2a6] bg-teal-50' : 'border-gray-200'
              }`}>
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="auth"
                    value="otp"
                    checked={authMethod.type === 'otp'}
                    onChange={() => setAuthMethod({ type: 'otp' })}
                    className="mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2 text-[#15a2a6]" />
                      <span className="font-semibold">SMS Code</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Receive a code via SMS to sign in
                    </p>
                  </div>
                </div>
              </label>
            </div>
            
            {/* PIN Setup */}
            {authMethod.type === 'pin' && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Create PIN
                  </label>
                  <div className="flex justify-center space-x-3">
                    {pin.map((digit, index) => (
                      <input
                        key={index}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinChange(index, e.target.value)}
                        className="pin-input w-14 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#15a2a6] focus:outline-none"
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm PIN
                  </label>
                  <div className="flex justify-center space-x-3">
                    {confirmPin.map((digit, index) => (
                      <input
                        key={index}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinChange(index, e.target.value, true)}
                        className="confirm-pin-input w-14 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#15a2a6] focus:outline-none"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {currentStep !== 'profile' && (
            <button
              onClick={handleBack}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 font-semibold transition-colors flex items-center"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          )}
          
          <div className="ml-auto">
            {currentStep === 'auth' ? (
              <button
                onClick={handleComplete}
                disabled={loading || !validateCurrentStep()}
                className="px-8 py-3 bg-gradient-to-r from-[#15a2a6] to-teal-500 text-white rounded-xl font-semibold hover:from-[#128a8e] hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            ) : currentStep === 'photo' || currentStep === 'pwa' ? (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl font-semibold hover:from-gray-500 hover:to-gray-600 transition-all flex items-center"
              >
                Skip
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!validateCurrentStep()}
                className="px-8 py-3 bg-gradient-to-r from-[#15a2a6] to-teal-500 text-white rounded-xl font-semibold hover:from-[#128a8e] hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
