# SMS Setup Documentation for SafePing

## Overview

SafePing uses SMS functionality for:
- Sending verification codes during signup
- Emergency notifications to staff members
- Check-in reminders
- Escalation alerts

The system supports both **ClickSend** and **Twilio** as SMS providers, with ClickSend being the primary provider.

## Current Configuration

### SMS Provider: ClickSend

The application is configured to use ClickSend for SMS delivery. The credentials are stored as Supabase secrets:
- `SMS_PROVIDER=clicksend`
- `CLICKSEND_USERNAME` (already configured)
- `CLICKSEND_API_KEY` (already configured)

## Architecture

### 1. SMS Service Module (`supabase/functions/_shared/sms.ts`)

The core SMS service provides:
- **Multi-provider support**: ClickSend and Twilio
- **Phone number formatting**: Automatic formatting to international format
- **Phone number validation**: E.164 format validation
- **Bulk SMS support**: Send multiple messages efficiently
- **Error handling**: Comprehensive error handling and logging

### 2. Edge Functions Using SMS

#### a. Test SMS Function (`supabase/functions/test-sms/`)
- **Purpose**: Test SMS configuration and delivery
- **Endpoint**: `/functions/v1/test-sms`
- **Usage**: Send test messages to verify setup

#### b. Send Verification Code (`supabase/functions/send-verification-code/`)
- **Purpose**: Send verification codes for signup, password reset, etc.
- **Currently uses**: Email (Resend) - can be extended to use SMS

#### c. Emergency Escalation (`supabase/functions/emergency-escalation/`)
- **Purpose**: Send emergency alerts via SMS
- **Triggers**: When check-ins are missed

#### d. Send Worker Invitation (`supabase/functions/send-worker-invitation/`)
- **Purpose**: Send invitation codes to new staff members
- **Can use**: SMS for mobile verification

## Testing SMS Functionality

### 1. Using the Test Script

```bash
# Test with a phone number
node test-sms-functionality.js +64212345678

# The script will:
# - Connect to your Supabase instance
# - Invoke the test-sms edge function
# - Display the result with message ID and cost
```

### 2. Using cURL

```bash
# Get your Supabase URL and anon key
SUPABASE_URL="https://your-project.supabase.co"
ANON_KEY="your-anon-key"

# Send test SMS
curl -X POST "$SUPABASE_URL/functions/v1/test-sms" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+64212345678",
    "message": "Test SMS from SafePing"
  }'
```

### 3. Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Find `test-sms` function
4. Use the built-in testing interface

## Phone Number Formatting

The system automatically formats phone numbers:
- Removes non-digit characters
- Adds country code if missing (default: +64 for NZ)
- Validates E.164 format

### Examples:
- `0212345678` → `+64212345678`
- `212345678` → `+64212345678`
- `+64212345678` → `+64212345678` (unchanged)

## Integration Points

### 1. Verification Code SMS

To enable SMS verification codes (currently using email):

```typescript
// In send-verification-code function, add:
import { SMSService, getSMSConfig, formatPhoneNumber } from '../_shared/sms.ts'

// When sending verification code:
const smsConfig = getSMSConfig()
if (smsConfig && phoneNumber) {
  const smsService = new SMSService(smsConfig)
  await smsService.sendSMS({
    to: formatPhoneNumber(phoneNumber),
    message: `Your SafePing verification code is: ${code}`
  })
}
```

### 2. Emergency Notifications

```typescript
// In emergency-escalation function:
import { SMSService, getSMSConfig } from '../_shared/sms.ts'

// Send emergency SMS to contacts
const smsConfig = getSMSConfig()
if (smsConfig) {
  const smsService = new SMSService(smsConfig)
  await smsService.sendBulkSMS(
    emergencyContacts.map(contact => ({
      to: contact.phone,
      message: `EMERGENCY: ${workerName} has missed their check-in. Last known location: ${location}`
    }))
  )
}
```

### 3. Check-in Reminders

```typescript
// In process-overdue-checkins function:
const smsService = new SMSService(getSMSConfig())
await smsService.sendSMS({
  to: worker.phone,
  message: `Reminder: Your SafePing check-in is due in 15 minutes`
})
```

## Cost Management

### ClickSend Pricing (as of 2025)
- SMS to NZ: ~$0.077 per message
- SMS to AU: ~$0.077 per message
- SMS to US: ~$0.055 per message
- SMS to UK: ~$0.065 per message

### Cost Optimization Tips:
1. **Use templates**: Reduce message length
2. **Batch sending**: Use bulk SMS for multiple recipients
3. **Smart scheduling**: Avoid peak times
4. **Monitor usage**: Track costs via ClickSend dashboard

## Environment Variables

### For Local Development

Add to `supabase/.env.local`:
```bash
SMS_PROVIDER=clicksend
CLICKSEND_USERNAME=your_username
CLICKSEND_API_KEY=your_api_key
```

### For Production

Set in Supabase Dashboard > Settings > Edge Functions > Secrets:
1. `SMS_PROVIDER` = `clicksend`
2. `CLICKSEND_USERNAME` = Your ClickSend username
3. `CLICKSEND_API_KEY` = Your ClickSend API key

## Troubleshooting

### Common Issues and Solutions

#### 1. "SMS service not configured"
- **Cause**: Missing environment variables
- **Solution**: Ensure SMS_PROVIDER, CLICKSEND_USERNAME, and CLICKSEND_API_KEY are set

#### 2. "Invalid phone number format"
- **Cause**: Phone number not in E.164 format
- **Solution**: Include country code (e.g., +64 for NZ)

#### 3. "Failed to send SMS"
- **Cause**: Invalid credentials or insufficient balance
- **Solution**: 
  - Verify ClickSend credentials
  - Check ClickSend account balance
  - Review ClickSend dashboard for errors

#### 4. "Message not delivered"
- **Cause**: Invalid recipient number or carrier issues
- **Solution**:
  - Verify recipient phone number
  - Check ClickSend delivery reports
  - Try alternative number

### Debug Mode

Enable debug logging in edge functions:
```typescript
const DEBUG = Deno.env.get('DEBUG_SMS') === 'true'

if (DEBUG) {
  console.log('SMS Config:', smsConfig)
  console.log('Formatted phone:', formattedPhone)
  console.log('Message:', message)
}
```

## Security Considerations

1. **Never expose API keys**: Always use environment variables
2. **Validate phone numbers**: Prevent injection attacks
3. **Rate limiting**: Implement rate limits to prevent abuse
4. **Audit logging**: Log all SMS sends for compliance
5. **Encryption**: Store phone numbers encrypted in database
6. **Consent**: Ensure user consent for SMS communications

## Monitoring and Analytics

### Key Metrics to Track:
- **Delivery rate**: Successful deliveries / Total sends
- **Response time**: Time to receive delivery confirmation
- **Cost per message**: Track spending
- **Error rate**: Failed sends / Total sends
- **User engagement**: Click-through rates for SMS links

### ClickSend Dashboard Features:
- Real-time delivery reports
- Message history
- Cost analytics
- API usage statistics
- Webhook configuration for delivery notifications

## Future Enhancements

1. **Two-way SMS**: Enable replies and commands via SMS
2. **SMS Templates**: Pre-defined message templates
3. **Localization**: Multi-language SMS support
4. **Smart Routing**: Choose provider based on destination
5. **Fallback Provider**: Automatic failover to Twilio
6. **SMS Preferences**: User-configurable SMS settings
7. **Delivery Webhooks**: Real-time delivery status updates

## Support and Resources

- **ClickSend Documentation**: https://developers.clicksend.com/
- **ClickSend API Reference**: https://developers.clicksend.com/docs/rest/v3/
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **E.164 Format Guide**: https://en.wikipedia.org/wiki/E.164

## Contact

For issues or questions about SMS setup:
- Create an issue in the SafePing repository
- Contact support@novaly.app
- Check ClickSend support: support@clicksend.com
