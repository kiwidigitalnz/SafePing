#!/bin/bash

# Deploy Staff/Worker Edge Functions
# This script deploys the edge functions needed for the staff onboarding system

echo "🚀 Deploying Staff/Worker Edge Functions..."
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}Error: supabase/config.toml not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Function to deploy an edge function
deploy_function() {
    local function_name=$1
    echo -e "\n${YELLOW}Deploying ${function_name}...${NC}"
    
    if supabase functions deploy $function_name --no-verify-jwt; then
        echo -e "${GREEN}✓ ${function_name} deployed successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to deploy ${function_name}${NC}"
        return 1
    fi
}

# Track deployment status
FAILED_DEPLOYMENTS=()

echo -e "\n📋 Pre-deployment Checklist:"
echo "  - Ensure you're logged into Supabase CLI"
echo "  - Ensure you have the correct project linked"
echo "  - Ensure SMS provider credentials are set in Edge Function secrets"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Deploy the staff/worker related functions
echo -e "\n${YELLOW}Starting deployment...${NC}"

# Core staff functions
deploy_function "send-worker-invitation" || FAILED_DEPLOYMENTS+=("send-worker-invitation")
deploy_function "verify-staff" || FAILED_DEPLOYMENTS+=("verify-staff")

# Additional related functions
deploy_function "validate-worker-pin" || FAILED_DEPLOYMENTS+=("validate-worker-pin")
deploy_function "verify-worker-device" || FAILED_DEPLOYMENTS+=("verify-worker-device")

# Check if the old function exists and warn about it
if [ -d "supabase/functions/verify-staff-invitation" ]; then
    echo -e "\n${YELLOW}⚠️  Warning: Old 'verify-staff-invitation' function directory still exists.${NC}"
    echo -e "${YELLOW}   This has been replaced by 'verify-staff'. Consider removing it.${NC}"
fi

echo -e "\n==========================================="
echo -e "📊 Deployment Summary:"
echo -e "==========================================="

if [ ${#FAILED_DEPLOYMENTS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All functions deployed successfully!${NC}"
    
    echo -e "\n📝 Next Steps:"
    echo "1. Test the invitation flow:"
    echo "   - Send an invitation from the web dashboard"
    echo "   - Verify SMS is received with 6-digit code"
    echo "   - Test verification in PWA app"
    echo ""
    echo "2. Verify environment variables are set:"
    echo "   - SMS_PROVIDER (twilio or messagebird)"
    echo "   - SMS provider credentials"
    echo "   - PWA_URL (https://my.safeping.app)"
    echo ""
    echo "3. Monitor the functions:"
    echo "   supabase functions logs send-worker-invitation --tail"
    echo "   supabase functions logs verify-staff --tail"
else
    echo -e "${RED}❌ Some functions failed to deploy:${NC}"
    for func in "${FAILED_DEPLOYMENTS[@]}"; do
        echo -e "${RED}   - $func${NC}"
    done
    echo ""
    echo -e "${YELLOW}Please check the error messages above and try again.${NC}"
    echo -e "${YELLOW}You can deploy individual functions with:${NC}"
    echo "   supabase functions deploy <function-name>"
    exit 1
fi

echo -e "\n✨ Deployment complete!"
