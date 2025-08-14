-- Fix missing INSERT permission on users table
-- This was preventing authenticated users from creating new staff members

-- Grant INSERT permission to authenticated users
-- Replace the unqualified INSERT grant
-GRANT INSERT ON users TO authenticated;
+GRANT INSERT ON TABLE public.users TO authenticated;

+-- If users.id is SERIAL/IDENTITY, allow using its underlying sequence.
+-- If your sequence name differs, adjust accordingly, or grant on all sequences.
+DO $
+BEGIN
+  IF EXISTS (
+    SELECT 1
+      FROM pg_class c
+      JOIN pg_namespace n ON n.oid = c.relnamespace
+     WHERE n.nspname = 'public'
+       AND c.relkind = 'S'
+       AND c.relname = 'users_id_seq'
+  ) THEN
+    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.users_id_seq TO authenticated';
+  END IF;
+END
+$;
+-- Alternatively (broader):
+-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- Note: GRANT INSERT ON users TO anon; was removed for security reasons.
-- If anon INSERT is truly required, enable RLS on the users table and add
-- a strict, explicit INSERT policy that limits allowed columns/values
-- and validates intent before granting any anon INSERT permission.

-- Verify that the authenticated role has all necessary permissions
-- SELECT and UPDATE were already granted in previous migrations
-- This completes the full CRUD permissions needed for user management