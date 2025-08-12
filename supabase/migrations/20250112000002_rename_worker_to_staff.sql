-- Rename all worker-related tables to use staff terminology
-- This migration updates table names, function names, and all references

-- 1. Rename tables
ALTER TABLE worker_invitations RENAME TO staff_invitations;
ALTER TABLE worker_sessions RENAME TO staff_sessions;
ALTER TABLE worker_devices RENAME TO staff_devices;

-- 2. Rename constraints (PostgreSQL automatically updates foreign key names, but we'll rename them for clarity)
ALTER TABLE staff_invitations RENAME CONSTRAINT worker_invitations_pkey TO staff_invitations_pkey;
ALTER TABLE staff_invitations RENAME CONSTRAINT worker_invitations_user_id_fkey TO staff_invitations_user_id_fkey;
ALTER TABLE staff_invitations RENAME CONSTRAINT worker_invitations_organization_id_fkey TO staff_invitations_organization_id_fkey;
ALTER TABLE staff_invitations RENAME CONSTRAINT worker_invitations_created_by_fkey TO staff_invitations_created_by_fkey;
ALTER TABLE staff_invitations RENAME CONSTRAINT unique_active_invitation_per_user TO unique_active_invitation_per_staff;

ALTER TABLE staff_sessions RENAME CONSTRAINT worker_sessions_pkey TO staff_sessions_pkey;
ALTER TABLE staff_sessions RENAME CONSTRAINT worker_sessions_user_id_fkey TO staff_sessions_user_id_fkey;
ALTER TABLE staff_sessions RENAME CONSTRAINT worker_sessions_device_id_fkey TO staff_sessions_device_id_fkey;

ALTER TABLE staff_devices RENAME CONSTRAINT worker_devices_pkey TO staff_devices_pkey;
ALTER TABLE staff_devices RENAME CONSTRAINT worker_devices_user_id_fkey TO staff_devices_user_id_fkey;

-- 3. Update functions that reference worker tables
-- Drop and recreate functions with updated references

-- Drop existing functions
DROP FUNCTION IF EXISTS create_staff_invitation CASCADE;
DROP FUNCTION IF EXISTS verify_staff_with_token CASCADE;
DROP FUNCTION IF EXISTS verify_staff_with_code CASCADE;
DROP FUNCTION IF EXISTS complete_staff_setup CASCADE;
DROP FUNCTION IF EXISTS resend_staff_invitation CASCADE;
DROP FUNCTION IF EXISTS create_worker_session CASCADE;
DROP FUNCTION IF EXISTS validate_worker_session CASCADE;
DROP FUNCTION IF EXISTS verify_worker_pin CASCADE;
DROP FUNCTION IF EXISTS request_device_verification CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_worker_sessions CASCADE;

-- Recreate functions with staff terminology

-- Function to create staff invitation
CREATE OR REPLACE FUNCTION create_staff_invitation(
    p_user_id UUID,
    p_organization_id UUID,
    p_created_by UUID,
    p_phone_number TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation_token UUID;
    v_verification_code TEXT;
    v_result JSON;
BEGIN
    -- Generate tokens
    v_invitation_token := gen_random_uuid();
    v_verification_code := generate_verification_code();
    
    -- Deactivate any existing active invitations for this user
    UPDATE staff_invitations
    SET status = 'cancelled',
        updated_at = now()
    WHERE user_id = p_user_id
    AND status IN ('pending', 'sent');
    
    -- Create new invitation
    INSERT INTO staff_invitations (
        user_id,
        organization_id,
        invitation_token,
        verification_code,
        created_by,
        phone_number,
        status,
        expires_at
    ) VALUES (
        p_user_id,
        p_organization_id,
        v_invitation_token,
        v_verification_code,
        p_created_by,
        p_phone_number,
        'pending',
        now() + interval '24 hours'
    );
    
    -- Return the invitation details
    SELECT json_build_object(
        'invitation_token', v_invitation_token,
        'verification_code', v_verification_code,
        'phone_number', p_phone_number,
        'expires_at', now() + interval '24 hours'
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Function to verify staff with token
CREATE OR REPLACE FUNCTION verify_staff_with_token(
    p_invitation_token UUID,
    p_device_info JSONB DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation RECORD;
    v_result JSON;
BEGIN
    -- Find the invitation
    SELECT si.*, u.phone, u.first_name, u.last_name, u.email
    INTO v_invitation
    FROM staff_invitations si
    JOIN users u ON u.id = si.user_id
    WHERE si.invitation_token = p_invitation_token
    AND si.expires_at > now()
    AND si.status IN ('pending', 'sent')
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation token';
    END IF;
    
    -- Return phone number to prompt for verification code
    v_result := json_build_object(
        'phone_number', v_invitation.phone,
        'requires_code', true
    );
    
    RETURN v_result;
END;
$$;

-- Function to verify staff with code
CREATE OR REPLACE FUNCTION verify_staff_with_code(
    p_phone_number TEXT,
    p_verification_code TEXT,
    p_device_info JSONB DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation RECORD;
    v_user RECORD;
    v_device_id UUID;
    v_session_token UUID;
    v_refresh_token UUID;
    v_result JSON;
BEGIN
    -- Normalize phone number
    p_phone_number := regexp_replace(p_phone_number, '[^0-9]', '', 'g');
    
    -- Find the invitation
    SELECT si.*, u.*
    INTO v_invitation
    FROM staff_invitations si
    JOIN users u ON u.id = si.user_id
    WHERE si.phone_number = p_phone_number
    AND si.verification_code = p_verification_code
    AND si.expires_at > now()
    AND si.status IN ('pending', 'sent')
    ORDER BY si.created_at DESC
    LIMIT 1
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid verification code or phone number';
    END IF;
    
    -- Create or update device
    INSERT INTO staff_devices (
        user_id,
        device_info,
        last_active_at
    ) VALUES (
        v_invitation.user_id,
        p_device_info,
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET last_active_at = now()
    RETURNING id INTO v_device_id;
    
    -- Create session
    v_session_token := gen_random_uuid();
    v_refresh_token := gen_random_uuid();
    
    INSERT INTO staff_sessions (
        user_id,
        device_id,
        session_token,
        refresh_token,
        expires_at,
        is_active
    ) VALUES (
        v_invitation.user_id,
        v_device_id,
        v_session_token,
        v_refresh_token,
        now() + interval '30 days',
        true
    );
    
    -- Update invitation status
    UPDATE staff_invitations
    SET status = 'accepted',
        accepted_at = now(),
        device_info = p_device_info
    WHERE id = v_invitation.id;
    
    -- Update user verification status
    UPDATE users
    SET phone_verified = true,
        updated_at = now()
    WHERE id = v_invitation.user_id;
    
    -- Get user details
    SELECT * INTO v_user
    FROM users
    WHERE id = v_invitation.user_id;
    
    -- Return result
    v_result := json_build_object(
        'user', json_build_object(
            'id', v_user.id,
            'email', v_user.email,
            'phone', v_user.phone,
            'first_name', v_user.first_name,
            'last_name', v_user.last_name,
            'role', v_user.role,
            'organization_id', v_user.organization_id,
            'pin_set', v_user.pin_hash IS NOT NULL,
            'biometric_enabled', v_user.biometric_enabled
        ),
        'session', json_build_object(
            'token', v_session_token,
            'refresh_token', v_refresh_token,
            'expires_at', now() + interval '30 days'
        ),
        'device_id', v_device_id
    );
    
    RETURN v_result;
END;
$$;

-- Function to complete staff setup (PIN/biometric)
CREATE OR REPLACE FUNCTION complete_staff_setup(
    p_user_id UUID,
    p_pin_hash TEXT DEFAULT NULL,
    p_biometric_enabled BOOLEAN DEFAULT FALSE
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Update user with setup details
    UPDATE users
    SET pin_hash = p_pin_hash,
        biometric_enabled = p_biometric_enabled,
        updated_at = now()
    WHERE id = p_user_id;
    
    -- Return success
    v_result := json_build_object(
        'success', true,
        'pin_set', p_pin_hash IS NOT NULL,
        'biometric_enabled', p_biometric_enabled
    );
    
    RETURN v_result;
END;
$$;

-- Function to resend staff invitation
CREATE OR REPLACE FUNCTION resend_staff_invitation(
    p_invitation_id UUID,
    p_requested_by UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation RECORD;
    v_new_code TEXT;
    v_result JSON;
BEGIN
    -- Find the invitation
    SELECT * INTO v_invitation
    FROM staff_invitations
    WHERE id = p_invitation_id
    AND status IN ('pending', 'sent')
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation not found or already accepted';
    END IF;
    
    -- Generate new verification code
    v_new_code := generate_verification_code();
    
    -- Update invitation
    UPDATE staff_invitations
    SET verification_code = v_new_code,
        expires_at = now() + interval '24 hours',
        updated_at = now()
    WHERE id = p_invitation_id;
    
    -- Return result
    v_result := json_build_object(
        'invitation_token', v_invitation.invitation_token,
        'verification_code', v_new_code,
        'phone_number', v_invitation.phone_number,
        'expires_at', now() + interval '24 hours'
    );
    
    RETURN v_result;
END;
$$;

-- Function to create staff session
CREATE OR REPLACE FUNCTION create_staff_session(
    p_user_id UUID,
    p_device_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_token UUID;
    v_refresh_token UUID;
    v_result JSON;
BEGIN
    -- Generate tokens
    v_session_token := gen_random_uuid();
    v_refresh_token := gen_random_uuid();
    
    -- Deactivate other sessions for this device
    UPDATE staff_sessions
    SET is_active = false
    WHERE device_id = p_device_id
    AND is_active = true;
    
    -- Create new session
    INSERT INTO staff_sessions (
        user_id,
        device_id,
        session_token,
        refresh_token,
        expires_at,
        is_active
    ) VALUES (
        p_user_id,
        p_device_id,
        v_session_token,
        v_refresh_token,
        now() + interval '30 days',
        true
    );
    
    -- Update device last active
    UPDATE staff_devices
    SET last_active_at = now()
    WHERE id = p_device_id;
    
    -- Return tokens
    v_result := json_build_object(
        'session_token', v_session_token,
        'refresh_token', v_refresh_token,
        'expires_at', now() + interval '30 days'
    );
    
    RETURN v_result;
END;
$$;

-- Function to validate staff session
CREATE OR REPLACE FUNCTION validate_staff_session(
    p_session_token UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_user RECORD;
    v_result JSON;
BEGIN
    -- Find active session
    SELECT s.*, u.*
    INTO v_session
    FROM staff_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.session_token = p_session_token
    AND s.is_active = true
    AND s.expires_at > now();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired session';
    END IF;
    
    -- Update last activity
    UPDATE staff_sessions
    SET last_activity_at = now()
    WHERE id = v_session.id;
    
    UPDATE staff_devices
    SET last_active_at = now()
    WHERE id = v_session.device_id;
    
    -- Return user info
    v_result := json_build_object(
        'user_id', v_session.user_id,
        'organization_id', v_session.organization_id,
        'role', v_session.role,
        'device_id', v_session.device_id
    );
    
    RETURN v_result;
END;
$$;

-- Function to verify staff PIN
CREATE OR REPLACE FUNCTION verify_staff_pin(
    p_user_id UUID,
    p_pin_hash TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_attempts INT;
    v_locked_until TIMESTAMP;
    v_result JSON;
BEGIN
    -- Get user and check attempts
    SELECT u.*, 
           COALESCE(p.attempt_count, 0) as attempts,
           p.locked_until
    INTO v_user, v_attempts, v_locked_until
    FROM users u
    LEFT JOIN pin_verification_attempts p ON p.user_id = u.id
    WHERE u.id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Check if account is locked
    IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
        RAISE EXCEPTION 'Account temporarily locked';
    END IF;
    
    -- Verify PIN
    IF v_user.pin_hash = p_pin_hash THEN
        -- Reset attempts on success
        DELETE FROM pin_verification_attempts
        WHERE user_id = p_user_id;
        
        v_result := json_build_object(
            'success', true,
            'attempts_remaining', 5
        );
    ELSE
        -- Increment attempts
        INSERT INTO pin_verification_attempts (user_id, attempt_count, last_attempt_at)
        VALUES (p_user_id, 1, now())
        ON CONFLICT (user_id) DO UPDATE
        SET attempt_count = pin_verification_attempts.attempt_count + 1,
            last_attempt_at = now(),
            locked_until = CASE 
                WHEN pin_verification_attempts.attempt_count >= 4 
                THEN now() + interval '30 minutes'
                ELSE NULL
            END;
        
        v_result := json_build_object(
            'success', false,
            'attempts_remaining', GREATEST(0, 5 - (v_attempts + 1))
        );
    END IF;
    
    RETURN v_result;
END;
$$;

-- Function for device verification requests
CREATE OR REPLACE FUNCTION request_device_verification(
    p_user_id UUID,
    p_device_info JSONB
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_verification_code TEXT;
    v_result JSON;
BEGIN
    -- Get user details
    SELECT * INTO v_user
    FROM users
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Generate verification code
    v_verification_code := generate_verification_code();
    
    -- Create temporary device verification entry
    INSERT INTO staff_invitations (
        user_id,
        organization_id,
        invitation_token,
        verification_code,
        created_by,
        phone_number,
        status,
        expires_at,
        device_info
    ) VALUES (
        p_user_id,
        v_user.organization_id,
        gen_random_uuid(),
        v_verification_code,
        p_user_id,
        v_user.phone,
        'device_verification',
        now() + interval '15 minutes',
        p_device_info
    );
    
    v_result := json_build_object(
        'phone_number', v_user.phone,
        'verification_code', v_verification_code
    );
    
    RETURN v_result;
END;
$$;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_staff_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Deactivate expired sessions
    UPDATE staff_sessions
    SET is_active = false
    WHERE expires_at < now()
    AND is_active = true;
    
    -- Delete old inactive sessions (older than 90 days)
    DELETE FROM staff_sessions
    WHERE is_active = false
    AND expires_at < now() - interval '90 days';
    
    -- Delete old invitations
    DELETE FROM staff_invitations
    WHERE expires_at < now() - interval '30 days'
    AND status IN ('expired', 'cancelled');
END;
$$;

-- Update RLS policies to use new table names
DROP POLICY IF EXISTS "Staff can view own invitations" ON worker_invitations;
DROP POLICY IF EXISTS "Admins can manage org invitations" ON worker_invitations;
DROP POLICY IF EXISTS "Staff can view own sessions" ON worker_sessions;
DROP POLICY IF EXISTS "Staff can view own devices" ON worker_devices;

-- Create new RLS policies with proper names
CREATE POLICY "Staff can view own invitations" ON staff_invitations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage org invitations" ON staff_invitations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'org_admin', 'admin')
        )
    );

CREATE POLICY "Staff can view own sessions" ON staff_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Staff can view own devices" ON staff_devices
    FOR SELECT USING (user_id = auth.uid());

-- Add helpful comments
COMMENT ON TABLE staff_invitations IS 'Manages staff member invitations and verification codes';
COMMENT ON TABLE staff_sessions IS 'Tracks active sessions for staff members across devices';
COMMENT ON TABLE staff_devices IS 'Stores information about devices used by staff members';