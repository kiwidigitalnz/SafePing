# Staff SMS Invitation System - Complete Guide

## ✅ Feature Overview

The SafePing staff invitation system now includes full SMS functionality, allowing administrators to:
- Send SMS invitations when adding new staff members
- Resend SMS invitations from the staff management table
- Track invitation status and delivery

## 🚀 Key Features Implemented

### 1. **Add New Staff with SMS Invitation**
- Location: `/staff/invite` page
- Automatically sends SMS with invitation link and code
- Supports international phone numbers with country selector
- Phone number formatting and validation

### 2. **Resend SMS Invitation**
- Available in Staff Management table (`/staff`)
- Shows "Resend SMS Invitation" option for inactive staff with phone numbers
- Generates new invitation token for security
- Real-time status feedback during sending

### 3. **SMS Content**
The invitation SMS includes:
- Personalized greeting with staff member's name
- Organization name
- Direct link to join SafePing
- Unique 8-character invitation code
- Download instructions
- 7-day expiration notice
- Opt-out instructions

Example SMS:
```
Hi John! 

SafePing has invited you to join their safety team.

Get started here:
https://my.safeping.app/invite/abc123...

Download SafePing and use this invitation code: ABC12345

This invitation expires in 7 days.

Reply STOP to opt out.
```

## 📱 How to Use

### Adding a New Staff Member

1. Navigate to **Staff Management** (`/staff`)
2. Click **"Add Staff Member"** button
3. Fill in the required information:
   - First Name & Last Name
   - Phone Number (with country code selector)
   - Role (Staff Member or Administrator)
   - Optional: Email, Department, Job Title, Emergency Contact
4. Ensure **"Send SMS invitation immediately"** is checked
5. Click **"Send Invitation"**

The system will:
- Create the staff member record
- Generate a unique invitation token
- Send SMS to the provided phone number
- Show success confirmation

### Resending an SMS Invitation

1. Go to **Staff Management** (`/staff`)
2. Find the staff member in the list
3. Click the **three dots menu** (⋮) on the right
4. Select **"Resend SMS Invitation"**
5. Confirm the action

The system will:
- Generate a new invitation token
- Send a fresh SMS with the new code
- Update the invitation timestamp
- Show confirmation message

## 🔧 Technical Implementation

### Components Modified

1. **`apps/web/src/pages/workers/InviteStaff.tsx`**
   - Added phone number formatting
   - Country code selector
   - SMS sending integration
   - Success/error handling

2. **`apps/web/src/pages/Staff.tsx`**
   - Added "Resend SMS" action in menu
   - SMS status tracking
   - Real-time sending feedback
   - Phone number display with SMS icon

3. **`supabase/functions/send-worker-invitation/index.ts`**
   - Complete rewrite to use ClickSend API
   - Phone number validation
   - Message formatting
   - Cost tracking
   - Delivery status updates

### Database Schema

The system uses these tables:
- `users` - Stores staff member information
- `worker_invitations` - Tracks invitation status
- Fields added:
  - `invitation_token` - Unique token for each invitation
  - `invitation_sent_at` - Timestamp of last invitation
  - `sms_sent_at` - SMS delivery timestamp
  - `sms_delivery_status` - Delivery status tracking
  - `sms_message_id` - ClickSend message ID

### Edge Functions

**`send-worker-invitation`**
- Endpoint: `/functions/v1/send-worker-invitation`
- Method: POST
- Payload:
```json
{
  "phoneNumber": "+64212345678",
  "invitationToken": "uuid-token",
  "workerName": "John Doe",
  "organizationName": "ACME Corp"
}
```
- Response:
```json
{
  "success": true,
  "message": "Invitation SMS sent successfully",
  "phone_number": "+64212345678",
  "invitation_url": "https://my.safeping.app/invite/...",
  "invitation_code": "ABC12345",
  "sms_provider": "clicksend",
  "message_id": "msg_123",
  "cost": 0.077,
  "timestamp": "2025-01-11T..."
}
```

## 🧪 Testing

### Test Individual SMS
```bash
# Test basic SMS functionality
node test-sms-functionality.js +64212345678
```

### Test Staff Invitation SMS
```bash
# Test the complete invitation flow
node test-staff-invitation-sms.js +64212345678 "John Doe"

# Test with different names
node test-staff-invitation-sms.js +61412345678 "Jane Smith"
```

### Verify Configuration
```bash
# Check SMS service configuration
./verify-sms-config.sh
```

### Test via cURL
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/send-worker-invitation" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+64212345678",
    "invitationToken": "test-token-123",
    "workerName": "John Doe",
    "organizationName": "ACME Corp"
  }'
```

## 📊 Cost Management

### ClickSend Pricing (Approximate)
- New Zealand: $0.077 per SMS
- Australia: $0.077 per SMS
- United States: $0.055 per SMS
- United Kingdom: $0.065 per SMS

### Monitoring Costs
1. Check ClickSend Dashboard: https://dashboard.clicksend.com
2. View message logs in Supabase Functions logs
3. Each SMS response includes cost information

## 🔒 Security Considerations

1. **Token Security**
   - Unique tokens generated for each invitation
   - Tokens expire after 7 days
   - New token generated on resend

2. **Phone Number Validation**
   - E.164 format validation
   - Country code verification
   - Prevents invalid numbers

3. **Rate Limiting**
   - Consider implementing rate limits in production
   - Monitor for abuse patterns
   - Set daily/monthly limits per organization

4. **Data Privacy**
   - Phone numbers stored securely in database
   - SMS content doesn't include sensitive data
   - Opt-out mechanism included

## 🐛 Troubleshooting

### SMS Not Sending

1. **Check Configuration**
```bash
./verify-sms-config.sh
```

2. **Verify ClickSend Account**
   - Check balance at https://dashboard.clicksend.com
   - Ensure account is active
   - Verify API credentials

3. **Check Function Logs**
   - Go to Supabase Dashboard > Functions
   - View logs for `send-worker-invitation`
   - Look for error messages

4. **Test Directly**
```bash
node test-staff-invitation-sms.js +64212345678 "Test User"
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "SMS service not configured" | Set SMS_PROVIDER, CLICKSEND_USERNAME, CLICKSEND_API_KEY in Supabase secrets |
| "Invalid phone number" | Ensure phone number includes country code |
| "Insufficient balance" | Top up ClickSend account |
| "Function timeout" | Check network connectivity, API status |
| SMS delivered but no link | Check PWA_URL environment variable |

## 📈 Future Enhancements

Consider implementing:
1. **Bulk SMS invitations** - Send to multiple staff at once
2. **SMS templates** - Customizable message templates
3. **Delivery tracking** - Webhook integration for delivery status
4. **SMS analytics** - Track open rates, response rates
5. **Multi-language support** - Send SMS in different languages
6. **URL shortener** - Integrate bit.ly or similar for shorter links
7. **Two-way SMS** - Allow staff to respond via SMS
8. **Scheduled sending** - Send invitations at optimal times

## 📝 Deployment Checklist

- [ ] SMS credentials configured in Supabase
- [ ] Edge functions deployed
- [ ] Phone number formatting tested
- [ ] SMS delivery verified
- [ ] Resend functionality tested
- [ ] Error handling verified
- [ ] Cost monitoring set up
- [ ] Rate limiting configured (if needed)
- [ ] Documentation updated
- [ ] Team trained on feature

## 🆘 Support

- **ClickSend Support**: support@clicksend.com
- **ClickSend API Docs**: https://developers.clicksend.com/
- **Supabase Support**: https://supabase.com/support
- **SafePing Support**: support@novaly.app

---

**Last Updated**: January 11, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
