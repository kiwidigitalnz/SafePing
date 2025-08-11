# Google OAuth Setup Guide for SafePing

This guide will walk you through setting up Google OAuth authentication for your SafePing application using Supabase.

## Prerequisites

- A Google Cloud Console account
- Access to your Supabase project dashboard
- Your Supabase project URL and anon key

## Step 1: Set up Google Cloud Console

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "SafePing")
5. Click "Create"

### 1.2 Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: SafePing
   - **User support email**: Your email
   - **App logo**: (optional) Upload your SafePing logo
   - **Application home page**: Your app URL (e.g., https://safeping.com)
   - **Application privacy policy link**: Your privacy policy URL
   - **Application terms of service link**: Your terms of service URL
   - **Authorized domains**: Add your domain (e.g., safeping.com)
   - **Developer contact information**: Your email
5. Click "Save and Continue"
6. On the Scopes page, click "Add or Remove Scopes"
7. Select these scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
8. Click "Update" and then "Save and Continue"
9. Add test users if needed (for development)
10. Review and click "Back to Dashboard"

### 1.4 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application" as the application type
4. Name it "SafePing Web Client"
5. Under "Authorized JavaScript origins", add:
   - Your Supabase project URL: `https://[YOUR-PROJECT-REF].supabase.co`
   - Your local development URL: `http://localhost:5176`
   - Your production URL: `https://yourdomain.com`
6. Under "Authorized redirect URIs", add:
   - `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
   - `http://localhost:5176/auth/callback` (for local development)
   - `https://yourdomain.com/auth/callback` (for production)
7. Click "Create"
8. **Important**: Copy the "Client ID" and "Client Secret" - you'll need these for Supabase

## Step 2: Configure Supabase

### 2.1 Add Google Provider in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to "Authentication" > "Providers"
4. Find "Google" in the list and click to expand it
5. Toggle "Enable Google" to ON
6. Enter the credentials from Google Cloud Console:
   - **Client ID**: Paste the Client ID from step 1.4
   - **Client Secret**: Paste the Client Secret from step 1.4
7. Copy the "Redirect URL" shown in Supabase (it should look like `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`)
8. Click "Save"

### 2.2 Update Redirect URLs (if needed)

If the redirect URL in Supabase is different from what you added in Google Cloud Console:

1. Go back to Google Cloud Console
2. Go to "APIs & Services" > "Credentials"
3. Click on your OAuth 2.0 Client ID
4. Add the Supabase redirect URL to "Authorized redirect URIs"
5. Click "Save"

## Step 3: Configure Your Application

### 3.1 Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3.2 Update Site URL in Supabase (Important!)

1. In Supabase Dashboard, go to "Authentication" > "URL Configuration"
2. Set the "Site URL" to your application URL:
   - For development: `http://localhost:5176`
   - For production: `https://yourdomain.com`
3. Add additional redirect URLs if needed:
   - `http://localhost:5176/*`
   - `https://yourdomain.com/*`
4. Click "Save"

## Step 4: Test the Integration

### 4.1 Local Testing

1. Start your development server:
   ```bash
   cd apps/web
   pnpm dev
   ```

2. Navigate to `http://localhost:5176/auth/signin`

3. Click "Sign in with Google"

4. You should be redirected to Google's OAuth consent screen

5. After authorizing, you should be redirected back to your app

### 4.2 Troubleshooting Common Issues

#### "Redirect URI mismatch" error

- Make sure the redirect URI in Google Cloud Console exactly matches the one in Supabase
- Check that you've added all necessary URLs to both Google and Supabase configurations
- Ensure there are no trailing slashes or protocol mismatches

#### "Invalid Site URL" error

- Update the Site URL in Supabase Authentication settings
- Make sure it matches your current development or production URL

#### User signs in but isn't redirected properly

- Check that the `/auth/callback` route is properly configured in your React app
- Verify that the `redirectTo` parameter in `signInWithGoogle()` is correct
- Check browser console for any JavaScript errors

#### "This app is blocked" error

- If in development, make sure you've added test users in Google Cloud Console
- For production, you may need to verify your app with Google

## Step 5: Production Deployment

### 5.1 Update URLs for Production

1. In Google Cloud Console, add your production domain to:
   - Authorized JavaScript origins
   - Authorized redirect URIs (with `/auth/callback` path)

2. In Supabase, update:
   - Site URL to your production domain
   - Add production domain to redirect URLs

### 5.2 Publish OAuth Consent Screen

1. In Google Cloud Console, go to "OAuth consent screen"
2. Click "Publish App" to make it available to all users
3. Google may require verification for certain scopes or sensitive data access

## Step 6: Handle New Google Users

When a user signs in with Google for the first time, they won't exist in your `public.users` table. The app handles this by:

1. Detecting new OAuth users (those not in `public.users`)
2. Redirecting them to an onboarding flow
3. Creating their organization and user profile

You may want to customize the onboarding flow in `/pages/auth/Onboarding.tsx` to collect additional information from Google OAuth users.

## Security Considerations

1. **Never commit credentials**: Keep your Client Secret secure and never commit it to version control
2. **Use environment variables**: Store sensitive configuration in environment variables
3. **Restrict domains**: In production, restrict OAuth to your specific domain
4. **Review permissions**: Only request the OAuth scopes you actually need
5. **Monitor usage**: Regularly review OAuth usage in Google Cloud Console

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Dashboard](https://app.supabase.com/)

## Support

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Review Supabase Auth logs in the dashboard
3. Verify all URLs match exactly between Google and Supabase
4. Ensure your Supabase project is not paused or rate-limited
