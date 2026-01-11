-- Geo-blocking for skill gaming compliance

CREATE TABLE IF NOT EXISTS geo_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('state', 'country')),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  blocked_for_paid BOOLEAN DEFAULT true,
  allow_free_play BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restriction_type, code)
);

CREATE TABLE IF NOT EXISTS geo_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  pi_user_id TEXT,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('ip', 'gps')),
  location_data JSONB NOT NULL,
  is_restricted BOOLEAN DEFAULT false,
  restriction_reason TEXT,
  attempted_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_restrictions_type ON geo_restrictions(restriction_type);
CREATE INDEX IF NOT EXISTS idx_geo_restrictions_blocked ON geo_restrictions(blocked_for_paid) WHERE blocked_for_paid = true;
CREATE INDEX IF NOT EXISTS idx_geo_verification_user ON geo_verification_log(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_geo_verification_restricted ON geo_verification_log(is_restricted) WHERE is_restricted = true;

-- Insert restricted US states
INSERT INTO geo_restrictions (restriction_type, code, name, blocked_for_paid, allow_free_play) VALUES
('state', 'AR', 'Arkansas', true, true),
('state', 'CT', 'Connecticut', true, true),
('state', 'DE', 'Delaware', true, true),
('state', 'LA', 'Louisiana', true, true),
('state', 'SD', 'South Dakota', true, true),
('state', 'FL', 'Florida', true, true),
('state', 'IN', 'Indiana', true, true),
('state', 'ME', 'Maine', true, true)
ON CONFLICT (restriction_type, code) DO UPDATE SET
  blocked_for_paid = EXCLUDED.blocked_for_paid,
  allow_free_play = EXCLUDED.allow_free_play;

-- Insert restricted countries
INSERT INTO geo_restrictions (restriction_type, code, name, blocked_for_paid, allow_free_play) VALUES
('country', 'IN', 'India', true, true),
('country', 'CN', 'China', true, true),
('country', 'SG', 'Singapore', true, true),
('country', 'DZ', 'Algeria', true, true),
('country', 'BD', 'Bangladesh', true, true),
('country', 'NP', 'Nepal', true, true),
('country', 'XK', 'Kosovo', true, true)
ON CONFLICT (restriction_type, code) DO UPDATE SET
  blocked_for_paid = EXCLUDED.blocked_for_paid,
  allow_free_play = EXCLUDED.allow_free_play;

ALTER TABLE geo_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_verification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS geo_restrictions_public_read ON geo_restrictions;
CREATE POLICY geo_restrictions_public_read ON geo_restrictions FOR SELECT
USING (true);

DROP POLICY IF EXISTS geo_verification_log_own ON geo_verification_log;
CREATE POLICY geo_verification_log_own ON geo_verification_log FOR ALL
USING (pi_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
