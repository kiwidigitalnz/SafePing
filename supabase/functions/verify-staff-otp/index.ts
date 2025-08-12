import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface VerifyOTPRequest {
  phoneNumber: string
  verificationCode: string
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

    const body: VerifyOTPRequest = await req.json()
    const { phoneNumber, verificationCode, deviceInfo } = body

    console.log('Verify OTP request:', { phoneNumber, deviceId: deviceInfo?.deviceId })

    // Validate required fields
    if (!phoneNumber || !verificationCode) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Phone number and verification code are required',
          errorCode: 'MISSING_FIELDS'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate verification code format (6 digits)
    if (!/^\d{6}$/.test(verificationCode)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid verification code format. Must be 6 digits',
          errorCode: 'INVALID_FORMAT'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate phone number format
    if (!phoneNumber.startsWith('+')) {
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

    // Verify the code using existing database function
    const { data: verifyData, error: verifyError } = await supabaseClient
      .rpc('verify_code_simple', {
        p_phone_number: phoneNumber,
        p_code: verificationCode
      })

    if (verifyError) {
      console.error('Error verifying code:', verifyError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to verify code',
          errorCode: 'VERIFICATION_FAILED'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!verifyData?.success) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: verifyData?.error_message || 'Invalid verification code',
          errorCode: verifyData?.error_code || 'INVALID_CODE'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user details
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, first_name, last_name, phone, role, organization_id, pin_hash')
      .eq('phone', phoneNumber)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'User not found',
          errorCode: 'USER_NOT_FOUND'
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user is staff
    if (userData.role !== 'staff' && userData.role !== 'admin') {
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

    // Create staff session using existing database function
    const { data: sessionData, error: sessionError } = await supabaseClient
      .rpc('create_staff_session_after_otp', {
        p_user_id: userData.id,
        p_device_id: deviceInfo?.deviceId || 'unknown',
        p_device_info: deviceInfo || {}
      })

    if (sessionError || !sessionData?.success) {
      console.error('Error creating session:', sessionError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create session',
          errorCode: 'SESSION_CREATION_FAILED'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get organization details
    const { data: orgData, error: orgError } = await supabaseClient
      .from('organizations')
      .select('id, name, slug')
      .eq('id', userData.organization_id)
      .single()

    if (orgError) {
      console.error('Error fetching organization:', orgError)
      // Don't fail the request, just log the error
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'OTP verified successfully',
        user: {
          id: userData.id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          phone: userData.phone,
          role: userData.role,
          organizationId: userData.organization_id,
          organizationName: orgData?.name || 'Unknown Organization'
        },
        session: {
          token: sessionData.session_token,
          refreshToken: sessionData.refresh_token,
          expiresAt: sessionData.expires_at
        },
        requiresPinSetup: !userData.pin_hash,
        requiresBiometricSetup: false, // Can be enhanced later
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in verify-staff-otp:', error)
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
curl -i --location --request POST 'http://localhost:54321/functions/v1/verify-staff-otp' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "phoneNumber": "+64212345678",
    "verificationCode": "123456",
    "deviceInfo": {
      "deviceId": "test-device-123",
      "deviceName": "iPhone 12",
      "deviceType": "iOS"
    }
  }'
*/
