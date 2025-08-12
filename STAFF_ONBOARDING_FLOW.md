# Staff Onboarding Flow Documentation

## Overview
The SafePing staff onboarding system provides a secure, mobile-first experience for new staff members to join the platform and set up their accounts.

## Flow Diagram

```
1. Admin Creates Staff (Web App)
   ↓
2. SMS Invitation Sent
   ↓
3. Staff Clicks Link or Enters Code (PWA)
   ↓
4. Verification Process
   ↓
5. Profile Setup (Onboarding)
   ↓
6. Authentication Setup
   ↓
7. Dashboard Access
```

## Detailed Flow

### 1. Staff Creation (Admin Web App)
**Location**: `/staff` page in web app
**Components**: 
- `apps/web/src/pages/Staff.tsx`
- `apps/web/src/components/StaffForm.tsx`

**Process**:
- Admin enters staff details (name, phone, role)
- System generates 6-digit verification code
- SMS sent via Supabase Edge Function

### 2. SMS Invitation
**Edge Function**: `supabase/functions/send-worker-invitation`
**Content**: 
```
Welcome to SafePing! Your verification code is: 123456
Or click: https://app.safeping.co.nz/invite/[token]
```

### 3. Staff Verification (PWA)
**Location**: `/invite` or `/invite/:token`
**Component**: `apps/pwa/src/pages/StaffInvite.tsx`

**Two Methods**:
1. **Direct Link**: Auto-verifies with token
2. **Manual Entry**: Enter phone + 6-digit code

### 4. Onboarding Process (PWA)
**Location**: `/onboarding`
**Component**: `apps/pwa/src/pages/StaffOnboarding.tsx`

**Steps**:
1. **Personal Information**
   - First/Last Name (required)
   - Email (optional)
   - Department (optional)
   - Job Title (optional)

2. **Emergency Contact**
   - Contact Name (required)
   - Phone Number (required)
   - Relationship (required)

3. **Profile Photo** (optional)
   - Upload photo
   - 5MB max size

4. **PWA Installation** (optional)
   - Install app prompt
   - Enable notifications

5. **Authentication Setup**
   - Choose method:
     - 4-Digit PIN
     - Biometric (if available)
     - SMS OTP

### 5. Future Authentication (PWA)
**Location**: `/auth`
**Component**: `apps/pwa/src/pages/WorkerAuth.tsx`

**Available Methods**:
- PIN entry
- Biometric authentication
- SMS OTP verification

## Database Schema

### Users Table
```sql
- id (UUID)
- organization_id (UUID)
- first_name (VARCHAR)
- last_name (VARCHAR)
- phone (VARCHAR)
- email (VARCHAR)
- role (user_role)
- is_active (BOOLEAN)
- emergency_contact_name (VARCHAR)
- emergency_contact_phone (VARCHAR)
- emergency_contact_relationship (VARCHAR)
- department (VARCHAR)
- job_title (VARCHAR)
- profile_image_url (TEXT)
- pin_hash (TEXT)
- biometric_enabled (BOOLEAN)
- phone_verified (BOOLEAN)
- onboarding_completed (BOOLEAN)
```

### Worker Invitations Table
```sql
- id (UUID)
- user_id (UUID)
- organization_id (UUID)
- phone_number (TEXT)
- verification_code (CHAR(6))
- invitation_token (UUID)
- status (TEXT)
- verification_attempts (INTEGER)
- expires_at (TIMESTAMPTZ)
```

## Security Features

1. **Verification Code**
   - 6-digit numeric code
   - Expires after 7 days
   - Max 5 attempts
   - One active invitation per user

2. **Device Tracking**
   - Device ID stored
   - Device info captured
   - Support for new device verification

3. **Authentication Options**
   - PIN: 4-digit code (should be hashed in production)
   - Biometric: Face ID/Touch ID
   - OTP: SMS-based verification

## User Experience Improvements

### Mobile-First Design
- Large touch targets
- Clear visual hierarchy
- Responsive layouts
- Native-like interactions

### Progressive Enhancement
- Skip optional steps
- Clear progress indicators
- Error recovery
- Offline support (PWA)

### Accessibility
- High contrast colors
- Clear labels
- Keyboard navigation
- Screen reader support

## Admin Management Features

### Staff List View
- Search/filter capabilities
- Status indicators (Active/Inactive)
- Quick actions (Edit/Delete)
- Bulk operations support

### Staff Details
- View complete profile
- Edit capabilities
- Activity history
- Deactivation option

### Invitation Management
- Resend invitations
- Track verification status
- View attempt counts
- Cancel pending invitations

## Error Handling

### Common Scenarios
1. **Expired Code**: Prompt to request new invitation
2. **Invalid Code**: Show attempts remaining
3. **Already Verified**: Redirect to auth
4. **Network Issues**: Retry mechanisms
5. **Device Issues**: Fallback options

## Testing Checklist

### Admin Side (Web)
- [ ] Create new staff member
- [ ] Edit existing staff
- [ ] Deactivate/reactivate staff
- [ ] Delete staff member
- [ ] Resend invitation

### Staff Side (PWA)
- [ ] Verify via link
- [ ] Verify via manual code entry
- [ ] Complete onboarding steps
- [ ] Skip optional steps
- [ ] Set up PIN authentication
- [ ] Test biometric (if available)
- [ ] Sign in with chosen method

### Edge Cases
- [ ] Multiple invitation attempts
- [ ] Expired invitations
- [ ] Wrong verification codes
- [ ] Network interruptions
- [ ] Browser compatibility

## Future Enhancements

1. **Batch Invitations**
   - CSV import
   - Bulk SMS sending
   - Progress tracking

2. **Advanced Authentication**
   - Two-factor authentication
   - Passwordless email links
   - Hardware key support

3. **Onboarding Customization**
   - Organization-specific fields
   - Custom welcome messages
   - Branded experiences

4. **Analytics**
   - Onboarding completion rates
   - Drop-off analysis
   - Time-to-complete metrics

## Deployment Notes

### Environment Variables Required
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### Edge Functions Deployment
```bash
# Deploy invitation function
supabase functions deploy send-worker-invitation

# Deploy verification function
supabase functions deploy verify-staff
```

### Database Migrations
Ensure all migrations are applied:
- `20250108000006_redesign_staff_verification_system.sql`
- Related user and invitation tables

## Support & Troubleshooting

### Common Issues

1. **SMS Not Received**
   - Check Twilio configuration
   - Verify phone number format
   - Check SMS logs in Twilio

2. **Verification Fails**
   - Check code expiration
   - Verify attempt count
   - Check database status

3. **Onboarding Errors**
   - Check browser console
   - Verify network connectivity
   - Check Supabase logs

### Debug Mode
Enable debug logging:
```javascript
localStorage.setItem('debug', 'safeping:*')
```

### Contact Support
For issues, contact the development team with:
- User ID
- Phone number (masked)
- Error messages
- Browser/device info
