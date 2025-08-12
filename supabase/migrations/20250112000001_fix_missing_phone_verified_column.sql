-- Fix missing phone_verified column that is referenced in functions but never created
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Add index for performance when querying verified phone numbers
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users(phone_verified) WHERE phone_verified = TRUE;

-- Add comment for clarity
COMMENT ON COLUMN users.phone_verified IS 'Indicates if the user has verified their phone number through SMS verification';