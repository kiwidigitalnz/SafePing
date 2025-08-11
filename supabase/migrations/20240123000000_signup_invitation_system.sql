-- Complete Signup and Invitation System with 6-digit codes
-- Handles email verification, admin invitations, and organization creation

-- Verification codes table for 6-digit email confirmations
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL, -- 6-digit code
    type TEXT NOT NULL CHECK (type IN ('signup_verification', 'admin_invitation', 'password_reset')),
    metadata JSONB DEFAULT '{}', -- Store additional data like organization_name, role, etc.
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pending organizations table for signup flow
CREATE TABLE IF NOT EXISTS pending_organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    verification_code_id UUID NOT NULL REFERENCES verification_codes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    admin_email TEXT NOT NULL,
    admin_first_name TEXT NOT NULL,
    admin_last_name TEXT NOT NULL,
    domain TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'Pacific/Auckland',
    trial_plan_id UUID, -- Will reference subscription_plans
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin invitations table
CREATE TABLE IF NOT EXISTS admin_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    verification_code_id UUID NOT NULL REFERENCES verification_codes(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id),
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'admin',
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT admin_invitations_email_org_unique UNIQUE (email, organization_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_type ON verification_codes(type);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_organizations_slug ON pending_organizations(slug);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_email ON admin_invitations(email);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_org_id ON admin_invitations(organization_id);

-- Function to generate 6-digit code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$;

-- Function to create verification code
CREATE OR REPLACE FUNCTION create_verification_code(
    p_email TEXT,
    p_type TEXT,
    p_metadata JSONB DEFAULT '{}',
    p_expires_minutes INTEGER DEFAULT 15
)
RETURNS TABLE(code_id UUID, code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code TEXT;
    v_code_id UUID;
BEGIN
    -- Generate unique code
    LOOP
        v_code := generate_verification_code();
        
        -- Check if code already exists and is still valid
        IF NOT EXISTS (
            SELECT 1 FROM verification_codes 
            WHERE code = v_code 
            AND expires_at > NOW() 
            AND used_at IS NULL
        ) THEN
            EXIT;
        END IF;
    END LOOP;
    
    -- Clean up old expired codes for this email
    DELETE FROM verification_codes 
    WHERE email = p_email 
    AND type = p_type 
    AND (expires_at < NOW() OR used_at IS NOT NULL);
    
    -- Insert new verification code
    INSERT INTO verification_codes (email, code, type, metadata, expires_at)
    VALUES (p_email, v_code, p_type, p_metadata, NOW() + (p_expires_minutes || ' minutes')::INTERVAL)
    RETURNING id INTO v_code_id;
    
    RETURN QUERY SELECT v_code_id, v_code;
END;
$$;

-- Function to verify code
CREATE OR REPLACE FUNCTION verify_code(
    p_email TEXT,
    p_code TEXT,
    p_type TEXT
)
RETURNS TABLE(
    success BOOLEAN,
    code_id UUID,
    metadata JSONB,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record RECORD;
BEGIN
    -- Find the verification code
    SELECT id, metadata, expires_at, used_at, attempts, max_attempts
    INTO v_record
    FROM verification_codes
    WHERE email = p_email 
    AND code = p_code 
    AND type = p_type
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Check if code exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::JSONB, 'Invalid verification code';
        RETURN;
    END IF;
    
    -- Check if already used
    IF v_record.used_at IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::JSONB, 'Verification code has already been used';
        RETURN;
    END IF;
    
    -- Check if expired
    IF v_record.expires_at < NOW() THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::JSONB, 'Verification code has expired';
        RETURN;
    END IF;
    
    -- Check attempts
    IF v_record.attempts >= v_record.max_attempts THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::JSONB, 'Too many failed attempts';
        RETURN;
    END IF;
    
    -- Mark as used
    UPDATE verification_codes 
    SET used_at = NOW()
    WHERE id = v_record.id;
    
    -- Return success
    RETURN QUERY SELECT TRUE, v_record.id, v_record.metadata, NULL::TEXT;
END;
$$;

-- Function to increment failed attempts
CREATE OR REPLACE FUNCTION increment_code_attempts(
    p_email TEXT,
    p_code TEXT,
    p_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE verification_codes 
    SET attempts = attempts + 1
    WHERE email = p_email 
    AND code = p_code 
    AND type = p_type
    AND used_at IS NULL;
    
    RETURN FOUND;
END;
$$;

-- Function to handle new organization signup
CREATE OR REPLACE FUNCTION complete_organization_signup(
    p_code_id UUID,
    p_auth_user_id UUID
)
RETURNS TABLE(
    organization_id UUID,
    user_id UUID,
    success BOOLEAN,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pending RECORD;
    v_org_id UUID;
    v_user_id UUID;
    v_slug_counter INTEGER := 0;
    v_final_slug TEXT;
BEGIN
    -- Get pending organization
    SELECT po.*, vc.email
    INTO v_pending
    FROM pending_organizations po
    JOIN verification_codes vc ON po.verification_code_id = vc.id
    WHERE po.verification_code_id = p_code_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'Invalid verification code';
        RETURN;
    END IF;
    
    -- Ensure unique slug
    v_final_slug := v_pending.slug;
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = v_final_slug) LOOP
        v_slug_counter := v_slug_counter + 1;
        v_final_slug := v_pending.slug || '-' || v_slug_counter;
    END LOOP;
    
    -- Create organization
    INSERT INTO organizations (
        name, slug, domain, phone, timezone, 
        subscription_status, trial_ends_at
    ) VALUES (
        v_pending.name, v_final_slug, v_pending.domain, v_pending.phone, v_pending.timezone,
        'trialing', NOW() + INTERVAL '14 days'
    ) RETURNING id INTO v_org_id;
    
    -- Create user
    INSERT INTO users (
        id, organization_id, email, first_name, last_name, role, is_active
    ) VALUES (
        p_auth_user_id, v_org_id, v_pending.admin_email, 
        v_pending.admin_first_name, v_pending.admin_last_name, 
        'org_admin', TRUE
    ) RETURNING id INTO v_user_id;
    
    -- Set primary admin
    UPDATE organizations 
    SET primary_admin_id = v_user_id 
    WHERE id = v_org_id;
    
    -- Create trial subscription if plan specified
    IF v_pending.trial_plan_id IS NOT NULL THEN
        INSERT INTO organization_subscriptions (
            organization_id, plan_id, status, 
            trial_start, trial_end, stripe_customer_id
        ) VALUES (
            v_org_id, v_pending.trial_plan_id, 'trialing',
            NOW(), NOW() + INTERVAL '14 days',
            'pending_' || v_org_id::TEXT -- Temporary customer ID
        );
    END IF;
    
    -- Clean up pending organization
    DELETE FROM pending_organizations WHERE id = v_pending.id;
    
    RETURN QUERY SELECT v_org_id, v_user_id, TRUE, NULL::TEXT;
END;
$$;

-- Function to complete admin invitation
CREATE OR REPLACE FUNCTION complete_admin_invitation(
    p_code_id UUID,
    p_auth_user_id UUID
)
RETURNS TABLE(
    organization_id UUID,
    user_id UUID,
    success BOOLEAN,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation RECORD;
    v_user_id UUID;
BEGIN
    -- Get invitation details
    SELECT ai.*, vc.email
    INTO v_invitation
    FROM admin_invitations ai
    JOIN verification_codes vc ON ai.verification_code_id = vc.id
    WHERE ai.verification_code_id = p_code_id
    AND ai.accepted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'Invalid or already used invitation';
        RETURN;
    END IF;
    
    -- Create user
    INSERT INTO users (
        id, organization_id, email, first_name, last_name, role, is_active
    ) VALUES (
        p_auth_user_id, v_invitation.organization_id, v_invitation.email,
        v_invitation.first_name, v_invitation.last_name, v_invitation.role, TRUE
    ) RETURNING id INTO v_user_id;
    
    -- Mark invitation as accepted
    UPDATE admin_invitations 
    SET accepted_at = NOW()
    WHERE id = v_invitation.id;
    
    RETURN QUERY SELECT v_invitation.organization_id, v_user_id, TRUE, NULL::TEXT;
END;
$$;

-- Cleanup function for expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete expired verification codes
    DELETE FROM verification_codes 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Delete orphaned pending organizations
    DELETE FROM pending_organizations po
    WHERE NOT EXISTS (
        SELECT 1 FROM verification_codes vc 
        WHERE vc.id = po.verification_code_id
    );
    
    -- Delete old unused invitations (older than 7 days)
    DELETE FROM admin_invitations ai
    WHERE ai.accepted_at IS NULL 
    AND ai.created_at < NOW() - INTERVAL '7 days';
    
    RETURN v_deleted_count;
END;
$$;

-- RLS Policies
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;

-- Verification codes: only accessible by functions
CREATE POLICY "Verification codes are function-only" ON verification_codes
    FOR ALL USING (FALSE);

-- Pending organizations: only accessible by functions
CREATE POLICY "Pending organizations are function-only" ON pending_organizations
    FOR ALL USING (FALSE);

-- Admin invitations: only org admins can view their org's invitations
CREATE POLICY "Org admins can view their invitations" ON admin_invitations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() 
            AND role IN ('org_admin', 'super_admin')
        )
    );

-- Org admins can insert invitations for their organization
CREATE POLICY "Org admins can create invitations" ON admin_invitations
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() 
            AND role IN ('org_admin', 'super_admin')
        )
    );

-- Super admins can access everything
CREATE POLICY "Super admins can access all invitations" ON admin_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Schedule cleanup job (run daily)
-- This would be set up as a cron job or periodic function
COMMENT ON FUNCTION cleanup_expired_codes() IS 'Cleanup expired verification codes and stale data - run daily';

-- Comments
COMMENT ON TABLE verification_codes IS '6-digit verification codes for email confirmation and invitations';
COMMENT ON TABLE pending_organizations IS 'Organizations waiting for email verification to complete signup';
COMMENT ON TABLE admin_invitations IS 'Admin invitations sent by organization administrators';
COMMENT ON FUNCTION create_verification_code(TEXT, TEXT, JSONB, INTEGER) IS 'Generate and store a 6-digit verification code';
COMMENT ON FUNCTION verify_code(TEXT, TEXT, TEXT) IS 'Verify a 6-digit code and mark as used';
COMMENT ON FUNCTION complete_organization_signup(UUID, UUID) IS 'Complete organization creation after email verification';
COMMENT ON FUNCTION complete_admin_invitation(UUID, UUID) IS 'Complete admin invitation after code verification';