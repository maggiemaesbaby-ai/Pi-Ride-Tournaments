-- Admin Rewards Tracking for Tax Writeoff
-- This script creates a table to track commission-free rides given to drivers
-- for financial reporting and tax writeoff purposes

-- Admin rewards tracking table
CREATE TABLE IF NOT EXISTS admin_rewards_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  commission_waived_pi DECIMAL(10,2) NOT NULL, -- Amount of commission not charged
  ride_price_pi DECIMAL(10,2) NOT NULL, -- Total ride price
  commission_percentage DECIMAL(5,2) NOT NULL, -- Percentage that would have been charged
  driver_rating_at_time DECIMAL(3,2) NOT NULL, -- Driver rating when reward was given
  paid_rides_at_time INTEGER NOT NULL, -- Number of paid rides when reward was given
  milestone_reached INTEGER NOT NULL, -- Which milestone earned this reward (20, 45, 70, etc)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fiscal_year INTEGER, -- For tax reporting
  fiscal_quarter INTEGER -- For quarterly reports
);

-- Create indexes for reporting
CREATE INDEX IF NOT EXISTS idx_admin_rewards_driver ON admin_rewards_tracking(driver_id);
CREATE INDEX IF NOT EXISTS idx_admin_rewards_fiscal ON admin_rewards_tracking(fiscal_year, fiscal_quarter);
CREATE INDEX IF NOT EXISTS idx_admin_rewards_created ON admin_rewards_tracking(created_at);

-- Function to log commission waiver for admin tracking
CREATE OR REPLACE FUNCTION log_commission_waiver()
RETURNS TRIGGER AS $$
DECLARE
  ride_price DECIMAL(10,2);
  commission_pct DECIMAL(5,2);
  commission_amount DECIMAL(10,2);
  driver_rating DECIMAL(3,2);
  paid_rides INTEGER;
  last_milestone INTEGER;
BEGIN
  -- Only log if ride was completed and commission-free
  IF NEW.status = 'completed' AND NEW.commission_free = true THEN
    -- Get ride price
    ride_price := NEW.price_pi;
    
    -- Get commission percentage (default to 10% if not specified)
    commission_pct := COALESCE(
      (SELECT commission_rate FROM drivers WHERE id = NEW.driver_id),
      10.0
    );
    
    -- Calculate commission amount that was waived
    commission_amount := ride_price * (commission_pct / 100);
    
    -- Get driver stats at time of reward
    SELECT 
      current_rating,
      paid_rides_completed,
      last_reward_milestone
    INTO driver_rating, paid_rides, last_milestone
    FROM driver_rewards
    WHERE driver_id = NEW.driver_id;
    
    -- Insert tracking record
    INSERT INTO admin_rewards_tracking (
      driver_id,
      ride_id,
      commission_waived_pi,
      ride_price_pi,
      commission_percentage,
      driver_rating_at_time,
      paid_rides_at_time,
      milestone_reached,
      fiscal_year,
      fiscal_quarter
    ) VALUES (
      NEW.driver_id,
      NEW.id,
      commission_amount,
      ride_price,
      commission_pct,
      driver_rating,
      paid_rides,
      last_milestone,
      EXTRACT(YEAR FROM NOW()),
      EXTRACT(QUARTER FROM NOW())
    );
    
    RAISE NOTICE 'Commission waiver logged: % Pi for driver % (milestone %)', 
      commission_amount, NEW.driver_id, last_milestone;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log commission waivers
DROP TRIGGER IF EXISTS trigger_log_commission_waiver ON rides;
CREATE TRIGGER trigger_log_commission_waiver
AFTER UPDATE ON rides
FOR EACH ROW
EXECUTE FUNCTION log_commission_waiver();

-- Add commission_rate to drivers table if not exists
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10.0;

-- Drop existing views before creating to make script idempotent
DROP VIEW IF EXISTS admin_rewards_summary;
DROP VIEW IF EXISTS driver_rewards_summary;

-- Create view for admin reporting
CREATE VIEW admin_rewards_summary AS
SELECT 
  fiscal_year,
  fiscal_quarter,
  COUNT(*) as total_free_rides_given,
  COUNT(DISTINCT driver_id) as drivers_rewarded,
  SUM(commission_waived_pi) as total_commission_waived_pi,
  AVG(commission_waived_pi) as avg_commission_per_free_ride,
  MIN(created_at) as period_start,
  MAX(created_at) as period_end
FROM admin_rewards_tracking
GROUP BY fiscal_year, fiscal_quarter
ORDER BY fiscal_year DESC, fiscal_quarter DESC;

-- Create view for driver-specific rewards summary
-- Fixed column reference from d.name to d.full_name to match actual drivers table schema
CREATE VIEW driver_rewards_summary AS
SELECT 
  d.id as driver_id,
  d.pi_user_id,
  d.full_name,
  d.email,
  dr.paid_rides_completed,
  dr.total_rides_completed,
  dr.commission_free_rides_remaining,
  dr.last_reward_milestone,
  dr.current_rating,
  dr.eligible_for_rewards,
  COUNT(art.id) as total_free_rides_used,
  COALESCE(SUM(art.commission_waived_pi), 0) as total_commission_saved_pi
FROM drivers d
LEFT JOIN driver_rewards dr ON d.id = dr.driver_id
LEFT JOIN admin_rewards_tracking art ON d.id = art.driver_id
GROUP BY 
  d.id, d.pi_user_id, d.full_name, d.email,
  dr.paid_rides_completed, dr.total_rides_completed,
  dr.commission_free_rides_remaining, dr.last_reward_milestone,
  dr.current_rating, dr.eligible_for_rewards
ORDER BY dr.paid_rides_completed DESC;

-- Enable RLS
ALTER TABLE admin_rewards_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policy before creating to make script idempotent
DROP POLICY IF EXISTS admin_rewards_tracking_admin_only ON admin_rewards_tracking;

-- Only admins can view rewards tracking (service role bypasses RLS)
CREATE POLICY admin_rewards_tracking_admin_only ON admin_rewards_tracking FOR SELECT
USING (false); -- Only service role can access

-- Grant permissions to service role
GRANT SELECT ON admin_rewards_summary TO authenticated;
GRANT SELECT ON driver_rewards_summary TO authenticated;
