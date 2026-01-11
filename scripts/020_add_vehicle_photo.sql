-- Add vehicle photo column to drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_photo_url TEXT;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_drivers_vehicle_photo ON drivers(vehicle_photo_url) WHERE vehicle_photo_url IS NOT NULL;
