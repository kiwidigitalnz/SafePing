import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

interface PinValidationRequest {
  sessionToken: string
  pin: string
  deviceId: string
}

interface SetPinRequest {
  sessionToken: string
  newPin: string
  deviceId: string
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

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop() // 'validate' or 'set'

    if (action === 'set') {
      // Handle PIN setup
      const { sessionToken, newPin, deviceId }: SetPinRequest = await req.json()

      if (!sessionToken || !newPin || !deviceId) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Validate PIN format (4-6 digits)
      if (!/^\d{4,6}$/.test(newPin)) {
        return new Response(
          JSON.stringify({ error: 'PIN must be 4-6 digits' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Validate session
      const { data: sessionValidation } = await supabaseClient
        .rpc('validate_worker_session', {
          p_session_token: sessionToken,
          p_device_id: deviceId
        })

      if (!sessionValidation?.valid) {
        return new Response(
          JSON.stringify({ error: 'Invalid session' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Hash the PIN
      const salt = await bcrypt.genSalt(10)
      const pinHash = await bcrypt.hash(newPin, salt)

      // Update user's PIN
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({ 
          pin_hash: pinHash,
          pin_attempts: 0,
          pin_locked_until: null
        })
        .eq('id', sessionValidation.user_id)

      if (updateError) {
        console.error('Error updating PIN:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to set PIN' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'PIN set successfully'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } else if (action === 'validate') {
      // Handle PIN validation
      const { sessionToken, pin, deviceId }: PinValidationRequest = await req.json()

      if (!sessionToken || !pin || !deviceId) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Validate session
      const { data: sessionValidation } = await supabaseClient
        .rpc('validate_worker_session', {
          p_session_token: sessionToken,
          p_device_id: deviceId
        })

      if (!sessionValidation?.valid) {
        return new Response(
          JSON.stringify({ error: 'Invalid session' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Get user's PIN hash
      const { data: user, error: userError } = await supabaseClient
        .from('users')
        .select('pin_hash, pin_locked_until')
        .eq('id', sessionValidation.user_id)
        .single()

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      if (!user.pin_hash) {
        return new Response(
          JSON.stringify({ error: 'PIN not set', requiresSetup: true }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Check if account is locked
      if (user.pin_locked_until && new Date(user.pin_locked_until) > new Date()) {
        return new Response(
          JSON.stringify({ 
            error: 'Account locked',
            lockedUntil: user.pin_locked_until
          }),
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Verify PIN
      const isValid = await bcrypt.compare(pin, user.pin_hash)

      // Use database function for rate limiting
      const { data: verificationResult } = await supabaseClient
        .rpc('verify_worker_pin', {
          p_user_id: sessionValidation.user_id,
          p_pin_hash: isValid ? user.pin_hash : 'invalid',
          p_device_id: deviceId
        })

      if (!verificationResult?.success) {
        return new Response(
          JSON.stringify(verificationResult),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Update session activity
      await supabaseClient
        .from('worker_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('session_token', sessionToken)

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'PIN validated successfully'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Error in validate-worker-pin:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
