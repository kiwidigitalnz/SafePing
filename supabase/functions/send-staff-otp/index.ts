import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { SMSService, type SMSConfig } from '../_shared/sms-service.ts'

interface SendOTPRequest {
  phoneNumber: string
  type: 'staff_auth' | 'staff_invitation' | 'staff_verification'
  deviceInfo?: {
    deviceId: string
    deviceName?: string
    deviceType?: string
    deviceModel?: string
    osVersion?: string
    appVersion?: string
    userAgent?: string
  }
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

    const body: SendOTPRequest = await req.json()
    const { phoneNumber, type, deviceInfo } = body

    console.log('Send OTP request:', { phoneNumber, type, deviceId: deviceInfo?.deviceId })

    // Validate phone number format
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid phone number format. Must start with +',
          errorCode: 'INVALID_PHONE_FORMAT'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user exists for staff_auth type
    if (type === 'staff_auth') {
      const { data: user, error: userError } = await supabaseClient
        .from('users')
        .select('id, first_name, last_name, phone, role, organization_id')
        .eq('phone', phoneNumber)
        .single()

      if (userError || !user) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'No staff account found with this phone number',
            errorCode: 'USER_NOT_FOUND'
          }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Check if user is staff
      if (user.role !== 'staff' && user.role !== 'admin') {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'This phone number is not associated with a staff account',
            errorCode: 'NOT_STAFF'
          }),
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Create verification code in database
    const { data: codeData, error: codeError } = await supabaseClient
      .rpc('create_verification_code', {
        p_phone_number: phoneNumber,
        p_type: type,
        p_metadata: {
          deviceInfo: deviceInfo || {},
          requestType: type,
          timestamp: new Date().toISOString()
        },
        p_expires_minutes: 15
      })

    if (codeError) {
      console.error('Error creating verification code:', codeError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create verification code',
          errorCode: 'DATABASE_ERROR'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const codeId = codeData[0]?.code_id
    if (!codeId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to generate verification code',
          errorCode: 'CODE_GENERATION_FAILED'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Configure SMS service
    const smsConfig: SMSConfig = {
      provider: (Deno.env.get('SMS_PROVIDER') as 'clicksend' | 'twilio') || 'clicksend',
      username: Deno.env.get('CLICKSEND_USERNAME'),
      apiKey: Deno.env.get('CLICKSEND_API_KEY'),
      accountSid: Deno.env.get('TWILIO_ACCOUNT_SID'),
      authToken: Deno.env.get('TWILIO_AUTH_TOKEN'),
      fromNumber: Deno.env.get('SMS_FROM_NUMBER') || 'SafePing'
    }

    const smsService = new SMSService(smsConfig)

    // Create SMS message
    let message: string
    switch (type) {
      case 'staff_auth':
        message = `Your SafePing verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes. Do not share this code with anyone.`
        break
      case 'staff_invitation':
        message = `Your SafePing invitation verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes. Use it to complete your staff account setup.`
        break
      case 'staff_verification':
        message = `Your SafePing verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes. Use it to verify your identity.`
        break
      default:
        message = `Your SafePing verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes.`
    }

    // Send SMS
    const smsResult = await smsService.sendSMS({
      to: phoneNumber,
      message: message
    })

    if (!smsResult.success) {
      console.error('Failed to send SMS:', smsResult.error)
      
      // Delete the verification code since SMS failed
      await supabaseClient
        .from('verification_codes')
        .delete()
        .eq('code_id', codeId)

      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to send verification code via SMS',
          errorCode: 'SMS_SEND_FAILED',
          details: smsResult.error
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update verification code with SMS details
    await supabaseClient
      .from('verification_codes')
      .update({ 
        sms_sent_at: new Date().toISOString(),
        sms_delivery_status: 'sent',
        sms_message_id: smsResult.messageId || null
      })
      .eq('code_id', codeId)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Verification code sent successfully',
        phoneNumber: phoneNumber,
        type: type,
        expiresIn: '15 minutes',
        smsProvider: smsConfig.provider,
        messageId: smsResult.messageId,
        cost: smsResult.cost,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-staff-otp:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        errorCode: 'INTERNAL_ERROR'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/* To test this function:
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-staff-otp' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "phoneNumber": "+64212345678",
    "type": "staff_auth",
    "deviceInfo": {
      "deviceId": "test-device-123",
      "deviceName": "iPhone 12",
      "deviceType": "iOS"
    }
  }'
*/
