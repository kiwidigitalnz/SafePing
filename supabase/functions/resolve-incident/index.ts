import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { EmailService, getEmailConfig, EmailTemplates, isValidEmail } from '../_shared/email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResolveIncidentRequest {
  incidentId: string
  resolvedBy: string
  resolutionNotes?: string
  notifyContacts?: string[] // Email addresses to notify of resolution
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

    const body: ResolveIncidentRequest = await req.json()
    const { incidentId, resolvedBy, resolutionNotes, notifyContacts } = body

    console.log(`Resolving incident ${incidentId} by ${resolvedBy}`)

    // Get incident details with user and organization info
    const { data: incident, error: incidentError } = await supabaseClient
      .from('incidents')
      .select(`
        *,
        user:users(
          id, first_name, last_name, email,
          organization:organizations(name)
        )
      `)
      .eq('id', incidentId)
      .single()

    if (incidentError || !incident) {
      throw new Error(`Incident not found: ${incidentError?.message}`)
    }

    // Update incident status to resolved
    const { error: updateError } = await supabaseClient
      .from('incidents')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        resolution_notes: resolutionNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', incidentId)

    if (updateError) {
      throw new Error(`Failed to update incident: ${updateError.message}`)
    }

    console.log(`Incident ${incidentId} resolved successfully`)

    // Send resolution notifications if contacts provided
    const emailResults = []
    if (notifyContacts && notifyContacts.length > 0) {
      const emailConfig = getEmailConfig()
      const emailService = emailConfig ? new EmailService(emailConfig) : null

      if (emailService) {
        console.log(`Sending resolution notifications to ${notifyContacts.length} contacts`)

        for (const email of notifyContacts) {
          try {
            if (!isValidEmail(email)) {
              throw new Error(`Invalid email address: ${email}`)
            }

            const emailTemplate = EmailTemplates.incidentResolved({
              workerName: `${incident.user.first_name} ${incident.user.last_name}`,
              resolvedBy,
              resolutionNotes,
              organizationName: incident.user.organization?.name
            })

            const result = await emailService.sendEmail({
              to: email,
              subject: emailTemplate.subject,
              html: emailTemplate.html
            })

            emailResults.push({
              contact: email,
              success: result.success,
              messageId: result.messageId,
              error: result.error
            })

            console.log(`Resolution notification sent to ${email}: ${result.success ? 'success' : result.error}`)
          } catch (error) {
            console.error(`Error sending resolution notification to ${email}:`, error)
            emailResults.push({
              contact: email,
              success: false,
              error: error.message
            })
          }
        }
      } else {
        console.log('Email service not configured - skipping resolution notifications')
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        incident_id: incidentId,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
        notifications_sent: emailResults.length,
        notification_results: emailResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error resolving incident:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

/* To test this function:
curl -i --location --request POST 'http://localhost:54321/functions/v1/resolve-incident' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "incidentId": "incident-uuid",
    "resolvedBy": "John Smith",
    "resolutionNotes": "Worker contacted and confirmed safe. Issue was phone battery died.",
    "notifyContacts": ["manager@company.com", "safety@company.com"]
  }'
*/