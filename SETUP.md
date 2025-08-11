# SafePing Setup Guide

This guide walks you through setting up SafePing for production use.

## Prerequisites

- Node.js 18+ and pnpm
- Supabase CLI (`npm install -g supabase`)
- A Supabase project (create one at https://supabase.com)
- Email service account (Resend)
- SMS service account (ClickSend or Twilio)
- Stripe account for payments

## 1. Initial Setup

### Clone and install dependencies
```bash
git clone <repository-url>
cd SafePing
pnpm install
```

### Environment variables
Copy the example environment files and update with your values:

```bash
# For web app
cp apps/web/.env.example apps/web/.env.local

# For PWA
cp apps/pwa/.env.example apps/pwa/.env.local
```

Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

## 2. Database Setup

### Link to your Supabase project
```bash
supabase login
supabase link --project-ref <your-project-ref>
```

### Run migrations
```bash
supabase db push
```

This will create all necessary tables, functions, and RLS policies.

## 3. Edge Functions Deployment

### Deploy all Edge Functions
```bash
./scripts/deploy-functions.sh
```

### Set required secrets
```bash
# Email service (Resend)
supabase secrets set RESEND_API_KEY=<your-resend-api-key>

# SMS service (choose one)
# For ClickSend:
supabase secrets set SMS_PROVIDER=clicksend
supabase secrets set CLICKSEND_USERNAME=<your-username>
supabase secrets set CLICKSEND_API_KEY=<your-api-key>

# For Twilio:
supabase secrets set SMS_PROVIDER=twilio
supabase secrets set TWILIO_ACCOUNT_SID=<your-account-sid>
supabase secrets set TWILIO_AUTH_TOKEN=<your-auth-token>
supabase secrets set TWILIO_FROM_NUMBER=<your-twilio-number>

# Stripe (for payments)
supabase secrets set STRIPE_SECRET_KEY=<your-stripe-secret-key>
supabase secrets set STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
```

## 4. Cron Jobs Setup

Run the setup-cron Edge Function to configure scheduled tasks:

```bash
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/setup-cron \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json"
```

This sets up:
- Check-in processing (every minute)
- Overdue escalations (every 5 minutes)
- Trial expiration checks (daily)

## 5. Local Development

Start all development servers:
```bash
pnpm dev
```

This runs:
- Web app: http://localhost:5173
- PWA: http://localhost:5174
- Landing site: http://localhost:5175

## 6. Production Deployment

### Build all apps
```bash
pnpm build
```

### Deploy to your hosting provider
- Web app: Deploy `apps/web/dist`
- PWA: Deploy `apps/pwa/dist`
- Landing: Deploy `apps/landing/dist`

### Configure domains
Update your environment variables with production URLs:
- `VITE_WEB_URL`: Your admin dashboard URL
- `VITE_PWA_URL`: Your worker app URL
- `VITE_SITE_URL`: Your landing page URL

## 7. Post-Deployment

### Test the signup flow
1. Navigate to your web app
2. Click "Sign up" and create an organization
3. Check your email for the verification code
4. Complete the verification process
5. Set up your organization profile

### Configure Stripe webhook
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
3. Select events: `customer.subscription.*`, `invoice.*`
4. Copy the webhook secret and set it in Supabase

### Monitor Edge Functions
View logs in Supabase Dashboard > Edge Functions > Logs

## Troubleshooting

### Edge Function errors
- Check logs: `supabase functions logs <function-name>`
- Verify secrets are set: `supabase secrets list`
- Test functions locally: `supabase functions serve`

### Email not sending
- Verify RESEND_API_KEY is set correctly
- Check Resend dashboard for API logs
- Ensure sender domain is verified in Resend

### SMS not sending
- Verify SMS provider credentials
- Check provider dashboard for errors
- Test with test-sms function

### Database errors
- Check RLS policies: `supabase db dump --data-only=false`
- Verify migrations ran successfully
- Check Supabase logs for SQL errors

## Support

For issues or questions:
- GitHub Issues: [repository-issues-url]
- Email: support@novaly.app
- Documentation: https://docs.safeping.com