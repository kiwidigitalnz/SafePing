import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface VerifyRequest {
  invitationToken: string
  verificationCode: string
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

    const { invitationToken, verificationCode, deviceInfo }: VerifyRequest = await req.json()

    // Validate required fields
    if (!invitationToken || !verificationCode || !deviceInfo?.deviceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Find invitation
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('worker_invitations')
      .select('*, users!inner(*)')
      .eq('invitation_token', invitationToken)
      .single()

    if (invitationError || !invitation) {
      return new Response(
        JSON.stringify({ error: 'Invalid invitation token' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Invitation has expired' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the OTP code
    const { data: verificationData, error: verificationError } = await supabaseClient
      .from('verification_codes')
      .select('*')
      .eq('phone_number', invitation.phone_number)
      .eq('code', verificationCode)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (verificationError || !verificationData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired verification code' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Mark verification code as used
    await supabaseClient
      .from('verification_codes')
      .update({ is_used: true })
      .eq('id', verificationData.id)

    // Update invitation status
    await supabaseClient
      .from('worker_invitations')
      .update({ 
        status: 'verified',
        verified_at: new Date().toISOString(),
        clicked_at: invitation.clicked_at || new Date().toISOString()
      })
      .eq('id', invitation.id)

    // Update user verification status
    await supabaseClient
      .from('users')
      .update({
        verified_at: new Date().toISOString(),
        phone_verified: true,
        last_device_id: deviceInfo.deviceId
      })
      .eq('id', invitation.user_id)

    // Create worker session using the database function
    const { data: sessionData, error: sessionError } = await supabaseClient
      .rpc('create_worker_session', {
        p_user_id: invitation.user_id,
        p_device_id: deviceInfo.deviceId,
        p_device_info: deviceInfo
      })

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user details for response
    const { data: user } = await supabaseClient
      .from('users')
      .select('id, phone_number, full_name, role, organization_id')
      .eq('id', invitation.user_id)
      .single()

    return new Response(
      JSON.stringify({ 
        success: true,
        user: user,
        session: {
          token: sessionData.session_token,
          refreshToken: sessionData.refresh_token,
          expiresAt: sessionData.expires_at
        },
        requiresPinSetup: !invitation.users.pin_hash,
        requiresBiometricSetup: true
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in verify-worker-device:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
