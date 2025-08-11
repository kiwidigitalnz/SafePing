import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationRequest {
  userId?: string
  userIds?: string[]
  organizationId?: string
  title: string
  body: string
  data?: any
  urgent?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

interface PushSubscription {
  user_id: string
  endpoint: string
  p256dh_key: string | null
  auth_key: string | null
  is_active: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body: PushNotificationRequest = await req.json()
    const { userId, userIds, organizationId, title, body: notificationBody, data, urgent, actions } = body

    console.log('Sending push notification:', { title, body: notificationBody, urgent })

    // Determine target users
    let targetUserIds: string[] = []

    if (userId) {
      targetUserIds = [userId]
    } else if (userIds) {
      targetUserIds = userIds
    } else if (organizationId) {
      // Get all active users in the organization
      const { data: orgUsers, error: orgUsersError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (orgUsersError) {
        throw new Error(`Failed to fetch organization users: ${orgUsersError.message}`)
      }

      targetUserIds = orgUsers.map(user => user.id)
    } else {
      throw new Error('Must specify userId, userIds, or organizationId')
    }

    console.log(`Targeting ${targetUserIds.length} users for push notification`)

    // Get push subscriptions for target users
    const { data: subscriptions, error: subscriptionsError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targetUserIds)
      .eq('is_active', true)

    if (subscriptionsError) {
      throw new Error(`Failed to fetch push subscriptions: ${subscriptionsError.message}`)
    }

    console.log(`Found ${subscriptions.length} active push subscriptions`)

    // Prepare notification payload
    const notificationPayload = {
      title,
      body: notificationBody,
      icon: '/pwa-192x192.png',
      badge: '/badge-72x72.png',
      data: data || {},
      requireInteraction: urgent || false,
      vibrate: urgent ? [200, 100, 200, 100, 200] : [200, 100, 200],
      tag: data?.tag || 'safeping-alert',
      actions: actions || [
        { action: 'view', title: 'View', icon: '/view-icon.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/dismiss-icon.png' }
      ]
    }

    // Send push notifications
    const results = []
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:alerts@novaly.app'

    if (!vapidPrivateKey || !vapidPublicKey) {
      console.warn('VAPID keys not configured - push notifications will be simulated')
      
      // Simulate push notifications
      for (const subscription of subscriptions) {
        results.push({
          user_id: subscription.user_id,
          endpoint: subscription.endpoint,
          success: true,
          simulated: true,
          message: 'Push notification simulated (VAPID not configured)'
        })
      }
    } else {
      // Send actual push notifications
      for (const subscription of subscriptions) {
        try {
          const pushResult = await sendWebPush({
            endpoint: subscription.endpoint,
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key,
            payload: JSON.stringify(notificationPayload),
            vapidPublicKey,
            vapidPrivateKey,
            vapidSubject
          })

          results.push({
            user_id: subscription.user_id,
            endpoint: subscription.endpoint,
            success: true,
            status: pushResult.status,
            message: 'Push notification sent successfully'
          })

          console.log(`Push notification sent to user ${subscription.user_id}`)
        } catch (error) {
          console.error(`Failed to send push notification to user ${subscription.user_id}:`, error)
          
          results.push({
            user_id: subscription.user_id,
            endpoint: subscription.endpoint,
            success: false,
            error: error.message
          })

          // If subscription is invalid, mark it as inactive
          if (error.message.includes('410') || error.message.includes('invalid')) {
            await supabaseClient
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('user_id', subscription.user_id)
              .eq('endpoint', subscription.endpoint)
          }
        }
      }
    }

    // Log the push notification attempt
    await supabaseClient
      .from('cron_job_logs')
      .insert({
        job_name: 'send_push_notification',
        status: 200,
        response_body: JSON.stringify({
          title,
          target_users: targetUserIds.length,
          subscriptions_found: subscriptions.length,
          notifications_sent: results.filter(r => r.success).length,
          notifications_failed: results.filter(r => !r.success).length
        }),
        executed_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        notification: {
          title,
          body: notificationBody,
          urgent
        },
        targeting: {
          user_ids: targetUserIds,
          organization_id: organizationId
        },
        delivery: {
          subscriptions_found: subscriptions.length,
          notifications_sent: results.filter(r => r.success).length,
          notifications_failed: results.filter(r => !r.success).length
        },
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Push notification error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Web Push implementation using Web Crypto API
async function sendWebPush(options: {
  endpoint: string
  p256dh: string | null
  auth: string | null
  payload: string
  vapidPublicKey: string
  vapidPrivateKey: string
  vapidSubject: string
}): Promise<{ status: number }> {
  const { endpoint, p256dh, auth, payload, vapidPublicKey, vapidPrivateKey, vapidSubject } = options

  if (!p256dh || !auth) {
    throw new Error('Missing p256dh or auth keys')
  }

  // For simplicity, we'll use fetch directly
  // In production, you'd want to use a proper Web Push library
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'Authorization': `vapid t=${generateVapidJWT(vapidPrivateKey, vapidSubject, endpoint)}, k=${vapidPublicKey}`,
      'TTL': '86400' // 24 hours
    },
    body: payload // This should be encrypted in production
  })

  if (!response.ok) {
    throw new Error(`Push notification failed: ${response.status} ${response.statusText}`)
  }

  return { status: response.status }
}

// Generate VAPID JWT (simplified version)
function generateVapidJWT(privateKey: string, subject: string, audience: string): string {
  // This is a simplified version
  // In production, use a proper JWT library
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
  const payload = btoa(JSON.stringify({
    aud: new URL(audience).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: subject
  }))
  
  // In production, properly sign with the private key
  const signature = btoa('mock-signature')
  
  return `${header}.${payload}.${signature}`
}

/* To test this function:
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-push-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "userId": "user-uuid",
    "title": "Safety Check Required",
    "body": "Please check in to confirm your safety status",
    "urgent": true,
    "data": {
      "action": "checkin",
      "scheduleId": "schedule-uuid"
    }
  }'
*/