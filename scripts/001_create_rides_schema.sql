-- Create rides, drivers, and waitlist tables for Pi Ride

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  service_cities TEXT[] NOT NULL, -- Array of cities they serve
  is_on_duty BOOLEAN DEFAULT false,
  current_location JSONB, -- {lat, lng, timestamp}
  vehicle_info JSONB, -- {make, model, year, color, plate}
  rating DECIMAL(3,2) DEFAULT 5.00,
  total_rides INTEGER DEFAULT 0,
  earnings_pi DECIMAL(10,2) DEFAULT 0,
  application_status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rides table
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_pi_user_id TEXT NOT NULL,
  driver_id UUID REFERENCES drivers(id),
  pickup_location JSONB NOT NULL, -- {lat, lng, address}
  dropoff_location JSONB NOT NULL, -- {lat, lng, address}
  ride_type TEXT NOT NULL, -- standard, premium, xl
  status TEXT DEFAULT 'pending', -- pending, matched, accepted, picked_up, completed, cancelled
  price_pi DECIMAL(10,2) NOT NULL,
  distance_km DECIMAL(6,2),
  duration_minutes INTEGER,
  pi_payment_id TEXT UNIQUE,
  rider_email TEXT,
  driver_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Waitlist for users in areas without drivers
CREATE TABLE IF NOT EXISTS driver_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  location JSONB, -- {lat, lng}
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver applications
CREATE TABLE IF NOT EXISTS driver_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_cities TEXT[] NOT NULL,
  vehicle_info JSONB NOT NULL,
  drivers_license JSONB, -- {number, state, expiry}
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_drivers_on_duty ON drivers(is_on_duty) WHERE is_on_duty = true;
CREATE INDEX IF NOT EXISTS idx_drivers_service_cities ON drivers USING GIN(service_cities);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_rider ON rides(rider_pi_user_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_city ON driver_waitlist(city);
CREATE INDEX IF NOT EXISTS idx_waitlist_notified ON driver_waitlist(notified) WHERE notified = false;
CREATE INDEX IF NOT EXISTS idx_applications_status ON driver_applications(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for drivers table
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
