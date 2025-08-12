# Staff Onboarding System - Simplified & Robust

## Overview

SafePing uses two distinct user onboarding systems:

1. **Admin/Manager Flow** - Web dashboard access via email verification
2. **Staff/Worker Flow** - Mobile PWA access via SMS verification (this document)

## Staff/Worker Onboarding Flow

### 🎯 Key Features

- **6-digit numeric verification codes** (easy to type on mobile)
- **SMS-based invitation** with clear mobile app instructions
- **PIN/Biometric authentication** after verification
- **Mobile-first experience** optimized for field workers

### 📱 Complete Process Flow

#### 1. Admin Initiates Invitation (Web Dashboard)

```
Location: /workers/invite
Action: Admin enters staff member details
System:
  - Creates user record with role='worker'
  - Generates 6-digit verification code
  - Creates invitation record
  - Sends SMS via edge function
```

#### 2. SMS Sent to Staff Member

```
Message includes:
  - Personal greeting
  - 6-digit verification code
  - Step-by-step instructions
  - Direct link to PWA
  - Clear note: "mobile app only"
```

#### 3. Staff Member Receives SMS

```
Options:
  A. Click link → Opens PWA with pre-filled token
  B. Manual entry → Open app, enter phone + code
```

#### 4. PWA Verification Process

```
Location: /invite or /invite/:token
Actions:
  - Enter phone number (if not pre-filled)
  - Enter 6-digit code
  - System verifies via edge function
  - Creates session token
```

#### 5. PIN & Biometric Setup

```
After verification:
  - Prompt to create 4-6 digit PIN
  - Option to enable biometric auth
  - Store encrypted credentials locally
```

#### 6. Ready to Use

```
Staff can now:
  - Check in/out for shifts
  - Receive emergency alerts
  - Update their status
  - Use PIN/biometric for quick access
```

## 🔧 Technical Components

### Database Tables

#### `users` table

- `id`: UUID
- `phone`: Staff phone number
- `role`: 'worker' for staff
- `pin_hash`: Encrypted PIN
- `is_active`: Account status
- `verified_at`: Verification timestamp

#### `worker_invitations` table

- `id`: UUID
- `user_id`: Links to users table
- `invitation_token`: Unique token
- `phone_number`: Staff phone
- `status`: sent/verified/completed/expired
- `expires_at`: 7 days from creation

#### `verification_codes` table

- `id`: UUID
- `user_id`: Links to users
- `code`: 6-digit numeric code
- `expires_at`: Expiration time
- `verified_at`: When verified

### Edge Functions

#### `send-worker-invitation`

- **Purpose**: Send SMS invitation to staff
- **Input**: Phone, name, organization, 6-digit code
- **Output**: SMS sent with instructions
- **Location**: `/supabase/functions/send-worker-invitation`

#### `verify-staff`

- **Purpose**: Verify 6-digit code and create session
- **Input**: Phone + code OR invitation token
- **Output**: User data + session token
- **Location**: `/supabase/functions/verify-staff`

### Frontend Components

#### Web Dashboard (`/apps/web`)

- **InviteStaff.js**: Admin interface to send invitations
- **WorkersList.js**: View and manage staff members
- **ResendInvite**: Resend invitation with new code

#### PWA App (`/apps/pwa`)

- **StaffInvite.tsx**: Verification code entry screen
- **PinSetup.tsx**: PIN creation after verification
- **BiometricSetup.tsx**: Optional biometric enrollment

## 🚀 Deployment Checklist

### 1. Database Migrations

```bash
# Apply all migrations
supabase db push

# Verify tables exist
- users
- worker_invitations
- verification_codes
- worker_sessions
```

### 2. Edge Functions

```bash
# Deploy edge functions
supabase functions deploy send-worker-invitation
supabase functions deploy verify-staff

# Set environment variables
- SMS_PROVIDER (twilio/messagebird)
- SMS credentials
- PWA_URL (https://my.safeping.app)
```

### 3. Environment Variables

```env
# Web App (.env.production)
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# PWA App (.env.production)
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-domain.com
```

### 4. SMS Provider Setup

- Configure Twilio or MessageBird
- Set up phone number
- Configure webhook for delivery status

## 🧪 Testing Guide

### Test Scenario 1: Happy Path

1. Admin sends invitation from web dashboard
2. Staff receives SMS with 6-digit code
3. Staff opens PWA and enters code
4. Verification successful
5. PIN setup completed
6. Biometric enabled
7. Staff can check in

### Test Scenario 2: Manual Code Entry

1. Staff doesn't click link
2. Opens PWA manually
3. Taps "I have an invitation"
4. Enters phone number
5. Enters 6-digit code
6. Verification successful

### Test Scenario 3: Resend Invitation

1. Staff loses SMS
2. Admin resends from dashboard
3. New 6-digit code generated
4. Old code invalidated
5. New SMS sent
6. Staff uses new code

### Test Scenario 4: Expired Code

1. Staff waits > 7 days
2. Tries to enter code
3. Gets "expired" error
4. Admin must resend

### Test Scenario 5: Wrong Code

1. Staff enters wrong code
2. Gets error message
3. Can retry (with rate limiting)
4. After 5 attempts, locked for 1 hour

## 🔒 Security Considerations

### Code Security

- 6-digit numeric codes (1,000,000 combinations)
- 7-day expiration
- One-time use only
- Rate limiting on verification attempts
- Codes stored hashed in database

### Session Management

- JWT tokens with 30-day expiry
- Refresh tokens for extended sessions
- Device ID tracking
- Automatic logout on suspicious activity

### PIN/Biometric Storage

- PINs hashed with bcrypt
- Biometric data stored locally only
- Fallback to PIN if biometric fails
- Force PIN reset option from admin

## 📊 Monitoring & Analytics

### Key Metrics to Track

- Invitation sent → Verification rate
- Time to complete verification
- PIN vs Biometric adoption
- Failed verification attempts
- Session duration

### Error Tracking

- SMS delivery failures
- Verification failures
- Session creation errors
- Database connection issues

## 🐛 Common Issues & Solutions

### Issue: SMS Not Received

**Solutions:**

- Check phone number format
- Verify SMS provider credits
- Check provider logs
- Try resending

### Issue: Code Not Working

**Solutions:**

- Check if code expired
- Verify correct phone number
- Check for typos in code
- Resend new invitation

### Issue: Can't Set PIN

**Solutions:**

- Clear app cache
- Check network connection
- Verify session is active
- Contact support for manual reset

### Issue: Biometric Not Working

**Solutions:**

- Check device compatibility
- Re-enroll biometric
- Fall back to PIN
- Update app version

## 🔄 Future Improvements

### Planned Enhancements

1. **Magic Link Alternative**: Direct app deep linking
2. **QR Code Option**: Scan to verify
3. **Multi-language SMS**: Localized messages
4. **Backup Verification**: Email as fallback
5. **Bulk Invitations**: CSV import for multiple staff

### Considered Features

- Voice call verification
- WhatsApp integration
- Time-based codes (TOTP)
- Hardware key support
- SSO integration for enterprise

## 📝 Maintenance Notes

### Regular Tasks

- Monitor SMS delivery rates
- Clean up expired invitations (> 30 days)
- Review failed verification attempts
- Update SMS templates seasonally
- Test edge functions after updates

### Database Cleanup

```sql
-- Remove expired invitations older than 30 days
DELETE FROM worker_invitations
WHERE expires_at < NOW() - INTERVAL '30 days';

-- Remove unverified codes older than 30 days
DELETE FROM verification_codes
WHERE created_at < NOW() - INTERVAL '30 days'
AND verified_at IS NULL;
```

## 🤝 Support Information

### For Admins

- Dashboard: https://app.safeping.com
- Documentation: /docs/admin-guide
- Support: admin@safeping.com

### For Staff

- App: https://my.safeping.app
- Help: In-app support chat
- Emergency: Contact your supervisor

---

Last Updated: January 2025
Version: 2.0 (Simplified 6-digit system)
