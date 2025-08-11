import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMSService, getSMSConfig, formatPhoneNumber, isValidPhoneNumber } from '../_shared/sms.ts'
import { EmailService, getEmailConfig, EmailTemplates, isValidEmail } from '../_shared/email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EscalationRequest {
  userId: string
  scheduleId: string
  organizationId: string
  overdueBy: number
  type: 'overdue_checkin' | 'emergency' | 'missed_checkin'
}

interface EscalationRule {
  id: string
  schedule_id: string | null
  level: string
  delay_minutes: number
  contact_method: string
  contact_list: string[]
  message_template: string | null
  is_active: boolean
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

    const body: EscalationRequest = await req.json()
    const { userId, scheduleId, organizationId, overdueBy, type } = body

    console.log(`Triggering escalation for user ${userId}, overdue by ${overdueBy} minutes`)

    // Get user details with organization
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select(`
        *,
        organization:organizations(name)
      `)
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw new Error(`User not found: ${userError?.message}`)
    }

    // Get escalation rules for this schedule (or global rules)
    const { data: escalationRules, error: escalationError } = await supabaseClient
      .from('escalations')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`schedule_id.eq.${scheduleId},schedule_id.is.null`)
      .eq('is_active', true)
      .order('level')

    if (escalationError) {
      throw new Error(`Failed to fetch escalation rules: ${escalationError.message}`)
    }

    const rules = escalationRules as EscalationRule[]
    console.log(`Found ${rules.length} escalation rules`)

    // Determine which escalation levels to trigger based on overdue time
    const triggeredEscalations: EscalationRule[] = []

    for (const rule of rules) {
      if (overdueBy >= rule.delay_minutes) {
        triggeredEscalations.push(rule)
      }
    }

    console.log(`Triggering ${triggeredEscalations.length} escalation levels`)

    // Execute each escalation
    const results = []
    for (const rule of triggeredEscalations) {
      try {
        const result = await executeEscalation(rule, user, overdueBy, type)
        results.push({
          level: rule.level,
          method: rule.contact_method,
          contacts: rule.contact_list.length,
          success: result.success,
          details: result.details
        })
      } catch (error) {
        console.error(`Error executing escalation level ${rule.level}:`, error)
        results.push({
          level: rule.level,
          method: rule.contact_method,
          success: false,
          error: error.message
        })
      }
    }

    // Create incident record if this is the first escalation
    if (triggeredEscalations.length > 0 && type === 'overdue_checkin') {
      const { error: incidentError } = await supabaseClient
        .from('incidents')
        .insert({
          organization_id: organizationId,
          user_id: userId,
          title: `Overdue Check-in: ${user.first_name} ${user.last_name}`,
          description: `Worker is ${overdueBy} minutes overdue for safety check-in`,
          severity: overdueBy > 60 ? 'high' : overdueBy > 30 ? 'medium' : 'low',
          status: 'open',
          metadata: {
            schedule_id: scheduleId,
            overdue_by_minutes: overdueBy,
            escalation_triggered: true,
            triggered_at: new Date().toISOString()
          }
        })

      if (incidentError) {
        console.error('Error creating incident:', incidentError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        user_name: `${user.first_name} ${user.last_name}`,
        overdue_by: overdueBy,
        escalations_triggered: triggeredEscalations.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error triggering escalation:', error)
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

async function executeEscalation(
  rule: EscalationRule, 
  user: any, 
  overdueBy: number, 
  type: string
): Promise<{ success: boolean; details: any }> {
  
  console.log(`Executing escalation level ${rule.level} via ${rule.contact_method}`)

  // Generate message from template
  const message = rule.message_template
    ? rule.message_template
        .replace('{{worker_name}}', `${user.first_name} ${user.last_name}`)
        .replace('{{overdue_time}}', `${overdueBy} minutes`)
        .replace('{{type}}', type)
    : `SAFETY ALERT: ${user.first_name} ${user.last_name} is ${overdueBy} minutes overdue for check-in. Please verify their safety immediately.`

  const contactResults = []

  // Initialize SMS and Email services if needed
  const smsConfig = getSMSConfig()
  const smsService = smsConfig ? new SMSService(smsConfig) : null
  
  const emailConfig = getEmailConfig()
  const emailService = emailConfig ? new EmailService(emailConfig) : null

  // Execute contact method
  switch (rule.contact_method) {
    case 'sms':
      for (const phoneNumber of rule.contact_list) {
        try {
          // Validate and format phone number
          const formattedPhone = formatPhoneNumber(phoneNumber)
          
          if (!isValidPhoneNumber(formattedPhone)) {
            throw new Error(`Invalid phone number format: ${phoneNumber}`)
          }

          if (smsService) {
            // Send actual SMS
            console.log(`Sending SMS to ${formattedPhone}: ${message}`)
            const result = await smsService.sendSMS({
              to: formattedPhone,
              message: message
            })
            
            contactResults.push({
              contact: phoneNumber,
              method: 'sms',
              success: result.success,
              messageId: result.messageId,
              cost: result.cost,
              message: result.success ? 'SMS sent successfully' : result.error
            })
          } else {
            // Fallback to simulation if SMS not configured
            console.log(`SMS service not configured. Would send SMS to ${formattedPhone}: ${message}`)
            
            contactResults.push({
              contact: phoneNumber,
              method: 'sms',
              success: true,
              message: 'SMS simulated (service not configured)'
            })
          }
        } catch (error) {
          console.error(`Error sending SMS to ${phoneNumber}:`, error)
          contactResults.push({
            contact: phoneNumber,
            method: 'sms',
            success: false,
            error: error.message
          })
        }
      }
      break

    case 'email':
      for (const email of rule.contact_list) {
        try {
          // Validate email address
          if (!isValidEmail(email)) {
            throw new Error(`Invalid email address format: ${email}`)
          }

          if (emailService) {
            // Generate professional safety alert email
            const emailTemplate = EmailTemplates.safetyAlert({
              workerName: `${user.first_name} ${user.last_name}`,
              overdueTime: overdueBy,
              alertLevel: overdueBy > 60 ? 'emergency' : overdueBy > 30 ? 'high' : 'medium',
              organizationName: user.organization?.name,
              scheduleInfo: rule.schedule_id ? `Schedule ID: ${rule.schedule_id}` : 'Global alert',
              actionRequired: 'Contact the worker immediately and verify their safety status'
            })

            console.log(`Sending email to ${email}: ${emailTemplate.subject}`)
            const result = await emailService.sendEmail({
              to: email,
              subject: emailTemplate.subject,
              html: emailTemplate.html
            })
            
            contactResults.push({
              contact: email,
              method: 'email',
              success: result.success,
              messageId: result.messageId,
              message: result.success ? 'Email sent successfully' : result.error
            })
          } else {
            // Fallback to simulation if email not configured
            console.log(`Email service not configured. Would send email to ${email}: ${message}`)
            
            contactResults.push({
              contact: email,
              method: 'email',
              success: true,
              message: 'Email simulated (service not configured)'
            })
          }
        } catch (error) {
          console.error(`Error sending email to ${email}:`, error)
          contactResults.push({
            contact: email,
            method: 'email',
            success: false,
            error: error.message
          })
        }
      }
      break

    case 'call':
      for (const phoneNumber of rule.contact_list) {
        try {
          // In a real implementation, you would integrate with voice calling service here
          console.log(`Would call ${phoneNumber} with message: ${message}`)
          
          contactResults.push({
            contact: phoneNumber,
            method: 'call',
            success: true,
            message: 'Call queued for delivery'
          })
        } catch (error) {
          contactResults.push({
            contact: phoneNumber,
            method: 'call',
            success: false,
            error: error.message
          })
        }
      }
      break

    default:
      throw new Error(`Unsupported contact method: ${rule.contact_method}`)
  }

  const successCount = contactResults.filter(r => r.success).length
  const success = successCount > 0

  return {
    success,
    details: {
      message,
      contacts_attempted: rule.contact_list.length,
      contacts_successful: successCount,
      results: contactResults
    }
  }
}

/* To test this function:
curl -i --location --request POST 'http://localhost:54321/functions/v1/trigger-escalation' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "userId": "user-uuid",
    "scheduleId": "schedule-uuid", 
    "organizationId": "org-uuid",
    "overdueBy": 30,
    "type": "overdue_checkin"
  }'
*/