import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import type { Database } from '../lib/supabase'

type Schedule = Database['public']['Tables']['schedules']['Row']
type ScheduleInsert = Database['public']['Tables']['schedules']['Insert']

const scheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  description: z.string().optional(),
  frequency: z.enum(['once', 'daily', 'weekly', 'custom']),
  check_in_interval_minutes: z.number().min(15, 'Minimum 15 minutes').max(1440, 'Maximum 24 hours'),
  grace_period_minutes: z.number().min(5, 'Minimum 5 minutes').max(60, 'Maximum 60 minutes'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  days_of_week: z.array(z.number().min(1).max(7)).optional(),
  is_active: z.boolean().default(true)
})

type ScheduleFormData = z.infer<typeof scheduleSchema>

interface ScheduleFormProps {
  schedule?: Schedule
  organizationId: string
  onSubmit: (data: ScheduleInsert) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' }
]

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', description: 'Check-ins required every day during work hours' },
  { value: 'weekly', label: 'Weekly', description: 'Check-ins required on specific days of the week' },
  { value: 'custom', label: 'Custom', description: 'Custom schedule with specific time ranges' }
]

export function ScheduleForm({ schedule, organizationId, onSubmit, onCancel, loading }: ScheduleFormProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>(
    schedule?.days_of_week || [1, 2, 3, 4, 5] // Default to weekdays
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      name: schedule?.name || '',
      description: schedule?.description || '',
      frequency: schedule?.frequency || 'daily',
      check_in_interval_minutes: schedule?.check_in_interval_minutes || 60,
      grace_period_minutes: schedule?.grace_period_minutes || 15,
      start_time: schedule?.start_time || '09:00',
      end_time: schedule?.end_time || '17:00',
      days_of_week: schedule?.days_of_week || [1, 2, 3, 4, 5],
      is_active: schedule?.is_active ?? true
    }
  })

  const frequency = watch('frequency')

  const handleDayToggle = (day: number) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort()
    
    setSelectedDays(newDays)
    setValue('days_of_week', newDays)
  }

  const onFormSubmit = async (data: ScheduleFormData) => {
    const scheduleData: ScheduleInsert = {
      ...data,
      organization_id: organizationId,
      days_of_week: selectedDays
    }

    await onSubmit(scheduleData)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Schedule Name
              </label>
              <input
                {...register('name')}
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                placeholder="e.g., Day Shift, Security Rounds"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                placeholder="Describe when and how this schedule should be used..."
              />
            </div>
          </div>
        </div>

        {/* Schedule Frequency */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Frequency</h3>
          
          <div className="space-y-4">
            {FREQUENCY_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  {...register('frequency')}
                  id={option.value}
                  type="radio"
                  value={option.value}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <label htmlFor={option.value} className="ml-3 block">
                  <span className="text-sm font-medium text-gray-700">{option.label}</span>
                  <span className="text-sm text-gray-500 block">{option.description}</span>
                </label>
              </div>
            ))}
          </div>

          {(frequency === 'weekly' || frequency === 'custom') && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Active Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`px-3 py-2 text-sm rounded-md border ${
                      selectedDays.includes(day.value)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {day.label.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Check-in Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Check-in Settings</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="check_in_interval_minutes" className="block text-sm font-medium text-gray-700">
                Check-in Interval (minutes)
              </label>
              <select
                {...register('check_in_interval_minutes', { valueAsNumber: true })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={240}>4 hours</option>
                <option value={480}>8 hours</option>
              </select>
              {errors.check_in_interval_minutes && (
                <p className="mt-1 text-sm text-red-600">{errors.check_in_interval_minutes.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="grace_period_minutes" className="block text-sm font-medium text-gray-700">
                Grace Period (minutes)
              </label>
              <select
                {...register('grace_period_minutes', { valueAsNumber: true })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
              {errors.grace_period_minutes && (
                <p className="mt-1 text-sm text-red-600">{errors.grace_period_minutes.message}</p>
              )}
            </div>

            {frequency !== 'once' && (
              <>
                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <input
                    {...register('start_time')}
                    type="time"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <input
                    {...register('end_time')}
                    type="time"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Schedule Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Status</h3>
          
          <div className="flex items-center">
            <input
              {...register('is_active')}
              id="is_active"
              type="checkbox"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Schedule is active
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Inactive schedules will not trigger check-in requirements or alerts
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
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
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {loading ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
          </button>
        </div>
      </form>
    </div>
  )
}