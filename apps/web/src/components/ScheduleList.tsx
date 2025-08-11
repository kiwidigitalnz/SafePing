import { useState } from 'react'
import { 
  Clock, 
  Users, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff,
  Calendar,
  AlertCircle
} from 'lucide-react'
import type { Database } from '../lib/supabase'

type Schedule = Database['public']['Tables']['schedules']['Row'] & {
  assignmentCount: number
  activeAssignments: number
}

interface ScheduleListProps {
  schedules: Schedule[]
  onEdit: (schedule: Schedule) => void
  onDelete: (schedule: Schedule) => void
  onToggleActive: (schedule: Schedule) => void
  onAssignStaff: (schedule: Schedule) => void
  loading?: boolean
}

export function ScheduleList({ 
  schedules, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onAssignStaff,
  loading 
}: ScheduleListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const formatTime = (time: string | null) => {
    if (!time) return ''
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return time
    }
  }

  const formatInterval = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    if (minutes === 60) return '1h'
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`
  }

  const formatDaysOfWeek = (days: number[] | null) => {
    if (!days || days.length === 0) return 'No days selected'
    if (days.length === 7) return 'Every day'
    
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map(day => dayNames[day - 1]).join(', ')
  }

  const getFrequencyDisplay = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily'
      case 'weekly': return 'Weekly'
      case 'custom': return 'Custom'
      case 'once': return 'One-time'
      default: return frequency
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (schedules.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first check-in schedule.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Check-in Schedules</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    schedule.is_active ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                  <h4 className="text-lg font-medium text-gray-900 truncate">
                    {schedule.name}
                  </h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    schedule.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {schedule.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {schedule.description && (
                  <p className="mt-1 text-sm text-gray-600 truncate">
                    {schedule.description}
                  </p>
                )}
                
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatInterval(schedule.check_in_interval_minutes)} intervals</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{getFrequencyDisplay(schedule.frequency)}</span>
                  </div>
                  
                  {schedule.start_time && schedule.end_time && (
                    <span>
                      {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                    </span>
                  )}
                  
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{schedule.activeAssignments} active assignments</span>
                  </div>
                </div>
                
                {(schedule.frequency === 'weekly' || schedule.frequency === 'custom') && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Days:</span> {formatDaysOfWeek(schedule.days_of_week)}
                  </div>
                )}
                
                {!schedule.is_active && (
                  <div className="mt-2 flex items-center text-sm text-orange-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span>This schedule is inactive and won't trigger check-ins</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onAssignStaff(schedule)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Assign Staff
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === schedule.id ? null : schedule.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {openMenuId === schedule.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            onEdit(schedule)
                            setOpenMenuId(null)
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Schedule
                        </button>
                        
                        <button
                          onClick={() => {
                            onToggleActive(schedule)
                            setOpenMenuId(null)
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {schedule.is_active ? (
                            <>
                              <PowerOff className="w-4 h-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Power className="w-4 h-4 mr-2" />
                              Activate
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            onDelete(schedule)
                            setOpenMenuId(null)
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Schedule
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}