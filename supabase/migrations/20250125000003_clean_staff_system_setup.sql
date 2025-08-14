-- Clean Staff System Setup
-- This migration consolidates all staff-related functionality into a clean, working system

-- Ensure users table has necessary columns for staff functionality
DO $$
BEGIN
    -- Add phone_verified column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'phone_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add verified_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'verified_at'
    ) THEN
        ALTER TABLE users ADD COLUMN verified_at TIMESTAMPTZ;
    END IF;
    
    -- Add last_device_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'last_device_id'
    ) THEN
        ALTER TABLE users ADD COLUMN last_device_id TEXT;
    END IF;
    
    -- Add pin_hash column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'pin_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN pin_hash TEXT;
    END IF;
    
    -- Add pin_attempts column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'pin_attempts'
    ) THEN
        ALTER TABLE users ADD COLUMN pin_attempts INTEGER DEFAULT 0;
    END IF;
    
    -- Add pin_locked_until column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'pin_locked_until'
    ) THEN
        ALTER TABLE users ADD COLUMN pin_locked_until TIMESTAMPTZ;
    END IF;
    
    -- Add last_activity_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'last_activity_at'
    ) THEN
        ALTER TABLE users ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add biometric_enabled column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'biometric_enabled'
    ) THEN
        ALTER TABLE users ADD COLUMN biometric_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    
    RAISE NOTICE 'Users table columns updated';
END $$;

-- Create indexes for users table if they don't exist
DO $$
BEGIN
    -- Phone verification index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_users_phone_verified'
    ) THEN
        CREATE INDEX idx_users_phone_verified ON users(phone_verified) WHERE phone_verified = TRUE;
        RAISE NOTICE 'Created idx_users_phone_verified index';
    END IF;
    
    -- Phone number index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_users_phone'
    ) THEN
        CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
        RAISE NOTICE 'Created idx_users_phone index';
    END IF;
    
    -- Role index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_users_role'
    ) THEN
        CREATE INDEX idx_users_role ON users(role);
        RAISE NOTICE 'Created idx_users_role index';
    END IF;
END $$;

-- Ensure verification_codes table has the right structure
DO $$
BEGIN
    -- Add phone_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verification_codes' 
        AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE verification_codes ADD COLUMN phone_number TEXT;
    END IF;
    
    -- Add indexes for phone number lookups
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_verification_codes_phone'
    ) THEN
        CREATE INDEX idx_verification_codes_phone ON verification_codes(phone_number, code) WHERE phone_number IS NOT NULL;
        RAISE NOTICE 'Created idx_verification_codes_phone index';
    END IF;
    
    -- Add constraint to ensure either phone or email is provided
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
        RAISE NOTICE 'Added phone_or_email constraint';
    END IF;
END $$;

-- Clean up any orphaned verification codes
DELETE FROM verification_codes WHERE expires_at < NOW() - INTERVAL '24 hours';

-- Ensure staff_sessions table exists with proper structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_sessions') THEN
        CREATE TABLE staff_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            session_token TEXT NOT NULL UNIQUE,
            refresh_token TEXT NOT NULL UNIQUE,
            device_id TEXT,
            device_info JSONB DEFAULT '{}'::JSONB,
            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            last_active_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_staff_sessions_user ON staff_sessions(user_id);
        CREATE INDEX idx_staff_sessions_token ON staff_sessions(session_token);
        CREATE INDEX idx_staff_sessions_expires ON staff_sessions(expires_at);
        CREATE INDEX idx_staff_sessions_device ON staff_sessions(device_id);
        
        RAISE NOTICE 'Created staff_sessions table';
    ELSE
        RAISE NOTICE 'staff_sessions table already exists';
    END IF;
END $$;

-- Ensure staff_invitations table exists with proper structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_invitations') THEN
        CREATE TABLE staff_invitations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            invited_by UUID REFERENCES users(id),
            phone_number TEXT NOT NULL,
            verification_code CHAR(6) NOT NULL,
            invitation_token UUID DEFAULT gen_random_uuid(),
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'verified', 'completed', 'expired', 'cancelled')),
            verification_attempts INTEGER DEFAULT 0,
            max_attempts INTEGER DEFAULT 5,
            device_id TEXT,
            device_info JSONB DEFAULT '{}'::JSONB,
            sms_sent_at TIMESTAMPTZ,
            sms_message_id TEXT,
            sms_delivery_status TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
            verified_at TIMESTAMPTZ,
            completed_at TIMESTAMPTZ
        );
        
        -- Create indexes
        CREATE UNIQUE INDEX unique_active_invitation_per_user 
        ON staff_invitations(user_id, status) 
        WHERE status IN ('pending', 'sent', 'verified');
        
        CREATE INDEX idx_invitations_phone_code ON staff_invitations(phone_number, verification_code) 
        WHERE status IN ('pending', 'sent');
        CREATE INDEX idx_invitations_token ON staff_invitations(invitation_token);
        CREATE INDEX idx_invitations_user_status ON staff_invitations(user_id, status);
        CREATE INDEX idx_invitations_expires ON staff_invitations(expires_at) 
        WHERE status IN ('pending', 'sent');
        
        RAISE NOTICE 'Created staff_invitations table';
    ELSE
        RAISE NOTICE 'staff_invitations table already exists';
    END IF;
END $$;

-- Drop any conflicting worker_* tables that might exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'worker_invitations') THEN
        DROP TABLE worker_invitations CASCADE;
        RAISE NOTICE 'Dropped worker_invitations table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'worker_sessions') THEN
        DROP TABLE worker_sessions CASCADE;
        RAISE NOTICE 'Dropped worker_sessions table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'worker_devices') THEN
        DROP TABLE worker_devices CASCADE;
        RAISE NOTICE 'Dropped worker_devices table';
    END IF;
END $$;

-- Create or replace all necessary functions
-- First drop the existing function if it has a different signature
DROP FUNCTION IF EXISTS generate_verification_code() CASCADE;

CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS CHAR(6)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
END;
$$;

-- Create clean create_staff_invitation function
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

-- Create clean verify_staff_with_code function
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
        si.*,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.pin_hash
    INTO v_invitation
    FROM staff_invitations si
    JOIN users u ON u.id = si.user_id
    WHERE 
        (si.phone_number = p_phone_number OR si.phone_number = v_clean_phone)
        AND si.verification_code = p_verification_code
        AND si.status IN ('pending', 'sent')
    ORDER BY si.created_at DESC
    LIMIT 1;
    
    -- Check if invitation exists
    IF v_invitation.id IS NULL THEN
        -- Increment attempts for wrong code
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
    
    -- Check if expired
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
    UPDATE staff_invitations
    SET 
        status = 'verified',
        verified_at = NOW(),
        device_id = p_device_id,
        device_info = p_device_info,
        updated_at = NOW()
    WHERE id = v_invitation.id;
    
    -- Update user
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
        'SUCCESS'::TEXT,
        'Verification successful'::TEXT;
END;
$$;

-- Create clean verify_staff_with_token function
CREATE OR REPLACE FUNCTION verify_staff_with_token(
    p_invitation_token UUID,
    p_device_id TEXT DEFAULT NULL,
    p_device_info JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
    success BOOLEAN,
    user_id UUID,
    invitation_id UUID,
    organization_id UUID,
    phone_number TEXT,
    error_code TEXT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation RECORD;
BEGIN
    -- Find the invitation by token
    SELECT 
        si.*,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.pin_hash
    INTO v_invitation
    FROM staff_invitations si
    JOIN users u ON u.id = si.user_id
    WHERE 
        si.invitation_token = p_invitation_token
        AND si.status IN ('pending', 'sent')
    ORDER BY si.created_at DESC
    LIMIT 1;
    
    -- Check if invitation exists
    IF v_invitation.id IS NULL THEN
        RETURN QUERY
        SELECT 
            FALSE,
            NULL::UUID,
            NULL::UUID,
            NULL::UUID,
            NULL::TEXT,
            'INVALID_TOKEN'::TEXT,
            'Invalid or expired invitation link'::TEXT;
        RETURN;
    END IF;
    
    -- Check if expired
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
            v_invitation.phone_number,
            'EXPIRED'::TEXT,
            'Invitation has expired'::TEXT;
        RETURN;
    END IF;
    
    -- Success! Return invitation details
    RETURN QUERY
    SELECT 
        TRUE,
        v_invitation.user_id,
        v_invitation.id,
        v_invitation.organization_id,
        v_invitation.phone_number,
        'SUCCESS'::TEXT,
        'Token valid'::TEXT;
END;
$$;

-- Create validate_staff_session function
CREATE OR REPLACE FUNCTION validate_staff_session(
    p_session_token TEXT,
    p_device_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    valid BOOLEAN,
    user_id UUID,
    organization_id UUID,
    expires_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
BEGIN
    -- Find the session
    SELECT 
        ss.*,
        u.organization_id
    INTO v_session
    FROM staff_sessions ss
    JOIN users u ON u.id = ss.user_id
    WHERE ss.session_token = p_session_token;
    
    -- Check if session exists and is valid
    IF v_session.id IS NULL THEN
        RETURN QUERY
        SELECT 
            FALSE,
            NULL::UUID,
            NULL::UUID,
            NULL::TIMESTAMPTZ,
            NULL::TIMESTAMPTZ;
        RETURN;
    END IF;
    
    -- Check if session has expired
    IF v_session.expires_at < NOW() THEN
        -- Mark session as expired
        UPDATE staff_sessions
        SET status = 'expired'
        WHERE id = v_session.id;
        
        RETURN QUERY
        SELECT 
            FALSE,
            NULL::UUID,
            NULL::UUID,
            NULL::TIMESTAMPTZ,
            NULL::TIMESTAMPTZ;
        RETURN;
    END IF;
    
    -- Check device ID if provided
    IF p_device_id IS NOT NULL AND v_session.device_id != p_device_id THEN
        RETURN QUERY
        SELECT 
            FALSE,
            NULL::UUID,
            NULL::UUID,
            NULL::TIMESTAMPTZ,
            NULL::TIMESTAMPTZ;
        RETURN;
    END IF;
    
    -- Update last activity
    UPDATE staff_sessions
    SET last_active_at = NOW()
    WHERE id = v_session.id;
    
    -- Return valid session
    RETURN QUERY
    SELECT 
        TRUE,
        v_session.user_id,
        v_session.organization_id,
        v_session.expires_at,
        v_session.last_active_at;
END;
$$;

-- Create verify_staff_pin function
CREATE OR REPLACE FUNCTION verify_staff_pin(
    p_user_id UUID,
    p_pin_hash TEXT,
    p_device_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    error_message TEXT,
    attempts_remaining INTEGER,
    pin_reset_required BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_attempts INTEGER;
    v_max_attempts INTEGER := 5;
    v_lockout_duration INTERVAL := INTERVAL '15 minutes';
BEGIN
    -- Get user's PIN status
    SELECT 
        pin_hash,
        pin_attempts,
        pin_locked_until
    INTO v_user
    FROM users
    WHERE id = p_user_id;
    
    IF v_user.pin_hash IS NULL THEN
        RETURN QUERY
        SELECT 
            FALSE,
            'PIN not set'::TEXT,
            0,
            TRUE;
        RETURN;
    END IF;
    
    -- Check if account is locked
    IF v_user.pin_locked_until IS NOT NULL AND v_user.pin_locked_until > NOW() THEN
        RETURN QUERY
        SELECT 
            FALSE,
            'Account locked due to too many failed attempts'::TEXT,
            0,
            FALSE;
        RETURN;
    END IF;
    
    -- Check if PIN is correct
    IF v_user.pin_hash = p_pin_hash THEN
        -- Reset attempts on successful PIN
        UPDATE users
        SET 
            pin_attempts = 0,
            pin_locked_until = NULL,
            last_activity_at = NOW()
        WHERE id = p_user_id;
        
        RETURN QUERY
        SELECT 
            TRUE,
            NULL::TEXT,
            v_max_attempts,
            FALSE;
        RETURN;
    ELSE
        -- Increment failed attempts
        v_attempts := COALESCE(v_user.pin_attempts, 0) + 1;
        
        UPDATE users
        SET 
            pin_attempts = v_attempts,
            pin_locked_until = CASE 
                WHEN v_attempts >= v_max_attempts THEN NOW() + v_lockout_duration
                ELSE NULL
            END,
            last_activity_at = NOW()
        WHERE id = p_user_id;
        
        -- Check if account should be locked
        IF v_attempts >= v_max_attempts THEN
            RETURN QUERY
            SELECT 
                FALSE,
                'Account locked due to too many failed attempts'::TEXT,
                0,
                FALSE;
            RETURN;
        END IF;
        
        RETURN QUERY
        SELECT 
            FALSE,
            'Invalid PIN'::TEXT,
            v_max_attempts - v_attempts,
            FALSE;
        RETURN;
    END IF;
END;
$$;

-- Create update_last_activity function
CREATE OR REPLACE FUNCTION update_last_activity(
    p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users
    SET last_activity_at = NOW()
    WHERE id = p_user_id;
END;
$$;

-- Grant all necessary permissions
GRANT EXECUTE ON FUNCTION generate_verification_code TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_staff_invitation TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_staff_with_code TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_staff_with_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_staff_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_staff_pin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_last_activity TO anon, authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_invitations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_sessions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON verification_codes TO anon, authenticated;
GRANT SELECT, UPDATE ON users TO anon, authenticated;

DO $$
BEGIN
    RAISE NOTICE 'Staff system setup completed successfully';
END $$;
