import { useState } from 'react'
import { User as UserIcon, Mail, Phone, MapPin, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { Database } from '../lib/supabase'

type User = Database['public']['Tables']['users']['Row']

interface StaffFormProps {
  staff?: User
  organizationId: string
  onSubmit: (data: FormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

interface FormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  role: 'super_admin' | 'admin' | 'supervisor' | 'worker'
  employee_id: string
  department: string
  job_title: string
  emergency_contact_name: string
  emergency_contact_phone: string
}

export function StaffForm({ staff, organizationId, onSubmit, onCancel, loading }: StaffFormProps) {
  const [formData, setFormData] = useState<FormData>({
    first_name: staff?.first_name || '',
    last_name: staff?.last_name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    role: staff?.role || 'worker',
    employee_id: staff?.employee_id || '',
    department: staff?.department || '',
    job_title: staff?.job_title || '',
    emergency_contact_name: staff?.emergency_contact_name || '',
    emergency_contact_phone: staff?.emergency_contact_phone || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

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

    // Phone validation (basic format)
    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    // Emergency contact phone validation
    if (formData.emergency_contact_phone && !/^\+?[\d\s\-()]+$/.test(formData.emergency_contact_phone)) {
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
      // Clean up the data before submission
      const submitData = {
        ...formData,
        // Convert empty strings to null for optional fields
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        employee_id: formData.employee_id.trim() || null,
        department: formData.department.trim() || null,
        job_title: formData.job_title.trim() || null,
        emergency_contact_name: formData.emergency_contact_name.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
      }

      await onSubmit(submitData)
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

  const getRoleOptions = () => [
    { value: 'worker', label: 'Staff Member', description: 'Standard staff member with check-in access' },
    { value: 'supervisor', label: 'Supervisor', description: 'Can manage staff and view reports' },
    { value: 'admin', label: 'Admin', description: 'Full administrative access' },
    { value: 'super_admin', label: 'Super Admin', description: 'Complete system access' },
  ]

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {staff ? 'Update staff member information and role permissions.' : 'Create a new staff member account with appropriate role permissions.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Contact Information Error */}
        {errors.contact && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{errors.contact}</p>
          </div>
        )}

        {/* Personal Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
            <UserIcon className="w-4 h-4 mr-2" />
            Personal Information
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary ${
                  errors.first_name ? 'border-red-300' : ''
                }`}
                placeholder="Enter first name"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                type="text"
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary ${
                  errors.last_name ? 'border-red-300' : ''
                }`}
                placeholder="Enter last name"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
            <Mail className="w-4 h-4 mr-2" />
            Contact Information
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary ${
                  errors.email ? 'border-red-300' : ''
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary ${
                  errors.phone ? 'border-red-300' : ''
                }`}
                placeholder="+64 21 123 4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Role and Permissions */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Role and Permissions
          </h4>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              User Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value as 'super_admin' | 'admin' | 'supervisor' | 'worker')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            >
              {getRoleOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              {getRoleOptions().find(opt => opt.value === formData.role)?.description}
            </p>
          </div>
        </div>

        {/* Work Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
            <Briefcase className="w-4 h-4 mr-2" />
            Work Information
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
                Employee ID
              </label>
              <input
                type="text"
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => handleChange('employee_id', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                placeholder="Enter employee ID"
              />
            </div>

            <div>
              <label htmlFor="job_title" className="block text-sm font-medium text-gray-700">
                Job Title
              </label>
              <input
                type="text"
                id="job_title"
                value={formData.job_title}
                onChange={(e) => handleChange('job_title', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                placeholder="Enter job title"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <input
                type="text"
                id="department"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                placeholder="Enter department"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
            <Phone className="w-4 h-4 mr-2" />
            Emergency Contact
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700">
                Emergency Contact Name
              </label>
              <input
                type="text"
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                placeholder="Enter emergency contact name"
              />
            </div>

            <div>
              <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                id="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary ${
                  errors.emergency_contact_phone ? 'border-red-300' : ''
                }`}
                placeholder="+64 21 123 4567"
              />
              {errors.emergency_contact_phone && (
                <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                {staff ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              staff ? 'Update Staff Member' : 'Create Staff Member'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}