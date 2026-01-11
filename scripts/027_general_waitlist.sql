-- General Driver & Rider Waitlist for Future City Rollouts
-- This tracks users interested in future cities (not Lagos-specific)

CREATE TABLE IF NOT EXISTS driver_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  location JSONB,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pi_user_id, city)
);

CREATE TABLE IF NOT EXISTS rider_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_user_id TEXT NOT NULL,
  email TEXT,
  city TEXT NOT NULL,
  pickup_location JSONB,
  destination_location JSONB,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pi_user_id, city)
);

CREATE INDEX IF NOT EXISTS idx_driver_waitlist_city ON driver_waitlist(city);
CREATE INDEX IF NOT EXISTS idx_driver_waitlist_notified ON driver_waitlist(notified) WHERE notified = false;
CREATE INDEX IF NOT EXISTS idx_rider_waitlist_city ON rider_waitlist(city);
CREATE INDEX IF NOT EXISTS idx_rider_waitlist_notified ON rider_waitlist(notified) WHERE notified = false;

ALTER TABLE driver_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS driver_waitlist_select_own ON driver_waitlist;
DROP POLICY IF EXISTS rider_waitlist_select_own ON rider_waitlist;

CREATE POLICY driver_waitlist_select_own ON driver_waitlist FOR ALL
USING (pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY rider_waitlist_select_own ON rider_waitlist FOR ALL
USING (pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
