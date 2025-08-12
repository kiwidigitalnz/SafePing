import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { SMSService, getSMSConfig, formatPhoneNumber, isValidPhoneNumber } from '../_shared/sms-adapter.ts'

interface InvitationRequest {
  phoneNumber: string
  invitationToken: string
  staffName: string
  organizationName: string
  verificationCode: string  // Required 6-digit code
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body: InvitationRequest = await req.json()
    const { phoneNumber, invitationToken, staffName, organizationName, verificationCode } = body

    console.log(`Sending invitation to ${staffName} at ${phoneNumber}`)
    console.log('Verification code:', verificationCode)

    // Validate required fields
    if (!phoneNumber || !invitationToken || !staffName || !verificationCode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate verification code format (should be 6 digits)
    if (!/^\d{6}$/.test(verificationCode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid verification code format. Must be 6 digits.' }),
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

    // Prepare SMS message with 6-digit verification code
    const message = `Hi ${staffName.split(' ')[0]}! 👋

${organizationName || 'SafePing'} has invited you to join their team on the SafePing mobile app.

Your verification code is: ${verificationCode}

To get started:
1. Install SafePing mobile app
2. Open the app and tap "I have an invitation"
3. Enter your phone number
4. Enter the code above

Or tap this link on your phone: ${invitationUrl}

This code expires in 7 days.

Note: This invitation is for the mobile app only, not the web dashboard.`

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

    // Update invitation status in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (supabaseUrl && supabaseKey) {
      const supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      // Update invitation status
      const { error: updateError } = await supabaseClient
        .from('staff_invitations')
        .update({ 
          sms_sent_at: new Date().toISOString(),
          sms_delivery_status: 'sent',
          sms_message_id: result.messageId || null,
          status: 'sent'
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
        verification_code: verificationCode,
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
    console.error('Error in send-staff-invitation:', error)
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
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-staff-invitation' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "phoneNumber": "+64212345678",
    "invitationToken": "test-token-123",
    "staffName": "John Doe",
    "organizationName": "ACME Corp",
    "verificationCode": "123456"
  }'
*/
