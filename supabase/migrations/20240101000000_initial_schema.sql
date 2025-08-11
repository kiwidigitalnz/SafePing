-- Initial SafePing Database Schema
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations table (multi-tenant root)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    timezone VARCHAR(50) DEFAULT 'Pacific/Auckland',
    settings JSONB DEFAULT '{}',
    subscription_status VARCHAR(20) DEFAULT 'trial',
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '14 days',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles enum
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'supervisor', 'worker');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255),
    phone VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'worker',
    is_active BOOLEAN DEFAULT true,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    employee_id VARCHAR(50),
    department VARCHAR(100),
    job_title VARCHAR(100),
    profile_image_url TEXT,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT users_email_org_unique UNIQUE (email, organization_id),
    CONSTRAINT users_phone_org_unique UNIQUE (phone, organization_id),
    CONSTRAINT users_employee_id_org_unique UNIQUE (employee_id, organization_id)
);

-- Check-in status enum
CREATE TYPE checkin_status AS ENUM ('safe', 'overdue', 'missed', 'emergency');

-- Check-ins table
CREATE TABLE check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status checkin_status NOT NULL DEFAULT 'safe',
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_accuracy DECIMAL(10, 2),
    location_address TEXT,
    message TEXT,
    image_url TEXT,
    is_manual BOOLEAN DEFAULT true,
    is_offline BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

-- Schedule frequency enum
CREATE TYPE schedule_frequency AS ENUM ('once', 'daily', 'weekly', 'custom');

-- Schedules table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    frequency schedule_frequency NOT NULL,
    check_in_interval_minutes INTEGER NOT NULL DEFAULT 60,
    grace_period_minutes INTEGER NOT NULL DEFAULT 15,
    start_time TIME,
    end_time TIME,
    days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Monday, 7=Sunday
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule assignments table
CREATE TABLE schedule_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT schedule_assignments_unique UNIQUE (schedule_id, user_id, start_date)
);

-- Escalation level enum
CREATE TYPE escalation_level AS ENUM ('level_1', 'level_2', 'level_3', 'emergency');

-- Escalations table
CREATE TABLE escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    level escalation_level NOT NULL,
    delay_minutes INTEGER NOT NULL,
    contact_method VARCHAR(20) NOT NULL DEFAULT 'sms', -- sms, email, call
    contact_list TEXT[] NOT NULL, -- phone numbers or emails
    message_template TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incident severity enum
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Incident status enum
CREATE TYPE incident_status AS ENUM ('open', 'investigating', 'resolved', 'false_alarm');

-- Incidents table
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in_id UUID REFERENCES check_ins(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity incident_severity NOT NULL DEFAULT 'medium',
    status incident_status NOT NULL DEFAULT 'open',
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    assigned_to UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message type enum
CREATE TYPE message_type AS ENUM ('chat', 'alert', 'system', 'emergency');

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID REFERENCES users(id),
    incident_id UUID REFERENCES incidents(id),
    type message_type NOT NULL DEFAULT 'chat',
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_check_ins_organization_id ON check_ins(organization_id);
CREATE INDEX idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX idx_check_ins_status ON check_ins(status);
CREATE INDEX idx_check_ins_created_at ON check_ins(created_at);
CREATE INDEX idx_schedule_assignments_organization_id ON schedule_assignments(organization_id);
CREATE INDEX idx_schedule_assignments_user_id ON schedule_assignments(user_id);
CREATE INDEX idx_incidents_organization_id ON incidents(organization_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_messages_organization_id ON messages(organization_id);
CREATE INDEX idx_messages_to_user_id ON messages(to_user_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Users: Can see users in their organization
CREATE POLICY "Users can view users in their organization" ON users
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Admins can manage users in their organization
CREATE POLICY "Admins can manage users in their organization" ON users
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'supervisor')
        )
    );

-- Check-ins: Users can see check-ins in their organization
CREATE POLICY "Users can view check-ins in their organization" ON check_ins
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Users can insert their own check-ins
CREATE POLICY "Users can insert their own check-ins" ON check_ins
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Similar policies for other tables
CREATE POLICY "Organization scoped schedules" ON schedules
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Organization scoped schedule_assignments" ON schedule_assignments
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Organization scoped escalations" ON escalations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Organization scoped incidents" ON incidents
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Organization scoped messages" ON messages
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Organization scoped audit_logs" ON audit_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Functions and triggers

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escalations_updated_at BEFORE UPDATE ON escalations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user creation from auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- This will be called when a new auth user is created
    -- We'll insert into users table when they complete onboarding
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;