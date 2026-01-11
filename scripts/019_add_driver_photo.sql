-- Add driver photo URL column to drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create index for quick photo lookups
CREATE INDEX IF NOT EXISTS idx_drivers_photo ON drivers(photo_url) WHERE photo_url IS NOT NULL;

-- Update existing drivers to have a default placeholder if needed
UPDATE drivers SET photo_url = NULL WHERE photo_url IS NULL OR photo_url = '';

COMMENT ON COLUMN drivers.photo_url IS 'Driver profile photo URL for rider verification and safety';
