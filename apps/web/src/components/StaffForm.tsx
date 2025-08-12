import { useState } from 'react'
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Shield, 
  Briefcase,
  Building,
  Users,
  AlertCircle,
  Save,
  X,
  ChevronDown,
  Search,
  Check
} from 'lucide-react'
import type { Database } from '../lib/supabase'

type User = Database['public']['Tables']['users']['Row']

interface StaffFormProps {
  staff?: any // Accept any type for staff to handle role conversion
  organizationId: string
  currentUserRole?: string
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

interface FormData {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  role: 'org_admin' | 'admin' | 'staff'
  employee_id: string | null
  department: string | null
  job_title: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
}

// Country codes data for NZ/AU region
const countryCodesData = [
  { country: 'New Zealand', code: '+64', flag: '🇳🇿' },
  { country: 'Australia', code: '+61', flag: '🇦🇺' },
  { country: 'United States', code: '+1', flag: '🇺🇸' },
  { country: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { country: 'Canada', code: '+1', flag: '🇨🇦' },
  { country: 'India', code: '+91', flag: '🇮🇳' },
  { country: 'China', code: '+86', flag: '🇨🇳' },
  { country: 'Japan', code: '+81', flag: '🇯🇵' },
  { country: 'South Korea', code: '+82', flag: '🇰🇷' },
  { country: 'Germany', code: '+49', flag: '🇩🇪' },
  { country: 'France', code: '+33', flag: '🇫🇷' },
  { country: 'Italy', code: '+39', flag: '🇮🇹' },
  { country: 'Spain', code: '+34', flag: '🇪🇸' },
  { country: 'Mexico', code: '+52', flag: '🇲🇽' },
  { country: 'Brazil', code: '+55', flag: '🇧🇷' },
  { country: 'Argentina', code: '+54', flag: '🇦🇷' },
  { country: 'South Africa', code: '+27', flag: '🇿🇦' },
  { country: 'Philippines', code: '+63', flag: '🇵🇭' },
  { country: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { country: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { country: 'Singapore', code: '+65', flag: '🇸🇬' },
  { country: 'Thailand', code: '+66', flag: '🇹🇭' },
  { country: 'Vietnam', code: '+84', flag: '🇻🇳' }
]

export function StaffForm({ staff, organizationId, currentUserRole, onSubmit, onCancel, loading }: StaffFormProps) {
  // Check if current user is org_admin
  const isOrgAdmin = currentUserRole === 'org_admin'
  
  // Define formatPhoneNumber first to avoid hoisting issues
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format based on length (NZ/AU format)
    if (digits.length <= 2) {
      return digits
    } else if (digits.length <= 5) {
      return `${digits.slice(0, 2)} ${digits.slice(2)}`
    } else if (digits.length <= 8) {
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
    } else {
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`
    }
  }

  // Extract country code from phone if editing
  const getInitialCountry = () => {
    if (staff?.phone) {
      const country = countryCodesData.find(c => staff.phone?.startsWith(c.code))
      return country || countryCodesData[0]
    }
    return countryCodesData[0] // Default to NZ
  }

  const getPhoneWithoutCountryCode = () => {
    if (staff?.phone) {
      const country = countryCodesData.find(c => staff.phone?.startsWith(c.code))
      if (country) {
        return formatPhoneNumber(staff.phone.substring(country.code.length))
      }
    }
    return ''
  }

  const [selectedCountry, setSelectedCountry] = useState(getInitialCountry())
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  const [formData, setFormData] = useState<FormData>({
    first_name: staff?.first_name || '',
    last_name: staff?.last_name || '',
    email: staff?.email || '',
    phone: getPhoneWithoutCountryCode(),
    role: staff?.role || 'staff',
    employee_id: staff?.employee_id || '',
    department: staff?.department || '',
    job_title: staff?.job_title || '',
    emergency_contact_name: staff?.emergency_contact_name || '',
    emergency_contact_phone: staff?.emergency_contact_phone || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'phone' | 'emergency_contact_phone') => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData({ ...formData, [field]: formatted })
  }

  const filteredCountries = countryCodesData.filter(country => 
    country.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.includes(countrySearch)
  )

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Phone validation
    const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : ''
    if (formData.phone && cleanPhone.length < 8) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    // Emergency contact phone validation
    const cleanEmergencyPhone = formData.emergency_contact_phone ? formData.emergency_contact_phone.replace(/\D/g, '') : ''
    if (formData.emergency_contact_phone && cleanEmergencyPhone.length < 8) {
      newErrors.emergency_contact_phone = 'Please enter a valid emergency contact phone number'
    }

    // Require either email or phone
    if (!formData.email && !formData.phone) {
      newErrors.contact = 'Either email or phone number is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      // Format phone numbers with country codes
      const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : ''
      const cleanEmergencyPhone = formData.emergency_contact_phone ? formData.emergency_contact_phone.replace(/\D/g, '') : ''
      
      const submitData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email?.trim() || null,
        phone: cleanPhone ? `${selectedCountry.code}${cleanPhone}` : null,
        role: formData.role,
        employee_id: formData.employee_id?.trim() || null,
        department: formData.department?.trim() || null,
        job_title: formData.job_title?.trim() || null,
        emergency_contact_name: formData.emergency_contact_name?.trim() || null,
        emergency_contact_phone: cleanEmergencyPhone ? `${selectedCountry.code}${cleanEmergencyPhone}` : null,
      }

      await onSubmit(submitData as any)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const getRoleOptions = () => {
    const options = [
      { 
        value: 'staff', 
        label: 'Staff Member', 
        description: 'Can check in, view schedules, and receive safety alerts',
        color: 'gray'
      },
      { 
        value: 'admin', 
        label: 'Administrator', 
        description: 'Can manage staff, view reports, and configure settings',
        color: 'blue'
      }
    ]
    
    // Only org_admin users can create/promote other org_admins
    if (isOrgAdmin) {
      options.push({ 
        value: 'org_admin', 
        label: 'Organization Admin', 
        description: 'Full access within the organization including billing and settings',
        color: 'purple'
      })
    }
    
    return options
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[#15a2a6] to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
            <UserIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>
            <p className="text-gray-600 mt-1">
              {staff ? 'Update staff member information and role permissions' : 'Create a new staff member account'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Contact Information Error */}
        {errors.contact && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start space-x-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errors.contact}</span>
          </div>
        )}

        {/* Personal Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <UserIcon className="w-5 h-5 mr-2 text-[#15a2a6]" />
            Personal Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all ${
                  errors.first_name ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="John"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all ${
                  errors.last_name ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Doe"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
              )}
            </div>
          </div>

          {/* Phone Number with Country Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowCountryPicker(true)}
                className="flex items-center space-x-2 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl">{selectedCountry.flag}</span>
                <span className="font-medium">{selectedCountry.code}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handlePhoneChange(e, 'phone')}
                className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all ${
                  errors.phone ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="21 234 5678"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all ${
                errors.email ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="john.doe@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Role and Permissions */}
        <div className="space-y-6 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-[#15a2a6]" />
            Role and Permissions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getRoleOptions().map((option) => (
              <label 
                key={option.value}
                className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.role === option.value 
                    ? 'border-[#15a2a6] bg-teal-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={formData.role === option.value}
                  onChange={(e) => handleChange('role', e.target.value as any)}
                  className="sr-only"
                />
                <div className="flex items-start space-x-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.role === option.value 
                      ? 'border-[#15a2a6] bg-[#15a2a6]' 
                      : 'border-gray-300'
                  }`}>
                    {formData.role === option.value && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Work Information */}
        <div className="space-y-6 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-[#15a2a6]" />
            Work Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Employee ID (Optional)
              </label>
              <input
                type="text"
                value={formData.employee_id || ''}
                onChange={(e) => handleChange('employee_id', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all"
                placeholder="EMP-001"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-1" />
                Job Title (Optional)
              </label>
              <input
                type="text"
                value={formData.job_title || ''}
                onChange={(e) => handleChange('job_title', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all"
                placeholder="e.g., Site Supervisor"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Building className="w-4 h-4 inline mr-1" />
                Department (Optional)
              </label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => handleChange('department', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all"
                placeholder="e.g., Field Operations"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="space-y-6 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-[#15a2a6]" />
            Emergency Contact (Optional)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                value={formData.emergency_contact_name || ''}
                onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.emergency_contact_phone || ''}
                onChange={(e) => handlePhoneChange(e, 'emergency_contact_phone')}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#15a2a6] focus:border-transparent transition-all ${
                  errors.emergency_contact_phone ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="21 234 5678"
              />
              {errors.emergency_contact_phone && (
                <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all flex items-center"
          >
            <X className="w-5 h-5 mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-[#15a2a6] to-teal-500 text-white rounded-xl font-semibold hover:from-[#128a8e] hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transform transition-all hover:scale-[1.02] shadow-lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {staff ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {staff ? 'Update Staff Member' : 'Create Staff Member'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Country Picker Modal */}
      {showCountryPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowCountryPicker(false)
              setCountrySearch('')
            }}
          />
          <div className="relative w-full max-h-[70vh] bg-white rounded-t-3xl shadow-2xl animate-slide-up">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Select Country</h3>
                <button
                  onClick={() => {
                    setShowCountryPicker(false)
                    setCountrySearch('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-[#15a2a6] focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Country List */}
            <div className="overflow-y-auto max-h-[50vh]">
              {filteredCountries.map((country) => (
                <button
                  key={country.code + country.country}
                  onClick={() => {
                    setSelectedCountry(country)
                    setShowCountryPicker(false)
                    setCountrySearch('')
                  }}
                  className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                    selectedCountry.code === country.code && selectedCountry.country === country.country ? 'bg-teal-50' : ''
                  }`}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <span className="flex-1 text-left text-gray-900">{country.country}</span>
                  <span className="text-gray-500">{country.code}</span>
                  {selectedCountry.code === country.code && selectedCountry.country === country.country && (
                    <Check className="text-[#15a2a6]" size={20} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
