import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { SMSService, getSMSConfig, formatPhoneNumber, isValidPhoneNumber } from '../_shared/sms.ts'

interface InvitationRequest {
  phoneNumber: string
  invitationToken: string
  workerName: string
  organizationName: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: InvitationRequest = await req.json()
    const { phoneNumber, invitationToken, workerName, organizationName } = body

    console.log(`Sending invitation to ${workerName} at ${phoneNumber}`)

    // Validate required fields
    if (!phoneNumber || !invitationToken || !workerName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Format and validate phone number
    const formattedPhone = formatPhoneNumber(phoneNumber)
    console.log(`Formatted phone: ${formattedPhone}`)

    if (!isValidPhoneNumber(formattedPhone)) {
      return new Response(
        JSON.stringify({ error: `Invalid phone number format: ${phoneNumber}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get SMS configuration
    const smsConfig = getSMSConfig()
    if (!smsConfig) {
      console.error('SMS service not configured')
      return new Response(
        JSON.stringify({ 
          error: 'SMS service not configured',
          details: 'Please configure SMS_PROVIDER and credentials in Supabase Edge Function secrets'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`SMS Provider: ${smsConfig.provider}`)

    // Construct invitation URL
    const baseUrl = Deno.env.get('PWA_URL') || 'https://my.safeping.app'
    const invitationUrl = `${baseUrl}/invite/${invitationToken}`
    
    // Create shortened URL for SMS (optional - you could integrate a URL shortener here)
    const shortUrl = invitationUrl // For now, use full URL

    // Prepare SMS message
    const message = `Hi ${workerName.split(' ')[0]}! 

${organizationName || 'SafePing'} has invited you to join their safety team.

Get started here:
${shortUrl}

Download SafePing and use this invitation code: ${invitationToken.slice(0, 8).toUpperCase()}

This invitation expires in 7 days.

Reply STOP to opt out.`

    // Initialize SMS service
    const smsService = new SMSService(smsConfig)

    // Send SMS
    const result = await smsService.sendSMS({
      to: formattedPhone,
      message: message
    })

    console.log(`SMS Result:`, result)

    if (!result.success) {
      console.error('Failed to send SMS:', result.error)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to send invitation SMS',
          details: result.error
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If we have a Supabase client, update the invitation record
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (supabaseUrl && supabaseKey) {
      const supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      // Update invitation status if we have the invitation record
      const { error: updateError } = await supabaseClient
        .from('worker_invitations')
        .update({ 
          sms_sent_at: new Date().toISOString(),
          sms_delivery_status: 'sent',
          sms_message_id: result.messageId || null
        })
        .eq('invitation_token', invitationToken)

      if (updateError) {
        console.error('Error updating invitation status:', updateError)
        // Don't fail the request - SMS was sent successfully
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Invitation SMS sent successfully',
        phone_number: formattedPhone,
        invitation_url: invitationUrl,
        invitation_code: invitationToken.slice(0, 8).toUpperCase(),
        sms_provider: smsConfig.provider,
        message_id: result.messageId,
        cost: result.cost,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-worker-invitation:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/* To test this function:
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-worker-invitation' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "phoneNumber": "+64212345678",
    "invitationToken": "test-token-123",
    "workerName": "John Doe",
    "organizationName": "ACME Corp"
  }'
*/
