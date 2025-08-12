-- Complete Redesign of Staff Verification System
-- Uses 6-digit numeric codes for all verification scenarios

-- Drop old tables and functions to start fresh
DROP FUNCTION IF EXISTS verify_staff_member CASCADE;
DROP FUNCTION IF EXISTS resend_staff_invitation CASCADE;
DROP FUNCTION IF EXISTS increment_verification_attempts CASCADE;
DROP FUNCTION IF EXISTS set_verification_code CASCADE;
DROP TRIGGER IF EXISTS set_verification_code_trigger ON worker_invitations;

-- Recreate worker_invitations table with proper structure
DROP TABLE IF EXISTS worker_invitations CASCADE;
CREATE TABLE worker_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and organization
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id),
  
  -- Verification details
  phone_number TEXT NOT NULL,
  verification_code CHAR(6) NOT NULL, -- Always 6 digits
  invitation_token UUID DEFAULT gen_random_uuid(), -- For URL-based access
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'verified', 'completed', 'expired', 'cancelled')),
  
  -- Attempt tracking
  verification_attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  
  -- Device information
  device_id TEXT,
  device_info JSONB DEFAULT '{}'::JSONB,
  
  -- SMS tracking
  sms_sent_at TIMESTAMPTZ,
  sms_message_id TEXT,
  sms_delivery_status TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  verified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create partial unique index for active invitations
CREATE UNIQUE INDEX unique_active_invitation_per_user 
ON worker_invitations(user_id, status) 
WHERE status IN ('pending', 'sent', 'verified');

-- Create indexes for performance
CREATE INDEX idx_invitations_phone_code ON worker_invitations(phone_number, verification_code) 
  WHERE status IN ('pending', 'sent');
CREATE INDEX idx_invitations_token ON worker_invitations(invitation_token);
CREATE INDEX idx_invitations_user_status ON worker_invitations(user_id, status);
CREATE INDEX idx_invitations_expires ON worker_invitations(expires_at) 
  WHERE status IN ('pending', 'sent');

-- Drop and recreate function to generate 6-digit verification code with correct return type
DROP FUNCTION IF EXISTS generate_verification_code();
CREATE FUNCTION generate_verification_code()
RETURNS CHAR(6)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate a 6-digit code (100000-999999)
  RETURN LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
END;
$$;

-- Function to create a new staff invitation
CREATE OR REPLACE FUNCTION create_staff_invitation(
  p_user_id UUID,
  p_organization_id UUID,
  p_phone_number TEXT,
  p_invited_by UUID DEFAULT NULL
)
RETURNS TABLE (
  invitation_id UUID,
  invitation_token UUID,
  verification_code CHAR(6),
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation_id UUID;
  v_token UUID;
  v_code CHAR(6);
  v_expires TIMESTAMPTZ;
BEGIN
  -- Cancel any existing pending invitations for this user
  UPDATE worker_invitations
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE 
    user_id = p_user_id
    AND status IN ('pending', 'sent');
  
  -- Generate new invitation details
  v_token := gen_random_uuid();
  v_code := generate_verification_code();
  v_expires := NOW() + INTERVAL '7 days';
  
  -- Create new invitation
  INSERT INTO worker_invitations (
    user_id,
    organization_id,
    phone_number,
    verification_code,
    invitation_token,
    invited_by,
    expires_at
  ) VALUES (
    p_user_id,
    p_organization_id,
    p_phone_number,
    v_code,
    v_token,
    p_invited_by,
    v_expires
  ) RETURNING id INTO v_invitation_id;
  
  RETURN QUERY
  SELECT 
    v_invitation_id,
    v_token,
    v_code,
    v_expires;
END;
$$;

-- Function to verify staff member with phone and code
CREATE OR REPLACE FUNCTION verify_staff_with_code(
  p_phone_number TEXT,
  p_verification_code CHAR(6),
  p_device_id TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  user_id UUID,
  invitation_id UUID,
  organization_id UUID,
  error_code TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
  v_clean_phone TEXT;
BEGIN
  -- Clean phone number (remove all non-digits except +)
  v_clean_phone := REGEXP_REPLACE(p_phone_number, '[^0-9+]', '', 'g');
  
  -- Find the invitation
  SELECT 
    wi.*,
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.pin_hash
  INTO v_invitation
  FROM worker_invitations wi
  JOIN users u ON u.id = wi.user_id
  WHERE 
    (wi.phone_number = p_phone_number OR wi.phone_number = v_clean_phone)
    AND wi.verification_code = p_verification_code
    AND wi.status IN ('pending', 'sent')
  ORDER BY wi.created_at DESC
  LIMIT 1;
  
  -- Check if invitation exists
  IF v_invitation.id IS NULL THEN
    -- Increment attempts for wrong code
    UPDATE worker_invitations
    SET 
      verification_attempts = verification_attempts + 1,
      updated_at = NOW()
    WHERE 
      (phone_number = p_phone_number OR phone_number = v_clean_phone)
      AND status IN ('pending', 'sent');
    
    RETURN QUERY
    SELECT 
      FALSE,
      NULL::UUID,
      NULL::UUID,
      NULL::UUID,
      'INVALID_CODE'::TEXT,
      'Invalid verification code'::TEXT;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_invitation.expires_at < NOW() THEN
    UPDATE worker_invitations
    SET status = 'expired', updated_at = NOW()
    WHERE id = v_invitation.id;
    
    RETURN QUERY
    SELECT 
      FALSE,
      v_invitation.user_id,
      v_invitation.id,
      v_invitation.organization_id,
      'EXPIRED'::TEXT,
      'Verification code has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Check max attempts
  IF v_invitation.verification_attempts >= v_invitation.max_attempts THEN
    RETURN QUERY
    SELECT 
      FALSE,
      v_invitation.user_id,
      v_invitation.id,
      v_invitation.organization_id,
      'TOO_MANY_ATTEMPTS'::TEXT,
      'Too many verification attempts'::TEXT;
    RETURN;
  END IF;
  
  -- Success! Update invitation
  UPDATE worker_invitations
  SET 
    status = 'verified',
    verified_at = NOW(),
    device_id = p_device_id,
    device_info = p_device_info,
    updated_at = NOW()
  WHERE id = v_invitation.id;
  
  -- Update user as verified
  UPDATE users
  SET 
    phone_verified = TRUE,
    verified_at = NOW(),
    last_device_id = p_device_id,
    is_active = TRUE
  WHERE id = v_invitation.user_id;
  
  RETURN QUERY
  SELECT 
    TRUE,
    v_invitation.user_id,
    v_invitation.id,
    v_invitation.organization_id,
    NULL::TEXT,
    NULL::TEXT;
END;
$$;

-- Function to verify with invitation token (for URL clicks)
CREATE OR REPLACE FUNCTION verify_staff_with_token(
  p_invitation_token UUID,
  p_device_id TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  user_id UUID,
  phone_number TEXT,
  verification_code CHAR(6),
  requires_code_entry BOOLEAN,
  error_code TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Find the invitation
  SELECT 
    wi.*,
    u.id as user_id,
    u.first_name,
    u.last_name
  INTO v_invitation
  FROM worker_invitations wi
  JOIN users u ON u.id = wi.user_id
  WHERE 
    wi.invitation_token = p_invitation_token
    AND wi.status IN ('pending', 'sent')
  LIMIT 1;
  
  -- Check if invitation exists
  IF v_invitation.id IS NULL THEN
    RETURN QUERY
    SELECT 
      FALSE,
      NULL::UUID,
      NULL::TEXT,
      NULL::CHAR(6),
      FALSE,
      'INVALID_TOKEN'::TEXT,
      'Invalid or expired invitation link'::TEXT;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_invitation.expires_at < NOW() THEN
    UPDATE worker_invitations
    SET status = 'expired', updated_at = NOW()
    WHERE id = v_invitation.id;
    
    RETURN QUERY
    SELECT 
      FALSE,
      v_invitation.user_id,
      v_invitation.phone_number,
      NULL::CHAR(6),
      FALSE,
      'EXPIRED'::TEXT,
      'Invitation link has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Return invitation details for code entry
  RETURN QUERY
  SELECT 
    TRUE,
    v_invitation.user_id,
    v_invitation.phone_number,
    v_invitation.verification_code,
    TRUE, -- Requires code entry for security
    NULL::TEXT,
    NULL::TEXT;
END;
$$;

-- Function to complete staff setup after verification
CREATE OR REPLACE FUNCTION complete_staff_setup(
  p_invitation_id UUID,
  p_pin_hash TEXT,
  p_biometric_enabled BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  success BOOLEAN,
  user_id UUID,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Get invitation
  SELECT * INTO v_invitation
  FROM worker_invitations
  WHERE id = p_invitation_id AND status = 'verified';
  
  IF v_invitation.id IS NULL THEN
    RETURN QUERY
    SELECT 
      FALSE,
      NULL::UUID,
      'Invalid or unverified invitation'::TEXT;
    RETURN;
  END IF;
  
  -- Update user with PIN
  UPDATE users
  SET 
    pin_hash = p_pin_hash,
    biometric_enabled = p_biometric_enabled,
    setup_completed_at = NOW(),
    is_active = TRUE
  WHERE id = v_invitation.user_id;
  
  -- Mark invitation as completed
  UPDATE worker_invitations
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_invitation_id;
  
  RETURN QUERY
  SELECT 
    TRUE,
    v_invitation.user_id,
    NULL::TEXT;
END;
$$;

-- Function to resend invitation with new code
CREATE OR REPLACE FUNCTION resend_staff_invitation(
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  invitation_token UUID,
  verification_code CHAR(6),
  phone_number TEXT,
  expires_at TIMESTAMPTZ,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_new_code CHAR(6);
  v_new_token UUID;
  v_expires TIMESTAMPTZ;
BEGIN
  -- Get user details
  SELECT u.*, wi.organization_id, wi.invited_by
  INTO v_user
  FROM users u
  LEFT JOIN worker_invitations wi ON wi.user_id = u.id
  WHERE u.id = p_user_id
  ORDER BY wi.created_at DESC
  LIMIT 1;
  
  IF v_user.id IS NULL THEN
    RETURN QUERY
    SELECT 
      FALSE,
      NULL::UUID,
      NULL::CHAR(6),
      NULL::TEXT,
      NULL::TIMESTAMPTZ,
      'User not found'::TEXT;
    RETURN;
  END IF;
  
  -- Cancel existing invitations
  UPDATE worker_invitations
  SET status = 'cancelled', updated_at = NOW()
  WHERE user_id = p_user_id AND status IN ('pending', 'sent');
  
  -- Generate new details
  v_new_code := generate_verification_code();
  v_new_token := gen_random_uuid();
  v_expires := NOW() + INTERVAL '7 days';
  
  -- Create new invitation
  INSERT INTO worker_invitations (
    user_id,
    organization_id,
    phone_number,
    verification_code,
    invitation_token,
    invited_by,
    expires_at
  ) VALUES (
    p_user_id,
    v_user.organization_id,
    v_user.phone,
    v_new_code,
    v_new_token,
    v_user.invited_by,
    v_expires
  );
  
  RETURN QUERY
  SELECT 
    TRUE,
    v_new_token,
    v_new_code,
    v_user.phone,
    v_expires,
    NULL::TEXT;
END;
$$;

-- Function for new device verification (existing staff)
CREATE OR REPLACE FUNCTION request_device_verification(
  p_user_id UUID,
  p_device_id TEXT,
  p_device_info JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  verification_code CHAR(6),
  phone_number TEXT,
  expires_at TIMESTAMPTZ,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_code CHAR(6);
  v_expires TIMESTAMPTZ;
BEGIN
  -- Get user details
  SELECT * INTO v_user
  FROM users
  WHERE id = p_user_id AND is_active = TRUE;
  
  IF v_user.id IS NULL THEN
    RETURN QUERY
    SELECT 
      FALSE,
      NULL::CHAR(6),
      NULL::TEXT,
      NULL::TIMESTAMPTZ,
      'User not found or inactive'::TEXT;
    RETURN;
  END IF;
  
  -- Cancel any existing device verifications
  UPDATE worker_invitations
  SET status = 'cancelled', updated_at = NOW()
  WHERE 
    user_id = p_user_id 
    AND status IN ('pending', 'sent')
    AND device_id IS NOT NULL;
  
  -- Generate new code
  v_code := generate_verification_code();
  v_expires := NOW() + INTERVAL '15 minutes'; -- Shorter expiry for device verification
  
  -- Create device verification invitation
  INSERT INTO worker_invitations (
    user_id,
    organization_id,
    phone_number,
    verification_code,
    device_id,
    device_info,
    expires_at,
    max_attempts
  ) VALUES (
    p_user_id,
    v_user.organization_id,
    v_user.phone,
    v_code,
    p_device_id,
    p_device_info,
    v_expires,
    3 -- Fewer attempts for device verification
  );
  
  RETURN QUERY
  SELECT 
    TRUE,
    v_code,
    v_user.phone,
    v_expires,
    NULL::TEXT;
END;
$$;

-- Add helpful comments
COMMENT ON TABLE worker_invitations IS 'Unified table for staff invitations and device verifications using 6-digit codes';
COMMENT ON FUNCTION create_staff_invitation IS 'Creates a new staff invitation with 6-digit verification code';
COMMENT ON FUNCTION verify_staff_with_code IS 'Verifies staff member using phone number and 6-digit code';
COMMENT ON FUNCTION verify_staff_with_token IS 'Handles URL-based invitation access, returns code for manual entry';
COMMENT ON FUNCTION complete_staff_setup IS 'Completes staff setup after verification (PIN, biometrics)';
COMMENT ON FUNCTION resend_staff_invitation IS 'Resends invitation with new 6-digit code';
COMMENT ON FUNCTION request_device_verification IS 'Requests verification for new device login';
