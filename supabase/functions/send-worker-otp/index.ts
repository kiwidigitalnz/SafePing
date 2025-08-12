import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { SMSService, getSMSConfig, formatPhoneNumber, isValidPhoneNumber } from '../_shared/sms-adapter.ts'

interface OTPRequest {
  phone_number: string
  type: 'worker_auth' | 'pin_reset'
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body: OTPRequest = await req.json()
    const { phone_number, type = 'worker_auth' } = body

    console.log(`Sending OTP to ${phone_number} for ${type}`)

    // Validate required fields
    if (!phone_number) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Format and validate phone number
    const formattedPhone = formatPhoneNumber(phone_number)
    console.log(`Formatted phone: ${formattedPhone}`)

    if (!isValidPhoneNumber(formattedPhone)) {
      return new Response(
        JSON.stringify({ error: `Invalid phone number format: ${phone_number}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user exists with this phone number
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, first_name, organization_id, role')
      .eq('phone_number', formattedPhone)
      .single()

    if (userError || !userData) {
      console.error('User not found with phone:', formattedPhone)
      return new Response(
        JSON.stringify({ 
          error: 'No account found with this phone number. Please contact your administrator to invite you.'
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user is a worker/staff member (not admin)
    if (userData.role === 'admin' || userData.role === 'super_admin') {
      return new Response(
        JSON.stringify({ 
          error: 'Administrators should use the web portal for login.'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('Generated verification code:', verificationCode)

    // Store verification code in database
    const { error: codeError } = await supabaseClient
      .from('verification_codes')
      .insert({
        phone_number: formattedPhone,
        code: verificationCode,
        type: type,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        metadata: {
          user_id: userData.id,
          organization_id: userData.organization_id
        }
      })

    if (codeError) {
      console.error('Error storing verification code:', codeError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate verification code' }),
        { 
          status: 500,
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

    // Prepare SMS message
    const message = type === 'pin_reset'
      ? `Your SafePing PIN reset code is: ${verificationCode}\n\nThis code expires in 15 minutes.`
      : `Your SafePing verification code is: ${verificationCode}\n\nThis code expires in 15 minutes.`

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
          error: 'Failed to send verification SMS',
          details: result.error
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Verification code sent successfully',
        expires_in: 900, // 15 minutes in seconds
        sms_provider: smsConfig.provider,
        message_id: result.messageId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-worker-otp:', error)
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
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-worker-otp' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "phone_number": "+64212345678",
    "type": "worker_auth"
  }'
*/