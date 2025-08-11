#!/bin/bash

# Test script for send-worker-invitation edge function

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing send-worker-invitation edge function${NC}"
echo "================================================"

# Check if SUPABASE_ANON_KEY is set
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}Error: SUPABASE_ANON_KEY environment variable is not set${NC}"
    echo "Please set it with: export SUPABASE_ANON_KEY='your-anon-key'"
    exit 1
fi

# Default values
SUPABASE_URL=${SUPABASE_URL:-"http://localhost:54321"}
PHONE_NUMBER=${1:-"+64212345678"}
WORKER_NAME=${2:-"Test Worker"}
ORGANIZATION_NAME=${3:-"SafePing"}

# Generate a test invitation token
INVITATION_TOKEN=$(uuidgen | tr '[:upper:]' '[:lower:]')

echo "Testing with:"
echo "  URL: $SUPABASE_URL/functions/v1/send-worker-invitation"
echo "  Phone: $PHONE_NUMBER"
echo "  Worker: $WORKER_NAME"
echo "  Organization: $ORGANIZATION_NAME"
echo "  Token: $INVITATION_TOKEN"
echo ""

# Make the request
echo -e "${YELLOW}Sending request...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" --location --request POST \
  "$SUPABASE_URL/functions/v1/send-worker-invitation" \
  --header "Authorization: Bearer $SUPABASE_ANON_KEY" \
  --header "Content-Type: application/json" \
  --data "{
    \"phoneNumber\": \"$PHONE_NUMBER\",
    \"invitationToken\": \"$INVITATION_TOKEN\",
    \"workerName\": \"$WORKER_NAME\",
    \"organizationName\": \"$ORGANIZATION_NAME\"
  }")

# Extract HTTP status code and response body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo ""
echo "HTTP Status Code: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

# Check if successful
if [ "$HTTP_CODE" -eq 200 ]; then
    echo ""
    echo -e "${GREEN}✓ Success! SMS invitation sent.${NC}"
    
    # Extract invitation details from response
    if command -v jq &> /dev/null; then
        INVITATION_URL=$(echo "$BODY" | jq -r '.invitation_url // empty')
        INVITATION_CODE=$(echo "$BODY" | jq -r '.invitation_code // empty')
        SMS_PROVIDER=$(echo "$BODY" | jq -r '.sms_provider // empty')
        
        if [ -n "$INVITATION_URL" ]; then
            echo ""
            echo "Invitation Details:"
            echo "  URL: $INVITATION_URL"
            echo "  Code: $INVITATION_CODE"
            echo "  SMS Provider: $SMS_PROVIDER"
        fi
    fi
else
    echo ""
    echo -e "${RED}✗ Failed to send SMS invitation${NC}"
    
    # Try to extract error message
    if command -v jq &> /dev/null; then
        ERROR_MSG=$(echo "$BODY" | jq -r '.error // .details // empty')
        if [ -n "$ERROR_MSG" ]; then
            echo "Error: $ERROR_MSG"
        fi
    fi
fi

echo ""
echo "================================================"
echo "To test with different parameters:"
echo "  $0 <phone_number> <worker_name> <organization_name>"
echo ""
echo "Example:"
echo "  $0 '+64212345678' 'John Doe' 'ACME Corp'"
