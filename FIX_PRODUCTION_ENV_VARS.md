# Fix Production Environment Variables Issue

## Problem Summary

Both the web app (web.safeping.app) and PWA (my.safeping.app) are failing in production because the Supabase environment variables are not being properly embedded during the build process. This causes:

1. Sign-in to hang with a loading spinner on web.safeping.app
2. Staff verification to fail with "Edge Function returned a non-2xx status code" on my.safeping.app

## Root Cause

The Dockerfile wasn't configured to accept and pass environment variables to the build process. When Vite builds the apps, it needs the environment variables available at build time to embed them in the JavaScript bundles.

## Solution Applied

### 1. Updated Dockerfile

Modified the Dockerfile to:

- Accept build arguments (ARG) for all VITE\_ environment variables
- Set environment variables (ENV) from these build arguments
- Make them available during the `pnpm run build` step

### 2. Updated DigitalOcean App Specification

Fixed the app.yaml to:

- Use consistent VITE\_ prefixed variable names
- Reference the correct environment variable names in DigitalOcean

## Required Actions in DigitalOcean

### Step 1: Set App-Level Environment Variables

Go to your DigitalOcean App Platform dashboard and set these **App-Level Environment Variables**:

| Variable Name            | Value                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`      | `https://zcmtcegxebspzjrrgvtn.supabase.co`                                                                                                                                                                         |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbXRjZWd4ZWJzcHpqcnJndnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNjQ4MTYsImV4cCI6MjA2ODY0MDgxNn0.A8sK6tJEiskdVLt3vT67oKtyHByMdkQVQOA5AS91zOI` |
| `VITE_GOOGLE_CLIENT_ID`  | `340509101186-pgr69bv4eq30e93h4bmfajcp4kc1c2i7.apps.googleusercontent.com`                                                                                                                                         |
| `VITE_STRIPE_PUBLIC_KEY` | (your Stripe publishable key if using payments)                                                                                                                                                                    |
| `VITE_VAPID_PUBLIC_KEY`  | (your VAPID key if using push notifications)                                                                                                                                                                       |
| `VITE_ENABLE_ANALYTICS`  | `false`                                                                                                                                                                                                            |
| `VITE_GA_TRACKING_ID`    | (your GA tracking ID if using analytics)                                                                                                                                                                           |

**Important**: Make sure these are set as **App-Level Environment Variables**, not component-level.

### Step 2: Deploy the Changes

1. **Commit and push the changes**:

```bash
git add Dockerfile .do/app.yaml
git commit -m "Fix production environment variables for Supabase connection

- Updated Dockerfile to accept and pass build arguments
- Fixed app.yaml to use consistent VITE_ prefixed variables
- This fixes sign-in hanging and staff verification errors"
git push origin main
```

2. **DigitalOcean will automatically deploy** when you push to main branch

3. **Or manually trigger deployment** in DigitalOcean dashboard:
   - Go to your app in DigitalOcean
   - Click "Deploy" → "Deploy from Source"

### Step 3: Verify the Fix

After deployment completes (5-10 minutes):

1. **Test Sign-In on web.safeping.app**:
   - Clear browser cache
   - Navigate to https://web.safeping.app
   - Click "Sign In"
   - The sign-in form should load properly

2. **Test Staff Verification on my.safeping.app**:
   - Click the SMS invitation link
   - Or manually enter phone and code
   - Verification should succeed

3. **Check Browser Console**:
   - Should see proper initialization messages
   - No more "your-anon-key" errors

## How This Fix Works

1. **Build Time Variables**: DigitalOcean passes the environment variables to Docker build
2. **Docker Build Args**: Dockerfile accepts them as ARG directives
3. **Environment Variables**: Docker sets them as ENV for the build process
4. **Vite Build**: Vite reads the VITE\_ prefixed variables and embeds them in the JavaScript bundles
5. **Runtime**: The built JavaScript files contain the actual values (not placeholders)

## Troubleshooting

If issues persist after deployment:

### Check Build Logs

Look for these lines in the build logs:

```
configuring build-time app environment variables:
VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY ...
```

### Verify Variables in Browser

Open browser console on the deployed site and run:

```javascript
// This should return the Supabase URL, not 'localhost:54321'
console.log(import.meta.env.VITE_SUPABASE_URL);
```

### Common Issues

1. **Variables not set**: Ensure they're set in DigitalOcean App Platform settings
2. **Wrong variable names**: Must use VITE\_ prefix consistently
3. **Cache issues**: Clear browser cache after deployment
4. **Build cache**: May need to force rebuild in DigitalOcean

## Prevention

To prevent this in the future:

1. Always test environment variable injection in staging
2. Use a `.env.example` file to document required variables
3. Add build-time checks to verify critical variables are set
4. Consider using a configuration validation step

## Summary

The production issues were caused by missing environment variables during the Docker build process. The fix ensures that Vite has access to the required environment variables when building the applications, properly embedding them in the final JavaScript bundles.
