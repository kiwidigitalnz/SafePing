#!/bin/bash

# Deploy Edge Functions to Supabase
# This script deploys all Edge Functions required for SafePing to work properly

set -e

echo "🚀 Deploying SafePing Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

# Deploy Edge Functions
echo ""
echo "📦 Deploying Edge Functions..."

# Core functions for signup and verification
echo "   - send-verification-code"
supabase functions deploy send-verification-code

echo "   - verify-and-complete-signup"
supabase functions deploy verify-and-complete-signup

# Notification functions
echo "   - send-push-notification"
supabase functions deploy send-push-notification

# Escalation and incident management
echo "   - trigger-escalation"
supabase functions deploy trigger-escalation

echo "   - emergency-escalation"
supabase functions deploy emergency-escalation

echo "   - resolve-incident"
supabase functions deploy resolve-incident

# Scheduled functions
echo "   - process-overdue-checkins"
supabase functions deploy process-overdue-checkins

# Stripe integration
echo "   - stripe-webhook"
supabase functions deploy stripe-webhook

echo "   - manage-subscription"
supabase functions deploy manage-subscription

# Test function (optional)
echo "   - test-sms"
supabase functions deploy test-sms

# Cron setup
echo "   - setup-cron"
supabase functions deploy setup-cron

echo ""
echo "✅ All Edge Functions deployed successfully!"
echo ""
echo "⚠️  Important: Don't forget to set the required secrets:"
echo ""
echo "Required secrets:"
echo "   - RESEND_API_KEY (for email sending)"
echo "   - SMS_PROVIDER (clicksend or twilio)"
echo "   - CLICKSEND_USERNAME (if using ClickSend)"
echo "   - CLICKSEND_API_KEY (if using ClickSend)"
echo "   - TWILIO_ACCOUNT_SID (if using Twilio)"
echo "   - TWILIO_AUTH_TOKEN (if using Twilio)"
echo "   - TWILIO_FROM_NUMBER (if using Twilio)"
echo "   - STRIPE_SECRET_KEY (for payment processing)"
echo "   - STRIPE_WEBHOOK_SECRET (for Stripe webhooks)"
echo ""
echo "Set secrets using:"
echo "   supabase secrets set KEY=value"
echo ""
echo "Example:"
echo "   supabase secrets set RESEND_API_KEY=your_resend_api_key"
echo "   supabase secrets set SMS_PROVIDER=clicksend"
echo ""