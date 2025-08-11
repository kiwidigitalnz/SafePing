-- Add example escalation rules for testing
-- This migration adds sample escalation rules to demonstrate the SMS notification system

-- First create a test organization
INSERT INTO organizations (id, name, slug, domain, timezone) VALUES 
('00000000-0000-0000-0000-000000000001', 'Test Organization', 'test-org', 'test.com', 'Australia/Sydney')
ON CONFLICT (id) DO NOTHING;

-- Create a test user
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
  '+61400123456',
  'Test',
  'Worker',
  'worker'
) ON CONFLICT (id) DO NOTHING;

-- Example escalation rules for testing
INSERT INTO escalations (
  organization_id,
  schedule_id,
  level,
  delay_minutes,
  contact_method,
  contact_list,
  message_template,
  is_active
) VALUES
-- Level 1: Immediate SMS to supervisors (5 minutes overdue)
(
  '00000000-0000-0000-0000-000000000001',
  NULL, -- Global rule for all schedules
  'level_1',
  5,
  'sms',
  ARRAY['+64021234567', '+64021654321'],
  'SAFETY ALERT: {{worker_name}} is {{overdue_time}} overdue for check-in. Please verify their safety immediately.',
  true
),

-- Level 2: SMS to managers (15 minutes overdue)
(
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'level_2',
  15,
  'sms',
  ARRAY['+64021111222', '+64021333444'],
  'URGENT: {{worker_name}} has been overdue for {{overdue_time}}. Escalating to management. Please take immediate action.',
  true
),

-- Level 3: SMS to emergency contacts (30 minutes overdue)
(
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'level_3',
  30,
  'sms',
  ARRAY['+64021555666', '+64021777888'],
  'EMERGENCY: {{worker_name}} has been missing for {{overdue_time}}. Emergency response may be required.',
  true
),

-- Level 4: SMS to all contacts (60 minutes overdue)
(
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'emergency',
  60,
  'sms',
  ARRAY['+64021234567', '+64021654321', '+64021111222', '+64021333444', '+64021555666', '+64021777888'],
  'CRITICAL: {{worker_name}} has been missing for {{overdue_time}}. All emergency protocols activated.',
  true
);

-- Add comment about phone number format
COMMENT ON TABLE escalations IS 'Escalation rules for safety monitoring. Phone numbers should be in international format (+64021XXXXXX for New Zealand).';