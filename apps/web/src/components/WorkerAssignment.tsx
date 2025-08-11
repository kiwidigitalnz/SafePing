import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Users, X, Check, User as UserIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getScheduleAssignments, assignUserToSchedule, unassignUserFromSchedule } from '../lib/api/schedules'
import type { Database } from '../lib/supabase'

type Schedule = Database['public']['Tables']['schedules']['Row']
type User = Database['public']['Tables']['users']['Row']
// type ScheduleAssignment = Database['public']['Tables']['schedule_assignments']['Row'] & { user: User }

interface WorkerAssignmentProps {
  schedule: Schedule
  organizationId: string
  onClose: () => void
  onAssignmentChange: () => void
}

export function WorkerAssignment({ schedule, organizationId, onClose, onAssignmentChange }: WorkerAssignmentProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch all users in the organization
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('first_name')

      if (error) throw error
      return data as User[]
    }
  })

  // Fetch current assignments for this schedule
  const { data: currentAssignments = [], isLoading: assignmentsLoading, refetch } = useQuery({
    queryKey: ['schedule-assignments', schedule.id],
    queryFn: () => getScheduleAssignments(schedule.id)
  })

  const currentAssignmentUserIds = currentAssignments.map(a => a.user_id)

  // Filter users based on search term
  const filteredUsers = allUsers.filter(user =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleAssignSelected = async () => {
    if (selectedUserIds.length === 0) return

    setLoading(true)
    try {
      // Assign all selected users
      await Promise.all(
        selectedUserIds.map(userId =>
          assignUserToSchedule({
            schedule_id: schedule.id,
            organization_id: organizationId,
            user_id: userId,
            start_date: startDate,
            end_date: endDate || null
          })
        )
      )

      setSelectedUserIds([])
      await refetch()
      onAssignmentChange()
    } catch (error) {
      console.error('Error assigning users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnassign = async (userId: string) => {
    try {
      await unassignUserFromSchedule(schedule.id, userId)
      await refetch()
      onAssignmentChange()
    } catch (error) {
      console.error('Error unassigning user:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Assign Workers to Schedule</h3>
            <p className="text-sm text-gray-600">Schedule: {schedule.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Assignment Settings */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Assignment Period</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                id="start_date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                End Date (Optional)
              </label>
              <input
                type="date"
                id="end_date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Current Assignments */}
        {currentAssignments.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Currently Assigned ({currentAssignments.length})</h4>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="space-y-2">
                {currentAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        {assignment.user.first_name} {assignment.user.last_name}
                      </span>
                      <span className="text-xs text-green-600">
                        {assignment.user.email}
                      </span>
                    </div>
                    <button
                      onClick={() => handleUnassign(assignment.user_id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search workers by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Action Bar */}
        {selectedUserIds.length > 0 && (
          <div className="mb-4 p-3 bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary">
                {selectedUserIds.length} worker(s) selected
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => setSelectedUserIds([])}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
                <button
                  onClick={handleAssignSelected}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark disabled:opacity-50"
                >
                  <Check className="w-4 h-4 mr-1" />
                  {loading ? 'Assigning...' : 'Assign Selected'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User List */}
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          {usersLoading || assignmentsLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading workers...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center">
              <Users className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {searchTerm ? 'No workers found matching your search.' : 'No workers available.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const isCurrentlyAssigned = currentAssignmentUserIds.includes(user.id)
                const isSelected = selectedUserIds.includes(user.id)
                
                return (
                  <div
                    key={user.id}
                    className={`p-4 hover:bg-gray-50 ${
                      isCurrentlyAssigned ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleUserToggle(user.id)}
                          disabled={isCurrentlyAssigned}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </h4>
                            {isCurrentlyAssigned && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Assigned
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email} • {user.job_title || 'Worker'}
                            {user.employee_id && ` • ID: ${user.employee_id}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}