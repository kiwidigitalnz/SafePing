import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  domain: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().min(1, 'Please select a timezone'),
})

type OrganizationForm = z.infer<typeof organizationSchema>

export function OrganizationProfile() {
  const { organization, user, loadOrganization } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<OrganizationForm>({
    resolver: zodResolver(organizationSchema),
  })

  // Load organization data into form
  useEffect(() => {
    if (organization) {
      reset({
        name: organization.name,
        domain: organization.domain || '',
        phone: organization.phone || '',
        address: organization.address || '',
        timezone: organization.timezone || 'Pacific/Auckland',
      })
    }
  }, [organization, reset])

  const onSubmit = async (data: OrganizationForm) => {
    if (!organization?.id) return

    setIsLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: data.name,
          domain: data.domain || null,
          phone: data.phone || null,
          address: data.address || null,
          timezone: data.timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Organization profile updated successfully' })
      
      // Reload organization data
      if (user?.organization_id) {
        await loadOrganization(user.organization_id)
      }
    } catch (error) {
      console.error('Error updating organization:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update organization' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const timezones = [
    { value: 'Pacific/Auckland', label: 'Auckland (GMT+12/+13)' },
    { value: 'Pacific/Chatham', label: 'Chatham Islands (GMT+12:45/+13:45)' },
    { value: 'Australia/Sydney', label: 'Sydney (GMT+10/+11)' },
    { value: 'Australia/Melbourne', label: 'Melbourne (GMT+10/+11)' },
    { value: 'Australia/Brisbane', label: 'Brisbane (GMT+10)' },
    { value: 'Australia/Perth', label: 'Perth (GMT+8)' },
    { value: 'UTC', label: 'UTC (GMT+0)' },
  ]

  if (!organization) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Organization Profile</h3>
        <p className="mt-1 text-sm text-gray-600">
          Update your organization's basic information and settings
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-6">
        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Organization Name *
            </label>
            <div className="mt-1">
              <input
                {...register('name')}
                type="text"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Enter organization name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
              Domain
            </label>
            <div className="mt-1">
              <input
                {...register('domain')}
                type="text"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="example.com"
              />
              {errors.domain && (
                <p className="mt-1 text-sm text-red-600">{errors.domain.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="mt-1">
              <input
                {...register('phone')}
                type="tel"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="+64 21 123 4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <div className="mt-1">
              <textarea
                {...register('address')}
                rows={3}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Enter organization address"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
              Timezone *
            </label>
            <div className="mt-1">
              <select
                {...register('timezone')}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              {errors.timezone && (
                <p className="mt-1 text-sm text-red-600">{errors.timezone.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => reset()}
            disabled={!isDirty || isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={!isDirty || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}