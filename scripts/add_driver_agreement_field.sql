-- Add agreement tracking fields to drivers table
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS agreement_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS agreement_accepted_at TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_drivers_agreement ON drivers(pi_user_id, agreement_accepted);
