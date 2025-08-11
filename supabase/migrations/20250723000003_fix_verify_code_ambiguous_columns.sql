-- Fix verify_code function to resolve ambiguous column references
DROP FUNCTION IF EXISTS verify_code(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION verify_code(
    p_email TEXT,
    p_code TEXT,
    p_type TEXT
)
RETURNS TABLE(
    success BOOLEAN,
    error_message TEXT,
    code_id UUID,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_verification RECORD;
BEGIN
    -- Get the most recent verification code that hasn't been used
    -- Fully qualify all column names to avoid ambiguity
    SELECT 
        verification_codes.id,
        verification_codes.code,
        verification_codes.expires_at,
        verification_codes.used_at,
        verification_codes.metadata,
        verification_codes.attempts
    INTO v_verification
    FROM verification_codes
    WHERE verification_codes.email = p_email 
    AND verification_codes.type = p_type
    AND verification_codes.used_at IS NULL
    ORDER BY verification_codes.created_at DESC
    LIMIT 1;
    
    -- Check if code exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE, 
            'No verification code found. Please request a new one.',
            NULL::UUID,
            NULL::JSONB;
        RETURN;
    END IF;
    
    -- Check if code has expired
    IF v_verification.expires_at < NOW() THEN
        RETURN QUERY SELECT 
            FALSE, 
            'Verification code has expired. Please request a new one.',
            NULL::UUID,
            NULL::JSONB;
        RETURN;
    END IF;
    
    -- Check if code matches
    IF v_verification.code != p_code THEN
        -- Increment attempts
        UPDATE verification_codes 
        SET attempts = COALESCE(attempts, 0) + 1
        WHERE id = v_verification.id;
        
        RETURN QUERY SELECT 
            FALSE, 
            'Invalid verification code. Please try again.',
            NULL::UUID,
            NULL::JSONB;
        RETURN;
    END IF;
    
    -- Code is valid - mark as used
    UPDATE verification_codes 
    SET used_at = NOW(),
        attempts = 0
    WHERE id = v_verification.id;
    
    RETURN QUERY SELECT 
        TRUE, 
        NULL::TEXT,
        v_verification.id,
        v_verification.metadata;
END;
$$;

COMMENT ON FUNCTION verify_code IS 'Verify a 6-digit code and mark as used - fixed column ambiguity';
