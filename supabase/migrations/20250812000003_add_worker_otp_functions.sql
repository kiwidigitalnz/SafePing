-- Add phone_number column to verification_codes table if it doesn't exist
ALTER TABLE verification_codes 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Drop existing email NOT NULL constraint if it exists
ALTER TABLE verification_codes 
ALTER COLUMN email DROP NOT NULL;

-- Add constraint to ensure either phone or email is provided
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'phone_or_email' 
    AND conrelid = 'verification_codes'::regclass
  ) THEN
    ALTER TABLE verification_codes 
    ADD CONSTRAINT phone_or_email CHECK (
      (phone_number IS NOT NULL AND email IS NULL) OR 
      (email IS NOT NULL AND phone_number IS NULL)
    );
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone_number, code) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email, code) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);



-- Function to create phone-based verification codes
CREATE OR REPLACE FUNCTION create_phone_verification_code(
    p_phone_number TEXT,
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
    
    -- Clean up old expired codes for this phone number
    DELETE FROM verification_codes 
    WHERE phone_number = p_phone_number 
    AND expires_at < NOW();
    
    -- Create new verification code
    INSERT INTO verification_codes (
        phone_number,
        code,
        type,
        metadata,
        expires_at
    ) VALUES (
        p_phone_number,
        v_code,
        p_type,
        p_metadata,
        NOW() + (p_expires_minutes || ' minutes')::INTERVAL
    ) RETURNING id INTO v_code_id;
    
    -- Return the code details
    RETURN QUERY SELECT v_code_id, v_code;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_phone_verification_code(TEXT, TEXT, JSONB, INTEGER) TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION create_phone_verification_code(TEXT, TEXT, JSONB, INTEGER) IS 'Generate and store a 6-digit verification code for phone numbers';