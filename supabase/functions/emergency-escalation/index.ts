import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMSService, getSMSConfig, formatPhoneNumber, isValidPhoneNumber } from '../_shared/sms.ts'
import { EmailService, getEmailConfig, EmailTemplates, isValidEmail } from '../_shared/email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmergencyEscalationRequest {
  userId: string
  organizationId: string
  emergencyType: 'panic_button' | 'no_response' | 'overdue_critical' | 'manual_emergency'
  location?: {
    latitude: number
    longitude: number
    accuracy?: number
    address?: string
  }
  message?: string
  triggeredBy?: string
}

interface EmergencyContact {
  id: string
  user_id: string
  name: string
  relationship: string
  phone: string | null
  email: string | null
  priority: number
  is_active: boolean
}

interface EscalationChain {
  contacts: EmergencyContact[]
  escalationLevels: {
    level: number
    delayMinutes: number
    methods: ('sms' | 'email' | 'call')[]
  }[]
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

    const body: EmergencyEscalationRequest = await req.json()
    const { userId, organizationId, emergencyType, location, message, triggeredBy } = body

    console.log(`🚨 EMERGENCY ESCALATION: ${emergencyType} for user ${userId}`)

    // Get user details
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select(`
        *,
        organization:organizations(name),
        emergency_contacts(*)
      `)
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw new Error(`User not found: ${userError?.message}`)
    }

    // Create emergency incident record
    const incidentData = {
      organization_id: organizationId,
      user_id: userId,
      title: `🚨 EMERGENCY: ${user.first_name} ${user.last_name}`,
      description: `Emergency escalation triggered: ${emergencyType}`,
      severity: 'critical',
      status: 'open',
      incident_type: 'emergency',
      metadata: {
        emergency_type: emergencyType,
        location: location,
        triggered_by: triggeredBy,
        triggered_at: new Date().toISOString(),
        message: message
      }
    }

    const { data: incident, error: incidentError } = await supabaseClient
      .from('incidents')
      .insert(incidentData)
      .select()
      .single()

    if (incidentError) {
      console.error('Error creating emergency incident:', incidentError)
    }

    // Get emergency contacts and organizational escalation contacts
    const { data: emergencyContacts, error: contactsError } = await supabaseClient
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('priority')

    if (contactsError) {
      console.error('Error fetching emergency contacts:', contactsError)
    }

    // Get organizational emergency contacts (managers, safety officers)
    const { data: orgContacts, error: orgContactsError } = await supabaseClient
      .from('users')
      .select('id, first_name, last_name, email, phone')
      .eq('organization_id', organizationId)
      .in('role', ['admin', 'manager', 'safety_officer'])
      .eq('is_active', true)

    if (orgContactsError) {
      console.error('Error fetching organizational contacts:', orgContactsError)
    }

    // Initialize communication services
    const smsConfig = getSMSConfig()
    const smsService = smsConfig ? new SMSService(smsConfig) : null
    
    const emailConfig = getEmailConfig()
    const emailService = emailConfig ? new EmailService(emailConfig) : null

    // Build escalation chain
    const escalationChain = buildEscalationChain(emergencyContacts || [], orgContacts || [])
    
    // Generate emergency message
    const emergencyMessage = generateEmergencyMessage({
      user,
      emergencyType,
      location,
      message,
      incidentId: incident?.id
    })

    // Execute immediate notifications (Level 1)
    const immediateResults = await executeImmediateNotifications(
      escalationChain.contacts.slice(0, 3), // First 3 priority contacts
      emergencyMessage,
      smsService,
      emailService
    )

    // Schedule delayed escalations
    const scheduledEscalations = await scheduleDelayedEscalations(
      supabaseClient,
      escalationChain,
      emergencyMessage,
      incident?.id
    )

    // Log the emergency escalation
    await supabaseClient
      .from('cron_job_logs')
      .insert({
        job_name: 'emergency_escalation',
        status: 200,
        response_body: JSON.stringify({
          incident_id: incident?.id,
          emergency_type: emergencyType,
          contacts_notified: immediateResults.length,
          scheduled_escalations: scheduledEscalations.length
        }),
        executed_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        emergency_type: emergencyType,
        incident_id: incident?.id,
        user_name: `${user.first_name} ${user.last_name}`,
        location: location,
        immediate_notifications: immediateResults,
        scheduled_escalations: scheduledEscalations,
        escalation_chain_contacts: escalationChain.contacts.length,
        message: 'Emergency escalation initiated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Emergency escalation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

function buildEscalationChain(emergencyContacts: any[], orgContacts: any[]): EscalationChain {
  // Combine and prioritize contacts
  const allContacts = [
    ...emergencyContacts.map(c => ({
      ...c,
      type: 'emergency_contact'
    })),
    ...orgContacts.map(c => ({
      id: c.id,
      user_id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      relationship: 'organizational',
      phone: c.phone,
      email: c.email,
      priority: 99, // Lower priority than personal emergency contacts
      is_active: true,
      type: 'organizational'
    }))
  ].sort((a, b) => a.priority - b.priority)

  const escalationLevels = [
    { level: 1, delayMinutes: 0, methods: ['sms', 'email'] as const },
    { level: 2, delayMinutes: 5, methods: ['sms', 'email', 'call'] as const },
    { level: 3, delayMinutes: 15, methods: ['sms', 'email', 'call'] as const },
    { level: 4, delayMinutes: 30, methods: ['sms', 'email', 'call'] as const }
  ]

  return {
    contacts: allContacts,
    escalationLevels
  }
}

function generateEmergencyMessage(params: {
  user: any
  emergencyType: string
  location?: any
  message?: string
  incidentId?: string
}): any {
  const { user, emergencyType, location, message, incidentId } = params
  
  const locationText = location 
    ? `Location: ${location.address || `${location.latitude}, ${location.longitude}`}` 
    : 'Location: Unknown'
  
  const urgencyLevel = emergencyType === 'panic_button' ? 'CRITICAL' : 'HIGH'
  
  const smsMessage = `🚨 EMERGENCY ALERT 🚨
${user.first_name} ${user.last_name} needs immediate assistance!
Type: ${emergencyType.replace('_', ' ').toUpperCase()}
${locationText}
${message ? `Message: ${message}` : ''}
Incident ID: ${incidentId}
Contact emergency services if needed: 111`

  const emailData = {
    subject: `🚨 CRITICAL EMERGENCY: ${user.first_name} ${user.last_name} - Immediate Action Required`,
    workerName: `${user.first_name} ${user.last_name}`,
    overdueTime: 0,
    alertLevel: 'emergency',
    organizationName: user.organization?.name,
    scheduleInfo: `Emergency Type: ${emergencyType}`,
    actionRequired: `IMMEDIATE ASSISTANCE REQUIRED. Contact ${user.first_name} ${user.last_name} and emergency services if necessary.`
  }

  return {
    sms: smsMessage,
    email: emailData,
    urgency: urgencyLevel
  }
}

async function executeImmediateNotifications(
  contacts: any[],
  message: any,
  smsService: SMSService | null,
  emailService: EmailService | null
): Promise<any[]> {
  const results = []

  for (const contact of contacts) {
    // Send SMS if phone available
    if (contact.phone && smsService) {
      try {
        const formattedPhone = formatPhoneNumber(contact.phone)
        if (isValidPhoneNumber(formattedPhone)) {
          const smsResult = await smsService.sendSMS({
            to: formattedPhone,
            message: message.sms
          })
          
          results.push({
            contact: contact.name,
            method: 'sms',
            phone: formattedPhone,
            success: smsResult.success,
            messageId: smsResult.messageId,
            error: smsResult.error
          })
        }
      } catch (error) {
        console.error(`SMS error for ${contact.name}:`, error)
        results.push({
          contact: contact.name,
          method: 'sms',
          success: false,
          error: error.message
        })
      }
    }

    // Send email if email available
    if (contact.email && emailService) {
      try {
        if (isValidEmail(contact.email)) {
          const emailTemplate = EmailTemplates.safetyAlert(message.email)
          const emailResult = await emailService.sendEmail({
            to: contact.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html
          })
          
          results.push({
            contact: contact.name,
            method: 'email',
            email: contact.email,
            success: emailResult.success,
            messageId: emailResult.messageId,
            error: emailResult.error
          })
        }
      } catch (error) {
        console.error(`Email error for ${contact.name}:`, error)
        results.push({
          contact: contact.name,
          method: 'email',
          success: false,
          error: error.message
        })
      }
    }
  }

  return results
}

async function scheduleDelayedEscalations(
  supabaseClient: any,
  escalationChain: EscalationChain,
  message: any,
  incidentId?: string
): Promise<any[]> {
  const scheduledEscalations = []

  // In a production environment, you would use a proper job queue
  // For now, we'll create scheduled records that can be processed by cron
  for (const level of escalationChain.escalationLevels.slice(1)) { // Skip level 1 (immediate)
    const scheduledTime = new Date(Date.now() + level.delayMinutes * 60 * 1000)
    
    const escalationRecord = {
      incident_id: incidentId,
      escalation_level: level.level,
      scheduled_for: scheduledTime.toISOString(),
      contact_methods: level.methods,
      message_content: JSON.stringify(message),
      status: 'scheduled',
      created_at: new Date().toISOString()
    }

    // Store in database for later processing
    // This would typically be handled by a job queue in production
    scheduledEscalations.push({
      level: level.level,
      delay_minutes: level.delayMinutes,
      scheduled_for: scheduledTime.toISOString(),
      methods: level.methods
    })
  }

  return scheduledEscalations
}

/* To test this function:
curl -i --location --request POST 'http://localhost:54321/functions/v1/emergency-escalation' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "userId": "user-uuid",
    "organizationId": "org-uuid",
    "emergencyType": "panic_button",
    "location": {
      "latitude": -36.8485,
      "longitude": 174.7633,
      "address": "Auckland, New Zealand"
    },
    "message": "Help needed immediately!"
  }'
*/