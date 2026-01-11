-- Add test ride mode support
-- Allows testing ride booking with minimal cost and clear identification

-- Add is_test_ride flag to rides table
ALTER TABLE rides ADD COLUMN IF NOT EXISTS is_test_ride BOOLEAN DEFAULT false;

-- Create index for filtering test rides
CREATE INDEX IF NOT EXISTS idx_rides_test ON rides(is_test_ride);

-- Create view for production rides only (exclude test rides)
CREATE OR REPLACE VIEW production_rides AS
SELECT * FROM rides 
WHERE is_test_ride = false OR is_test_ride IS NULL;

-- Create view for test rides only
CREATE OR REPLACE VIEW test_rides AS
SELECT * FROM rides 
WHERE is_test_ride = true;

-- Add comment
COMMENT ON COLUMN rides.is_test_ride IS 'Identifies test rides for development/testing purposes. Test rides use "TEST" as pickup and destination.';
