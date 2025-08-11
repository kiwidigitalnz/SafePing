import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScheduleWithAssignments {
  id: string
  organization_id: string
  name: string
  check_in_interval_minutes: number
  grace_period_minutes: number
  start_time: string | null
  end_time: string | null
  days_of_week: number[] | null
  is_active: boolean
  frequency: string
  schedule_assignments: {
    id: string
    user_id: string
    start_date: string
    end_date: string | null
    is_active: boolean
    user: {
      id: string
      first_name: string
      last_name: string
      email: string | null
      phone: string | null
    }
  }[]
}

interface OverdueCheckIn {
  userId: string
  userName: string
  scheduleId: string
  scheduleName: string
  organizationId: string
  lastCheckIn: Date | null
  overdueBy: number // minutes
  gracePeriodExpired: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    const currentDay = now.getDay() === 0 ? 7 : now.getDay() // Convert Sunday from 0 to 7
    const overdueCheckIns: OverdueCheckIn[] = []

    console.log(`Processing overdue check-ins at ${now.toISOString()}`)

    // Get all active schedules with their assignments
    const { data: schedules, error: schedulesError } = await supabaseClient
      .from('schedules')
      .select(`
        *,
        schedule_assignments!inner(
          *,
          user:users!inner(
            id, first_name, last_name, email, phone
          )
        )
      `)
      .eq('is_active', true)
      .eq('schedule_assignments.is_active', true)

    if (schedulesError) {
      throw new Error(`Failed to fetch schedules: ${schedulesError.message}`)
    }

    const activeSchedules = schedules as ScheduleWithAssignments[]
    console.log(`Found ${activeSchedules.length} active schedules`)

    // Process each schedule
    for (const schedule of activeSchedules) {
      // Check if current time is within schedule hours
      if (!isScheduleActiveNow(schedule, currentDay, currentTime)) {
        continue
      }

      console.log(`Processing schedule: ${schedule.name}`)

      // Process each assigned user
      for (const assignment of schedule.schedule_assignments) {
        // Check if assignment is currently active
        const today = now.toISOString().split('T')[0]
        if (assignment.start_date > today || (assignment.end_date && assignment.end_date < today)) {
          continue
        }

        const user = assignment.user

        // Get the latest check-in for this user
        const { data: latestCheckIns, error: checkInError } = await supabaseClient
          .from('check_ins')
          .select('*')
          .eq('user_id', user.id)
          .eq('organization_id', schedule.organization_id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (checkInError) {
          console.error(`Error fetching check-ins for user ${user.id}:`, checkInError)
          continue
        }

        const latestCheckIn = latestCheckIns?.[0]
        const lastCheckInTime = latestCheckIn ? new Date(latestCheckIn.created_at) : null

        // Calculate when the next check-in should have been
        const nextCheckInDue = lastCheckInTime 
          ? new Date(lastCheckInTime.getTime() + (schedule.check_in_interval_minutes * 60 * 1000))
          : new Date(now.getTime() - (schedule.check_in_interval_minutes * 60 * 1000)) // If no check-in, assume overdue

        // Check if check-in is overdue
        const overdueBy = Math.floor((now.getTime() - nextCheckInDue.getTime()) / (60 * 1000))
        const gracePeriodExpired = overdueBy > schedule.grace_period_minutes

        if (overdueBy > 0) {
          console.log(`User ${user.first_name} ${user.last_name} is ${overdueBy} minutes overdue`)

          // Only update status if grace period has expired and not already marked as overdue
          if (gracePeriodExpired && (!latestCheckIn || latestCheckIn.status !== 'overdue')) {
            // Create or update check-in record as overdue
            const { error: overdueError } = await supabaseClient
              .from('check_ins')
              .insert({
                organization_id: schedule.organization_id,
                user_id: user.id,
                status: 'overdue',
                is_manual: false,
                metadata: {
                  schedule_id: schedule.id,
                  overdue_by_minutes: overdueBy,
                  auto_generated: true,
                  processed_at: now.toISOString()
                }
              })

            if (overdueError) {
              console.error(`Error creating overdue check-in for user ${user.id}:`, overdueError)
            } else {
              console.log(`Created overdue check-in for user ${user.first_name} ${user.last_name}`)
            }
          }

          overdueCheckIns.push({
            userId: user.id,
            userName: `${user.first_name} ${user.last_name}`,
            scheduleId: schedule.id,
            scheduleName: schedule.name,
            organizationId: schedule.organization_id,
            lastCheckIn: lastCheckInTime,
            overdueBy,
            gracePeriodExpired
          })
        }
      }
    }

    // Trigger escalations for newly overdue check-ins
    if (overdueCheckIns.length > 0) {
      console.log(`Found ${overdueCheckIns.length} overdue check-ins, triggering escalations...`)
      
      // Call escalation function for each overdue check-in
      for (const overdueCheckIn of overdueCheckIns) {
        if (overdueCheckIn.gracePeriodExpired) {
          try {
            const { error: escalationError } = await supabaseClient.functions.invoke('trigger-escalation', {
              body: {
                userId: overdueCheckIn.userId,
                scheduleId: overdueCheckIn.scheduleId,
                organizationId: overdueCheckIn.organizationId,
                overdueBy: overdueCheckIn.overdueBy,
                type: 'overdue_checkin'
              }
            })

            if (escalationError) {
              console.error(`Error triggering escalation for user ${overdueCheckIn.userId}:`, escalationError)
            }
          } catch (error) {
            console.error(`Error calling escalation function:`, error)
          }
        }
      }
    }

    console.log(`Processing complete. Found ${overdueCheckIns.length} overdue check-ins`)

    return new Response(
      JSON.stringify({
        success: true,
        processed_at: now.toISOString(),
        schedules_processed: activeSchedules.length,
        overdue_checkins: overdueCheckIns.length,
        overdue_details: overdueCheckIns
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error processing overdue check-ins:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        processed_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function isScheduleActiveNow(schedule: ScheduleWithAssignments, currentDay: number, currentTime: string): boolean {
  // Check frequency and days
  if (schedule.frequency === 'weekly' || schedule.frequency === 'custom') {
    if (!schedule.days_of_week || !schedule.days_of_week.includes(currentDay)) {
      return false
    }
  } else if (schedule.frequency === 'daily') {
    // Daily schedules typically run Monday-Friday
    if (currentDay > 5) { // Weekend
      return false
    }
  }

  // Check time range
  if (schedule.start_time && schedule.end_time) {
    const startTime = schedule.start_time
    const endTime = schedule.end_time
    
    if (currentTime < startTime || currentTime > endTime) {
      return false
    }
  }

  return true
}

/* To test this function locally, you can create a test file:
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-overdue-checkins' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{}'
*/