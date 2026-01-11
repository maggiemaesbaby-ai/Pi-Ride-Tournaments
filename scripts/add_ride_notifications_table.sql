-- Create ride notifications table for real-time dashboard notifications
CREATE TABLE IF NOT EXISTS ride_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id TEXT NOT NULL,
  pickup_location JSONB NOT NULL,
  dropoff_location JSONB NOT NULL,
  ride_type TEXT NOT NULL,
  price_pi DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '90 seconds',
  accepted_by TEXT,
  accepted_at TIMESTAMP
);

-- Index for fast driver lookups
CREATE INDEX IF NOT EXISTS idx_ride_notifications_driver_status 
ON ride_notifications(driver_id, status, created_at DESC);

-- Index for ride lookups
CREATE INDEX IF NOT EXISTS idx_ride_notifications_ride 
ON ride_notifications(ride_id);

-- Auto-expire old notifications function
CREATE OR REPLACE FUNCTION expire_old_ride_notifications()
RETURNS void AS $$
BEGIN
  UPDATE ride_notifications
  SET status = 'expired'
  WHERE status = 'pending' 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
