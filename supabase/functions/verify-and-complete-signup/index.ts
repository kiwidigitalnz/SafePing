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

    const { email, code, type, organizationName, firstName, lastName, password, slug, ...otherParams } = await req.json()

    // Validate required fields
    if (!email || !code || !type) {
      return new Response(JSON.stringify({ 
        error: 'Email, code, and type are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the code
    const { data: verificationData, error: verificationError } = await supabase
      .rpc('verify_code', {
        p_email: email,
        p_code: code,
        p_type: type
      })

    if (verificationError) {
      console.error('Verification error:', verificationError)
      return new Response(JSON.stringify({ 
        error: 'Invalid verification code' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!verificationData || verificationData.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Invalid verification code' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const verificationRecord = verificationData[0]
    
    // Check if verification was successful
    if (!verificationRecord.success) {
      return new Response(JSON.stringify({ 
        error: verificationRecord.error_message || 'Invalid verification code' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    const metadata = verificationRecord.metadata || {}

    // Merge stored metadata with frontend data (frontend data takes precedence if provided)
    const finalData = {
      first_name: firstName || metadata.first_name,
      last_name: lastName || metadata.last_name,
      organization_name: organizationName || metadata.organization_name,
      password: password || metadata.password,
      slug: slug || metadata.slug
    }

    // For signup verification, create the user account and organization
    if (type === 'signup_verification') {
      try {
        // Create the user account in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: finalData.password || 'TempPassword123!', // Use merged password or temp
          email_confirm: true,
          user_metadata: {
            first_name: finalData.first_name,
            last_name: finalData.last_name,
            organization_name: finalData.organization_name
          }
        })

        if (authError) {
          console.error('Auth user creation error:', authError)
          return new Response(JSON.stringify({ 
            error: 'Failed to create user account' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const userId = authData.user?.id
        if (!userId) {
          return new Response(JSON.stringify({ 
            error: 'Failed to create user account' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Generate organization ID first
        const orgId = crypto.randomUUID()

        // Create organization first WITHOUT primary_admin_id (to avoid foreign key constraint)
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            id: orgId,
            name: finalData.organization_name,
            slug: finalData.slug,
            subscription_status: 'trial',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days trial
          })
          .select()
          .single()

        if (orgError) {
          console.error('Organization creation error:', orgError)
          // Clean up the auth user if org creation fails
          await supabase.auth.admin.deleteUser(userId)
          return new Response(JSON.stringify({ 
            error: 'Failed to create organization' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Create user record in users table (now with organization_id)
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: email,
            first_name: finalData.first_name,
            last_name: finalData.last_name,
            organization_id: orgData.id,
            role: 'org_admin',
            is_active: true
          })

        if (userError) {
          console.error('User record creation error:', userError)
          // Clean up auth user and organization
          await supabase.auth.admin.deleteUser(userId)
          await supabase.from('organizations').delete().eq('id', orgData.id)
          return new Response(JSON.stringify({ 
            error: 'Failed to create user record' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Now update the organization with the primary_admin_id
        const { error: updateOrgError } = await supabase
          .from('organizations')
          .update({ primary_admin_id: userId })
          .eq('id', orgData.id)

        if (updateOrgError) {
          console.error('Organization update error:', updateOrgError)
          // Clean up everything
          await supabase.auth.admin.deleteUser(userId)
          await supabase.from('users').delete().eq('id', userId)
          await supabase.from('organizations').delete().eq('id', orgData.id)
          return new Response(JSON.stringify({ 
            error: 'Failed to update organization' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Mark verification code as used
        await supabase
          .from('verification_codes')
          .update({ used_at: new Date().toISOString() })
          .eq('id', verificationRecord.id)

        // Sign in the user automatically after account creation
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: finalData.password || 'TempPassword123!'
        })

        if (signInError) {
          console.error('Auto sign-in error:', signInError)
          // Don't fail the whole process, just return without session
        }

        return new Response(JSON.stringify({ 
          success: true,
          authUserId: userId, // Frontend expects this field
          organizationId: orgData.id, // Frontend expects this field
          session: signInData?.session, // Include session for frontend
          user: {
            id: userId,
            email: email,
            first_name: finalData.first_name,
            last_name: finalData.last_name,
            organization_id: orgData.id,
            role: 'org_admin'
          },
          organization: {
            id: orgData.id,
            name: finalData.organization_name,
            slug: finalData.slug
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })

      } catch (error) {
        console.error('Signup completion error:', error)
        return new Response(JSON.stringify({ 
          error: 'Failed to complete signup' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // For other verification types (admin_invitation, password_reset), handle accordingly
    if (type === 'admin_invitation') {
      // Similar logic for admin invitation
      // This would create a user account and add them to an existing organization
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Admin invitation verified successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (type === 'password_reset') {
      // For password reset, just mark the code as verified
      // The actual password change would happen in a separate step
      await supabase
        .from('verification_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', verificationRecord.id)

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Password reset code verified successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid verification type' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Verification completion error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
