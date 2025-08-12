-- Add phone_number column to verification_codes table if it doesn't exist
ALTER TABLE verification_codes 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Drop existing email NOT NULL constraint if it exists
ALTER TABLE verification_codes 
ALTER COLUMN email DROP NOT NULL;

-- Add constraint to ensure either phone or email is provided
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'phone_or_email' 
    AND conrelid = 'verification_codes'::regclass
  ) THEN
    ALTER TABLE verification_codes 
    ADD CONSTRAINT phone_or_email CHECK (
      (phone_number IS NOT NULL AND email IS NULL) OR 
      (email IS NOT NULL AND phone_number IS NULL)
    );
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone_number, code) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email, code) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);

-- Function to verify OTP code
CREATE OR REPLACE FUNCTION verify_code_simple(
  p_phone_number TEXT,
  p_code TEXT
) RETURNS JSONB AS $$
DECLARE
  v_verification verification_codes;
  v_user_id UUID;
BEGIN
  -- Find the verification code
  SELECT * INTO v_verification
  FROM verification_codes
  WHERE phone_number = p_phone_number
    AND code = p_code
    AND used_at IS NULL
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if code exists
  IF v_verification.id IS NULL THEN
    -- Check if code exists but is expired
    IF EXISTS (
      SELECT 1 FROM verification_codes
      WHERE phone_number = p_phone_number
        AND code = p_code
        AND expires_at <= NOW()
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Verification code has expired'
      );
    END IF;
    
    -- Check if code was already used
    IF EXISTS (
      SELECT 1 FROM verification_codes
      WHERE phone_number = p_phone_number
        AND code = p_code
        AND used_at IS NOT NULL
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Verification code has already been used'
      );
    END IF;
    
    -- Increment attempts for any active codes
    UPDATE verification_codes
    SET attempts = attempts + 1
    WHERE phone_number = p_phone_number
      AND used_at IS NULL
      AND expires_at > NOW();
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid verification code'
    );
  END IF;

  -- Mark code as used
  UPDATE verification_codes
  SET used_at = NOW()
  WHERE id = v_verification.id;

  -- Get user ID from metadata if available
  v_user_id := (v_verification.metadata->>'user_id')::UUID;

  RETURN jsonb_build_object(
    'success', true,
    'verification_id', v_verification.id,
    'type', v_verification.type,
    'user_id', v_user_id,
    'metadata', v_verification.metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create staff session after OTP verification
CREATE OR REPLACE FUNCTION create_staff_session_after_otp(
  p_user_id UUID,
  p_device_id TEXT,
  p_device_info JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
  v_session_id UUID;
  v_session_token TEXT;
  v_refresh_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate tokens
  v_session_id := gen_random_uuid();
  v_session_token := encode(gen_random_bytes(32), 'base64');
  v_refresh_token := encode(gen_random_bytes(32), 'base64');
  v_expires_at := NOW() + INTERVAL '30 days';

  -- Create session
  INSERT INTO staff_sessions (
    id,
    user_id,
    session_token,
    refresh_token,
    device_id,
    device_info,
    expires_at,
    last_activity_at
  ) VALUES (
    v_session_id,
    p_user_id,
    v_session_token,
    v_refresh_token,
    p_device_id,
    p_device_info,
    v_expires_at,
    NOW()
  );

  -- Update user's last login
  UPDATE users
  SET 
    last_login_at = NOW(),
    last_activity_at = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'session_token', v_session_token,
    'refresh_token', v_refresh_token,
    'expires_at', v_expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION verify_code_simple TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_staff_session_after_otp TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_verification_codes TO service_role;