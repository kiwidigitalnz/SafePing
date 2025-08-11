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

    const { 
      email, 
      type, 
      metadata = {},
      organizationName,
      firstName,
      lastName,
      password
    } = await req.json()

    // Validate required fields
    if (!email || !type) {
      return new Response(JSON.stringify({ 
        error: 'Email and type are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // For signup verification, enhance metadata with password
    let enhancedMetadata = metadata
    if (type === 'signup_verification' && password) {
      enhancedMetadata = {
        ...metadata,
        password: password // Store password temporarily for account creation
      }
    }

    // Generate verification code
    const { data: codeData, error: codeError } = await supabase
      .rpc('create_verification_code', {
        p_email: email,
        p_type: type,
        p_metadata: enhancedMetadata,
        p_expires_minutes: 15
      })

    if (codeError) {
      console.error('Error creating verification code:', codeError)
      return new Response(JSON.stringify({ 
        error: 'Failed to create verification code' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const verificationCode = codeData[0]?.code
    const codeId = codeData[0]?.code_id
    
    if (!verificationCode || !codeId) {
      return new Response(JSON.stringify({ 
        error: 'Failed to generate verification code' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // For signup verification, create pending organization entry
    if (type === 'signup_verification' && enhancedMetadata?.slug) {
      const { error: pendingOrgError } = await supabase
        .from('pending_organizations')
        .insert({
          verification_code_id: codeId,
          name: organizationName || metadata.organization_name,
          slug: metadata.slug,
          admin_email: email,
          admin_first_name: firstName || metadata.first_name,
          admin_last_name: lastName || metadata.last_name
        })

      if (pendingOrgError) {
        console.error('Error creating pending organization:', pendingOrgError)
        // Don't fail the request, but log the error
        // The organization data is still in the verification_codes metadata
      }
    }

    // Send email based on type
    let emailContent
    let subject
    
    switch (type) {
      case 'signup_verification':
        subject = `Welcome to SafePing - Verify your email`
        emailContent = generateSignupEmail(verificationCode, firstName, organizationName)
        break
        
      case 'admin_invitation':
        subject = `You're invited to join ${organizationName} on SafePing`
        emailContent = generateInvitationEmail(verificationCode, firstName, organizationName, metadata.inviterName)
        break
        
      case 'password_reset':
        subject = `SafePing - Reset your password`
        emailContent = generatePasswordResetEmail(verificationCode, firstName)
        break
        
      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid verification type' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(JSON.stringify({ 
        error: 'Email service not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SafePing <noreply@novaly.app>',
        to: [email],
        subject: subject,
        html: emailContent,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Failed to send email:', errorText)
      return new Response(JSON.stringify({ 
        error: 'Failed to send verification email' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Verification code sent successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Verification code error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

function generateSignupEmail(code: string, firstName: string, organizationName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to SafePing</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; background: #2563eb; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .code { font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; letter-spacing: 4px; margin: 20px 0; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to SafePing!</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          <p>Thanks for signing up ${organizationName} with SafePing! To complete your registration, please verify your email address.</p>
          
          <p>Your verification code is:</p>
          <div class="code">${code}</div>
          
          <p>This code will expire in 15 minutes for security purposes.</p>
          
          <p>Once verified, you'll be able to:</p>
          <ul>
            <li>Set up your organization profile</li>
            <li>Add team members</li>
            <li>Configure safety check-ins</li>
            <li>Start your 14-day free trial</li>
          </ul>
          
          <div class="footer">
            <p>If you didn't create this account, you can safely ignore this email.</p>
            <p>Need help? Contact us at <a href="mailto:support@novaly.app">support@novaly.app</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateInvitationEmail(code: string, firstName: string, organizationName: string, inviterName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>You're invited to SafePing</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; background: #059669; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
        .code { font-size: 32px; font-weight: bold; color: #059669; text-align: center; letter-spacing: 4px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You're Invited!</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          <p>${inviterName || 'An administrator'} has invited you to join <strong>${organizationName}</strong> on SafePing.</p>
          
          <p>To accept this invitation and create your account, use this verification code:</p>
          <div class="code">${code}</div>
          
          <p>This code will expire in 15 minutes for security purposes.</p>
          
          <p>SafePing helps teams stay safe with:</p>
          <ul>
            <li>Regular safety check-ins</li>
            <li>Emergency alerts and notifications</li>
            <li>Real-time location sharing</li>
            <li>Automated escalation procedures</li>
          </ul>
          
          <div class="footer">
            <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
            <p>Need help? Contact us at <a href="mailto:support@novaly.app">support@novaly.app</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function generatePasswordResetEmail(code: string, firstName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset your SafePing password</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; background: #dc2626; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; }
        .code { font-size: 32px; font-weight: bold; color: #dc2626; text-align: center; letter-spacing: 4px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          <p>We received a request to reset your SafePing password. Use this verification code to proceed:</p>
          
          <div class="code">${code}</div>
          
          <p>This code will expire in 15 minutes for security purposes.</p>
          
          <div class="footer">
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <p>Need help? Contact us at <a href="mailto:support@novaly.app">support@novaly.app</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
