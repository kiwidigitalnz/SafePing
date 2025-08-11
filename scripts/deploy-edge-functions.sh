#!/bin/bash

# Deploy Edge Functions to Supabase with proper environment variables
# This script ensures all SMS-related Edge Functions have the correct configuration

echo "🚀 Deploying Edge Functions to Supabase..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "brew install supabase/tap/supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📋 Setting up Edge Function secrets..."

# Function to set a secret
set_secret() {
    local key=$1
    local prompt=$2
    local current_value=$(supabase secrets list 2>/dev/null | grep "$key" | awk '{print $2}')
    
    if [ -n "$current_value" ] && [ "$current_value" != "null" ]; then
        echo "✅ $key is already set"
    else
        read -p "$prompt: " value
        if [ -n "$value" ]; then
            supabase secrets set $key="$value"
            echo "✅ $key has been set"
        else
            echo "⚠️  Skipping $key (no value provided)"
        fi
    fi
}

# Set SMS Provider (required)
echo ""
echo "Setting SMS Provider configuration..."
set_secret "SMS_PROVIDER" "Enter SMS provider (clicksend or twilio)"

# Set ClickSend credentials
echo ""
echo "Setting ClickSend credentials..."
set_secret "CLICKSEND_USERNAME" "Enter ClickSend username"
set_secret "CLICKSEND_API_KEY" "Enter ClickSend API key"

# Set PWA URL for invitation links
echo ""
echo "Setting application URLs..."
set_secret "PWA_URL" "Enter PWA URL (default: https://my.safeping.app)"

# Deploy the Edge Functions
echo ""
echo "🚀 Deploying Edge Functions..."

# Deploy send-worker-invitation function
echo "Deploying send-worker-invitation..."
supabase functions deploy send-worker-invitation

# Deploy send-verification-code function
echo "Deploying send-verification-code..."
supabase functions deploy send-verification-code

# Deploy test-sms function (for testing)
echo "Deploying test-sms..."
supabase functions deploy test-sms

echo ""
echo "✅ Edge Functions deployed successfully!"
echo ""
echo "📝 Current secrets configuration:"
supabase secrets list | grep -E "(SMS_PROVIDER|CLICKSEND_USERNAME|CLICKSEND_API_KEY|PWA_URL)"

echo ""
echo "🧪 To test SMS functionality, run:"
echo "curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/test-sms' \\"
echo "  --header 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "  --header 'Content-Type: application/json' \\"
echo "  --data '{\"phoneNumber\": \"+64212345678\", \"message\": \"Test message\"}'"
