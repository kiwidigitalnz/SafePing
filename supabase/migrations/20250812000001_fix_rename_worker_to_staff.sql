-- Fix and rename worker tables to staff tables
-- This migration handles the renaming properly

-- First, ensure phone_verified column exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users(phone_verified) WHERE phone_verified = TRUE;

-- Check if tables need renaming (they exist as worker_* tables)
DO $$ 
BEGIN
    -- Rename worker_invitations to staff_invitations if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'worker_invitations') THEN
        ALTER TABLE worker_invitations RENAME TO staff_invitations;
        
        -- Rename constraints
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'worker_invitations_pkey') THEN
            ALTER TABLE staff_invitations RENAME CONSTRAINT worker_invitations_pkey TO staff_invitations_pkey;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'worker_invitations_created_by_fkey') THEN
            ALTER TABLE staff_invitations RENAME CONSTRAINT worker_invitations_created_by_fkey TO staff_invitations_created_by_fkey;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'worker_invitations_invitation_token_key') THEN
            ALTER TABLE staff_invitations RENAME CONSTRAINT worker_invitations_invitation_token_key TO staff_invitations_invitation_token_key;
        END IF;
        
        -- Rename indexes
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_worker_invitations_phone') THEN
            ALTER INDEX idx_worker_invitations_phone RENAME TO idx_staff_invitations_phone;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_worker_invitations_token') THEN
            ALTER INDEX idx_worker_invitations_token RENAME TO idx_staff_invitations_token;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_worker_invitations_expires_at') THEN
            ALTER INDEX idx_worker_invitations_expires_at RENAME TO idx_staff_invitations_expires_at;
        END IF;
    END IF;

    -- Rename worker_sessions to staff_sessions if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'worker_sessions') THEN
        ALTER TABLE worker_sessions RENAME TO staff_sessions;
        
        -- Rename constraints
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'worker_sessions_pkey') THEN
            ALTER TABLE staff_sessions RENAME CONSTRAINT worker_sessions_pkey TO staff_sessions_pkey;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'worker_sessions_user_id_fkey') THEN
            ALTER TABLE staff_sessions RENAME CONSTRAINT worker_sessions_user_id_fkey TO staff_sessions_user_id_fkey;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'worker_sessions_session_token_key') THEN
            ALTER TABLE staff_sessions RENAME CONSTRAINT worker_sessions_session_token_key TO staff_sessions_session_token_key;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'worker_sessions_refresh_token_key') THEN
            ALTER TABLE staff_sessions RENAME CONSTRAINT worker_sessions_refresh_token_key TO staff_sessions_refresh_token_key;
        END IF;
        
        -- Rename indexes
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_worker_sessions_user_device') THEN
            ALTER INDEX idx_worker_sessions_user_device RENAME TO idx_staff_sessions_user_device;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_worker_sessions_expires_at') THEN
            ALTER INDEX idx_worker_sessions_expires_at RENAME TO idx_staff_sessions_expires_at;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_worker_sessions_token') THEN
            ALTER INDEX idx_worker_sessions_token RENAME TO idx_staff_sessions_token;
        END IF;
    END IF;

    -- Rename worker_devices to staff_devices if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'worker_devices') THEN
        ALTER TABLE worker_devices RENAME TO staff_devices;
        
        -- Rename constraints
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'worker_devices_pkey') THEN
            ALTER TABLE staff_devices RENAME CONSTRAINT worker_devices_pkey TO staff_devices_pkey;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'worker_devices_user_id_fkey') THEN
            ALTER TABLE staff_devices RENAME CONSTRAINT worker_devices_user_id_fkey TO staff_devices_user_id_fkey;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'worker_devices_device_id_key') THEN
            ALTER TABLE staff_devices RENAME CONSTRAINT worker_devices_device_id_key TO staff_devices_device_id_key;
        END IF;
        
        -- Rename indexes
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_worker_devices_user_id') THEN
            ALTER INDEX idx_worker_devices_user_id RENAME TO idx_staff_devices_user_id;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_worker_devices_device_id') THEN
            ALTER INDEX idx_worker_devices_device_id RENAME TO idx_staff_devices_device_id;
        END IF;
    END IF;
END $$;

-- Update functions to use new table names
-- Drop old functions if they exist
DROP FUNCTION IF EXISTS create_worker_session CASCADE;
DROP FUNCTION IF EXISTS validate_worker_session CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_worker_sessions CASCADE;
DROP FUNCTION IF EXISTS revoke_worker_session CASCADE;

-- Create new functions with staff terminology
CREATE OR REPLACE FUNCTION create_staff_session(
    p_user_id UUID,
    p_device_id TEXT,
    p_device_info JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_token TEXT;
    v_refresh_token TEXT;
    v_expires_at TIMESTAMPTZ;
    v_session_id UUID;
BEGIN
    -- Check if user exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_user_id 
        AND role = 'worker'
        AND deleted_at IS NULL
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid user'
        );
    END IF;

    -- Mark any existing sessions for this device as revoked
    UPDATE staff_sessions
    SET 
        revoked_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id 
    AND device_id = p_device_id 
    AND revoked_at IS NULL;

    -- Generate session tokens
    v_session_token := encode(gen_random_bytes(32), 'base64');
    v_refresh_token := encode(gen_random_bytes(32), 'base64');
    v_expires_at := NOW() + INTERVAL '30 days';

    -- Create new session
    INSERT INTO staff_sessions (
        user_id,
        device_id,
        device_info,
        session_token,
        refresh_token,
        expires_at,
        created_at,
        updated_at,
        last_activity_at
    ) VALUES (
        p_user_id,
        p_device_id,
        p_device_info,
        v_session_token,
        v_refresh_token,
        v_expires_at,
        NOW(),
        NOW(),
        NOW()
    ) RETURNING id INTO v_session_id;

    -- Update or create device record
    INSERT INTO staff_devices (
        user_id,
        device_id,
        device_type,
        device_model,
        last_active_at,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_device_id,
        COALESCE(p_device_info->>'deviceType', 'unknown'),
        COALESCE(p_device_info->>'deviceModel', 'unknown'),
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (device_id) 
    DO UPDATE SET
        last_active_at = NOW(),
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'session_id', v_session_id,
        'session_token', v_session_token,
        'refresh_token', v_refresh_token,
        'expires_at', v_expires_at
    );
END;
$$;

-- Create validate_staff_session function
CREATE OR REPLACE FUNCTION validate_staff_session(
    p_session_token TEXT,
    p_device_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_user RECORD;
BEGIN
    -- Find the session
    SELECT 
        s.*,
        u.id as user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone_number,
        u.role,
        u.organization_id,
        u.deleted_at
    INTO v_session
    FROM staff_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.session_token = p_session_token
    AND s.device_id = p_device_id;

    -- Check if session exists
    IF v_session IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Invalid session'
        );
    END IF;

    -- Check if session is expired
    IF v_session.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Session expired'
        );
    END IF;

    -- Check if session is revoked
    IF v_session.revoked_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Session revoked'
        );
    END IF;

    -- Check if user is deleted
    IF v_session.deleted_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'User account deactivated'
        );
    END IF;

    -- Update last activity
    UPDATE staff_sessions
    SET last_activity_at = NOW()
    WHERE id = v_session.id;

    -- Update device last active
    UPDATE staff_devices
    SET last_active_at = NOW()
    WHERE device_id = p_device_id;

    RETURN jsonb_build_object(
        'valid', true,
        'user', jsonb_build_object(
            'id', v_session.user_id,
            'email', v_session.email,
            'first_name', v_session.first_name,
            'last_name', v_session.last_name,
            'phone_number', v_session.phone_number,
            'role', v_session.role,
            'organization_id', v_session.organization_id
        ),
        'session', jsonb_build_object(
            'id', v_session.id,
            'expires_at', v_session.expires_at,
            'device_id', v_session.device_id
        )
    );
END;
$$;

-- Update RLS policies to use staff tables
ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_devices ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "worker_invitations_admin_manage" ON staff_invitations;
DROP POLICY IF EXISTS "worker_invitations_worker_read_own" ON staff_invitations;
DROP POLICY IF EXISTS "worker_sessions_user_read_own" ON staff_sessions;
DROP POLICY IF EXISTS "worker_sessions_system_manage" ON staff_sessions;
DROP POLICY IF EXISTS "worker_devices_user_read_own" ON staff_devices;
DROP POLICY IF EXISTS "worker_devices_admin_manage" ON staff_devices;

-- Create new policies for staff_invitations
CREATE POLICY "staff_invitations_admin_manage" ON staff_invitations
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE organization_id = staff_invitations.organization_id 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "staff_invitations_worker_read_own" ON staff_invitations
    FOR SELECT USING (
        phone_number = (SELECT phone_number FROM users WHERE id = auth.uid())
    );

-- Create policies for staff_sessions
CREATE POLICY "staff_sessions_user_read_own" ON staff_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "staff_sessions_system_manage" ON staff_sessions
    FOR ALL USING (true);

-- Create policies for staff_devices
CREATE POLICY "staff_devices_user_read_own" ON staff_devices
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "staff_devices_admin_manage" ON staff_devices
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE organization_id = (
                SELECT organization_id FROM users WHERE id = staff_devices.user_id
            )
            AND role IN ('admin', 'super_admin')
        )
    );

-- Create cleanup function for expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_staff_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM staff_sessions
    WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON staff_invitations TO authenticated;
GRANT ALL ON staff_sessions TO authenticated;
GRANT ALL ON staff_devices TO authenticated;
GRANT EXECUTE ON FUNCTION create_staff_session TO authenticated;
GRANT EXECUTE ON FUNCTION validate_staff_session TO authenticated;