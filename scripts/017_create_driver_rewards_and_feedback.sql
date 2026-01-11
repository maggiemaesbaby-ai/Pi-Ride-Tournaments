-- Driver Rewards, Feedback, and Favorite Driver System
-- This script creates tables and functions for:
-- 1. Driver rewards tracking (commission-free rides for 4.5+ rating)
-- 2. Rating feedback system (driver responses, rider messages)
-- 3. Favorite driver system with direct offers

-- Extend rides table with rating and feedback
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rider_rating INTEGER CHECK (rider_rating >= 1 AND rider_rating <= 5);
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rider_feedback TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_response TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rating_removed_by_admin BOOLEAN DEFAULT false;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS admin_removal_reason TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS commission_free BOOLEAN DEFAULT false;

-- Extend drivers table with application fee tracking
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS application_fee_balance DECIMAL(10,2) DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS application_fee_paid BOOLEAN DEFAULT false;

-- Driver rewards tracking table
CREATE TABLE IF NOT EXISTS driver_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  paid_rides_completed INTEGER DEFAULT 0, -- Rides where commission was paid
  total_rides_completed INTEGER DEFAULT 0, -- All completed rides
  commission_free_rides_remaining INTEGER DEFAULT 0,
  last_reward_milestone INTEGER DEFAULT 0, -- Last milestone that granted rewards (20, 45, 70, 95, etc)
  eligible_for_rewards BOOLEAN DEFAULT false, -- true if rating >= 4.5 AND application fee paid
  current_rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(driver_id)
);

-- Favorite drivers table
CREATE TABLE IF NOT EXISTS favorite_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_pi_user_id TEXT NOT NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(rider_pi_user_id, driver_id)
);

-- Direct ride offers table (for favorite driver requests)
CREATE TABLE IF NOT EXISTS direct_ride_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  pickup_location JSONB NOT NULL,
  dropoff_location JSONB NOT NULL,
  price_pi DECIMAL(10,2) NOT NULL,
  distance_km DECIMAL(6,2),
  duration_minutes INTEGER,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, expired
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ride_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rides_rating ON rides(rider_rating);
CREATE INDEX IF NOT EXISTS idx_rides_commission_free ON rides(commission_free);
CREATE INDEX IF NOT EXISTS idx_driver_rewards_driver ON driver_rewards(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_rewards_eligible ON driver_rewards(eligible_for_rewards) WHERE eligible_for_rewards = true;
CREATE INDEX IF NOT EXISTS idx_favorite_drivers_rider ON favorite_drivers(rider_pi_user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_drivers_driver ON favorite_drivers(driver_id);
CREATE INDEX IF NOT EXISTS idx_direct_offers_status ON direct_ride_offers(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_direct_offers_driver ON direct_ride_offers(driver_id);
CREATE INDEX IF NOT EXISTS idx_direct_offers_expires ON direct_ride_offers(expires_at);

-- Function to calculate next reward milestone
-- Rewards at rides: 21-25, 46-50, 71-75, 96-100, etc
-- Pattern: First at 20 paid rides, then every 25 rides after (counting the 5 free ones)
CREATE OR REPLACE FUNCTION get_next_reward_milestone(paid_rides INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- First milestone at 20 paid rides
  IF paid_rides < 20 THEN
    RETURN 20;
  END IF;
  
  -- After first milestone, every 25 rides (including the 5 free)
  -- Milestones: 20, 45, 70, 95, 120, etc
  RETURN ((paid_rides - 20) / 25 + 1) * 25 + 20;
END;
$$ LANGUAGE plpgsql;

-- Function to update driver rewards after ride completion
CREATE OR REPLACE FUNCTION update_driver_rewards()
RETURNS TRIGGER AS $$
DECLARE
  driver_rating DECIMAL(3,2);
  app_fee_paid BOOLEAN;
  rewards_record RECORD;
  next_milestone INTEGER;
  should_grant_reward BOOLEAN := false;
BEGIN
  -- Only process if ride is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get current driver info
    SELECT rating, application_fee_paid 
    INTO driver_rating, app_fee_paid 
    FROM drivers 
    WHERE id = NEW.driver_id;
    
    -- Get or create rewards record
    INSERT INTO driver_rewards (driver_id, current_rating, eligible_for_rewards)
    VALUES (NEW.driver_id, driver_rating, app_fee_paid AND driver_rating >= 4.5)
    ON CONFLICT (driver_id) DO NOTHING;
    
    -- Check if this ride was commission-free
    IF NEW.commission_free THEN
      -- Commission-free ride: increment total but not paid rides, decrement remaining
      UPDATE driver_rewards
      SET 
        total_rides_completed = total_rides_completed + 1,
        commission_free_rides_remaining = GREATEST(commission_free_rides_remaining - 1, 0),
        current_rating = driver_rating,
        eligible_for_rewards = app_fee_paid AND driver_rating >= 4.5,
        updated_at = NOW()
      WHERE driver_id = NEW.driver_id;
    ELSE
      -- Paid ride: increment both counters
      UPDATE driver_rewards
      SET 
        paid_rides_completed = paid_rides_completed + 1,
        total_rides_completed = total_rides_completed + 1,
        current_rating = driver_rating,
        eligible_for_rewards = app_fee_paid AND driver_rating >= 4.5,
        updated_at = NOW()
      WHERE driver_id = NEW.driver_id
      RETURNING * INTO rewards_record;
      
      -- Check if driver should get reward
      -- Must be eligible (app fee paid + 4.5+ rating)
      -- Must have reached a milestone
      IF rewards_record.eligible_for_rewards THEN
        next_milestone := get_next_reward_milestone(rewards_record.paid_rides_completed);
        
        -- Check if we just hit or passed a milestone
        IF rewards_record.paid_rides_completed >= next_milestone 
           AND rewards_record.last_reward_milestone < next_milestone THEN
          should_grant_reward := true;
        END IF;
        
        -- Grant reward if eligible
        IF should_grant_reward THEN
          UPDATE driver_rewards
          SET 
            commission_free_rides_remaining = commission_free_rides_remaining + 5,
            last_reward_milestone = next_milestone,
            updated_at = NOW()
          WHERE driver_id = NEW.driver_id;
          
          RAISE NOTICE 'REWARD GRANTED! Driver % reached milestone % - 5 free rides awarded', 
            NEW.driver_id, next_milestone;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rewards on ride completion
DROP TRIGGER IF EXISTS trigger_update_driver_rewards ON rides;
CREATE TRIGGER trigger_update_driver_rewards
AFTER UPDATE ON rides
FOR EACH ROW
EXECUTE FUNCTION update_driver_rewards();

-- Function to check if ride should be commission-free
CREATE OR REPLACE FUNCTION should_ride_be_commission_free(p_driver_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  free_rides_remaining INTEGER;
  is_eligible BOOLEAN;
BEGIN
  SELECT 
    commission_free_rides_remaining,
    eligible_for_rewards
  INTO free_rides_remaining, is_eligible
  FROM driver_rewards
  WHERE driver_id = p_driver_id;
  
  -- Return true if driver has free rides remaining and is still eligible
  RETURN COALESCE(free_rides_remaining > 0 AND is_eligible, false);
END;
$$ LANGUAGE plpgsql;

-- Function to expire old direct offers
CREATE OR REPLACE FUNCTION expire_old_direct_offers()
RETURNS void AS $$
BEGIN
  UPDATE direct_ride_offers
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Initialize rewards for existing drivers
INSERT INTO driver_rewards (driver_id, paid_rides_completed, total_rides_completed, current_rating, eligible_for_rewards)
SELECT 
  id,
  total_rides,
  total_rides,
  rating,
  COALESCE(application_fee_paid, false) AND rating >= 4.5
FROM drivers
ON CONFLICT (driver_id) DO UPDATE
SET 
  paid_rides_completed = EXCLUDED.paid_rides_completed,
  total_rides_completed = EXCLUDED.total_rides_completed,
  current_rating = EXCLUDED.current_rating,
  eligible_for_rewards = EXCLUDED.eligible_for_rewards;

-- Add RLS policies
ALTER TABLE driver_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_ride_offers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating to make script idempotent
DROP POLICY IF EXISTS driver_rewards_select_own ON driver_rewards;
DROP POLICY IF EXISTS favorite_drivers_manage_own ON favorite_drivers;
DROP POLICY IF EXISTS direct_offers_view_own ON direct_ride_offers;
DROP POLICY IF EXISTS direct_offers_update_own ON direct_ride_offers;

-- Drivers can view their own rewards
CREATE POLICY driver_rewards_select_own ON driver_rewards FOR SELECT
USING (driver_id IN (SELECT id FROM drivers WHERE pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub'));

-- Riders can manage their favorite drivers
CREATE POLICY favorite_drivers_manage_own ON favorite_drivers FOR ALL
USING (rider_pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Drivers can view offers directed to them
CREATE POLICY direct_offers_view_own ON direct_ride_offers FOR SELECT
USING (driver_id IN (SELECT id FROM drivers WHERE pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub'));

-- Drivers can update their own offers (accept/decline)
CREATE POLICY direct_offers_update_own ON direct_ride_offers FOR UPDATE
USING (driver_id IN (SELECT id FROM drivers WHERE pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub'));
