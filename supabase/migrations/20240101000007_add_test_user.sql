-- Add test user for SMS testing
INSERT INTO users (
  id, 
  organization_id, 
  email, 
  phone, 
  first_name, 
  last_name, 
  role
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'test@test.com',
  '+64021234567',
  'Test',
  'Worker',
  'worker'
) ON CONFLICT (id) DO NOTHING;