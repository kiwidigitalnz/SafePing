# Staff Verification System - Simplified Design

## Overview

The SafePing staff verification system has been redesigned to use a consistent 6-digit numeric verification code for all scenarios, making it simpler and more robust.

## Key Features

### 1. Unified Verification Code
- **Always 6 digits** (100000-999999)
- Auto-generated when invitation is created
- Used for both new staff and new device verification
- Consistent across SMS, manual entry, and URL-based flows

### 2. Database Schema

#### `worker_invitations` Table
```sql
- id: UUID (primary key)
- user_id: UUID (references users)
- organization_id: UUID
- phone_number: TEXT
- verification_code: CHAR(6) -- Always 6 digits
- invitation_token: UUID -- For URL access
- status: TEXT (pending, sent, verified, completed, expired, cancelled)
- verification_attempts: INTEGER (default 0, max 5)
- device_id: TEXT
- device_info: JSONB
- expires_at: TIMESTAMPTZ (7 days for invitations, 15 minutes for device verification)
```

## Process Flows

### A. New Staff Invitation Flow

1. **Admin Creates Invitation**
   ```javascript
   // In InviteStaff.js
   const { data: invitation } = await supabase.rpc('create_staff_invitation', {
     p_user_id: newUser.id,
     p_organization_id: org_id,
     p_phone_number: '+64212345678',
     p_invited_by: admin_id
   });
   // Returns: { invitation_token, verification_code, expires_at }
   ```

2. **SMS Sent to Staff**
   ```
   Hi John! 👋
   SafePing has invited you to join their team.
   
   Your verification code is: 123456
   
   To get started:
   1. Install SafePing app
   2. Enter your phone number
   3. Enter the code above
   
   Or tap here: https://my.safeping.app/invite/[token]
   
   This code expires in 7 days.
   ```

3. **Staff Verifies**
   - **Option A: Manual Entry**
     - Enter phone number
     - Enter 6-digit code
   - **Option B: Click Link**
     - Opens app with token
     - Still requires 6-digit code for security

4. **Verification Process**
   ```javascript
   // Call verify-staff edge function
   const response = await fetch('/functions/v1/verify-staff', {
     method: 'POST',
     body: JSON.stringify({
       phoneNumber: '+64212345678',
       verificationCode: '123456',
       deviceInfo: { deviceId: 'xxx', ... }
     })
   });
   ```

5. **Complete Setup**
   - Set PIN (4-6 digits)
   - Enable biometrics (optional)
   - Account activated

### B. Resend Invitation Flow

```javascript
// Database function handles everything
const { data } = await supabase.rpc('resend_staff_invitation', {
  p_user_id: user_id
});
// Generates new code, cancels old invitation, creates new one
```

### C. New Device Verification Flow

```javascript
// For existing staff on new device
const { data } = await supabase.rpc('request_device_verification', {
  p_user_id: user_id,
  p_device_id: 'new-device-123',
  p_device_info: { ... }
});
// Returns 6-digit code, expires in 15 minutes
```

## Database Functions

### 1. `create_staff_invitation`
- Creates new invitation with auto-generated 6-digit code
- Cancels any existing pending invitations
- Returns invitation details

### 2. `verify_staff_with_code`
- Verifies using phone + 6-digit code
- Handles attempt tracking
- Updates user and invitation status
- Returns success/error with details

### 3. `verify_staff_with_token`
- Used when clicking invitation link
- Returns invitation details
- Still requires code entry for security

### 4. `complete_staff_setup`
- Called after verification
- Sets PIN and biometric preferences
- Marks invitation as completed

### 5. `resend_staff_invitation`
- Generates new 6-digit code
- Creates fresh invitation
- Cancels old invitations

### 6. `request_device_verification`
- For existing staff on new devices
- Shorter expiry (15 minutes)
- Fewer attempts allowed (3)

## Edge Functions

### 1. `/send-worker-invitation`
**Purpose**: Send SMS with 6-digit code
```typescript
interface InvitationRequest {
  phoneNumber: string
  invitationToken: string
  workerName: string
  organizationName: string
  verificationCode: string  // Required 6-digit code
}
```

### 2. `/verify-staff`
**Purpose**: Verify staff with phone + code
```typescript
interface VerifyRequest {
  phoneNumber: string
  verificationCode: string
  deviceInfo?: {
    deviceId: string
    deviceName?: string
    // ... other device details
  }
}
```

## Security Features

1. **Rate Limiting**
   - Max 5 attempts for staff invitations
   - Max 3 attempts for device verification
   - Attempt tracking in database

2. **Expiration**
   - 7 days for new staff invitations
   - 15 minutes for device verification
   - Auto-expire old invitations

3. **Phone Number Validation**
   - Supports international formats
   - Cleans and normalizes numbers
   - Validates format before sending

4. **Status Tracking**
   - `pending`: Created but not sent
   - `sent`: SMS delivered
   - `verified`: Code validated
   - `completed`: Setup finished
   - `expired`: Time limit exceeded
   - `cancelled`: Replaced by new invitation

## Error Handling

### Error Codes
- `INVALID_CODE`: Wrong verification code
- `EXPIRED`: Code/invitation expired
- `TOO_MANY_ATTEMPTS`: Max attempts exceeded
- `INVALID_TOKEN`: Bad invitation link
- `USER_NOT_FOUND`: No user for phone number

### User-Friendly Messages
```javascript
switch(errorCode) {
  case 'INVALID_CODE':
    return 'Invalid verification code. Please check and try again.';
  case 'EXPIRED':
    return 'Your invitation has expired. Please request a new one.';
  case 'TOO_MANY_ATTEMPTS':
    return 'Too many failed attempts. Please request a new invitation.';
  // ...
}
```

## Testing

### Test Scenarios
1. **Happy Path**: Create invitation → Send SMS → Verify → Complete setup
2. **Wrong Code**: Enter incorrect code → Track attempt → Show error
3. **Expired**: Wait for expiry → Try to verify → Show expired message
4. **Resend**: Create invitation → Resend → Old cancelled, new created
5. **Max Attempts**: Try wrong code 5 times → Lock out

### Test Data
```sql
-- Create test invitation
SELECT * FROM create_staff_invitation(
  'user-uuid',
  'org-uuid',
  '+64212345678',
  'admin-uuid'
);

-- Verify with code
SELECT * FROM verify_staff_with_code(
  '+64212345678',
  '123456',
  'test-device-id'
);
```

## Migration Path

### From Old System
1. Old system used UUID tokens with first 8 chars as "code"
2. New system uses dedicated 6-digit numeric codes
3. Migration creates proper verification codes for existing invitations

### Database Migrations Applied
1. `20250108000005_fix_staff_verification_flow.sql` - Initial fixes
2. `20250108000006_redesign_staff_verification_system.sql` - Complete redesign

## Benefits of New System

1. **Simplicity**
   - One code format for everything
   - Clear, predictable behavior
   - Easy to understand and debug

2. **User Experience**
   - 6-digit codes are easy to type
   - Consistent across all flows
   - Clear error messages

3. **Security**
   - Proper attempt tracking
   - Appropriate expiration times
   - Phone number verification

4. **Maintainability**
   - Clean database functions
   - Separated concerns
   - Well-documented flows

## Implementation Checklist

- [x] Database schema redesigned
- [x] Database functions created
- [x] Edge functions updated
- [x] InviteStaff.js updated
- [x] Migrations deployed
- [x] Edge functions deployed
- [ ] PWA app updated for new verification flow
- [ ] Test with real SMS provider
- [ ] Monitor and adjust attempt limits/expiry times

## Next Steps

1. **Update PWA App**
   - Implement phone + code entry screen
   - Handle invitation links
   - Complete PIN setup flow

2. **Add Monitoring**
   - Track verification success rates
   - Monitor SMS delivery
   - Alert on high failure rates

3. **Enhance Security**
   - Add CAPTCHA for multiple failures
   - Implement IP-based rate limiting
   - Add fraud detection

4. **Improve UX**
   - Add progress indicators
   - Implement auto-retry for SMS
   - Add help/support links
