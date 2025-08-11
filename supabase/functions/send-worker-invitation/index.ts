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
    // Log environment configuration (without exposing secrets)
    console.log('Environment check:', {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasSupabaseKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      hasSmsProvider: !!Deno.env.get('SMS_PROVIDER'),
      smsProvider: Deno.env.get('SMS_PROVIDER') || 'not configured',
      hasClicksendCreds: !!(Deno.env.get('CLICKSEND_USERNAME') && Deno.env.get('CLICKSEND_API_KEY')),
      hasTwilioCreds: !!(Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN')),
      pwaUrl: Deno.env.get('PWA_URL') || 'https://my.safeping.app'
    })
    
    // Add debug logging
    console.log('Request received:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    })
    
    // Log the raw request body first
    const rawBody = await req.text()
    console.log('Raw request body:', rawBody)
    
    // Try to parse as JSON
    let body: InvitationRequest
    try {
      body = JSON.parse(rawBody)
      console.log('Request body parsed successfully:', body)
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Validate body structure before destructuring
    if (!body || typeof body !== 'object') {
      console.error('Invalid request body:', body)
      return new Response(
        JSON.stringify({ error: 'Invalid request body format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    const { phoneNumber, invitationToken, workerName, organizationName } = body

    console.log(`Sending invitation to ${workerName} at ${phoneNumber}`)
    console.log('Extracted fields:', { phoneNumber, invitationToken, workerName, organizationName })

    // Validate required fields
    if (!phoneNumber || !invitationToken || !workerName) {
      console.log('Missing required fields:', { phoneNumber, invitationToken, workerName })
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

    // Prepare SMS message with simplified format
    const invitationCode = invitationToken.slice(0, 8).toUpperCase()
    const message = `Hi ${workerName.split(' ')[0]}! 👋

${organizationName || 'SafePing'} has invited you to join their team.

Tap here to get started:
${shortUrl}

Or use code: ${invitationCode}

This link expires in 7 days.`

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
      const { data: updateData, error: updateError } = await supabaseClient
        .from('worker_invitations')
        .update({ 
          sms_sent_at: new Date().toISOString(),
          sms_delivery_status: 'sent',
          sms_message_id: result.messageId || null,
          status: 'sent'
        })
        .eq('invitation_token', invitationToken)
        .select()

      if (updateError) {
        console.error('Error updating invitation status:', updateError)
        console.error('Update error details:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        })
        // Don't fail the request - SMS was sent successfully
      } else {
        console.log('Successfully updated invitation status:', updateData)
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
