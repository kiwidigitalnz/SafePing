import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ 
        error: 'Email is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check for pending verification codes
    const { data: verificationData, error: verificationError } = await supabase
      .from('verification_codes')
      .select('id, type, metadata, expires_at, created_at')
      .eq('email', email)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    if (verificationError) {
      console.error('Error checking verification:', verificationError)
      return new Response(JSON.stringify({ 
        error: 'Failed to check verification status' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user exists in public.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('email', email)
      .limit(1)

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking user:', userError)
      return new Response(JSON.stringify({ 
        error: 'Failed to check user status' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // User exists in public.users - they're fully registered
    if (userData && userData.length > 0) {
      return new Response(JSON.stringify({ 
        status: 'registered',
        hasOrganization: !!userData[0].organization_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Check for pending organization (signup flow)
    if (verificationData && verificationData.length > 0) {
      const verification = verificationData[0]
      
      // Also check if there's a pending organization
      const { data: pendingOrg } = await supabase
        .from('pending_organizations')
        .select('name, slug')
        .eq('verification_code_id', verification.id)
        .single()

      return new Response(JSON.stringify({ 
        status: 'pending_verification',
        verificationType: verification.type,
        metadata: {
          ...verification.metadata,
          organizationName: pendingOrg?.name || verification.metadata?.organization_name,
          firstName: verification.metadata?.first_name,
          lastName: verification.metadata?.last_name
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // No verification codes and no user record
    return new Response(JSON.stringify({ 
      status: 'not_found',
      message: 'No active account or pending verification found'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Verification status check error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})