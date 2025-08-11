-- Fix ambiguous column reference in create_verification_code function
CREATE OR REPLACE FUNCTION create_verification_code(
    p_email TEXT,
    p_type TEXT,
    p_metadata JSONB DEFAULT '{}',
    p_expires_minutes INTEGER DEFAULT 15
)
RETURNS TABLE(code_id UUID, code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code TEXT;
    v_code_id UUID;
BEGIN
    -- Generate unique code
    LOOP
        v_code := generate_verification_code();
        
        -- Check if code already exists and is still valid
        IF NOT EXISTS (
            SELECT 1 FROM verification_codes vc
            WHERE vc.code = v_code 
            AND vc.expires_at > NOW() 
            AND vc.used_at IS NULL
        ) THEN
            EXIT;
        END IF;
    END LOOP;
    
    -- Clean up old expired codes for this email
    DELETE FROM verification_codes 
    WHERE email = p_email 
    AND expires_at < NOW();
    
    -- Create new verification code
    INSERT INTO verification_codes (
        email,
        code,
        type,
        metadata,
        expires_at
    ) VALUES (
        p_email,
        v_code,
        p_type,
        p_metadata,
        NOW() + (p_expires_minutes || ' minutes')::INTERVAL
    ) RETURNING id INTO v_code_id;
    
    -- Return the code details
    RETURN QUERY SELECT v_code_id, v_code;
END;
$$;