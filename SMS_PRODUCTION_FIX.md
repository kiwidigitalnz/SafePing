# Fix SMS Functionality in Production

## Issue
The error "Edge Function returned a non-2xx status code" occurs when trying to send SMS invitations to staff members.

## Root Cause
The Edge Function requires the `SMS_PROVIDER` environment variable to be set in addition to the ClickSend credentials. Without this, the function cannot determine which SMS service to use.

## Solution

### Option 1: Quick Fix via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to your project
3. Go to **Settings** → **Edge Functions** → **Secrets**
4. Add the following secret:
   - Key: `SMS_PROVIDER`
   - Value: `clicksend`

### Option 2: Use the Deployment Script

Run the provided script to set all required secrets and redeploy the Edge Functions:

```bash
./scripts/deploy-edge-functions.sh
```

When prompted, enter:
- SMS provider: `clicksend`
- ClickSend username: (your username)
- ClickSend API key: (your API key)
- PWA URL: `https://my.safeping.app`

### Required Environment Variables

The following secrets must be set in Supabase Edge Functions:

1. **SMS_PROVIDER** - Set to `clicksend` (this was missing!)
2. **CLICKSEND_USERNAME** - Your ClickSend username
3. **CLICKSEND_API_KEY** - Your ClickSend API key
4. **PWA_URL** - The PWA URL for invitation links (optional, defaults to https://my.safeping.app)

## Verification

After setting the SMS_PROVIDER secret, test the SMS functionality:

1. Try resending an invitation from the Staff page
2. Check the Edge Function logs in Supabase dashboard for any errors
3. Verify the SMS is received

## Additional Troubleshooting

If SMS still doesn't work after setting SMS_PROVIDER:

1. **Check ClickSend Balance**: Ensure you have sufficient credit
2. **Verify Phone Format**: Phone numbers should be in international format (+64...)
3. **Check Edge Function Logs**: 
   - Go to Supabase Dashboard → Edge Functions → send-worker-invitation → Logs
   - Look for specific error messages

4. **Test with curl**:
```bash
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/test-sms' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"phoneNumber": "+64212345678", "message": "Test message"}'
```

## Summary

The main issue was that the `SMS_PROVIDER` environment variable was not set in the Edge Functions secrets. This is required for the SMS service to know which provider (ClickSend or Twilio) to use. Setting this value to `clicksend` should resolve the issue immediately.
