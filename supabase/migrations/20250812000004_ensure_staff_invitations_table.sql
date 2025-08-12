-- Ensure staff_invitations table exists (handle both cases: doesn't exist or exists as worker_invitations)

-- First check if worker_invitations exists and rename it
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'worker_invitations') THEN
        -- Table exists as worker_invitations, rename it
        ALTER TABLE worker_invitations RENAME TO staff_invitations;
        RAISE NOTICE 'Renamed worker_invitations to staff_invitations';
    ELSIF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_invitations') THEN
        -- Neither table exists, create staff_invitations
        CREATE TABLE staff_invitations (
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
        RAISE NOTICE 'Created staff_invitations table';
    ELSE
        RAISE NOTICE 'staff_invitations table already exists';
    END IF;
END $$;

-- Ensure indexes exist
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_invitation_per_user 
ON staff_invitations(user_id, status) 
WHERE status IN ('pending', 'sent', 'verified');

CREATE INDEX IF NOT EXISTS idx_invitations_phone_code 
ON staff_invitations(phone_number, verification_code) 
WHERE status IN ('pending', 'sent');

CREATE INDEX IF NOT EXISTS idx_invitations_token 
ON staff_invitations(invitation_token);

CREATE INDEX IF NOT EXISTS idx_invitations_user_status 
ON staff_invitations(user_id, status);

CREATE INDEX IF NOT EXISTS idx_invitations_expires 
ON staff_invitations(expires_at) 
WHERE status IN ('pending', 'sent');

-- Ensure the generate_verification_code function exists
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS CHAR(6)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate a 6-digit code (100000-999999)
  RETURN LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
END;
$$;

-- Recreate the create_staff_invitation function to use staff_invitations table
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
  UPDATE staff_invitations
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
  INSERT INTO staff_invitations (
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

-- Grant permissions
GRANT ALL ON staff_invitations TO authenticated;
GRANT ALL ON staff_invitations TO anon;
GRANT ALL ON staff_invitations TO service_role;


-- Update functions to reference staff_invitations
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
  v_clean_phone := REGEXP_REPLACE(p_phone_number, '[^0-9+]', '', 'g');
  
  SELECT 
    wi.*,
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.pin_hash
  INTO v_invitation
  FROM staff_invitations wi
  JOIN users u ON u.id = wi.user_id
  WHERE 
    (wi.phone_number = p_phone_number OR wi.phone_number = v_clean_phone)
    AND wi.verification_code = p_verification_code
    AND wi.status IN ('pending', 'sent')
  ORDER BY wi.created_at DESC
  LIMIT 1;
  
  IF v_invitation.id IS NULL THEN
    UPDATE staff_invitations
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
  
  IF v_invitation.expires_at < NOW() THEN
    UPDATE staff_invitations
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
  
  UPDATE staff_invitations
  SET 
    status = 'verified',
    verified_at = NOW(),
    device_id = p_device_id,
    device_info = p_device_info,
    updated_at = NOW()
  WHERE id = v_invitation.id;
  
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
  SELECT 
    wi.*,
    u.id as user_id,
    u.first_name,
    u.last_name
  INTO v_invitation
  FROM staff_invitations wi
  JOIN users u ON u.id = wi.user_id
  WHERE 
    wi.invitation_token = p_invitation_token
    AND wi.status IN ('pending', 'sent')
  LIMIT 1;
  
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
  
  IF v_invitation.expires_at < NOW() THEN
    UPDATE staff_invitations
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
  
  RETURN QUERY
  SELECT 
    TRUE,
    v_invitation.user_id,
    v_invitation.phone_number,
    v_invitation.verification_code,
    TRUE,
    NULL::TEXT,
    NULL::TEXT;
END;
$$;

-- Add comment
COMMENT ON TABLE staff_invitations IS 'Table for staff invitations and device verifications using 6-digit codes';
COMMENT ON FUNCTION create_staff_invitation IS 'Creates a new staff invitation with 6-digit verification code';
COMMENT ON FUNCTION verify_staff_with_code IS 'Verifies staff member using phone number and 6-digit code';
COMMENT ON FUNCTION verify_staff_with_token IS 'Handles URL-based invitation access, returns code for manual entry';
