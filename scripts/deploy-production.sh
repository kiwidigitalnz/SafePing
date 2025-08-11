#!/bin/bash

# SafePing Production Deployment Script
# This script prepares and deploys the SafePing application to DigitalOcean

set -e

echo "🚀 SafePing Production Deployment Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    if ! command -v doctl &> /dev/null; then
        echo -e "${YELLOW}⚠️  DigitalOcean CLI (doctl) is not installed${NC}"
        echo "Install it from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    fi
    
    echo -e "${GREEN}✅ Requirements check passed${NC}"
}

# Build Docker image locally for testing
build_local() {
    echo "🔨 Building Docker image locally..."
    docker build -t safeping-production:latest .
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
}

# Test the build locally
test_local() {
    echo "🧪 Testing locally..."
    echo "Starting container on http://localhost:8080"
    docker run -d -p 8080:80 --name safeping-test safeping-production:latest
    
    echo -e "${YELLOW}Test the following URLs:${NC}"
    echo "  - Landing: http://localhost:8080"
    echo "  - Web App: http://web.localhost:8080"
    echo "  - PWA: http://my.localhost:8080"
    echo ""
    echo "Press any key to stop the test container..."
    read -n 1
    
    docker stop safeping-test
    docker rm safeping-test
    echo -e "${GREEN}✅ Local test completed${NC}"
}

# Deploy to DigitalOcean
deploy_to_do() {
    echo "🚢 Deploying to DigitalOcean..."
    
    # Check if app spec exists
    if [ ! -f ".do/app.yaml" ]; then
        echo -e "${RED}❌ .do/app.yaml not found${NC}"
        exit 1
    fi
    
    # Update GitHub username in app.yaml
    read -p "Enter your GitHub username: " github_username
    sed -i.bak "s/YOUR_GITHUB_USERNAME/$github_username/g" .do/app.yaml
    
    echo "Creating/Updating DigitalOcean App..."
    
    # Check if doctl is configured
    if command -v doctl &> /dev/null; then
        # Create or update the app
        doctl apps create --spec .do/app.yaml || doctl apps update $(doctl apps list --format ID --no-header | head -1) --spec .do/app.yaml
        echo -e "${GREEN}✅ Deployment initiated on DigitalOcean${NC}"
    else
        echo -e "${YELLOW}⚠️  Please manually create the app in DigitalOcean using the .do/app.yaml file${NC}"
    fi
}

# Update environment variables
update_env() {
    echo "📝 Environment Variables Checklist"
    echo "=================================="
    echo "Make sure to set these in DigitalOcean App Platform:"
    echo ""
    echo "Required:"
    echo "  ✓ SUPABASE_URL"
    echo "  ✓ SUPABASE_ANON_KEY"
    echo "  ✓ GOOGLE_CLIENT_ID"
    echo "  ✓ STRIPE_PUBLIC_KEY"
    echo "  ✓ VAPID_PUBLIC_KEY"
    echo ""
    echo "Also update in Supabase Dashboard:"
    echo "  ✓ Site URL: https://web.safeping.app"
    echo "  ✓ Redirect URLs: https://web.safeping.app/auth/callback"
    echo ""
    echo "Update in Google Cloud Console:"
    echo "  ✓ Authorized redirect URIs: https://web.safeping.app/auth/callback"
    echo ""
}

# Main menu
main() {
    check_requirements
    
    echo ""
    echo "What would you like to do?"
    echo "1) Build Docker image locally"
    echo "2) Test locally"
    echo "3) Deploy to DigitalOcean"
    echo "4) Show environment variables checklist"
    echo "5) Full deployment (build + test + deploy)"
    echo "6) Exit"
    echo ""
    read -p "Select an option (1-6): " choice
    
    case $choice in
        1)
            build_local
            ;;
        2)
            build_local
            test_local
            ;;
        3)
            deploy_to_do
            update_env
            ;;
        4)
            update_env
            ;;
        5)
            build_local
            test_local
            deploy_to_do
            update_env
            ;;
        6)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}🎉 Done!${NC}"
}

# Run main function
main
