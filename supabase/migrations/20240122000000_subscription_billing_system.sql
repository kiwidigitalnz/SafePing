-- Subscription and Billing System
-- Support for Stripe integration and subscription management

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    stripe_price_id TEXT UNIQUE NOT NULL,
    interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
    price_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'nzd',
    max_staff INTEGER NOT NULL,
    features JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization subscriptions
CREATE TABLE IF NOT EXISTS organization_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    stripe_customer_id TEXT UNIQUE NOT NULL,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing events (invoices, payments, etc.)
CREATE TABLE IF NOT EXISTS billing_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES organization_subscriptions(id) ON DELETE CASCADE,
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    amount_cents INTEGER,
    currency TEXT DEFAULT 'nzd',
    status TEXT,
    stripe_invoice_id TEXT,
    stripe_payment_intent_id TEXT,
    metadata JSONB DEFAULT '{}',
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking for billing purposes
CREATE TABLE IF NOT EXISTS usage_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES organization_subscriptions(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL, -- 'staff_count', 'check_ins', 'sms_sent', etc.
    quantity INTEGER NOT NULL DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, stripe_price_id, interval, price_cents, max_staff, features) VALUES
(
    'Starter',
    'Perfect for small teams getting started with safety tracking',
    'price_starter_monthly_nzd', -- Replace with actual Stripe price ID
    'month',
    1500, -- $15 NZD
    10,
    '{
        "check_ins": true,
        "emergency_alerts": true,
        "basic_reports": true,
        "email_support": true,
        "mobile_app": true
    }'
),
(
    'Professional', 
    'Advanced features for growing organizations',
    'price_professional_monthly_nzd', -- Replace with actual Stripe price ID
    'month',
    4500, -- $45 NZD
    50,
    '{
        "check_ins": true,
        "emergency_alerts": true,
        "advanced_reports": true,
        "geofencing": true,
        "custom_escalations": true,
        "sms_notifications": true,
        "priority_support": true,
        "mobile_app": true,
        "api_access": true
    }'
),
(
    'Enterprise',
    'Full-featured solution for large organizations',
    'price_enterprise_monthly_nzd', -- Replace with actual Stripe price ID
    'month',
    9900, -- $99 NZD
    999999,
    '{
        "check_ins": true,
        "emergency_alerts": true,
        "advanced_reports": true,
        "geofencing": true,
        "custom_escalations": true,
        "sms_notifications": true,
        "phone_escalations": true,
        "dedicated_support": true,
        "mobile_app": true,
        "api_access": true,
        "custom_integrations": true,
        "audit_logs": true
    }'
)
ON CONFLICT (stripe_price_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_org_id ON organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_stripe_customer ON organization_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_stripe_subscription ON organization_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_org_id ON billing_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_event ON billing_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_org_period ON usage_records(organization_id, billing_period_start, billing_period_end);

-- Add subscription_id to organizations table for easy access
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES organization_subscriptions(id);

-- RLS Policies

-- subscription_plans: Public read access for pricing display
CREATE POLICY "Public can view active subscription plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

-- organization_subscriptions: Organization admins can view their subscription
CREATE POLICY "Org admins can view their subscription" ON organization_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.organization_id = organization_subscriptions.organization_id 
            AND u.role IN ('org_admin', 'admin')
        )
    );

-- billing_events: Organization admins can view their billing events
CREATE POLICY "Org admins can view their billing events" ON billing_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.organization_id = billing_events.organization_id 
            AND u.role IN ('org_admin', 'admin')
        )
    );

-- usage_records: Organization admins can view their usage
CREATE POLICY "Org admins can view their usage records" ON usage_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.organization_id = usage_records.organization_id 
            AND u.role IN ('org_admin', 'admin')
        )
    );

-- Super admins can access all billing data
CREATE POLICY "Super admins can access all subscription data" ON organization_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can access all billing events" ON billing_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can access all usage records" ON usage_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'super_admin'
        )
    );

-- Function to get current subscription for organization
CREATE OR REPLACE FUNCTION get_organization_subscription(org_id UUID)
RETURNS TABLE(
    subscription_id UUID,
    plan_name TEXT,
    status TEXT,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    max_staff INTEGER,
    features JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        os.id as subscription_id,
        sp.name as plan_name,
        os.status,
        os.current_period_end,
        os.trial_end,
        sp.max_staff,
        sp.features
    FROM organization_subscriptions os
    JOIN subscription_plans sp ON os.plan_id = sp.id
    WHERE os.organization_id = org_id
    AND os.status IN ('trialing', 'active')
    ORDER BY os.created_at DESC
    LIMIT 1;
END;
$$;

-- Function to check if organization can add more staff
CREATE OR REPLACE FUNCTION can_add_staff(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_staff_count INTEGER;
    max_allowed INTEGER;
    subscription_status TEXT;
BEGIN
    -- Get current staff count
    SELECT COUNT(*) INTO current_staff_count
    FROM users
    WHERE organization_id = org_id AND is_active = true;
    
    -- Get subscription limits
    SELECT sp.max_staff, os.status
    INTO max_allowed, subscription_status
    FROM organization_subscriptions os
    JOIN subscription_plans sp ON os.plan_id = sp.id
    WHERE os.organization_id = org_id
    AND os.status IN ('trialing', 'active')
    ORDER BY os.created_at DESC
    LIMIT 1;
    
    -- If no subscription found, allow basic limit during trial
    IF max_allowed IS NULL THEN
        RETURN current_staff_count < 3; -- 3 staff limit for unsubscribed orgs
    END IF;
    
    -- Check if subscription is active or trialing
    IF subscription_status NOT IN ('trialing', 'active') THEN
        RETURN false;
    END IF;
    
    RETURN current_staff_count < max_allowed;
END;
$$;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_subscriptions_updated_at BEFORE UPDATE ON organization_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE subscription_plans IS 'Available subscription plans with Stripe integration';
COMMENT ON TABLE organization_subscriptions IS 'Active subscriptions for organizations';
COMMENT ON TABLE billing_events IS 'Webhook events from Stripe for billing tracking';
COMMENT ON TABLE usage_records IS 'Usage metrics for billing and analytics';
COMMENT ON FUNCTION get_organization_subscription(UUID) IS 'Get current active subscription for organization';
COMMENT ON FUNCTION can_add_staff(UUID) IS 'Check if organization can add more staff based on subscription limits';