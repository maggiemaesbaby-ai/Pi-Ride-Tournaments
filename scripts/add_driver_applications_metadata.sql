-- Add metadata column to driver_applications table to store fee package selection

ALTER TABLE driver_applications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN driver_applications.metadata IS 'Stores additional application data like selectedFeePackage, commission, upfrontFeeOwed';

-- Create index for faster metadata queries
CREATE INDEX IF NOT EXISTS idx_driver_applications_metadata ON driver_applications USING GIN(metadata);
