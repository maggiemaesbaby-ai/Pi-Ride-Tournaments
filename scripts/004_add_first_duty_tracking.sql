-- Add first_duty_at field to track when driver goes on duty for the first time
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS first_duty_at TIMESTAMP WITH TIME ZONE;

-- Create index for querying drivers who have gone on duty
CREATE INDEX IF NOT EXISTS idx_drivers_first_duty ON drivers(first_duty_at);
