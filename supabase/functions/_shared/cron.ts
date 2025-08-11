/**
 * Cron job utilities for SafePing
 * 
 * These functions can be called periodically to maintain system health
 * and process time-sensitive operations.
 */

export interface CronJobConfig {
  name: string
  schedule: string // Cron expression
  function: string // Function name to call
  enabled: boolean
}

// Recommended cron schedules for SafePing
export const CRON_SCHEDULES: CronJobConfig[] = [
  {
    name: 'Process Overdue Check-ins',
    schedule: '*/5 * * * *', // Every 5 minutes
    function: 'process-overdue-checkins',
    enabled: true
  },
  {
    name: 'Clean Old Check-ins',
    schedule: '0 2 * * *', // Daily at 2 AM
    function: 'cleanup-old-checkins',
    enabled: true
  },
  {
    name: 'Generate Daily Reports',
    schedule: '0 6 * * *', // Daily at 6 AM
    function: 'generate-daily-reports',
    enabled: false
  }
]

/**
 * Manual trigger for testing cron jobs
 * 
 * Usage in admin dashboard:
 * ```typescript
 * const { data } = await supabase.functions.invoke('trigger-cron', {
 *   body: { job: 'process-overdue-checkins' }
 * })
 * ```
 */
export async function triggerCronJob(functionName: string): Promise<Response> {
  const baseUrl = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321'
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      triggered_by: 'cron',
      triggered_at: new Date().toISOString()
    })
  })
  
  return response
}

/**
 * Setup instructions for production cron jobs:
 * 
 * 1. Using GitHub Actions (recommended for Supabase projects):
 *    Create `.github/workflows/cron-jobs.yml`:
 * 
 * ```yaml
 * name: SafePing Cron Jobs
 * on:
 *   schedule:
 *     - cron: '*/5 * * * *'  # Every 5 minutes
 * 
 * jobs:
 *   process-overdue:
 *     runs-on: ubuntu-latest
 *     steps:
 *       - name: Trigger Overdue Processing
 *         run: |
 *           curl -X POST \
 *             -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
 *             -H "Content-Type: application/json" \
 *             -d '{"triggered_by": "github_actions"}' \
 *             "${{ secrets.SUPABASE_URL }}/functions/v1/process-overdue-checkins"
 * ```
 * 
 * 2. Using external cron services (cron-job.org, EasyCron, etc.):
 *    Set up HTTP requests to call the functions directly
 * 
 * 3. Using Supabase Cron (when available):
 *    Add to your Supabase project settings
 * 
 * 4. Using server-based cron (if you have your own server):
 *    Add to crontab: `*/5 * * * * curl -X POST https://your-project.supabase.co/functions/v1/process-overdue-checkins`
 */