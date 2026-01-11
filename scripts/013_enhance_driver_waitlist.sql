-- Enhance driver_waitlist table with ride search parameters and geographic data

-- Add new columns for complete ride search parameters
ALTER TABLE driver_waitlist 
ADD COLUMN IF NOT EXISTS pickup_address TEXT,
ADD COLUMN IF NOT EXISTS dropoff_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_location JSONB,
ADD COLUMN IF NOT EXISTS dropoff_location JSONB,
ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'economy',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for efficient geographic queries
CREATE INDEX IF NOT EXISTS idx_waitlist_pickup_location ON driver_waitlist USING GIST ((pickup_location::jsonb));
CREATE INDEX IF NOT EXISTS idx_waitlist_notified_city ON driver_waitlist(notified, city) WHERE notified = false;

-- Add function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  r CONSTANT DOUBLE PRECISION := 6371; -- Earth radius in km
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add service_radius column to drivers table
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS service_radius INTEGER DEFAULT 10; -- Default 10 km radius

-- Create index for geographic driver queries
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers USING GIST ((current_location::jsonb)) WHERE is_on_duty = true;

-- Add comment explaining the schema
COMMENT ON TABLE driver_waitlist IS 'Stores waitlist entries for users in areas without available drivers, with complete ride search parameters for matching when drivers become available';
COMMENT ON COLUMN driver_waitlist.pickup_location IS 'JSONB containing {lat, lng} of pickup location for geographic matching';
COMMENT ON COLUMN driver_waitlist.dropoff_location IS 'JSONB containing {lat, lng} of dropoff location for distance calculation';
COMMENT ON COLUMN drivers.service_radius IS 'Driver service radius in kilometers for matching with waitlisted rides';
