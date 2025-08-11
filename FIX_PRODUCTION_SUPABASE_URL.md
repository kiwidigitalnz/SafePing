# Fix Production Supabase URL Issue

## Problem
The production app at web.safeping.app is trying to connect to `localhost:5173` instead of your production Supabase instance, causing the SMS functionality to fail.

## Root Cause
The environment variables `SUPABASE_URL` and `SUPABASE_ANON_KEY` are not set in DigitalOcean App Platform.

## Solution

### Step 1: Get Your Supabase Credentials

1. Go to your Supabase Dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (the `anon` key, not the `service_role` key)

### Step 2: Set Environment Variables in DigitalOcean

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click on your `safeping-production` app
3. Go to **Settings** → **App-Level Environment Variables**
4. Add these variables:

   | Key | Value |
   |-----|-------|
   | `SUPABASE_URL` | Your Supabase project URL (e.g., `https://xxxxx.supabase.co`) |
   | `SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `GOOGLE_CLIENT_ID` | Your Google OAuth client ID (if using Google login) |
   | `STRIPE_PUBLIC_KEY` | Your Stripe publishable key (if using payments) |
   | `VAPID_PUBLIC_KEY` | Your VAPID public key (if using push notifications) |

5. Click **Save**

### Step 3: Redeploy

After saving the environment variables:
1. DigitalOcean will automatically trigger a new deployment
2. Wait for the deployment to complete (usually 5-10 minutes)
3. Test the SMS functionality again

## Verification

Once deployed, verify the fix:
1. Go to https://web.safeping.app
2. Navigate to the Staff page
3. Try resending an SMS invitation
4. The error should no longer mention `localhost:5173`

## Important Notes

- The `.env.production` files in the repository are templates and should NOT contain actual credentials
- All sensitive configuration should be done through DigitalOcean's environment variables
- The app.yaml file correctly references these variables with `${VARIABLE_NAME}` syntax
- These variables are injected at build time (note the `scope: BUILD_TIME` in app.yaml)

## Additional Environment Variables (Optional)

If you haven't set these yet, you might also want to add:
- `CLICKSEND_USERNAME` and `CLICKSEND_API_KEY` (though these should be in Supabase Edge Functions, not here)
- Any other API keys your app uses

## Summary

The issue is that your production deployment doesn't have the Supabase URL configured, so it's falling back to localhost. Setting the `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables in DigitalOcean will fix this immediately.
