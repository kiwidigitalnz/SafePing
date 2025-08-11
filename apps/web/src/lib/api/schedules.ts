import { supabase } from '../supabase'
import type { Database } from '../supabase'

type Schedule = Database['public']['Tables']['schedules']['Row']
type ScheduleInsert = Database['public']['Tables']['schedules']['Insert']
type ScheduleUpdate = Database['public']['Tables']['schedules']['Update']
type ScheduleAssignment = Database['public']['Tables']['schedule_assignments']['Row']
type ScheduleAssignmentInsert = Database['public']['Tables']['schedule_assignments']['Insert']
type User = Database['public']['Tables']['users']['Row']

// Schedule CRUD operations
export async function getSchedules(organizationId: string): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getSchedule(id: string): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createSchedule(schedule: ScheduleInsert): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .insert(schedule)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSchedule(id: string, updates: ScheduleUpdate): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Schedule assignments
export async function getScheduleAssignments(scheduleId: string): Promise<(ScheduleAssignment & { user: User })[]> {
  const { data, error } = await supabase
    .from('schedule_assignments')
    .select(`
      *,
      user:users!inner(*)
    `)
    .eq('schedule_id', scheduleId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as (ScheduleAssignment & { user: User })[]
}

export async function getUserSchedules(userId: string): Promise<(ScheduleAssignment & { schedule: Schedule })[]> {
  const { data, error } = await supabase
    .from('schedule_assignments')
    .select(`
      *,
      schedule:schedules!inner(*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as (ScheduleAssignment & { schedule: Schedule })[]
}

export async function assignUserToSchedule(assignment: ScheduleAssignmentInsert): Promise<ScheduleAssignment> {
  // First check if assignment already exists
  const { data: existing } = await supabase
    .from('schedule_assignments')
    .select('*')
    .eq('schedule_id', assignment.schedule_id)
    .eq('user_id', assignment.user_id)
    .eq('start_date', assignment.start_date)
    .single()

  if (existing) {
    // Update existing assignment
    const { data, error } = await supabase
      .from('schedule_assignments')
      .update({ is_active: true })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Create new assignment
  const { data, error } = await supabase
    .from('schedule_assignments')
    .insert(assignment)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function unassignUserFromSchedule(scheduleId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('schedule_assignments')
    .update({ is_active: false })
    .eq('schedule_id', scheduleId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function bulkAssignUsersToSchedule(
  scheduleId: string, 
  organizationId: string,
  userIds: string[], 
  startDate: string,
  endDate?: string
): Promise<ScheduleAssignment[]> {
  const assignments: ScheduleAssignmentInsert[] = userIds.map(userId => ({
    schedule_id: scheduleId,
    organization_id: organizationId,
    user_id: userId,
    start_date: startDate,
    end_date: endDate || null
  }))

  const { data, error } = await supabase
    .from('schedule_assignments')
    .insert(assignments)
    .select()

  if (error) throw error
  return data
}

// Schedule utilities
export async function getActiveSchedulesForUser(userId: string): Promise<Schedule[]> {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('schedule_assignments')
    .select(`
      schedule:schedules!inner(*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .lte('start_date', today)
    .or(`end_date.is.null,end_date.gte.${today}`)

  if (error) throw error
  return data.map(item => item.schedule) as Schedule[]
}

export async function getSchedulesByOrganization(organizationId: string): Promise<(Schedule & { 
  assignmentCount: number, 
  activeAssignments: number 
})[]> {
  const { data: schedules, error: schedulesError } = await supabase
    .from('schedules')
    .select(`
      *,
      schedule_assignments(count)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (schedulesError) throw schedulesError

  // Get active assignment counts
  const schedulesWithCounts = await Promise.all(
    schedules.map(async (schedule) => {
      const { count: activeCount } = await supabase
        .from('schedule_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('schedule_id', schedule.id)
        .eq('is_active', true)

      return {
        ...schedule,
        assignmentCount: schedule.schedule_assignments?.[0]?.count || 0,
        activeAssignments: activeCount || 0
      }
    })
  )

  return schedulesWithCounts
}