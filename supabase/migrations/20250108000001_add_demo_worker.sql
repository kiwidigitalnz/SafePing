-- Create demo worker for testing
-- This creates a worker that can be used to test the PWA login flow

-- First, ensure we have a demo organization
INSERT INTO organizations (id, name, slug, timezone, phone, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Demo Company NZ',
  'demo-company-nz',
  'Pacific/Auckland',
  '+6421234567',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create a demo admin user (if not exists)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'admin@demo.safeping.app',
  crypt('DemoAdmin123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Demo Admin"}',
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Add admin to users table
INSERT INTO users (
  id,
  organization_id,
  email,
  first_name,
  last_name,
  phone,
  role,
  department,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@demo.safeping.app',
  'Demo',
  'Admin',
  '+6421234567',
  'admin',
  'Management',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create demo worker user
INSERT INTO auth.users (
  id,
  phone,
  phone_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  '00000000-0000-0000-0000-000000000003'::uuid,
  '+6421000111',  -- New Zealand phone number
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "phone", "providers": ["phone"]}',
  '{"full_name": "John Worker", "is_worker": true}',
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Add worker to users table (using 'staff' role if available, fallback to 'worker')
DO $$
BEGIN
  -- Try to insert with 'staff' role first
  BEGIN
    INSERT INTO users (
      id,
      organization_id,
      email,
      first_name,
      last_name,
      phone,
      role,
      department,
      emergency_contact_name,
      emergency_contact_phone,
      created_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000003'::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid,
      NULL,  -- Workers don't need email
      'John',
      'Worker',
      '+6421000111',
      'staff'::user_role,
      'Field Operations',
      'Jane Worker',
      '+6421000222',
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN invalid_text_representation THEN
      -- If 'staff' doesn't exist, use 'worker'
      INSERT INTO users (
        id,
        organization_id,
        email,
        first_name,
        last_name,
        phone,
        role,
        department,
        emergency_contact_name,
        emergency_contact_phone,
        created_at
      )
      VALUES (
        '00000000-0000-0000-0000-000000000003'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        NULL,  -- Workers don't need email
        'John',
        'Worker',
        '+6421000111',
        'worker'::user_role,
        'Field Operations',
        'Jane Worker',
        '+6421000222',
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
  END;
END $$;

-- Create worker device record
INSERT INTO worker_devices (
  id,
  user_id,
  device_id,
  device_name,
  device_type,
  is_trusted,
  last_seen_at,
  registered_at
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000003'::uuid,
  'demo-device-fingerprint-001',
  'Demo iPhone 14',
  'ios',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (user_id, device_id) DO NOTHING;

-- Create worker invitation (already accepted)
INSERT INTO worker_invitations (
  id,
  user_id,
  organization_id,
  invited_by,
  invitation_token,
  phone_number,
  status,
  verified_at,
  created_at
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  gen_random_uuid(),  -- Use proper UUID for token
  '+6421000111',
  'completed',  -- Use 'completed' status
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Create some check-in history for the worker
INSERT INTO check_ins (
  id,
  user_id,
  organization_id,
  location_lat,
  location_lng,
  status,
  message,
  created_at
)
VALUES 
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    -36.8485,  -- Auckland latitude
    174.7633,  -- Auckland longitude
    'safe',
    'Regular check-in from site',
    NOW() - INTERVAL '2 hours'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    -36.8485,
    174.7633,
    'safe',
    'Morning check-in',
    NOW() - INTERVAL '6 hours'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    -36.8485,
    174.7633,
    'safe',
    'Arrived at work site',
    NOW() - INTERVAL '8 hours'
  );

-- Output demo credentials
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DEMO WORKER CREDENTIALS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phone Number: +64 21 000 111';
  RAISE NOTICE 'PIN: 123456 (to be set on first login)';
  RAISE NOTICE '';
  RAISE NOTICE 'DEMO ADMIN CREDENTIALS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email: admin@demo.safeping.app';
  RAISE NOTICE 'Password: DemoAdmin123!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
