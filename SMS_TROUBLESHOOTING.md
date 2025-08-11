# 📱 SMS Verification Troubleshooting Guide

## 🚨 **Current Issue: "Edge Function returned a non-2xx status code"**

**Symptoms:**

- Trying to resend SMS verification for new staff member
- Getting "Edge Function returned a non-2xx status code" error
- SMS is not being sent

**Root Cause:** The SMS Edge Function is failing due to missing environment variables or configuration issues.

## 🔍 **Root Cause Analysis**

The issue is in the **`send-worker-invitation`** Edge Function, not the `send-verification-code` function. Here's what's happening:

1. **`send-verification-code`** → Handles email verification only
2. **`send-worker-invitation`** → Handles SMS invitations for staff members
3. **Missing environment variables** → Function fails and returns error status

## 🛠️ **Step-by-Step Fix**

### **Step 1: Check Edge Function Status**

1. **Go to Supabase Dashboard** → **Edge Functions**
2. **Find** `send-worker-invitation`
3. **Verify** it's deployed and active
4. **Check the Logs** tab for error messages

### **Step 2: Set Required Environment Variables**

1. **Go to Supabase Dashboard** → **Settings** → **Edge Functions**
2. **Add these secrets**:

#### **For ClickSend (Recommended)**

```
SMS_PROVIDER=clicksend
CLICKSEND_USERNAME=your_username
CLICKSEND_API_KEY=your_api_key
PWA_URL=https://my.safeping.app
```

#### **For Twilio (Alternative)**

```
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=your_verified_number
PWA_URL=https://my.safeping.app
```

### **Step 3: Redeploy the Function**

After setting environment variables:

```bash
# Deploy the function
supabase functions deploy send-worker-invitation --project-ref your-project-ref
```

### **Step 4: Test the Function**

Use the test script I created:

```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# Run the test
node test-sms-function.js
```

## 🔧 **Common Issues & Solutions**

### **Issue 1: Missing Environment Variables**

**Error:** "SMS service not configured"
**Solution:** Set all required environment variables in Supabase Edge Function secrets

### **Issue 2: Function Not Deployed**

**Error:** Function not accessible
**Solution:** Deploy the function using Supabase CLI

### **Issue 3: ClickSend API Issues**

**Error:** ClickSend authentication failed
**Solution:**

- Verify username/API key are correct
- Check if account has SMS credits
- Verify sender number is approved

### **Issue 4: Invalid Phone Number Format**

**Error:** "Invalid phone number format"
**Solution:**

- Phone numbers should be in international format
- Example: `+1234567890` (not `1234567890`)

## 📋 **Configuration Checklist**

### **Supabase Edge Functions**

- [ ] `send-worker-invitation` function is deployed
- [ ] Environment variables are set correctly
- [ ] Function logs show no errors

### **ClickSend Account**

- [ ] Username and API key are correct
- [ ] Account has SMS credits
- [ ] Sender number is verified
- [ ] Account is not suspended

### **Phone Number Format**

- [ ] Numbers are in international format (`+1234567890`)
- [ ] No spaces or special characters
- [ ] Valid country code

## 🧪 **Testing the Fix**

### **Test 1: Direct Function Test**

```bash
node test-sms-function.js
```

### **Test 2: Frontend Integration**

1. **Go to Staff page** in your app
2. **Try to invite a new staff member**
3. **Verify** SMS is sent successfully
4. **Check** function logs for success messages

### **Test 3: Check Function Logs**

1. **In Supabase Dashboard** → **Edge Functions**
2. **Click on** `send-worker-invitation`
3. **Check Logs** tab for successful SMS sends

## 🐛 **Debugging Steps**

### **Step 1: Check Function Logs**

1. **Go to Supabase Dashboard** → **Edge Functions**
2. **Click on** `send-worker-invitation`
3. **Check Logs** tab for error messages
4. **Look for** specific error details

### **Step 2: Test Function Directly**

```bash
# Test with curl
curl -X POST https://your-project.supabase.co/functions/v1/send-worker-invitation \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "invitationToken": "test-token",
    "workerName": "Test User",
    "organizationName": "Test Org"
  }'
```

### **Step 3: Check Environment Variables**

1. **Verify** all required variables are set
2. **Check** variable names match exactly
3. **Ensure** no extra spaces or characters

## 📚 **Function Details**

### **`send-worker-invitation` Function**

- **Purpose**: Sends SMS invitations to new staff members
- **Input**: phoneNumber, invitationToken, workerName, organizationName
- **Output**: SMS sent to worker's phone number
- **Dependencies**: SMS provider configuration, PWA_URL

### **`send-verification-code` Function**

- **Purpose**: Sends email verification codes
- **Input**: email, type, metadata
- **Output**: Email sent with verification code
- **Dependencies**: RESEND_API_KEY

## 🚀 **Expected Result**

After fixing the configuration:

1. **Staff invitation** should work successfully
2. **SMS is sent** to the worker's phone number
3. **Function returns** 200 status code
4. **Worker receives** invitation with link and code
5. **No more** "Edge Function returned a non-2xx status code" errors

## 🆘 **If Still Not Working**

### **Check Supabase Logs**

1. **Go to Supabase Dashboard** → **Logs**
2. **Filter by** Edge Function events
3. **Look for** specific error messages

### **Check ClickSend Dashboard**

1. **Verify** SMS was attempted
2. **Check** delivery status
3. **Look for** any account issues

### **Contact Support**

- **Supabase Support**: [support.supabase.com](https://support.supabase.com)
- **ClickSend Support**: [clicksend.com/support](https://clicksend.com/support)

---

**Next Steps:** Follow the configuration checklist, set the environment variables, and test the function. The issue is almost certainly missing SMS provider credentials! 🎯
