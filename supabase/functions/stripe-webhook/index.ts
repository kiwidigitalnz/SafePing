import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.11.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
      console.error('Missing Stripe signature or webhook secret')
      return new Response('Webhook signature verification failed', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    console.log('Processing Stripe event:', event.type)

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(supabase, event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object as Stripe.Invoice)
        break

      case 'customer.created':
        await handleCustomerCreated(supabase, event.data.object as Stripe.Customer)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Log the billing event
    await supabase.from('billing_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      metadata: event.data.object,
      organization_id: await getOrganizationFromEvent(supabase, event)
    })

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  console.log('Handling subscription updated:', subscription.id)

  const { data: existingSubscription, error: fetchError } = await supabase
    .from('organization_subscriptions')
    .select('id, organization_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching subscription:', fetchError)
    return
  }

  const subscriptionData = {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
  }

  if (existingSubscription) {
    // Update existing subscription
    const { error } = await supabase
      .from('organization_subscriptions')
      .update(subscriptionData)
      .eq('id', existingSubscription.id)

    if (error) {
      console.error('Error updating subscription:', error)
    }
  } else {
    // Create new subscription record
    const { data: customer } = await supabase
      .from('organization_subscriptions')
      .select('organization_id')
      .eq('stripe_customer_id', subscription.customer)
      .single()

    if (customer) {
      const { error } = await supabase
        .from('organization_subscriptions')
        .insert({
          ...subscriptionData,
          organization_id: customer.organization_id
        })

      if (error) {
        console.error('Error creating subscription:', error)
      }
    }
  }
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  console.log('Handling subscription deleted:', subscription.id)

  const { error } = await supabase
    .from('organization_subscriptions')
    .update({ 
      status: 'canceled',
      canceled_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error canceling subscription:', error)
  }
}

async function handlePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  console.log('Handling payment succeeded:', invoice.id)

  // Get organization from subscription
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select('organization_id, id')
    .eq('stripe_subscription_id', invoice.subscription)
    .single()

  if (subscription) {
    await supabase.from('billing_events').insert({
      organization_id: subscription.organization_id,
      subscription_id: subscription.id,
      stripe_event_id: `payment_succeeded_${invoice.id}`,
      event_type: 'payment_succeeded',
      amount_cents: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: invoice.payment_intent as string,
    })
  }
}

async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  console.log('Handling payment failed:', invoice.id)

  // Get organization from subscription
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select('organization_id, id')
    .eq('stripe_subscription_id', invoice.subscription)
    .single()

  if (subscription) {
    await supabase.from('billing_events').insert({
      organization_id: subscription.organization_id,
      subscription_id: subscription.id,
      stripe_event_id: `payment_failed_${invoice.id}`,
      event_type: 'payment_failed',
      amount_cents: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: invoice.payment_intent as string,
    })
  }
}

async function handleCustomerCreated(supabase: any, customer: Stripe.Customer) {
  console.log('Handling customer created:', customer.id)
  // Customer creation is handled when creating subscriptions
  // This webhook mainly serves as a backup/verification
}

async function getOrganizationFromEvent(supabase: any, event: Stripe.Event): Promise<string | null> {
  try {
    const object = event.data.object as any

    // Try to get organization from customer ID
    if (object.customer) {
      const { data } = await supabase
        .from('organization_subscriptions')
        .select('organization_id')
        .eq('stripe_customer_id', object.customer)
        .single()

      return data?.organization_id || null
    }

    return null
  } catch (error) {
    console.error('Error getting organization from event:', error)
    return null
  }
}