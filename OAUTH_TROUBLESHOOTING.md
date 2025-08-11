# 🔐 Google OAuth Troubleshooting Guide

## 🚨 **Current Issue: OAuth Redirect Mismatch**

**Symptoms:**

- User clicks "Sign in with Google"
- Google shows "Supabase redirect URI" instead of "SafePing"
- After authentication, user is redirected to landing page
- User is not actually signed in

**Root Cause:** Redirect URI configuration mismatch between Google Cloud Console, Supabase, and your application.

## 🔧 **Step-by-Step Fix**

### **Step 1: Update Supabase Dashboard**

1. **Go to Supabase Dashboard** → Your Project → **Authentication** → **URL Configuration**
2. **Set Site URL** to: `https://web.safeping.app`
3. **Add Redirect URLs**:
   ```
   https://web.safeping.app/auth/callback
   https://web.safeping.app/*
   ```
4. **Click Save**

### **Step 2: Update Google Cloud Console**

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**
2. **Navigate to** → APIs & Services → Credentials
3. **Click on your OAuth 2.0 Client ID**
4. **Update Authorized JavaScript origins**:
   ```
   https://web.safeping.app
   https://safeping.app
   ```
5. **Update Authorized redirect URIs**:
   ```
   https://web.safeping.app/auth/callback
   https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
   ```
6. **Click Save**

### **Step 3: Verify Supabase OAuth Provider**

1. **In Supabase Dashboard** → **Authentication** → **Providers**
2. **Find Google** and click to expand
3. **Ensure it's enabled** and has correct Client ID/Secret
4. **Copy the Redirect URL** shown (should be Supabase's callback URL)
5. **Add this URL to Google Cloud Console** if not already there

### **Step 4: Test the Flow**

1. **Clear browser cookies/cache** for your domain
2. **Go to** `https://web.safeping.app/auth/signin`
3. **Click "Sign in with Google"**
4. **Verify** you see "SafePing" (not Supabase) in Google's consent screen
5. **Complete authentication** and verify redirect to `/auth/callback`

## 🔍 **Diagnostic Tools**

### **Run the Diagnostic Script**

```bash
# Install dependencies if needed
npm install @supabase/supabase-js

# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# Run diagnostic
node debug-oauth.js
```

### **Check Browser Console**

1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Try OAuth sign-in**
4. **Look for errors** related to:
   - Redirect URI mismatch
   - Supabase connection issues
   - Authentication failures

### **Check Network Tab**

1. **Go to Network tab** in Developer Tools
2. **Try OAuth sign-in**
3. **Look for**:
   - Failed requests to Supabase
   - Redirect loops
   - CORS errors

## 🐛 **Common Issues & Solutions**

### **Issue 1: "Redirect URI mismatch"**

**Cause:** Google Cloud Console redirect URI doesn't match Supabase's callback URL

**Solution:**

- Add both URLs to Google Cloud Console:
  - `https://web.safeping.app/auth/callback` (your app)
  - `https://[PROJECT-REF].supabase.co/auth/v1/callback` (Supabase)

### **Issue 2: "Invalid Site URL" in Supabase**

**Cause:** Supabase Site URL doesn't match your production domain

**Solution:**

- Update Site URL to: `https://web.safeping.app`
- Add redirect URL: `https://web.safeping.app/auth/callback`

### **Issue 3: User authenticated but not in public.users**

**Cause:** OAuth user created in `auth.users` but not in `public.users`

**Solution:**

- Check if user needs onboarding
- Verify RLS policies allow access to `public.users`
- Check if Edge Functions are creating user profiles

### **Issue 4: CORS errors**

**Cause:** Supabase not configured for your production domain

**Solution:**

- Add `https://web.safeping.app` to Supabase allowed origins
- Check if your domain is in the allowlist

## 📋 **Configuration Checklist**

### **Supabase Dashboard**

- [ ] Site URL: `https://web.safeping.app`
- [ ] Redirect URLs: `https://web.safeping.app/auth/callback`
- [ ] Google OAuth provider enabled
- [ ] Google Client ID and Secret configured

### **Google Cloud Console**

- [ ] Authorized JavaScript origins: `https://web.safeping.app`
- [ ] Authorized redirect URIs:
  - `https://web.safeping.app/auth/callback`
  - `https://[PROJECT-REF].supabase.co/auth/v1/callback`

### **Your Application**

- [ ] Environment variables set correctly
- [ ] OAuth callback route working (`/auth/callback`)
- [ ] `handleOAuthCallback` function implemented
- [ ] User creation/onboarding flow working

## 🧪 **Testing the Fix**

### **Test 1: OAuth Consent Screen**

- Should show "SafePing" (not Supabase)
- Should have correct app icon and description

### **Test 2: Redirect Flow**

- After Google auth → should redirect to `/auth/callback`
- Should not redirect to landing page
- Should create session and redirect to dashboard/onboarding

### **Test 3: User Creation**

- New users should be redirected to `/onboarding`
- Existing users should go to `/dashboard`
- User should appear in `public.users` table

## 🆘 **If Still Not Working**

### **Check Supabase Logs**

1. **Go to Supabase Dashboard** → **Logs**
2. **Filter by** "Authentication" events
3. **Look for** OAuth-related errors

### **Check Google OAuth Logs**

1. **Go to Google Cloud Console** → **APIs & Services** → **OAuth consent screen**
2. **Check** for any verification issues
3. **Verify** app is published (not in testing mode)

### **Contact Support**

- **Supabase Support**: [support.supabase.com](https://support.supabase.com)
- **Google Cloud Support**: [cloud.google.com/support](https://cloud.google.com/support)

## 📚 **Additional Resources**

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [SafePing OAuth Setup Guide](GOOGLE_OAUTH_SETUP.md)

---

**Next Steps:** Follow the configuration checklist above, then test the OAuth flow. If issues persist, run the diagnostic script and check the logs.
