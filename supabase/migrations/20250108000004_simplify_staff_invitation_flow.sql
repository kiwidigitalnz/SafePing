-- Add device_id field to worker_invitations table for tracking verification device
ALTER TABLE worker_invitations
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Add index on invitation_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_worker_invitations_token ON worker_invitations(invitation_token);

-- Add index on phone_number for code-based lookups
CREATE INDEX IF NOT EXISTS idx_worker_invitations_phone ON worker_invitations(phone_number);

-- Drop existing function if it exists with different signature
DROP FUNCTION IF EXISTS create_worker_session(UUID, TEXT, JSONB);

-- Create the create_worker_session function to handle session creation
CREATE OR REPLACE FUNCTION create_worker_session(
  p_user_id UUID,
  p_device_id TEXT,
  p_device_info JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  session_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_token TEXT;
  v_refresh_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate secure tokens
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_refresh_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '30 days';
  
  -- Store session (you might want to create a sessions table)
  -- For now, we'll just return the tokens
  
  -- Update user's last device
  UPDATE users 
  SET 
    last_device_id = p_device_id,
    last_login_at = NOW()
  WHERE id = p_user_id;
  
  RETURN QUERY
  SELECT 
    v_session_token,
    v_refresh_token,
    v_expires_at;
END;
$$;

-- Add fields to users table for better tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT FALSE;

-- Create a function to validate invitation tokens
CREATE OR REPLACE FUNCTION validate_invitation_token(
  p_token TEXT
)
RETURNS TABLE (
  invitation_id UUID,
  user_id UUID,
  is_valid BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Find the invitation
  SELECT * INTO v_invitation
  FROM worker_invitations
  WHERE invitation_token = p_token
  LIMIT 1;
  
  -- Check if invitation exists
  IF v_invitation.id IS NULL THEN
    RETURN QUERY
    SELECT 
      NULL::UUID,
      NULL::UUID,
      FALSE,
      'Invalid invitation token'::TEXT;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_invitation.expires_at < NOW() THEN
    RETURN QUERY
    SELECT 
      v_invitation.id,
      v_invitation.user_id,
      FALSE,
      'Invitation has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Check if already used
  IF v_invitation.status = 'completed' THEN
    RETURN QUERY
    SELECT 
      v_invitation.id,
      v_invitation.user_id,
      FALSE,
      'Invitation has already been used'::TEXT;
    RETURN;
  END IF;
  
  -- Valid invitation
  RETURN QUERY
  SELECT 
    v_invitation.id,
    v_invitation.user_id,
    TRUE,
    NULL::TEXT;
END;
$$;

-- Create a function to extend invitation expiry
CREATE OR REPLACE FUNCTION extend_invitation_expiry(
  p_user_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE worker_invitations
  SET 
    expires_at = NOW() + (p_days || ' days')::INTERVAL,
    updated_at = NOW()
  WHERE 
    user_id = p_user_id
    AND status != 'completed';
    
  RETURN FOUND;
END;
$$;

-- Add comment explaining the simplified flow
COMMENT ON TABLE worker_invitations IS 'Simplified staff invitation system. Supports both token-based (click link) and code-based (manual entry) verification.';
