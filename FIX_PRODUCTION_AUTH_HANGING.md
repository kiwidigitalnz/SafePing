# Fix Production Authentication Hanging Issue

## Problem

When clicking "Sign In" on the production site (web.safeping.app), the page shows a loading spinner indefinitely. The console shows:

- `[Auth Store] Starting initialization...` but never completes
- No error messages are displayed

## Root Cause

The production deployment is missing critical environment variables in DigitalOcean App Platform. The app is falling back to invalid default values (`'your-anon-key'`) which causes the Supabase authentication to fail silently.

## Immediate Solution

### Step 1: Verify Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your production project
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL**: `https://zcmtcegxebspzjrrgvtn.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbXRjZWd4ZWJzcHpqcnJndnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNjQ4MTYsImV4cCI6MjA2ODY0MDgxNn0.A8sK6tJEiskdVLt3vT67oKtyHByMdkQVQOA5AS91zOI`

### Step 2: Set Environment Variables in DigitalOcean

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click on your `safeping-production` app
3. Go to **Settings** tab
4. Scroll to **App-Level Environment Variables**
5. Click **Edit** and add/update these variables:

```
# Critical - Required for authentication to work
VITE_SUPABASE_URL=https://zcmtcegxebspzjrrgvtn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbXRjZWd4ZWJzcHpqcnJndnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNjQ4MTYsImV4cCI6MjA2ODY0MDgxNn0.A8sK6tJEiskdVLt3vT67oKtyHByMdkQVQOA5AS91zOI

# Application URLs
VITE_APP_URL=https://web.safeping.app
VITE_PWA_URL=https://my.safeping.app
VITE_LANDING_URL=https://safeping.app

# Google OAuth (if using)
VITE_GOOGLE_CLIENT_ID=340509101186-pgr69bv4eq30e93h4bmfajcp4kc1c2i7.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://web.safeping.app/auth/callback

# Optional
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key_if_using_payments
VITE_ENABLE_ANALYTICS=true
VITE_GA_TRACKING_ID=your_ga_tracking_id_if_using
```

6. **Important**: Make sure the variables are set with scope **BUILD_TIME** (not RUN_TIME)
7. Click **Save**

### Step 3: Trigger Redeployment

After saving the environment variables:

1. DigitalOcean will automatically trigger a new deployment
2. You can also manually trigger by clicking **Deploy** → **Deploy from Source**
3. Wait for deployment to complete (5-10 minutes)

### Step 4: Verify the Fix

1. Clear your browser cache (important!)
2. Go to https://web.safeping.app
3. Click "Sign In"
4. The sign-in form should now load properly
5. Check browser console - you should see:
   - `[Auth Store] Starting initialization...`
   - `[Auth Store] No stored session found` or `[Auth Store] Initial user check completed`

## Why This Happened

The production build was using fallback values from the code:

```javascript
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "http://localhost:54321";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";
```

Without proper environment variables, it was trying to connect with `'your-anon-key'` which is invalid, causing the authentication to hang.

## Prevention

1. **Never commit real credentials to Git** - Use environment variables
2. **Always verify environment variables** after deployment
3. **Add health checks** to verify Supabase connection on app startup
4. **Use proper error handling** to catch and display connection issues

## Additional Checks

If the issue persists after setting environment variables:

1. **Check Supabase Dashboard**:
   - Verify your project is active
   - Check if there are any rate limits hit
   - Verify the Site URL is set to `https://web.safeping.app`

2. **Check Browser Console**:
   - Look for any CORS errors
   - Check for network errors in the Network tab

3. **Verify DNS**:
   - Ensure web.safeping.app resolves correctly
   - Check SSL certificate is valid

## Quick Test

You can test if Supabase is accessible by running this in the browser console:

```javascript
fetch("https://zcmtcegxebspzjrrgvtn.supabase.co/auth/v1/health")
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

This should return a health check response if Supabase is accessible.

## Support

If issues persist after following these steps:

1. Check DigitalOcean deployment logs for build errors
2. Verify all environment variables are correctly set
3. Contact support with deployment logs and browser console errors
