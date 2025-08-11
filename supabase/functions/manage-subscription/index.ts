import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.11.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user's organization and verify admin permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role, first_name, last_name, email')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!['org_admin', 'admin', 'super_admin'].includes(userData.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, email, phone')
      .eq('id', userData.organization_id)
      .single()

    if (orgError || !organization) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, planId, successUrl, cancelUrl } = await req.json()

    switch (action) {
      case 'create_checkout_session':
        return await createCheckoutSession(stripe, supabase, organization, userData, planId, successUrl, cancelUrl)
      
      case 'create_portal_session':
        return await createPortalSession(stripe, supabase, organization, successUrl)
      
      case 'get_subscription':
        return await getSubscription(supabase, organization.id)
      
      case 'cancel_subscription':
        return await cancelSubscription(stripe, supabase, organization.id)
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

  } catch (error) {
    console.error('Subscription management error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function createCheckoutSession(
  stripe: Stripe, 
  supabase: any, 
  organization: any, 
  userData: any, 
  planId: string,
  successUrl: string,
  cancelUrl: string
) {
  // Get subscription plan
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (planError || !plan) {
    return new Response(JSON.stringify({ error: 'Plan not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Check if organization already has a customer
  let { data: existingSubscription } = await supabase
    .from('organization_subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', organization.id)
    .single()

  let customerId = existingSubscription?.stripe_customer_id

  if (!customerId) {
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: organization.email || userData.email,
      name: organization.name,
      metadata: {
        organization_id: organization.id,
        user_id: userData.id,
      },
    })
    customerId = customer.id
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.stripe_price_id,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 14, // 14-day trial
      metadata: {
        organization_id: organization.id,
        plan_id: planId,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  })

  // Update or create subscription record with customer ID
  const subscriptionData = {
    organization_id: organization.id,
    plan_id: planId,
    stripe_customer_id: customerId,
    status: 'incomplete',
    trial_start: new Date().toISOString(),
    trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
  }

  if (existingSubscription) {
    await supabase
      .from('organization_subscriptions')
      .update(subscriptionData)
      .eq('organization_id', organization.id)
  } else {
    await supabase
      .from('organization_subscriptions')
      .insert(subscriptionData)
  }

  return new Response(JSON.stringify({ 
    sessionId: session.id,
    url: session.url 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

async function createPortalSession(
  stripe: Stripe, 
  supabase: any, 
  organization: any,
  returnUrl: string
) {
  // Get existing subscription
  const { data: subscription, error } = await supabase
    .from('organization_subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', organization.id)
    .single()

  if (error || !subscription?.stripe_customer_id) {
    return new Response(JSON.stringify({ error: 'No subscription found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: returnUrl,
  })

  return new Response(JSON.stringify({ 
    url: portalSession.url 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

async function getSubscription(supabase: any, organizationId: string) {
  const { data, error } = await supabase
    .rpc('get_organization_subscription', { org_id: organizationId })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ subscription: data[0] || null }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

async function cancelSubscription(stripe: Stripe, supabase: any, organizationId: string) {
  // Get existing subscription
  const { data: subscription, error } = await supabase
    .from('organization_subscriptions')
    .select('stripe_subscription_id')
    .eq('organization_id', organizationId)
    .single()

  if (error || !subscription?.stripe_subscription_id) {
    return new Response(JSON.stringify({ error: 'No subscription found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Cancel at period end in Stripe
  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: true,
  })

  // Update database
  await supabase
    .from('organization_subscriptions')
    .update({ cancel_at_period_end: true })
    .eq('organization_id', organizationId)

  return new Response(JSON.stringify({ 
    success: true,
    message: 'Subscription will be canceled at the end of the billing period'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}