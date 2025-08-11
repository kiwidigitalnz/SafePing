-- Update user roles to match PRD requirements
-- Four-role hierarchy: super_admin, org_admin, admin, staff

-- Drop all existing RLS policies that depend on the role column
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their organization" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Org admins can view all users in organization" ON users;
DROP POLICY IF EXISTS "Org admins can manage users in organization" ON users;
DROP POLICY IF EXISTS "Admins can view users in organization" ON users;
DROP POLICY IF EXISTS "Super admins can access all users" ON users;

-- First, update the enum type
ALTER TYPE user_role RENAME TO user_role_old;

CREATE TYPE user_role AS ENUM ('super_admin', 'org_admin', 'admin', 'staff');

-- Update the users table to use the new enum
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users ALTER COLUMN role TYPE user_role USING 
  CASE 
    WHEN role::text = 'super_admin' THEN 'super_admin'::user_role
    WHEN role::text = 'admin' THEN 'org_admin'::user_role  -- Migrate existing admins to org_admin
    WHEN role::text = 'supervisor' THEN 'admin'::user_role -- Migrate supervisors to admin
    WHEN role::text = 'worker' THEN 'staff'::user_role     -- Migrate workers to staff
    ELSE 'staff'::user_role
  END;

-- Set new default
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'staff';

-- Drop the old enum
DROP TYPE user_role_old;

-- Add role descriptions table for role management
CREATE TABLE IF NOT EXISTS user_role_permissions (
    role user_role PRIMARY KEY,
    description TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert role definitions
INSERT INTO user_role_permissions (role, description, permissions) VALUES
(
    'super_admin',
    'System administrator with full access across all organizations',
    '{
        "manage_system": true,
        "manage_organizations": true,
        "manage_all_users": true,
        "access_all_data": true,
        "manage_billing": true
    }'
),
(
    'org_admin',
    'Organization administrator with full access within their organization',
    '{
        "manage_organization": true,
        "manage_users": true,
        "manage_settings": true,
        "manage_billing": true,
        "view_all_data": true,
        "manage_schedules": true,
        "manage_incidents": true
    }'
),
(
    'admin',
    'Administrative user with operational access within their organization',
    '{
        "manage_users": true,
        "view_all_data": true,
        "manage_schedules": true,
        "manage_incidents": true,
        "view_reports": true
    }'
),
(
    'staff',
    'Standard user with basic check-in and profile access',
    '{
        "check_in": true,
        "view_own_data": true,
        "update_profile": true,
        "view_schedules": true
    }'
)
ON CONFLICT (role) DO UPDATE SET
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- Add organization admin tracking
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_admin_id UUID REFERENCES users(id);

-- Create organization admins view for easy admin management
CREATE OR REPLACE VIEW organization_admins AS
SELECT 
    u.id,
    u.organization_id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.is_active,
    u.created_at,
    CASE WHEN o.primary_admin_id = u.id THEN true ELSE false END as is_primary_admin
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.role IN ('org_admin', 'admin');

-- Create new RLS policies for four-role system
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Org admins can view all users in organization" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.organization_id = users.organization_id 
            AND u.role IN ('org_admin', 'admin')
        )
    );

CREATE POLICY "Org admins can manage users in organization" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.organization_id = users.organization_id 
            AND u.role = 'org_admin'
        )
    );

CREATE POLICY "Admins can view users in organization" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.organization_id = users.organization_id 
            AND u.role IN ('org_admin', 'admin')
        )
    );

CREATE POLICY "Super admins can access all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'super_admin'
        )
    );

-- Add function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role_val user_role;
    permissions_json JSONB;
BEGIN
    -- Get current user's role
    SELECT role INTO user_role_val
    FROM users 
    WHERE id = auth.uid();
    
    IF user_role_val IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get permissions for the role
    SELECT permissions INTO permissions_json
    FROM user_role_permissions 
    WHERE role = user_role_val;
    
    -- Check if permission exists and is true
    RETURN COALESCE((permissions_json ->> permission_name)::BOOLEAN, FALSE);
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_org_role ON users(organization_id, role);

COMMENT ON TABLE user_role_permissions IS 'Defines permissions for each user role';
COMMENT ON VIEW organization_admins IS 'View of all admins within organizations';
COMMENT ON FUNCTION check_user_permission(TEXT) IS 'Check if current user has specific permission';