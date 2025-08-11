import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface VerifyRequest {
  // Either token (from URL) or both phone and code (manual entry)
  invitationToken?: string
  phoneNumber?: string
  verificationCode?: string
  deviceInfo: {
    deviceId: string
    deviceName?: string
    deviceType?: string
    deviceModel?: string
    osVersion?: string
    appVersion?: string
    userAgent?: string
    biometricType?: string
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
    const { invitationToken, phoneNumber, verificationCode, deviceInfo } = body

    // Validate device info
    if (!deviceInfo?.deviceId) {
      return new Response(
        JSON.stringify({ error: 'Device information is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let invitation = null
    let user = null

    // Path 1: Direct token verification (clicked link)
    if (invitationToken) {
      console.log('Verifying with invitation token:', invitationToken)
      
      const { data: inviteData, error: inviteError } = await supabaseClient
        .from('worker_invitations')
        .select('*, users!inner(*)')
        .eq('invitation_token', invitationToken)
        .single()

      if (inviteError || !inviteData) {
        console.error('Invalid invitation token:', inviteError)
        return new Response(
          JSON.stringify({ error: 'Invalid or expired invitation link' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      invitation = inviteData
      user = inviteData.users
    }
    // Path 2: Manual code verification (entered code)
    else if (phoneNumber && verificationCode) {
      console.log('Verifying with phone and code:', phoneNumber, verificationCode)
      
      // Find invitation by phone number and code
      const { data: inviteData, error: inviteError } = await supabaseClient
        .from('worker_invitations')
        .select('*, users!inner(*)')
        .eq('phone_number', phoneNumber)
        .eq('invitation_token', verificationCode.toLowerCase()) // Store lowercase for case-insensitive comparison
        .single()

      if (inviteError || !inviteData) {
        // Try with just the first 8 characters of the token (the code shown in SMS)
        const { data: inviteByCode, error: codeError } = await supabaseClient
          .from('worker_invitations')
          .select('*, users!inner(*)')
          .eq('phone_number', phoneNumber)
          .ilike('invitation_token', `${verificationCode.toLowerCase()}%`)
          .single()

        if (codeError || !inviteByCode) {
          console.error('Invalid verification code:', codeError)
          return new Response(
            JSON.stringify({ error: 'Invalid verification code' }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        invitation = inviteByCode
        user = inviteByCode.users
      } else {
        invitation = inviteData
        user = inviteData.users
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Either invitation token or phone number with code is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'This invitation has expired. Please contact your administrator for a new invitation.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if already verified
    if (invitation.status === 'completed' && user.is_active) {
      return new Response(
        JSON.stringify({ 
          error: 'This invitation has already been used. Please sign in with your PIN or biometric authentication.',
          alreadyVerified: true 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update invitation status
    const { error: updateInviteError } = await supabaseClient
      .from('worker_invitations')
      .update({ 
        status: 'verified',
        verified_at: new Date().toISOString(),
        clicked_at: invitation.clicked_at || new Date().toISOString(),
        device_id: deviceInfo.deviceId
      })
      .eq('id', invitation.id)

    if (updateInviteError) {
      console.error('Error updating invitation:', updateInviteError)
    }

    // Update user verification status
    const { error: updateUserError } = await supabaseClient
      .from('users')
      .update({
        verified_at: new Date().toISOString(),
        phone_verified: true,
        last_device_id: deviceInfo.deviceId,
        is_active: true // Activate user upon verification
      })
      .eq('id', user.id)

    if (updateUserError) {
      console.error('Error updating user:', updateUserError)
    }

    // Create worker session
    const { data: sessionData, error: sessionError } = await supabaseClient
      .rpc('create_worker_session', {
        p_user_id: user.id,
        p_device_id: deviceInfo.deviceId,
        p_device_info: deviceInfo
      })

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create session. Please try again.' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare user data for response
    const userData = {
      id: user.id,
      phone: user.phone,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`,
      role: user.role,
      organizationId: user.organization_id,
      department: user.department,
      jobTitle: user.job_title
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        user: userData,
        session: {
          token: sessionData.session_token,
          refreshToken: sessionData.refresh_token,
          expiresAt: sessionData.expires_at
        },
        requiresPinSetup: !user.pin_hash,
        requiresBiometricSetup: true,
        isFirstTimeSetup: !user.pin_hash
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in verify-staff-invitation:', error)
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred. Please try again.',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/* Test examples:

1. Token-based verification (clicked link):
curl -X POST 'http://localhost:54321/functions/v1/verify-staff-invitation' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "invitationToken": "abc123-def456-ghi789",
    "deviceInfo": {
      "deviceId": "device-123",
      "deviceType": "mobile",
      "deviceModel": "iPhone 12"
    }
  }'

2. Code-based verification (manual entry):
curl -X POST 'http://localhost:54321/functions/v1/verify-staff-invitation' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "phoneNumber": "+64212345678",
    "verificationCode": "ABC12345",
    "deviceInfo": {
      "deviceId": "device-123",
      "deviceType": "mobile",
      "deviceModel": "iPhone 12"
    }
  }'
*/
