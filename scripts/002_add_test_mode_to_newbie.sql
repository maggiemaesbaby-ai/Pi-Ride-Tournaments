-- Add test mode configuration for Newbie tier
-- This allows testing without real Pi payments

-- Add a test_mode column to game_tiers
ALTER TABLE game_tiers ADD COLUMN IF NOT EXISTS test_mode BOOLEAN DEFAULT false;

-- Enable test mode for Newbie tier
UPDATE game_tiers 
SET test_mode = true
WHERE tier_id = 'tier-0';

-- Add test entries tracking
CREATE TABLE IF NOT EXISTS test_tournament_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  match_id UUID REFERENCES tournament_matches(id),
  score INTEGER DEFAULT 0,
  rank INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE test_tournament_entries ENABLE ROW LEVEL SECURITY;

-- Policies for test entries
CREATE POLICY "Users can view their own test entries"
  ON test_tournament_entries FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "System can insert test entries"
  ON test_tournament_entries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update test entries"
  ON test_tournament_entries FOR UPDATE
  USING (true);

COMMENT ON TABLE test_tournament_entries IS 'Test tournament entries for development and testing without real Pi payments';
