#!/bin/bash

# Fix Production Environment Variables Deployment Script
# This script commits and pushes the fixes for production environment variables

echo "🔧 SafePing Production Environment Variables Fix"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "Dockerfile" ] || [ ! -f ".do/app.yaml" ]; then
    echo "❌ Error: This script must be run from the SafePing root directory"
    exit 1
fi

# Check git status
echo "📋 Checking git status..."
git status --short

echo ""
echo "📝 Files to be committed:"
echo "  - Dockerfile (updated to accept build arguments)"
echo "  - .do/app.yaml (fixed environment variable names)"
echo "  - FIX_PRODUCTION_ENV_VARS.md (documentation)"
echo ""

# Confirm before proceeding
read -p "Do you want to commit and push these changes? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Add files
echo ""
echo "📦 Adding files to git..."
git add Dockerfile .do/app.yaml FIX_PRODUCTION_ENV_VARS.md

# Commit
echo "💾 Committing changes..."
git commit -m "Fix production environment variables for Supabase connection

- Updated Dockerfile to accept and pass build arguments
- Fixed app.yaml to use consistent VITE_ prefixed variables
- Added comprehensive documentation for the fix

This resolves:
1. Sign-in hanging on web.safeping.app
2. Staff verification errors on my.safeping.app
3. Edge Function authentication failures

The issue was that environment variables weren't being passed
to the Vite build process, causing the apps to use fallback
values like 'your-anon-key' instead of actual credentials."

# Push to main
echo "🚀 Pushing to main branch..."
git push origin main

echo ""
echo "✅ Changes pushed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to DigitalOcean App Platform dashboard"
echo "2. Set the following App-Level Environment Variables:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "   - VITE_GOOGLE_CLIENT_ID"
echo "   (See FIX_PRODUCTION_ENV_VARS.md for values)"
echo "3. The deployment will trigger automatically"
echo "4. Wait 5-10 minutes for deployment to complete"
echo "5. Test sign-in on web.safeping.app"
echo "6. Test staff verification on my.safeping.app"
echo ""
echo "📖 For detailed instructions, see: FIX_PRODUCTION_ENV_VARS.md"
