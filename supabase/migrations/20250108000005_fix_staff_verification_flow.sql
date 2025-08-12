-- Fix Staff Verification Flow
-- This migration simplifies the staff invitation and verification process

-- Add verification_code column to worker_invitations table
ALTER TABLE worker_invitations
ADD COLUMN IF NOT EXISTS verification_code TEXT,
ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_verification_attempts INTEGER DEFAULT 5;

-- Create function to generate 6-digit verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate a 6-digit code (100000-999999)
  RETURN LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
END;
$$;

-- Update the worker_invitations table to auto-generate verification codes
CREATE OR REPLACE FUNCTION set_verification_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code := generate_verification_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate verification code
DROP TRIGGER IF EXISTS set_verification_code_trigger ON worker_invitations;
CREATE TRIGGER set_verification_code_trigger
BEFORE INSERT ON worker_invitations
FOR EACH ROW
EXECUTE FUNCTION set_verification_code();

-- Update existing invitations with verification codes
UPDATE worker_invitations
SET verification_code = generate_verification_code()
WHERE verification_code IS NULL AND status = 'pending';

-- Create simplified verification function
CREATE OR REPLACE FUNCTION verify_staff_member(
  p_phone_number TEXT,
  p_verification_code TEXT,
  p_device_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  user_id UUID,
  invitation_id UUID,
  invitation_token TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
  v_clean_phone TEXT;
BEGIN
  -- Clean phone number (remove spaces, dashes, etc)
  v_clean_phone := REGEXP_REPLACE(p_phone_number, '[^0-9+]', '', 'g');
  
  -- Find the invitation by phone and code
  SELECT wi.*, u.*
  INTO v_invitation
  FROM worker_invitations wi
  JOIN users u ON u.id = wi.user_id
  WHERE 
    (wi.phone_number = p_phone_number OR wi.phone_number = v_clean_phone)
    AND wi.verification_code = p_verification_code
    AND wi.status IN ('pending', 'sent', 'clicked')
  ORDER BY wi.created_at DESC
  LIMIT 1;
  
  -- Check if invitation exists
  IF v_invitation.id IS NULL THEN
    -- Try to find by just phone to give better error message
    SELECT COUNT(*) > 0 INTO v_invitation
    FROM worker_invitations
    WHERE (phone_number = p_phone_number OR phone_number = v_clean_phone);
    
    IF v_invitation THEN
      RETURN QUERY
      SELECT 
        FALSE,
        NULL::UUID,
        NULL::UUID,
        NULL::TEXT,
        'Invalid verification code'::TEXT;
    ELSE
      RETURN QUERY
      SELECT 
        FALSE,
        NULL::UUID,
        NULL::UUID,
        NULL::TEXT,
        'No invitation found for this phone number'::TEXT;
    END IF;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_invitation.expires_at < NOW() THEN
    RETURN QUERY
    SELECT 
      FALSE,
      v_invitation.user_id,
      v_invitation.id,
      v_invitation.invitation_token,
      'Invitation has expired. Please request a new one.'::TEXT;
    RETURN;
  END IF;
  
  -- Check if already completed
  IF v_invitation.status = 'completed' THEN
    RETURN QUERY
    SELECT 
      FALSE,
      v_invitation.user_id,
      v_invitation.id,
      v_invitation.invitation_token,
      'This invitation has already been used'::TEXT;
    RETURN;
  END IF;
  
  -- Check max attempts
  IF v_invitation.verification_attempts >= v_invitation.max_verification_attempts THEN
    RETURN QUERY
    SELECT 
      FALSE,
      v_invitation.user_id,
      v_invitation.id,
      v_invitation.invitation_token,
      'Too many verification attempts. Please request a new invitation.'::TEXT;
    RETURN;
  END IF;
  
  -- Update invitation status
  UPDATE worker_invitations
  SET 
    status = 'verified',
    verified_at = NOW(),
    device_id = COALESCE(p_device_id, device_id),
    clicked_at = COALESCE(clicked_at, NOW())
  WHERE id = v_invitation.id;
  
  -- Update user verification status
  UPDATE users
  SET 
    phone_verified = TRUE,
    verified_at = NOW(),
    last_device_id = COALESCE(p_device_id, last_device_id)
  WHERE id = v_invitation.user_id;
  
  -- Return success
  RETURN QUERY
  SELECT 
    TRUE,
    v_invitation.user_id,
    v_invitation.id,
    v_invitation.invitation_token,
    NULL::TEXT;
END;
$$;

-- Create function to resend invitation with new code
CREATE OR REPLACE FUNCTION resend_staff_invitation(
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  invitation_token TEXT,
  verification_code TEXT,
  phone_number TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
  v_new_code TEXT;
  v_new_token TEXT;
BEGIN
  -- Get the existing invitation
  SELECT wi.*, u.phone
  INTO v_invitation
  FROM worker_invitations wi
  JOIN users u ON u.id = wi.user_id
  WHERE 
    wi.user_id = p_user_id
    AND wi.status != 'completed'
  ORDER BY wi.created_at DESC
  LIMIT 1;
  
  IF v_invitation.id IS NULL THEN
    RETURN QUERY
    SELECT 
      FALSE,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      'No pending invitation found for this user'::TEXT;
    RETURN;
  END IF;
  
  -- Generate new code and token
  v_new_code := generate_verification_code();
  v_new_token := gen_random_uuid()::TEXT;
  
  -- Update the invitation
  UPDATE worker_invitations
  SET 
    verification_code = v_new_code,
    invitation_token = v_new_token,
    verification_attempts = 0,
    expires_at = NOW() + INTERVAL '7 days',
    status = 'pending',
    sms_sent_at = NULL,
    updated_at = NOW()
  WHERE id = v_invitation.id;
  
  RETURN QUERY
  SELECT 
    TRUE,
    v_new_token,
    v_new_code,
    v_invitation.phone,
    NULL::TEXT;
END;
$$;

-- Create function to increment verification attempts
CREATE OR REPLACE FUNCTION increment_verification_attempts(
  p_phone_number TEXT,
  p_verification_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE worker_invitations
  SET verification_attempts = verification_attempts + 1
  WHERE 
    phone_number = p_phone_number
    AND verification_code != p_verification_code
    AND status IN ('pending', 'sent', 'clicked');
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_worker_invitations_phone_code 
ON worker_invitations(phone_number, verification_code) 
WHERE status IN ('pending', 'sent', 'clicked');

CREATE INDEX IF NOT EXISTS idx_worker_invitations_user_status 
ON worker_invitations(user_id, status);

-- Add helpful comments
COMMENT ON COLUMN worker_invitations.verification_code IS '6-digit verification code sent via SMS';
COMMENT ON COLUMN worker_invitations.verification_attempts IS 'Number of failed verification attempts';
COMMENT ON FUNCTION verify_staff_member IS 'Simplified staff verification using phone number and 6-digit code';
COMMENT ON FUNCTION resend_staff_invitation IS 'Resend invitation with new verification code';
