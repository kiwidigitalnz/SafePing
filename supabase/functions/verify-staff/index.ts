import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface VerifyRequest {
  phoneNumber?: string
  verificationCode?: string
  invitationToken?: string
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

    const body: VerifyRequest = await req.json()
    const { phoneNumber, verificationCode, invitationToken, deviceInfo } = body

    console.log('Verification request:', { phoneNumber, verificationCode, invitationToken, deviceId: deviceInfo?.deviceId })

    let data, error

    // Handle token-based verification
    if (invitationToken) {
      console.log('Verifying with invitation token:', invitationToken)
      
      // First, get invitation details using the token
      const { data: tokenData, error: tokenError } = await supabaseClient.rpc('verify_staff_with_token', {
        p_invitation_token: invitationToken,
        p_device_id: deviceInfo?.deviceId || null,
        p_device_info: deviceInfo || {}
      })

      if (tokenError) {
        console.error('Token verification error:', tokenError)
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid or expired invitation link',
            errorCode: 'INVALID_TOKEN',
            details: tokenError.message
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Check if token verification was successful
      const tokenResult = tokenData[0]
      if (!tokenResult.success) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: tokenResult.error_message,
            errorCode: tokenResult.error_code
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Token is valid, return the phone number and code for the user to enter
      return new Response(
        JSON.stringify({ 
          success: true,
          requiresCodeEntry: true,
          phoneNumber: tokenResult.phone_number,
          maskedPhone: tokenResult.phone_number ? 
            tokenResult.phone_number.substring(0, 3) + '****' + tokenResult.phone_number.substring(tokenResult.phone_number.length - 2) : '',
          message: 'Please enter the 6-digit verification code sent to your phone'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Handle code-based verification
    else if (phoneNumber && verificationCode) {
      // Validate verification code format (6 digits)
      if (!/^\d{6}$/.test(verificationCode)) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid verification code format',
            errorCode: 'INVALID_FORMAT'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Call the database function to verify with code
      const { data: codeData, error: codeError } = await supabaseClient.rpc('verify_staff_with_code', {
        p_phone_number: phoneNumber,
        p_verification_code: verificationCode,
        p_device_id: deviceInfo?.deviceId || null,
        p_device_info: deviceInfo || {}
      })

      data = codeData
      error = codeError
    }
    
    // Missing required fields
    else {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required fields. Provide either invitationToken or phoneNumber with verificationCode',
          errorCode: 'MISSING_FIELDS'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Verification failed',
          errorCode: 'DATABASE_ERROR',
          details: error.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check the result
    const result = data[0]
    
    if (!result.success) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: result.error_message,
          errorCode: result.error_code
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
      .eq('id', result.user_id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to fetch user details',
          errorCode: 'USER_NOT_FOUND'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate session tokens (simplified - in production use proper JWT)
    const sessionToken = crypto.randomUUID()
    const refreshToken = crypto.randomUUID()

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: userData.id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          phone: userData.phone,
          role: userData.role,
          organizationId: userData.organization_id
        },
        invitationId: result.invitation_id,
        requiresPinSetup: !userData.pin_hash,
        session: {
          token: sessionToken,
          refreshToken: refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in verify-staff:', error)
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
curl -i --location --request POST 'http://localhost:54321/functions/v1/verify-staff' \
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
