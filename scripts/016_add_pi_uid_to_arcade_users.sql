-- Add pi_uid and pi_username columns to arcade_users table
ALTER TABLE arcade_users
ADD COLUMN IF NOT EXISTS pi_uid TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS pi_username TEXT;

-- Create index for pi_uid lookups
CREATE INDEX IF NOT EXISTS idx_arcade_users_pi_uid ON arcade_users(pi_uid);

-- Add comment
COMMENT ON COLUMN arcade_users.pi_uid IS 'Pi Network user ID for A2U payments';
COMMENT ON COLUMN arcade_users.pi_username IS 'Pi Network username';
