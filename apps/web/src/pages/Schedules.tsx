import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Calendar } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { ScheduleList } from '../components/ScheduleList'
import { ScheduleForm } from '../components/ScheduleForm'
import { StaffAssignment } from '../components/StaffAssignment'
import { 
  getSchedulesByOrganization,
  createSchedule,
  updateSchedule,
  deleteSchedule
} from '../lib/api/schedules'
import type { Database } from '../lib/supabase'

type Schedule = Database['public']['Tables']['schedules']['Row'] & {
  assignmentCount: number
  activeAssignments: number
}

type ScheduleInsert = Database['public']['Tables']['schedules']['Insert']

type ViewMode = 'list' | 'create' | 'edit' | 'assign'

export function Schedules() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)

  // Fetch schedules
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules', user?.organization_id],
    queryFn: () => getSchedulesByOrganization(user!.organization_id!),
    enabled: !!user?.organization_id
  })

  // Create schedule mutation
  const createMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      setViewMode('list')
    }
  })

  // Update schedule mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScheduleInsert> }) =>
      updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      setViewMode('list')
      setSelectedSchedule(null)
    }
  })

  // Delete schedule mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    }
  })

  const handleCreateSchedule = async (data: ScheduleInsert) => {
    await createMutation.mutateAsync(data)
  }

  const handleUpdateSchedule = async (data: ScheduleInsert) => {
    if (!selectedSchedule) return
    await updateMutation.mutateAsync({ id: selectedSchedule.id, data })
  }

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setViewMode('edit')
  }

  const handleDelete = async (schedule: Schedule) => {
    if (confirm(`Are you sure you want to delete the schedule "${schedule.name}"?`)) {
      await deleteMutation.mutateAsync(schedule.id)
    }
  }

  const handleToggleActive = async (schedule: Schedule) => {
    await updateMutation.mutateAsync({
      id: schedule.id,
      data: { is_active: !schedule.is_active }
    })
  }

  const handleAssignStaff = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setViewMode('assign')
  }

  const handleAssignmentChange = () => {
    queryClient.invalidateQueries({ queryKey: ['schedules'] })
  }

  const handleCancel = () => {
    setViewMode('list')
    setSelectedSchedule(null)
  }

  if (!user?.organization_id) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500">Access denied. Organization not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Check-in Schedules</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage automated check-in schedules and staff assignments
          </p>
        </div>
        
        {viewMode === 'list' && (
          <button
            onClick={() => setViewMode('create')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Schedule
          </button>
        )}
      </div>

      {/* Statistics */}
      {viewMode === 'list' && schedules.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Schedules
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {schedules.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-400 rounded-full"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Schedules
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {schedules.filter(s => s.is_active).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Assignments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {schedules.reduce((sum, s) => sum + s.activeAssignments, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {viewMode === 'list' && (
        <ScheduleList
          schedules={schedules}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onAssignStaff={handleAssignStaff}
          loading={isLoading}
        />
      )}

      {viewMode === 'create' && (
        <ScheduleForm
          organizationId={user.organization_id}
          onSubmit={handleCreateSchedule}
          onCancel={handleCancel}
          loading={createMutation.isPending}
        />
      )}

      {viewMode === 'edit' && selectedSchedule && (
        <ScheduleForm
          schedule={selectedSchedule}
          organizationId={user.organization_id}
          onSubmit={handleUpdateSchedule}
          onCancel={handleCancel}
          loading={updateMutation.isPending}
        />
      )}

      {/* Staff Assignment Modal */}
      {viewMode === 'assign' && selectedSchedule && (
        <StaffAssignment
          schedule={selectedSchedule}
          organizationId={user.organization_id}
          onClose={handleCancel}
          onAssignmentChange={handleAssignmentChange}
        />
      )}
    </div>
  )
}