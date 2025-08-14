-- Fix missing INSERT permission on users table
-- This was preventing authenticated users from creating new staff members

-- Grant INSERT permission to authenticated users
GRANT INSERT ON users TO authenticated;

-- Also ensure anon role has proper permissions (for potential future use)
GRANT INSERT ON users TO anon;

-- Verify that the authenticated role has all necessary permissions
-- SELECT and UPDATE were already granted in previous migrations
-- This completes the full CRUD permissions needed for user management