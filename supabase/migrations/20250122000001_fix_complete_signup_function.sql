-- Fix the complete_organization_signup function to match new schema
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
        v_pending.name, v_final_slug, COALESCE(v_pending.timezone, 'Pacific/Auckland'),
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
    
    -- Mark verification code as used
    UPDATE verification_codes 
    SET used_at = NOW() 
    WHERE id = p_code_id;
    
    RETURN QUERY SELECT v_org_id, v_user_id, TRUE, NULL::TEXT;
EXCEPTION WHEN OTHERS THEN
    -- Return the actual error message
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, SQLERRM;
END;
$$;