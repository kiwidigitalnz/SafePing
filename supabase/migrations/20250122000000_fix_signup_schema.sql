-- Fix signup schema issues
-- 1. Remove domain/phone from pending_organizations (collected during onboarding)
-- 2. Add primary_admin_id foreign key to organizations
-- 3. Ensure trial subscription is created on signup

-- Remove domain and phone columns from pending_organizations
ALTER TABLE pending_organizations 
DROP COLUMN IF EXISTS domain,
DROP COLUMN IF EXISTS phone;

-- Add primary_admin_id to organizations table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'primary_admin_id'
    ) THEN
        ALTER TABLE organizations 
        ADD COLUMN primary_admin_id UUID REFERENCES users(id);
    END IF;
END $$;

-- Add trial plan to existing subscription_plans table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE LOWER(name) = 'trial') THEN
        INSERT INTO subscription_plans (name, description, stripe_price_id, interval, price_cents, max_staff, features)
        VALUES (
            'Trial',
            '14-day free trial with full access',
            'price_trial', -- Placeholder, not used for trials
            'month',
            0, -- Free
            10, -- 10 staff limit for trial
            '{
                "check_ins": true,
                "emergency_alerts": true,
                "scheduling": true,
                "mobile_apps": true,
                "sms_alerts": true,
                "api_access": true,
                "reports": true,
                "duration_days": 14
            }'
        );
    END IF;
END $$;

-- Update complete_organization_signup function to automatically create trial subscription
CREATE OR REPLACE FUNCTION complete_organization_signup(
    p_code_id UUID,
    p_auth_user_id UUID
)
RETURNS TABLE(
    organization_id UUID,
    user_id UUID,
    success BOOLEAN,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pending RECORD;
    v_org_id UUID;
    v_user_id UUID;
    v_slug_counter INTEGER := 0;
    v_final_slug TEXT;
    v_trial_plan_id UUID;
BEGIN
    -- Get pending organization
    SELECT po.*, vc.email
    INTO v_pending
    FROM pending_organizations po
    JOIN verification_codes vc ON po.verification_code_id = vc.id
    WHERE po.verification_code_id = p_code_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'Invalid verification code';
        RETURN;
    END IF;
    
    -- Get trial plan ID
    SELECT id INTO v_trial_plan_id 
    FROM subscription_plans 
    WHERE LOWER(name) = 'trial' 
    LIMIT 1;
    
    -- Ensure unique slug
    v_final_slug := v_pending.slug;
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = v_final_slug) LOOP
        v_slug_counter := v_slug_counter + 1;
        v_final_slug := v_pending.slug || '-' || v_slug_counter;
    END LOOP;
    
    -- Create organization (without domain/phone - will be added during onboarding)
    INSERT INTO organizations (
        name, slug, timezone, 
        subscription_status, subscription_plan, trial_ends_at
    ) VALUES (
        v_pending.name, v_final_slug, v_pending.timezone,
        'trialing', 'trial', NOW() + INTERVAL '14 days'
    ) RETURNING id INTO v_org_id;
    
    -- Create user
    INSERT INTO users (
        id, organization_id, email, first_name, last_name, role, is_active
    ) VALUES (
        p_auth_user_id, v_org_id, v_pending.admin_email, 
        v_pending.admin_first_name, v_pending.admin_last_name, 
        'org_admin', TRUE
    ) RETURNING id INTO v_user_id;
    
    -- Set primary admin
    UPDATE organizations 
    SET primary_admin_id = v_user_id 
    WHERE id = v_org_id;
    
    -- Create trial subscription
    IF v_trial_plan_id IS NOT NULL THEN
        INSERT INTO organization_subscriptions (
            organization_id, plan_id, status, 
            trial_start, trial_end, stripe_customer_id
        ) VALUES (
            v_org_id, v_trial_plan_id, 'trialing',
            NOW(), NOW() + INTERVAL '14 days',
            'cus_trial_' || v_org_id::TEXT -- Temporary customer ID until Stripe integration
        );
    END IF;
    
    -- Clean up pending organization
    DELETE FROM pending_organizations WHERE id = v_pending.id;
    
    RETURN QUERY SELECT v_org_id, v_user_id, TRUE, NULL::TEXT;
END;
$$;

-- Add comment for clarity
COMMENT ON COLUMN organizations.primary_admin_id IS 'Reference to the primary administrator user for this organization';