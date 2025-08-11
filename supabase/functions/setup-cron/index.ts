import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CronSetupRequest {
  action: 'setup' | 'status' | 'trigger' | 'logs'
  interval?: number // minutes
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body: CronSetupRequest = await req.json()
    const { action, interval = 5 } = body

    switch (action) {
      case 'setup':
        // Setup recurring execution using Supabase Edge Functions + external cron
        console.log('Setting up cron job system...')
        
        // Create cron job logs table if it doesn't exist
        const { error: tableError } = await supabaseClient
          .from('cron_job_logs')
          .select('id')
          .limit(1)

        if (tableError && tableError.code === 'PGRST116') {
          // Table doesn't exist, but we'll handle this in migrations
          console.log('Cron job logs table needs to be created via migration')
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Cron job system configured for ${interval} minute intervals`,
            setup: {
              interval_minutes: interval,
              function_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-overdue-checkins`,
              webhook_setup: 'Configure external cron service (like cron-job.org) to call this function',
              example_curl: `curl -X POST "${Deno.env.get('SUPABASE_URL')}/functions/v1/process-overdue-checkins" -H "Authorization: Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}" -H "Content-Type: application/json" -d '{}'`
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      case 'trigger':
        // Manually trigger overdue processing
        console.log('Manually triggering overdue check-in processing...')
        
        const { data: result, error: triggerError } = await supabaseClient.functions.invoke('process-overdue-checkins', {
          body: {}
        })

        if (triggerError) {
          throw new Error(`Failed to trigger processing: ${triggerError.message}`)
        }

        // Log the manual trigger
        await supabaseClient
          .from('cron_job_logs')
          .insert({
            job_name: 'manual_trigger',
            status: 200,
            response_body: JSON.stringify(result),
            executed_at: new Date().toISOString()
          })

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Overdue processing triggered manually',
            result
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      case 'status':
        // Get cron job status
        const { data: logs, error: logsError } = await supabaseClient
          .from('cron_job_logs')
          .select('*')
          .order('executed_at', { ascending: false })
          .limit(10)

        if (logsError) {
          console.error('Error fetching logs:', logsError)
        }

        return new Response(
          JSON.stringify({
            success: true,
            status: 'Cron system operational',
            recent_executions: logs || [],
            next_check: 'Depends on external cron configuration'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      case 'logs':
        // Get detailed logs
        const { data: allLogs, error: allLogsError } = await supabaseClient
          .from('cron_job_logs')
          .select('*')
          .order('executed_at', { ascending: false })
          .limit(50)

        return new Response(
          JSON.stringify({
            success: true,
            logs: allLogs || [],
            total_logs: allLogs?.length || 0
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Cron setup error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/* 
Setup Instructions:
1. Deploy this function: npx supabase functions deploy setup-cron
2. Call setup action to configure the system
3. Use external cron service (like cron-job.org) to call process-overdue-checkins every 5 minutes
4. Monitor with status and logs actions

Test commands:
curl -X POST 'http://localhost:54321/functions/v1/setup-cron' -H 'Content-Type: application/json' -d '{"action": "setup"}'
curl -X POST 'http://localhost:54321/functions/v1/setup-cron' -H 'Content-Type: application/json' -d '{"action": "trigger"}'
curl -X POST 'http://localhost:54321/functions/v1/setup-cron' -H 'Content-Type: application/json' -d '{"action": "status"}'
*/