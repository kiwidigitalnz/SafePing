-- Temporarily disable all RLS for testing the escalation rules functionality
-- This should be re-enabled with proper policies in production

ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins DISABLE ROW LEVEL SECURITY;
ALTER TABLE escalations DISABLE ROW LEVEL SECURITY;
ALTER TABLE incidents DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;