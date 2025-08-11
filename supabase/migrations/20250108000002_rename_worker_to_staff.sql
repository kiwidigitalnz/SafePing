-- Migration to add 'staff' role to user_role enum
-- This makes the terminology more appropriate for the application

-- First, we need to add the new value to the enum if it doesn't exist
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff';

-- Add a comment to document the available roles
COMMENT ON TYPE user_role IS 'User roles: super_admin, admin, supervisor, staff, worker (deprecated - use staff instead)';

-- Note: The 'worker' role still exists for backward compatibility but should not be used for new records
